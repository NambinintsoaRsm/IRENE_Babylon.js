import { constantesLumiere } from "../../Configuration/constantesLumiere.js";

/**
 * Gère les réglages de lumière Babylon.
 *
 * Principe retenu :
 * - Principale : lumière de base, hémisphérique, sans ombre directionnelle ;
 * - Haut / Bas / Tournante : on garde une base ambiante faible et on active
 *   une seule lumière directionnelle. Chaque choix remplace le précédent.
 */
export class ServiceLumiereBabylon {
    constructor() {
        this.observateurRotation = null;
        this.observateurOrientationCamera = null;

        this.typeActif = constantesLumiere.typeDefaut;
        this.intensiteActuelle = constantesLumiere.intensite.defaut;
        this.temperatureActuelle = constantesLumiere.temperature.defaut;
        this.couleurActuelle = new BABYLON.Color3(1, 1, 1);
        this.facteurVitesseRotation = constantesLumiere.tournante.facteurVitesse;

        // Etat conservé pour pouvoir mettre la lumière tournante en pause
        // sans perdre sa position courante.
        this.angleRotation = 0;
        this.rotationEnPause = false;
        this.directionRotationActuelle = this.creerVecteur(
            constantesLumiere.tournante.directionInitiale
        ).normalize();

        // Haut/Bas : référence de la caméra et direction du spot au moment où
        // le mode est activé. La caméra continue de bouger réellement ; ces
        // informations servent à reproduire l'équivalent d'un objet qui tourne
        // sous une source fixe.
        this.orientationCameraReference = null;
        this.directionReferenceOrientation = null;
        this.typeSuiviOrientation = null;
        this.derniereSignatureCamera = null;
        this.dernierLogOrientation = 0;
    }

    initialiser(scene) {
        this.garantirLumieres(scene);
        this.appliquerTemperature(scene, this.temperatureActuelle);
        this.appliquerType(scene, constantesLumiere.typeDefaut);
    }

    appliquerIntensite(scene, valeur) {
        const intensite = Math.max(
            constantesLumiere.intensite.minimum,
            Math.min(constantesLumiere.intensite.maximum, Number(valeur) || 0)
        );
        this.intensiteActuelle = intensite;
        this.appliquerType(scene, this.typeActif, { garderRotation: true });
    }

    appliquerTemperature(scene, valeur) {
        const valeurBornee = Math.max(
            constantesLumiere.temperature.minimum,
            Math.min(constantesLumiere.temperature.maximum, Number(valeur) || 0)
        );
        this.temperatureActuelle = valeurBornee;

        // 0 = chaud/orangé, 50 = neutre/blanc, 100 = froid/bleuté.
        const t = valeurBornee / 100;
        const chaud = new BABYLON.Color3(1.0, 0.55, 0.25);
        const neutre = new BABYLON.Color3(1.0, 1.0, 1.0);
        const froid = new BABYLON.Color3(0.55, 0.75, 1.0);

        this.couleurActuelle = t < 0.5
            ? BABYLON.Color3.Lerp(chaud, neutre, t * 2)
            : BABYLON.Color3.Lerp(neutre, froid, (t - 0.5) * 2);

        const lumieres = this.garantirLumieres(scene);
        if (!lumieres) return;

        this.appliquerCouleurAuxLumieres(lumieres, this.couleurActuelle);
    }

    appliquerCouleurAuxLumieres(lumieres, couleur) {
        if (lumieres.lumierePrincipale) {
            lumieres.lumierePrincipale.diffuse = couleur;
            lumieres.lumierePrincipale.groundColor = new BABYLON.Color3(
                couleur.r * 0.55,
                couleur.g * 0.55,
                couleur.b * 0.55
            );
        }

        if (lumieres.lumiereDirectionnelle) {
            lumieres.lumiereDirectionnelle.diffuse = couleur;
            lumieres.lumiereDirectionnelle.specular = couleur;
        }
    }

