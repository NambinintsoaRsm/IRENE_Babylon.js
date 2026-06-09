export class ChangerBordureBoutonUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(tailleBorduresBoutons) {
        if (!Number.isFinite(tailleBorduresBoutons) || tailleBorduresBoutons < 0) {
            throw new Error("Taille de bordure des boutons invalide.");
        }

        const parametres = this.etatApplication.interface.parametres;

        if (!parametres) {
            throw new Error("Paramètres d'interface introuvables.");
        }

        const nouveauxParametres = parametres.copierAvec({
            tailleBorduresBoutons
        });

        this.etatApplication.interface.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}