export class ChangerTextureUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(textureActive) {
        if (textureActive !== null && typeof textureActive !== "string") {
            throw new Error("Texture invalide.");
        }

        const parametres = this.etatApplication.apparence.parametres;

        if (!parametres) {
            throw new Error("Paramètres d'apparence introuvables.");
        }

        const nouveauxParametres = parametres.copierAvec({
            textureActive
        });

        this.etatApplication.apparence.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}