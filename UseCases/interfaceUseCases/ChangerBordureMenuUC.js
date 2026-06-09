export class ChangerBordureMenuUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(tailleBorduresMenu) {
        if (!Number.isFinite(tailleBorduresMenu) || tailleBorduresMenu < 0) {
            throw new Error("Taille de bordure du menu invalide.");
        }

        const parametres = this.etatApplication.interface.parametres;

        if (!parametres) {
            throw new Error("Paramètres d'interface introuvables.");
        }

        const nouveauxParametres = parametres.copierAvec({
            tailleBorduresMenu
        });

        this.etatApplication.interface.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}