    appliquerType(scene, type, options = {}) {
        const lumieres = this.garantirLumieres(scene);
        if (!lumieres) return;

        const nouveauType = type || constantesLumiere.typeDefaut;
        const garderEtat = options.garderRotation === true;

        if (!garderEtat) {
            this.arreterRotation(scene);
            this.arreterSuiviOrientationCamera(scene);
            this.rotationEnPause = false;

            if (nouveauType !== "tournante") {
                this.angleRotation = 0;
                this.directionRotationActuelle = this.creerVecteur(
                    constantesLumiere.tournante.directionInitiale
                ).normalize();
            }
        }

        this.typeActif = nouveauType;

        if (this.typeActif === "haut" || this.typeActif === "bas") {
            const directionReference = this.directionReferencePourType(this.typeActif);

            // Un changement explicite de type crée une nouvelle orientation zéro.
            // Un changement d'intensité conserve au contraire la référence déjà
            // mémorisée afin de ne pas déplacer artificiellement la zone éclairée.
            if (!garderEtat
                || !this.orientationCameraReference
                || this.typeSuiviOrientation !== this.typeActif) {
                this.demarrerSuiviOrientationCamera(
                    scene,
                    this.typeActif,
                    directionReference
                );
            } else {
                this.mettreAJourDirectionSelonCamera(scene, { forcer: true });
            }
            return;
        }

        if (this.typeActif === "tournante") {
            // Le suivi Haut/Bas n'a aucun rôle pour le balayage.
            this.arreterSuiviOrientationCamera(scene);

            const direction = garderEtat && this.directionRotationActuelle
                ? this.directionRotationActuelle.clone()
                : this.directionDepuisAngleRotation();

            this.activerDirectionnelle(scene, lumieres, direction);

            if (!this.rotationEnPause && !this.observateurRotation) {
                this.demarrerRotation(scene);
            }

            return;
        }

        this.arreterSuiviOrientationCamera(scene);
        this.activerPrincipale(lumieres);
    }

    creerVecteur(valeur = {}) {
        return new BABYLON.Vector3(
            Number(valeur.x) || 0,
            Number(valeur.y) || 0,
            Number(valeur.z) || 0
        );
    }

    directionReferencePourType(type) {
        const valeur = constantesLumiere.directionnelle.directionsReference[type]
            ?? constantesLumiere.directionnelle.directionsReference.haut;
        return this.creerVecteur(valeur).normalize();
    }

    /**
     * Capture l'orientation courante de la caméra comme orientation zéro, puis
     * suit ses mouvements pour simuler la rotation de l'objet sous un spot fixe.
     */
    demarrerSuiviOrientationCamera(scene, type, directionReference) {
        this.arreterSuiviOrientationCamera(scene);

        const lumieres = this.garantirLumieres(scene);
        const camera = scene?.activeCamera;
        if (!lumieres || !camera) {
            this.activerDirectionnelle(scene, lumieres, directionReference);
            return;
        }

        this.typeSuiviOrientation = type;
        this.directionReferenceOrientation = directionReference.clone().normalize();
        this.orientationCameraReference = this.obtenirOrientationCamera(camera);
        this.derniereSignatureCamera = this.lireSignatureCamera(camera);

        // Au moment de la sélection, le spot garde exactement sa direction de
        // référence : Haut descend, Bas remonte.
        this.activerDirectionnelle(scene, lumieres, this.directionReferenceOrientation);

        if (!constantesLumiere.suiviOrientationCamera.actif
            || !this.orientationCameraReference
            || !scene?.onBeforeRenderObservable) {
            return;
        }

        this.journaliserOrientation(scene, this.directionReferenceOrientation, true);

        this.observateurOrientationCamera = scene.onBeforeRenderObservable.add(() => {
            this.mettreAJourDirectionSelonCamera(scene);
        });
    }

    arreterSuiviOrientationCamera(scene) {
        if (this.observateurOrientationCamera && scene?.onBeforeRenderObservable) {
            scene.onBeforeRenderObservable.remove(this.observateurOrientationCamera);
        }

        this.observateurOrientationCamera = null;
        this.orientationCameraReference = null;
        this.directionReferenceOrientation = null;
        this.typeSuiviOrientation = null;
        this.derniereSignatureCamera = null;
    }

    lireSignatureCamera(camera) {
        return {
            alpha: Number.isFinite(Number(camera?.alpha)) ? Number(camera.alpha) : null,
            beta: Number.isFinite(Number(camera?.beta)) ? Number(camera.beta) : null
        };
    }

