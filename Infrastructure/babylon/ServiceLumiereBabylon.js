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
        this.typeActif = "principale";
        this.intensiteActuelle = 1.2;
        this.temperatureActuelle = 50;
        this.couleurActuelle = new BABYLON.Color3(1, 1, 1);
        this.facteurVitesseRotation = 1;
    }

    initialiser(scene) {
        this.garantirLumieres(scene);
        this.appliquerTemperature(scene, this.temperatureActuelle);
        this.appliquerType(scene, "principale");
    }

    appliquerIntensite(scene, valeur) {
        const intensite = Math.max(0, Math.min(3, Number(valeur) || 0));
        this.intensiteActuelle = intensite;
        this.appliquerType(scene, this.typeActif, { garderRotation: true });
    }

    appliquerTemperature(scene, valeur) {
        const valeurBornee = Math.max(0, Math.min(100, Number(valeur) || 0));
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

        if (!options.garderRotation) {
            this.arreterRotation(scene);
        }

        this.typeActif = type || "principale";

        if (this.typeActif === "haut") {
            this.activerDirectionnelle(scene, lumieres, new BABYLON.Vector3(0, -1, 0));
            return;
        }

        if (this.typeActif === "bas") {
            this.activerDirectionnelle(scene, lumieres, new BABYLON.Vector3(0, 1, 0));
            return;
        }

        if (this.typeActif === "tournante") {
            this.activerDirectionnelle(scene, lumieres, new BABYLON.Vector3(-1, -0.7, 0));
            if (!options.garderRotation) {
                this.demarrerRotation(scene);
            }
            return;
        }

        this.activerPrincipale(lumieres);
    }

    /**
     * Lumière principale : la lumière de base reste seule active.
     * La directionnelle est éteinte pour éviter les ombres ou contrastes trop forts.
     */
    activerPrincipale(lumieres) {
        if (lumieres.lumierePrincipale) {
            lumieres.lumierePrincipale.intensity = this.intensiteActuelle;
            lumieres.lumierePrincipale.direction = new BABYLON.Vector3(0, 1, 0);
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

        if (lumieres.lumierePrincipale) {
            // Base faible pour éviter un objet trop noir.
            lumieres.lumierePrincipale.intensity = this.intensiteActuelle * 0.35;
            lumieres.lumierePrincipale.direction = new BABYLON.Vector3(0, 1, 0);
        }

        if (lumieres.lumiereDirectionnelle) {
            lumieres.lumiereDirectionnelle.setEnabled?.(true);
            lumieres.lumiereDirectionnelle.intensity = this.intensiteActuelle;
            lumieres.lumiereDirectionnelle.direction = directionNormalisee.clone();
            lumieres.lumiereDirectionnelle.position = directionNormalisee.scale(-8);
        }

        this.appliquerCouleurAuxLumieres(lumieres, this.couleurActuelle);
    }

    demarrerRotation(scene) {
        if (!scene?.onBeforeRenderObservable) return;

        const lumieres = this.garantirLumieres(scene);
        if (!lumieres) return;

        let angle = 0;

        this.observateurRotation = scene.onBeforeRenderObservable.add(() => {
            const delta = scene.getEngine()?.getDeltaTime?.() ?? 16;
            angle += delta * 0.001 * (this.facteurVitesseRotation ?? 1);

            const direction = new BABYLON.Vector3(
                -Math.cos(angle),
                -0.7,
                -Math.sin(angle)
            ).normalize();

            this.activerDirectionnelle(scene, lumieres, direction);
        });
    }

    arreterRotation(scene) {
        if (this.observateurRotation && scene?.onBeforeRenderObservable) {
            scene.onBeforeRenderObservable.remove(this.observateurRotation);
        }

        this.observateurRotation = null;
    }

    reinitialiser(scene) {
        this.arreterRotation(scene);
        this.typeActif = "principale";
        this.intensiteActuelle = 1.2;
        this.temperatureActuelle = 50;
        this.appliquerTemperature(scene, 50);
        this.appliquerType(scene, "principale");
    }

    libelleTemperature(valeur) {
        if (valeur < 40) return "Chaud";
        if (valeur > 60) return "Froid";
        return "Neutre";
    }

    libelleType(type) {
        if (type === "haut") return "Haut";
        if (type === "bas") return "Bas";
        if (type === "tournante") return "Tournante";
        return "Principale";
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
                new BABYLON.Vector3(0, 1, 0),
                scene
            );
        }

        // On garde aussi l'ancien nom pour les fichiers qui l'utilisent encore.
        lumieres.lumiereAmbiante = lumieres.lumierePrincipale;

        if (!lumieres.lumiereDirectionnelle || lumieres.lumiereDirectionnelle.isDisposed?.()) {
            lumieres.lumiereDirectionnelle = scene.getLightByName?.("LumiereDirectionnelle")
                ?? new BABYLON.DirectionalLight(
                    "LumiereDirectionnelle",
                    new BABYLON.Vector3(-1, -1, 0),
                    scene
                );
        }

        lumieres.lumierePrincipale.diffuse = this.couleurActuelle;
        lumieres.lumiereDirectionnelle.diffuse = this.couleurActuelle;

        return lumieres;
    }
}
