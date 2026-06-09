export class ChangerModeleActifUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(idModele) {
        if (typeof idModele !== "string" || idModele.trim() === "") {
            throw new Error("Identifiant du modèle invalide.");
        }

        const etatModele = this.etatApplication.modele3d;

        if (!etatModele) {
            throw new Error("État du modèle 3D introuvable.");
        }

        const modele = etatModele.modelesDisponibles.find(
            (modeleDisponible) => modeleDisponible.id === idModele
        );

        if (!modele) {
            throw new Error(`Modèle introuvable : ${idModele}`);
        }

        etatModele.modeleSelectionne = modele;
        etatModele.demarrerChargement(modele);

        return {
            modeleSelectionne: modele,
            etatModele
        };
    }
}