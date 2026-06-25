import { ProfilUtilisateur } from "../../Domain/profil/ProfilUtilisateur.js";

import { ParametresInterface } from "../../Domain/interface/ParametresInterface.js";
import { ParametresApparence } from "../../Domain/apparence/ParametresApparence.js";
import { ParametresContours } from "../../Domain/contours/ParametresContours.js";
import { ParametresCamera } from "../../Domain/camera/ParametresCamera.js";

/**
 * Gère la sauvegarde locale des réglages utilisateur.
 *
 * Important : une application web ne peut pas écrire automatiquement un vrai
 * fichier sur le disque au moment de la fermeture du navigateur. Le stockage
 * utilisé ici est donc un fichier JSON interne au navigateur via localStorage.
 * La structure reste volontairement proche d'un fichier exportable pour pouvoir
 * ajouter facilement plus tard l'import/export manuel, les réglages OS ou les
 * préférences navigateur.
 */
export class StockageProfilLocal {
    constructor(cleStockage = "saotra_reglages_utilisateur", ancienneCleStockage = "saotra_profil_utilisateur") {
        this.cleStockage = cleStockage;
        this.ancienneCleStockage = ancienneCleStockage;
        this.version = 2;
    }

    localStorageDisponible() {
        try {
            return typeof window !== "undefined"
                && typeof window.localStorage !== "undefined";
        } catch (erreur) {
            return false;
        }
    }

    sauvegarder(profil) {
        if (!(profil instanceof ProfilUtilisateur)) {
            throw new Error("Profil utilisateur invalide pour la sauvegarde.");
        }

        if (!this.localStorageDisponible()) {
            throw new Error("localStorage indisponible.");
        }

        const donnees = this.convertirProfilEnDonnees(profil);

        window.localStorage.setItem(
            this.cleStockage,
            JSON.stringify(donnees)
        );

        return donnees;
    }

    sauvegarderDepuisEtat(etatApplication) {
        const profil = this.creerProfilDepuisEtat(etatApplication);
        return this.sauvegarder(profil);
    }

    charger() {
        if (!this.localStorageDisponible()) {
            return null;
        }

        const contenu = window.localStorage.getItem(this.cleStockage)
            ?? window.localStorage.getItem(this.ancienneCleStockage);

        if (!contenu) {
            return null;
        }

        try {
            const donnees = JSON.parse(contenu);
            return this.convertirDonneesEnProfil(donnees);
        } catch (erreur) {
            console.warn("Profil local illisible. Il sera ignoré.", erreur);
            return null;
        }
    }

    supprimer() {
        if (!this.localStorageDisponible()) {
            return;
        }

        window.localStorage.removeItem(this.cleStockage);
        window.localStorage.removeItem(this.ancienneCleStockage);
    }

    existe() {
        if (!this.localStorageDisponible()) {
            return false;
        }

        return window.localStorage.getItem(this.cleStockage) !== null
            || window.localStorage.getItem(this.ancienneCleStockage) !== null;
    }

    creerProfilDepuisEtat(etatApplication) {
        const camera = this.lireCameraCourante(etatApplication);

        const profil = new ProfilUtilisateur({
            interfaceUtilisateur: etatApplication.interface?.parametres,
            apparence: etatApplication.apparence?.parametres,
            contours: etatApplication.contours?.parametres,
            camera: camera ?? etatApplication.camera?.parametres,
            modele3DId: etatApplication.modele3d?.modeleActuel?.id
                ?? etatApplication.modele3d?.modeleSelectionne?.id
                ?? null,
            lumiere: this.lireLumiereCourante(etatApplication),
            miseLumiere: this.lireMiseLumiereCourante(etatApplication),
            fondScene: this.lireFondSceneCourant(etatApplication),
            accessibilite: this.lireAccessibiliteCourante(etatApplication),
            dateSauvegarde: new Date().toISOString(),
            versionSauvegarde: this.version
        });

        return profil;
    }