    cameraAChange(signature) {
        const precedente = this.derniereSignatureCamera;
        if (!precedente) return true;

        const epsilon = constantesLumiere.suiviOrientationCamera.epsilonAngle;
        const alphaChange = signature.alpha !== null
            && precedente.alpha !== null
            && Math.abs(signature.alpha - precedente.alpha) > epsilon;
        const betaChange = signature.beta !== null
            && precedente.beta !== null
            && Math.abs(signature.beta - precedente.beta) > epsilon;

        // ArcRotateCamera expose alpha/beta. Si une autre caméra est utilisée,
        // on laisse le quaternion décider lors d'un recalcul forcé uniquement.
        return alphaChange || betaChange;
    }

    obtenirOrientationCamera(camera) {
        if (!camera?.getViewMatrix) return null;

        try {
            // L'inverse de la view matrix donne le repère monde de la caméra.
            // Sa décomposition fournit un quaternion indépendant de la position.
            const mondeCamera = camera.getViewMatrix().clone();
            mondeCamera.invert();

            const echelle = new BABYLON.Vector3();
            const orientation = new BABYLON.Quaternion();
            const position = new BABYLON.Vector3();
            const ok = mondeCamera.decompose(echelle, orientation, position);

            if (ok === false) return null;
            return orientation.normalize();
        } catch (erreur) {
            if (constantesLumiere.suiviOrientationCamera.debug) {
                console.warn("[ANNA][Lumiere] Orientation caméra indisponible", erreur);
            }
            return null;
        }
    }

    mettreAJourDirectionSelonCamera(scene, { forcer = false } = {}) {
        if (this.typeActif !== "haut" && this.typeActif !== "bas") return;
        if (this.typeSuiviOrientation !== this.typeActif) return;

        const camera = scene?.activeCamera;
        const lumieres = this.garantirLumieres(scene);
        if (!camera || !lumieres || !this.directionReferenceOrientation) return;

        const signature = this.lireSignatureCamera(camera);
        if (!forcer && !this.cameraAChange(signature)) return;
        this.derniereSignatureCamera = signature;

        const orientationCourante = this.obtenirOrientationCamera(camera);
        if (!orientationCourante || !this.orientationCameraReference) {
            this.activerDirectionnelle(scene, lumieres, this.directionReferenceOrientation);
            return;
        }

        // Qcourante * inverse(Qreference) = rotation réelle de la caméra depuis
        // l'activation du spot. Appliquée au vecteur lumineux de référence, cette
        // rotation produit sur le mesh fixe le même rapport lumière/surface que
        // si l'objet avait tourné en sens inverse sous une source fixe.
        const inverseReference = this.orientationCameraReference.conjugate();
        const rotationRelative = orientationCourante
            .multiply(inverseReference)
            .normalize();

        const matriceRotation = BABYLON.Matrix.Identity();
        BABYLON.Matrix.FromQuaternionToRef(rotationRelative, matriceRotation);
        const direction = BABYLON.Vector3.TransformNormal(
            this.directionReferenceOrientation,
            matriceRotation
        ).normalize();

        this.activerDirectionnelle(scene, lumieres, direction);
        this.journaliserOrientation(scene, direction, false);
    }

    journaliserOrientation(scene, direction, forcer = false) {
        if (!constantesLumiere.suiviOrientationCamera.debug) return;

        const maintenant = Date.now();
        if (!forcer
            && maintenant - this.dernierLogOrientation
                < constantesLumiere.suiviOrientationCamera.delaiLogMs) {
            return;
        }
        this.dernierLogOrientation = maintenant;

        const camera = scene?.activeCamera;
        const signature = this.lireSignatureCamera(camera);

        console.debug(`[ANNA][Lumiere][${this.typeActif}]`, {
            alpha: signature.alpha,
            beta: signature.beta,
            directionEffective: {
                x: Number(direction?.x?.toFixed?.(4) ?? direction?.x ?? 0),
                y: Number(direction?.y?.toFixed?.(4) ?? direction?.y ?? 0),
                z: Number(direction?.z?.toFixed?.(4) ?? direction?.z ?? 0)
            },
            principe: "caméra mobile -> compensation équivalente à un objet tournant sous une lumière fixe"
        });
    }

