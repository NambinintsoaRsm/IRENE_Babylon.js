export class ChangerLuminositeUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(luminosite) {
        if (!Number.isFinite(luminosite)) {
            throw new Error("Luminosité invalide.");
        }

        const parametres = this.etatApplication.apparence.parametres;

        if (!parametres) {
            throw new Error("Paramètres d'apparence introuvables.");
        }

        const nouveauxParametres = parametres.copierAvec({
            luminosite
        });

        this.etatApplication.apparence.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}