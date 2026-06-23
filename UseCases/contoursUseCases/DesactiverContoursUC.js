export class DesactiverContoursUC {
    constructor(etatApplication, epaisseurDefaut = 1) {
        this.etatApplication = etatApplication;
        this.epaisseurDefaut = epaisseurDefaut;
    }

    executer(typeContour = null) {
        const contours = this.etatApplication.contours;

        if (!contours || !contours.parametres) {
            throw new Error("Paramètres de contours introuvables.");
        }

        contours.parametres.desactiver(typeContour);

        // Si aucun contour ne reste actif, on remet l'épaisseur à la valeur par défaut.
        if (!contours.parametres.actif) {
            contours.parametres.changerEpaisseur(this.epaisseurDefaut);
        }

        return contours.parametres;
    }
}