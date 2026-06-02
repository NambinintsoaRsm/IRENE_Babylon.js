export class EtatModele3D {
    constructor({
                    modelesDisponibles = [],
                    modeleSelectionne = null,
                    modeleActuel = null,
                    meshActuel = null,
                    meshesImportes = [],
                    estEnChargement = false,
                    erreurChargement = null
                } = {}) {
        this.modelesDisponibles = modelesDisponibles;
        this.modeleSelectionne = modeleSelectionne;
        this.modeleActuel = modeleActuel;
        this.meshActuel = meshActuel;
        this.meshesImportes = meshesImportes;
        this.estEnChargement = estEnChargement;
        this.erreurChargement = erreurChargement;

        this.valider();
    }

    valider() {
        if (!Array.isArray(this.modelesDisponibles)) {
            throw new Error("La liste des modèles disponibles est invalide.");
        }

        if (!Array.isArray(this.meshesImportes)) {
            throw new Error("La liste des meshes importés est invalide.");
        }

        if (typeof this.estEnChargement !== "boolean") {
            throw new Error("L'état de chargement du modèle 3D doit être un booléen.");
        }
    }

    demarrerChargement(modele) {
        this.modeleSelectionne = modele;
        this.estEnChargement = true;
        this.erreurChargement = null;
    }

    terminerChargement({ modele, meshActuel, meshesImportes = [] }) {
        this.modeleActuel = modele;
        this.meshActuel = meshActuel;
        this.meshesImportes = meshesImportes;
        this.estEnChargement = false;
        this.erreurChargement = null;
    }

    signalerErreurChargement(erreur) {
        this.estEnChargement = false;
        this.erreurChargement = erreur;
    }

    viderModeleActuel() {
        this.modeleActuel = null;
        this.meshActuel = null;
        this.meshesImportes = [];
        this.estEnChargement = false;
        this.erreurChargement = null;
    }
}