export class ChangerEpaisseurContourUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(epaisseur) {
        if (!Number.isFinite(epaisseur) || epaisseur < 0) {
            throw new Error("Épaisseur de contour invalide.");
        }

        const contours = this.etatApplication.contours;

        if (!contours || !contours.parametres) {
            throw new Error("Paramètres de contours introuvables.");
        }

        contours.parametres.changerEpaisseur(epaisseur);

        return contours.parametres;
    }
}