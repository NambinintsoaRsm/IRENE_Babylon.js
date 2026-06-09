export class ChoisirVueEntropieUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer() {
        const etatModele = this.etatApplication.modele3d;

        if (!etatModele) {
            throw new Error("État du modèle 3D introuvable.");
        }

        if (!etatModele.modeleActuel) {
            throw new Error("Aucun modèle actif pour choisir une vue par entropie.");
        }

        return {
            doitChoisirVueEntropie: true,
            modeleActuel: etatModele.modeleActuel,
            meshActuel: etatModele.meshActuel,
            meshesImportes: etatModele.meshesImportes
        };
    }
}