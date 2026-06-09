export class ChangerNetteteUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(nettete) {
        if (!Number.isFinite(nettete) || nettete < 0) {
            throw new Error("Netteté invalide.");
        }

        const parametres = this.etatApplication.apparence.parametres;

        if (!parametres) {
            throw new Error("Paramètres d'apparence introuvables.");
        }

        const nouveauxParametres = parametres.copierAvec({
            nettete
        });

        this.etatApplication.apparence.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}