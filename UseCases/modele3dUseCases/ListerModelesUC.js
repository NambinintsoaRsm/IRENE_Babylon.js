export class ListerModelesUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer() {
        const etatModele = this.etatApplication.modele3d;

        if (!etatModele) {
            throw new Error("État du modèle 3D introuvable.");
        }

        if (!Array.isArray(etatModele.modelesDisponibles)) {
            throw new Error("Liste des modèles disponibles invalide.");
        }

        return etatModele.modelesDisponibles;
    }
}