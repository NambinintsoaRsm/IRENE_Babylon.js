/**
 * @file Sérialisation et persistance locale du profil utilisateur ANNA.
 *
 * Rôle : convertir ProfilUtilisateur en JSON versionné, l'enregistrer dans
 * localStorage et reconstruire un profil au démarrage.
 *
 * Utilisation : sauvegarde manuelle et sauvegarde automatique utilisent toutes deux
 * ce même stockage afin d'éviter deux sources de vérité concurrentes.
 *
 * Contrainte : lorsque l'accessibilité temporaire est active, la sauvegarde conserve
 * les réglages normaux précédant son activation puis persiste séparément son état.
 */
import { ProfilUtilisateur } from "../../Domain/profil/ProfilUtilisateur.js";
import { constantesSauvegarde } from "../../Configuration/constantesSauvegarde.js";

import { ParametresInterface } from "../../Domain/interface/ParametresInterface.js";
import { ParametresApparence } from "../../Domain/apparence/ParametresApparence.js";
import { ParametresContours } from "../../Domain/contours/ParametresContours.js";
import { TypeContour } from "../../Domain/contours/TypeContour.js";
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
    constructor(
        cleStockage = constantesSauvegarde.cleProfil,
        ancienneCleStockage = constantesSauvegarde.ancienneCleProfil
    ) {
        this.cleStockage = cleStockage;
        this.ancienneCleStockage = ancienneCleStockage;
        this.version = 3;
    }

    localStorageDisponible() {
        try {
            return typeof window !== "undefined"
                && typeof window.localStorage !== "undefined";
        } catch (erreur) {
            return false;
        }
    }

    /**
     * Sérialise et écrit un profil validé dans localStorage.
     *
     * @param {ProfilUtilisateur} profil Profil métier à persister.
     * @returns {Object} Représentation JSON-compatible réellement enregistrée.
     * @throws {Error} Si le profil est invalide ou localStorage indisponible.
     */
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

    /**
     * Charge la sauvegarde courante, avec lecture de l'ancienne clé si nécessaire.
     *
     * @returns {ProfilUtilisateur|null} Profil reconstruit ou null en l'absence de sauvegarde valide.
     */
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
        const sauvegardeAccessibilite = this.lireSauvegardeAvantAccessibilite(etatApplication);
        const camera = sauvegardeAccessibilite?.camera
            ? this.lireCameraDepuisSauvegarde(etatApplication, sauvegardeAccessibilite.camera)
            : this.lireCameraCourante(etatApplication);

        return new ProfilUtilisateur({
            // Si l'accessibilité est active, on sauvegarde les réglages normaux
            // d'avant activation, puis seulement le booléen accessibilite.actif.
            interfaceUtilisateur: sauvegardeAccessibilite?.interface
                ? new ParametresInterface(sauvegardeAccessibilite.interface)
                : etatApplication.interface?.parametres,
            apparence: sauvegardeAccessibilite?.apparence
                ? new ParametresApparence(sauvegardeAccessibilite.apparence)
                : etatApplication.apparence?.parametres,
            contours: etatApplication.contours?.parametres,
            camera: camera ?? etatApplication.camera?.parametres,
            modele3DId: etatApplication.modele3d?.modeleActuel?.id
                ?? etatApplication.modele3d?.modeleSelectionne?.id
                ?? null,
            lumiere: this.lireLumiereCourante(etatApplication, sauvegardeAccessibilite),
            fondScene: sauvegardeAccessibilite?.fondScene
                ? this.lireFondSceneDepuisSauvegarde(sauvegardeAccessibilite.fondScene)
                : this.lireFondSceneCourant(etatApplication),
            accessibilite: this.lireAccessibiliteCourante(etatApplication),
            dateSauvegarde: new Date().toISOString(),
            versionSauvegarde: this.version
        });
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


    lireSauvegardeAvantAccessibilite(etatApplication) {
        const accessibilite = etatApplication.accessibilite;

        if (!accessibilite?.actif || !accessibilite?.sauvegardeAvantActivation) {
            return null;
        }

        return accessibilite.sauvegardeAvantActivation;
    }


    lireCameraDepuisSauvegarde(etatApplication, sauvegardeCamera) {
        const parametres = etatApplication.camera?.parametres;

        return new ParametresCamera({
            alpha: parametres?.alpha,
            beta: parametres?.beta,
            rayon: parametres?.rayon,
            cible: parametres?.cible,
            zoom: parametres?.zoom,
            wheelPrecision: Number.isFinite(sauvegardeCamera?.wheelPrecision)
                ? sauvegardeCamera.wheelPrecision
                : parametres?.wheelPrecision,
            sensibiliteRotation: Number.isFinite(sauvegardeCamera?.angularSensibilityX)
                ? sauvegardeCamera.angularSensibilityX
                : parametres?.sensibiliteRotation,
            distanceMin: parametres?.distanceMin,
            distanceMax: parametres?.distanceMax,
            estBloquee: Boolean(parametres?.estBloquee)
        });
    }

    lireFondSceneDepuisSauvegarde(fondScene) {
        if (!fondScene || !Number.isFinite(fondScene.r)) {
            return 0;
        }

        const moyenne = (Number(fondScene.r) + Number(fondScene.g) + Number(fondScene.b)) / 3;
        return Math.round((1 - moyenne) * 100);
    }

    lireLumiereCourante(etatApplication, sauvegardeAccessibilite = null) {
        if (sauvegardeAccessibilite?.lumiere) {
            return sauvegardeAccessibilite.lumiere;
        }

        const service = etatApplication.services?.lumiere;

        if (service?.obtenirParametresSauvegarde) {
            return service.obtenirParametresSauvegarde();
        }

        return etatApplication.lumiere?.parametres ?? null;
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
                    epaisseur: this.desContoursSontActifs(profil.contours) ? profil.contours.epaisseur : 1,
                    seuil: profil.contours.seuil,
                    couleur: profil.contours.couleur,
                    couleurAutomatiqueActive: profil.contours.couleurAutomatiqueActive,
                    couleurManuelleChoisie: profil.contours.couleurManuelleChoisie,
                    couleurAutomatiqueCalculee: profil.contours.couleurAutomatiqueCalculee,
                    signatureCouleurAutomatique: profil.contours.signatureCouleurAutomatique
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
        const contoursSauvegardes = this.normaliserContoursSauvegardes(reglages.contours ?? {});

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
                actif: contoursSauvegardes.actif,
                typeActif: contoursSauvegardes.typeActif,
                typesActifs: contoursSauvegardes.typesActifs,
                epaisseur: contoursSauvegardes.epaisseur,
                seuil: contoursSauvegardes.seuil,
                couleur: contoursSauvegardes.couleur,
                couleurAutomatiqueActive: contoursSauvegardes.couleurAutomatiqueActive ?? true,
                couleurManuelleChoisie: contoursSauvegardes.couleurManuelleChoisie ?? false,
                couleurAutomatiqueCalculee: contoursSauvegardes.couleurAutomatiqueCalculee ?? null,
                signatureCouleurAutomatique: contoursSauvegardes.signatureCouleurAutomatique ?? null
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
            fondScene: reglages.apparence?.fondScene ?? reglages.fondScene ?? 0,
            accessibilite: reglages.accessibilite ?? null,
            dateSauvegarde: donnees.dateSauvegarde ?? null,
            versionSauvegarde: donnees.version ?? 1
        });
    }


    desContoursSontActifs(contours) {
        return Boolean(contours?.actif)
            && (
                (Array.isArray(contours?.typesActifs) && contours.typesActifs.length > 0)
                || Boolean(contours?.typeActif)
            );
    }

    normaliserContoursSauvegardes(contours) {
        // Compatibilité descendante : un profil V2 peut contenir relief/couleur.
        // En V1 ces types sont simplement ignorés, sans casser le chargement.
        const candidats = Array.isArray(contours?.typesActifs)
            ? contours.typesActifs
            : (contours?.typeActif ? [contours.typeActif] : []);

        const typesActifs = [...new Set(candidats)]
            .filter((type) => type === TypeContour.SILHOUETTE);
        const actif = Boolean(contours?.actif) && typesActifs.length > 0;

        return {
            ...contours,
            actif,
            typesActifs: actif ? typesActifs : [],
            typeActif: actif ? TypeContour.SILHOUETTE : null,
            epaisseur: Number.isFinite(Number(contours?.epaisseur))
                ? Number(contours.epaisseur)
                : 1
        };
    }


}
