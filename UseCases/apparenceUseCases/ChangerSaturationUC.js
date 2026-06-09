export class ChangerSaturationUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(saturation) {
        if (!Number.isFinite(saturation) || saturation < 0) {
            throw new Error("Saturation invalide.");
        }

        const parametres = this.etatApplication.apparence.parametres;

        if (!parametres) {
            throw new Error("Paramètres d'apparence introuvables.");
        }

        const nouveauxParametres = parametres.copierAvec({
            saturation
        });

        this.etatApplication.apparence.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}