    lireCameraCourante(etatApplication) {
        const camera = etatApplication.camera?.cameraBabylon;
        const parametres = etatApplication.camera?.parametres;

        if (!camera && !parametres) {
            return null;
        }

        const cible = camera?.target
            ? { x: camera.target.x, y: camera.target.y, z: camera.target.z }
            : parametres?.cible;

        return new ParametresCamera({
            alpha: Number.isFinite(camera?.alpha) ? camera.alpha : parametres?.alpha,
            beta: Number.isFinite(camera?.beta) ? camera.beta : parametres?.beta,
            rayon: Number.isFinite(camera?.radius) ? camera.radius : parametres?.rayon,
            cible,
            zoom: parametres?.zoom,
            wheelPrecision: Number.isFinite(camera?.wheelPrecision) ? camera.wheelPrecision : parametres?.wheelPrecision,
            sensibiliteRotation: Number.isFinite(camera?.angularSensibilityX)
                ? camera.angularSensibilityX
                : parametres?.sensibiliteRotation,
            distanceMin: Number.isFinite(camera?.lowerRadiusLimit) ? camera.lowerRadiusLimit : parametres?.distanceMin,
            distanceMax: Number.isFinite(camera?.upperRadiusLimit) ? camera.upperRadiusLimit : parametres?.distanceMax,
            estBloquee: Boolean(parametres?.estBloquee)
        });
    }

    lireLumiereCourante(etatApplication) {
        const service = etatApplication.services?.lumiere;

        if (service?.obtenirParametresSauvegarde) {
            return service.obtenirParametresSauvegarde();
        }

        return etatApplication.lumiere?.parametres ?? null;
    }

    lireMiseLumiereCourante(etatApplication) {
        return {
            normalesActif: Boolean(etatApplication.contours?.miseLumiereNormalesActif),
            couleursActif: Boolean(etatApplication.contours?.miseLumiereCouleursActif),
            parametres: {
                ...(etatApplication.contours?.parametresMiseLumiere ?? {})
            }
        };
    }

    lireFondSceneCourant(etatApplication) {
        const scene = etatApplication.scenes?.scene3D;
        const valeurDepuisParametres = etatApplication.apparence?.parametres?.fondScene;

        if (Number.isFinite(valeurDepuisParametres)) {
            return valeurDepuisParametres;
        }

        const clearColor = scene?.clearColor;
        if (!clearColor) {
            return 0;
        }

        const moyenne = (Number(clearColor.r) + Number(clearColor.g) + Number(clearColor.b)) / 3;
        return Math.round((1 - moyenne) * 100);
    }

    lireAccessibiliteCourante(etatApplication) {
        return {
            actif: Boolean(etatApplication.accessibilite?.actif),
            preferencesNavigateur: etatApplication.accessibilite?.preferencesNavigateur ?? null,
            preferencesOS: etatApplication.accessibilite?.preferencesOS ?? null
        };
    }

