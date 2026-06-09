export class SupprimerModeleActuelUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer() {
        const etatModele = this.etatApplication.modele3d;

        if (!etatModele) {
            throw new Error("État du modèle 3D introuvable.");
        }

        etatModele.viderModeleActuel();

        return etatModele;
    }
}