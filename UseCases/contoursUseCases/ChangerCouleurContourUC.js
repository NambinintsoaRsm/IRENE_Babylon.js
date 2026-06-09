export class ChangerCouleurContourUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(couleur) {
        if (typeof couleur !== "string" || couleur.trim() === "") {
            throw new Error("Couleur de contour invalide.");
        }

        const contours = this.etatApplication.contours;

        if (!contours || !contours.parametres) {
            throw new Error("Paramètres de contours introuvables.");
        }

        contours.parametres.couleur = couleur;

        return contours.parametres;
    }
}