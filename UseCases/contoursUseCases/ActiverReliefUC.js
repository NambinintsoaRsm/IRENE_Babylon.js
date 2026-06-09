import { TypeContour } from "../../Domain/contours/TypeContour.js";

export class ActiverReliefUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer() {
        const contours = this.etatApplication.contours;

        if (!contours || !contours.parametres) {
            throw new Error("Paramètres de contours introuvables.");
        }

        contours.parametres.activer(TypeContour.RELIEF);

        return contours.parametres;
    }
}