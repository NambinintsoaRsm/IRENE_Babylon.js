export class ChangerContrasteUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(contraste) {
        if (!Number.isFinite(contraste) || contraste < 0) {
            throw new Error("Contraste invalide.");
        }

        const parametres = this.etatApplication.apparence.parametres;

        if (!parametres) {
            throw new Error("Paramètres d'apparence introuvables.");
        }

        const nouveauxParametres = parametres.copierAvec({
            contraste
        });

        this.etatApplication.apparence.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}