    convertirProfilEnDonnees(profil) {
        return {
            version: profil.versionSauvegarde ?? this.version,
            dateSauvegarde: profil.dateSauvegarde ?? new Date().toISOString(),

            reglages: {
                interfaceUtilisateur: {
                    police: profil.interfaceUtilisateur.police,
                    taillePolice: profil.interfaceUtilisateur.taillePolice,
                    gras: profil.interfaceUtilisateur.gras,
                    theme: profil.interfaceUtilisateur.theme,
                    positionMenu: profil.interfaceUtilisateur.positionMenu,
                    tailleBorduresMenu: profil.interfaceUtilisateur.tailleBorduresMenu,
                    tailleBorduresBoutons: profil.interfaceUtilisateur.tailleBorduresBoutons
                },

                apparence: {
                    contraste: profil.apparence.contraste,
                    luminosite: profil.apparence.luminosite,
                    saturation: profil.apparence.saturation,
                    nettete: profil.apparence.nettete,
                    textureActive: profil.apparence.textureActive,
                    textureMotifTaille: profil.apparence.textureMotifTaille,
                    materiauActif: profil.apparence.materiauActif,
                    fondScene: profil.apparence.fondScene ?? profil.fondScene ?? 0
                },

                contours: {
                    actif: profil.contours.actif,
                    typeActif: profil.contours.typeActif,
                    typesActifs: profil.contours.typesActifs,
                    epaisseur: profil.contours.epaisseur,
                    seuil: profil.contours.seuil,
                    couleur: profil.contours.couleur
                },

                camera: {
                    alpha: profil.camera.alpha,
                    beta: profil.camera.beta,
                    rayon: profil.camera.rayon,
                    cible: profil.camera.cible,
                    zoom: profil.camera.zoom,
                    wheelPrecision: profil.camera.wheelPrecision,
                    sensibiliteRotation: profil.camera.sensibiliteRotation,
                    distanceMin: profil.camera.distanceMin,
                    distanceMax: profil.camera.distanceMax,
                    estBloquee: profil.camera.estBloquee
                },

                lumiere: profil.lumiere ?? null,
                miseLumiere: profil.miseLumiere ?? null,
                accessibilite: profil.accessibilite ?? null,
                modele3DId: profil.modele3DId
            }
        };
    }

    convertirDonneesEnProfil(donnees) {
        if (!donnees || typeof donnees !== "object") {
            throw new Error("Données du profil local invalides.");
        }

        // Compatibilité avec l'ancien format : les réglages étaient à la racine.
        const reglages = donnees.reglages ?? donnees;

        return new ProfilUtilisateur({
            interfaceUtilisateur: new ParametresInterface({
                police: reglages.interfaceUtilisateur?.police,
                taillePolice: reglages.interfaceUtilisateur?.taillePolice,
                gras: reglages.interfaceUtilisateur?.gras,
                theme: reglages.interfaceUtilisateur?.theme,
                positionMenu: reglages.interfaceUtilisateur?.positionMenu,
                tailleBorduresMenu: reglages.interfaceUtilisateur?.tailleBorduresMenu,
                tailleBorduresBoutons: reglages.interfaceUtilisateur?.tailleBorduresBoutons
            }),

            apparence: new ParametresApparence({
                contraste: reglages.apparence?.contraste,
                luminosite: reglages.apparence?.luminosite,
                saturation: reglages.apparence?.saturation,
                nettete: reglages.apparence?.nettete,
                textureActive: reglages.apparence?.textureActive,
                textureMotifTaille: reglages.apparence?.textureMotifTaille,
                materiauActif: reglages.apparence?.materiauActif,
                fondScene: reglages.apparence?.fondScene ?? reglages.fondScene
            }),

            contours: new ParametresContours({
                actif: reglages.contours?.actif,
                typeActif: reglages.contours?.typeActif,
                typesActifs: reglages.contours?.typesActifs,
                epaisseur: reglages.contours?.epaisseur,
                seuil: reglages.contours?.seuil,
                couleur: reglages.contours?.couleur
            }),

            camera: new ParametresCamera({
                alpha: reglages.camera?.alpha,
                beta: reglages.camera?.beta,
                rayon: reglages.camera?.rayon,
                cible: reglages.camera?.cible,
                zoom: reglages.camera?.zoom,
                wheelPrecision: reglages.camera?.wheelPrecision,
                sensibiliteRotation: reglages.camera?.sensibiliteRotation,
                distanceMin: reglages.camera?.distanceMin,
                distanceMax: reglages.camera?.distanceMax,
                estBloquee: reglages.camera?.estBloquee
            }),

            modele3DId: reglages.modele3DId ?? null,
            lumiere: reglages.lumiere ?? null,
            miseLumiere: reglages.miseLumiere ?? null,
            fondScene: reglages.apparence?.fondScene ?? reglages.fondScene ?? 0,
            accessibilite: reglages.accessibilite ?? null,
            dateSauvegarde: donnees.dateSauvegarde ?? null,
            versionSauvegarde: donnees.version ?? 1
        });
    }
}
