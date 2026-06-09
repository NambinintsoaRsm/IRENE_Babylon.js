export class ChargerProfilLocalUC {
    constructor(etatApplication, stockageProfilLocal) {
        this.etatApplication = etatApplication;
        this.stockageProfilLocal = stockageProfilLocal;
    }

    executer() {
        if (!this.stockageProfilLocal) {
            throw new Error("Service de stockage du profil introuvable.");
        }

        const profil = this.stockageProfilLocal.charger();

        if (!profil) {
            return null;
        }

        this.etatApplication.profil.profilActuel = profil;

        return profil;
    }
}