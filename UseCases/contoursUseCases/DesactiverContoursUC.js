export class DesactiverContoursUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer() {
        const contours = this.etatApplication.contours;

        if (!contours || !contours.parametres) {
            throw new Error("Paramètres de contours introuvables.");
        }

        contours.parametres.desactiver();

        return contours.parametres;
    }
}