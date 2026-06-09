export class NormaliserModeleUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer() {
        const etatModele = this.etatApplication.modele3d;

        if (!etatModele) {
            throw new Error("État du modèle 3D introuvable.");
        }

        if (!etatModele.meshActuel && !etatModele.meshesImportes?.length) {
            throw new Error("Aucun modèle chargé à normaliser.");
        }

        return {
            doitNormaliser: true,
            modeleActuel: etatModele.modeleActuel,
            meshActuel: etatModele.meshActuel,
            meshesImportes: etatModele.meshesImportes
        };
    }
}