    /**
     * Lumière principale : la lumière de base reste seule active.
     * La directionnelle est éteinte pour éviter les ombres ou contrastes trop forts.
     */
    activerPrincipale(lumieres) {
        if (lumieres.lumierePrincipale) {
            lumieres.lumierePrincipale.intensity = this.intensiteActuelle;
            lumieres.lumierePrincipale.direction = this.creerVecteur(
                constantesLumiere.principale.direction
            );
        }

        if (lumieres.lumiereDirectionnelle) {
            lumieres.lumiereDirectionnelle.intensity = 0;
            lumieres.lumiereDirectionnelle.setEnabled?.(false);
        }
    }

    /**
     * Haut / Bas / Tournante : une seule lumière directionnelle est utilisée.
     * Chaque nouveau choix remplace donc le précédent.
     */
    activerDirectionnelle(scene, lumieres, direction) {
        const directionNormalisee = direction.normalize();

        // On mémorise la direction réellement appliquée. C'est elle qui reste
        // visible pendant une pause de la lumière tournante.
        this.directionRotationActuelle = directionNormalisee.clone();

        if (lumieres.lumierePrincipale) {
            // Base faible pour éviter un objet trop noir.
            lumieres.lumierePrincipale.intensity = this.intensiteActuelle
                * constantesLumiere.principale.facteurAmbiantAvecSpot;
            lumieres.lumierePrincipale.direction = this.creerVecteur(
                constantesLumiere.principale.direction
            );
        }

        if (lumieres.lumiereDirectionnelle) {
            lumieres.lumiereDirectionnelle.setEnabled?.(true);
            lumieres.lumiereDirectionnelle.intensity = this.intensiteActuelle;
            lumieres.lumiereDirectionnelle.direction = directionNormalisee.clone();
            lumieres.lumiereDirectionnelle.position = directionNormalisee.scale(
                -constantesLumiere.directionnelle.distancePosition
            );
        }

        this.appliquerCouleurAuxLumieres(lumieres, this.couleurActuelle);
    }

    directionDepuisAngleRotation() {
        return new BABYLON.Vector3(
            -Math.cos(this.angleRotation),
            constantesLumiere.tournante.composanteVerticale,
            -Math.sin(this.angleRotation)
        ).normalize();
    }

    demarrerRotation(scene) {
        if (!scene?.onBeforeRenderObservable) return;

        const lumieres = this.garantirLumieres(scene);
        if (!lumieres) return;

        // Sécurité : ne jamais ajouter plusieurs observers de rotation.
        if (this.observateurRotation) return;

        this.rotationEnPause = false;

        this.observateurRotation = scene.onBeforeRenderObservable.add(() => {
            const delta = scene.getEngine()?.getDeltaTime?.() ?? 16;
            this.angleRotation += delta * 0.001 * (this.facteurVitesseRotation ?? 1);

            const direction = this.directionDepuisAngleRotation();
            this.activerDirectionnelle(scene, lumieres, direction);
        });
    }

    arreterRotation(scene) {
        if (this.observateurRotation && scene?.onBeforeRenderObservable) {
            scene.onBeforeRenderObservable.remove(this.observateurRotation);
        }

        this.observateurRotation = null;
    }

    mettreRotationEnPause(scene) {
        if (this.typeActif !== "tournante") {
            return null;
        }

        // On arrête uniquement l'animation. La direction déjà appliquée à la
        // lumière n'est pas modifiée, donc la lumière reste à sa position.
        this.rotationEnPause = true;
        this.arreterRotation(scene);

        return true;
    }

    reprendreRotation(scene) {
        if (this.typeActif !== "tournante") {
            return null;
        }

        this.rotationEnPause = false;
        this.demarrerRotation(scene);

        return false;
    }

    basculerPauseRotation(scene) {
        if (this.typeActif !== "tournante") {
            return null;
        }

        if (this.rotationEnPause || !this.observateurRotation) {
            return this.reprendreRotation(scene);
        }

        return this.mettreRotationEnPause(scene);
    }

    reinitialiser(scene) {
        this.arreterRotation(scene);
        this.arreterSuiviOrientationCamera(scene);
        this.typeActif = constantesLumiere.typeDefaut;
        this.intensiteActuelle = constantesLumiere.intensite.defaut;
        this.temperatureActuelle = constantesLumiere.temperature.defaut;
        this.angleRotation = 0;
        this.rotationEnPause = false;
        this.directionRotationActuelle = this.creerVecteur(
            constantesLumiere.tournante.directionInitiale
        ).normalize();
        this.appliquerTemperature(scene, constantesLumiere.temperature.defaut);
        this.appliquerType(scene, constantesLumiere.typeDefaut);
    }




