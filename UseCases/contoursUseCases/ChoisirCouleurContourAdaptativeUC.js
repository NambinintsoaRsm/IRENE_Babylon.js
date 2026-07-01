import { TypeContour } from "../../Domain/contours/TypeContour.js";

export class ChoisirCouleurContourAdaptativeUC {
    constructor(etatApplication, serviceCouleurContourAdaptative) {
        this.etatApplication = etatApplication;
        this.serviceCouleurContourAdaptative = serviceCouleurContourAdaptative;
    }

    async executer(options = {}) {
        const contours = this.etatApplication?.contours;

        if (!contours?.parametres) {
            throw new Error("Paramètres de contours introuvables.");
        }

        if (!this.serviceCouleurContourAdaptative?.choisir) {
            throw new Error("Service de couleur optimale indisponible.");
        }

        const resultat = await this.serviceCouleurContourAdaptative.choisir(this.etatApplication);

        if (typeof contours.parametres.choisirCouleurAutomatique === "function") {
            contours.parametres.choisirCouleurAutomatique(resultat.couleur);
        } else {
            contours.parametres.couleur = resultat.couleur;
            contours.parametres.couleurAutomatiqueCalculee = resultat.couleur;
            contours.parametres.couleurAutomatiqueActive = true;
            contours.parametres.couleurManuelleChoisie = false;
        }

        if (options?.activerSilhouette === true) {
            contours.parametres.activer(TypeContour.SILHOUETTE);
        }

        return {
            parametres: contours.parametres,
            resultat
        };
    }
}
