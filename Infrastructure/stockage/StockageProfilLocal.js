import { ProfilUtilisateur } from "../../Domain/profil/ProfilUtilisateur.js";

import { ParametresInterface } from "../../Domain/interface/ParametresInterface.js";
import { ParametresApparence } from "../../Domain/apparence/ParametresApparence.js";
import { ParametresContours } from "../../Domain/contours/ParametresContours.js";
import { ParametresCamera } from "../../Domain/camera/ParametresCamera.js";

/**
 * Gère la sauvegarde et le chargement local du profil utilisateur.
 *
 * Le profil est sauvegardé dans le navigateur avec localStorage.
 * Il ne dépend pas d'une base de données ni d'un compte utilisateur.
 *
 * Le profil contient les préférences locales :
 * - interface ;
 * - apparence ;
 * - contours ;
 * - caméra ;
 * - modèle 3D sélectionné.
 */
export class StockageProfilLocal {
    constructor(cleStockage = "saotra_profil_utilisateur") {
        this.cleStockage = cleStockage;
    }

    localStorageDisponible() {
        return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
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

    charger() {
        if (!this.localStorageDisponible()) {
            return null;
        }

        const contenu = window.localStorage.getItem(this.cleStockage);

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
    }

    existe() {
        if (!this.localStorageDisponible()) {
            return false;
        }

        return window.localStorage.getItem(this.cleStockage) !== null;
    }

    convertirProfilEnDonnees(profil) {
        return {
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
                textureActive: profil.apparence.textureActive
            },

            contours: {
                actif: profil.contours.actif,
                typeActif: profil.contours.typeActif,
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

            modele3DId: profil.modele3DId
        };
    }

    convertirDonneesEnProfil(donnees) {
        if (!donnees || typeof donnees !== "object") {
            throw new Error("Données du profil local invalides.");
        }

        return new ProfilUtilisateur({
            interfaceUtilisateur: new ParametresInterface({
                police: donnees.interfaceUtilisateur?.police,
                taillePolice: donnees.interfaceUtilisateur?.taillePolice,
                gras: donnees.interfaceUtilisateur?.gras,
                theme: donnees.interfaceUtilisateur?.theme,
                positionMenu: donnees.interfaceUtilisateur?.positionMenu,
                tailleBorduresMenu: donnees.interfaceUtilisateur?.tailleBorduresMenu,
                tailleBorduresBoutons: donnees.interfaceUtilisateur?.tailleBorduresBoutons
            }),

            apparence: new ParametresApparence({
                contraste: donnees.apparence?.contraste,
                luminosite: donnees.apparence?.luminosite,
                saturation: donnees.apparence?.saturation,
                nettete: donnees.apparence?.nettete,
                textureActive: donnees.apparence?.textureActive
            }),

            contours: new ParametresContours({
                actif: donnees.contours?.actif,
                typeActif: donnees.contours?.typeActif,
                epaisseur: donnees.contours?.epaisseur,
                seuil: donnees.contours?.seuil,
                couleur: donnees.contours?.couleur
            }),

            camera: new ParametresCamera({
                alpha: donnees.camera?.alpha,
                beta: donnees.camera?.beta,
                rayon: donnees.camera?.rayon,
                cible: donnees.camera?.cible,
                zoom: donnees.camera?.zoom,
                wheelPrecision: donnees.camera?.wheelPrecision,
                sensibiliteRotation: donnees.camera?.sensibiliteRotation,
                distanceMin: donnees.camera?.distanceMin,
                distanceMax: donnees.camera?.distanceMax,
                estBloquee: donnees.camera?.estBloquee
            }),

            modele3DId: donnees.modele3DId ?? null
        });
    }
}