    obtenirParametresSauvegarde() {
        return {
            typeActif: this.typeActif,
            intensite: this.intensiteActuelle,
            temperature: this.temperatureActuelle,
            angleRotation: this.angleRotation,
            rotationEnPause: this.rotationEnPause,
            facteurVitesseRotation: this.facteurVitesseRotation,
            directionRotationActuelle: this.directionRotationActuelle
                ? {
                    x: this.directionRotationActuelle.x,
                    y: this.directionRotationActuelle.y,
                    z: this.directionRotationActuelle.z
                }
                : null
        };
    }

    appliquerParametresSauvegarde(scene, parametres = {}) {
        if (!parametres || typeof parametres !== "object") {
            return;
        }

        this.arreterRotation(scene);
        this.arreterSuiviOrientationCamera(scene);

        this.typeActif = parametres.typeActif || constantesLumiere.typeDefaut;
        this.intensiteActuelle = Number.isFinite(Number(parametres.intensite))
            ? Number(parametres.intensite)
            : this.intensiteActuelle;
        this.temperatureActuelle = Number.isFinite(Number(parametres.temperature))
            ? Number(parametres.temperature)
            : this.temperatureActuelle;
        this.angleRotation = Number.isFinite(Number(parametres.angleRotation))
            ? Number(parametres.angleRotation)
            : 0;
        this.rotationEnPause = Boolean(parametres.rotationEnPause);
        this.facteurVitesseRotation = Number.isFinite(Number(parametres.facteurVitesseRotation))
            ? Number(parametres.facteurVitesseRotation)
            : this.facteurVitesseRotation;

        if (parametres.directionRotationActuelle) {
            this.directionRotationActuelle = new BABYLON.Vector3(
                Number(parametres.directionRotationActuelle.x)
                    || constantesLumiere.tournante.directionInitiale.x,
                Number(parametres.directionRotationActuelle.y)
                    || constantesLumiere.tournante.directionInitiale.y,
                Number(parametres.directionRotationActuelle.z)
                    || constantesLumiere.tournante.directionInitiale.z
            ).normalize();
        }

        this.appliquerTemperature(scene, this.temperatureActuelle);
        this.appliquerType(scene, this.typeActif, { garderRotation: true });

        if (this.typeActif === "tournante" && this.rotationEnPause) {
            this.mettreRotationEnPause(scene);
        }
    }

    libelleType(type) {
        if (type === "haut") return "Haut";
        if (type === "bas") return "Bas";
        if (type === "tournante") return "Tournante";
        return "Uniforme";
    }

    garantirLumieres(scene) {
        if (!scene) return null;

        scene.metadata = scene.metadata || {};
        scene.metadata.lumieres = scene.metadata.lumieres || {};

        const lumieres = scene.metadata.lumieres;

        // Compatibilité avec les anciennes versions.
        if (!lumieres.lumierePrincipale) {
            lumieres.lumierePrincipale = lumieres.lumiereAmbiante
                ?? scene.getLightByName?.("LumiereAmbiante")
                ?? scene.getLightByName?.("mainLight")
                ?? null;
        }

        if (!lumieres.lumierePrincipale || lumieres.lumierePrincipale.isDisposed?.()) {
            lumieres.lumierePrincipale = new BABYLON.HemisphericLight(
                "LumierePrincipale",
                this.creerVecteur(constantesLumiere.principale.direction),
                scene
            );
        }

        // On garde aussi l'ancien nom pour les fichiers qui l'utilisent encore.
        lumieres.lumiereAmbiante = lumieres.lumierePrincipale;

        if (!lumieres.lumiereDirectionnelle || lumieres.lumiereDirectionnelle.isDisposed?.()) {
            lumieres.lumiereDirectionnelle = scene.getLightByName?.("LumiereDirectionnelle")
                ?? new BABYLON.DirectionalLight(
                    "LumiereDirectionnelle",
                    this.directionReferencePourType("haut"),
                    scene
                );
        }

        lumieres.lumierePrincipale.diffuse = this.couleurActuelle;
        lumieres.lumiereDirectionnelle.diffuse = this.couleurActuelle;

        return lumieres;
    }
}
