import { TypeContour } from "../../Domain/contours/TypeContour.js";

export class ChoisirCouleurContourAdaptativeUC {
    constructor(etatApplication, serviceCouleurContourAdaptative) {
        this.etatApplication = etatApplication;
        this.serviceCouleurContourAdaptative = serviceCouleurContourAdaptative;
    }

    async executer() {
        const contours = this.etatApplication?.contours;

        if (!contours?.parametres) {
            throw new Error("Paramètres de contours introuvables.");
        }

        if (!this.serviceCouleurContourAdaptative?.choisir) {
            throw new Error("Service de couleur optimale indisponible.");
        }

        const resultat = await this.serviceCouleurContourAdaptative.choisir(this.etatApplication);

        contours.parametres.couleur = resultat.couleur;
        contours.parametres.activer(TypeContour.SILHOUETTE);

        return {
            parametres: contours.parametres,
            resultat
        };
    }
}
