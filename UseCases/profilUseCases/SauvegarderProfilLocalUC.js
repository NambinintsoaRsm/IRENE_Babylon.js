export class SauvegarderProfilLocalUC {
    constructor(etatApplication, stockageProfilLocal) {
        this.etatApplication = etatApplication;
        this.stockageProfilLocal = stockageProfilLocal;
    }

    executer() {
        if (!this.stockageProfilLocal) {
            throw new Error("Service de stockage du profil introuvable.");
        }

        const donneesSauvegardees = this.stockageProfilLocal.sauvegarderDepuisEtat(this.etatApplication);
        const profil = this.stockageProfilLocal.charger();

        if (profil) {
            this.etatApplication.profil.profilActuel = profil;
        }

        return profil ?? donneesSauvegardees;
    }
}
