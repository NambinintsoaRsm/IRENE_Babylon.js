export class ChargerModeleUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(modele) {
        if (!modele) {
            throw new Error("Modèle 3D invalide.");
        }

        const etatModele = this.etatApplication.modele3d;

        if (!etatModele) {
            throw new Error("État du modèle 3D introuvable.");
        }

        etatModele.demarrerChargement(modele);

        return etatModele;
    }
}