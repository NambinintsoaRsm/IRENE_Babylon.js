export class ChangerGrasUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(gras) {
        if (typeof gras !== "boolean") {
            throw new Error("Valeur du gras invalide.");
        }

        const parametres = this.etatApplication.interface.parametres;

        if (!parametres) {
            throw new Error("Paramètres d'interface introuvables.");
        }

        const nouveauxParametres = parametres.copierAvec({
            gras
        });

        this.etatApplication.interface.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}