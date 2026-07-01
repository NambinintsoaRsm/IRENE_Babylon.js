export class ListerModelesUC {
    constructor(etatApplication, { serviceDetectionModeles3D = null } = {}) {
        this.etatApplication = etatApplication;
        this.serviceDetectionModeles3D = serviceDetectionModeles3D;
        this.detectionDejaTentee = false;
    }

    executer() {
        const etatModele = this.obtenirEtatModele();

        if (!Array.isArray(etatModele.modelesDisponibles)) {
            throw new Error("Liste des modèles disponibles invalide.");
        }

        return etatModele.modelesDisponibles;
    }

    async actualiserDepuisDossier({ forcer = false } = {}) {
        const etatModele = this.obtenirEtatModele();

        if (!this.serviceDetectionModeles3D) {
            return this.executer();
        }

        if (this.detectionDejaTentee && !forcer) {
            return this.executer();
        }

        this.detectionDejaTentee = true;

        const modelesDetectes = await this.serviceDetectionModeles3D.detecterModeles();

        if (!Array.isArray(modelesDetectes) || modelesDetectes.length === 0) {
            console.info("[Modèles 3D] Détection automatique indisponible : conservation du catalogue de secours.");
            return this.executer();
        }

        const modeleSelectionneAvant = etatModele.modeleSelectionne;
        const modeleActuelAvant = etatModele.modeleActuel;

        etatModele.modelesDisponibles = modelesDetectes;

        etatModele.modeleSelectionne = this.retrouverModeleEquivalent(
            modeleSelectionneAvant,
            modelesDetectes
        ) ?? modelesDetectes[0] ?? null;

        etatModele.modeleActuel = this.retrouverModeleEquivalent(
            modeleActuelAvant,
            modelesDetectes
        ) ?? modeleActuelAvant ?? null;

        console.info(`[Modèles 3D] ${modelesDetectes.length} modèle(s) détecté(s) automatiquement.`);

        return etatModele.modelesDisponibles;
    }

    obtenirEtatModele() {
        const etatModele = this.etatApplication.modele3d;

        if (!etatModele) {
            throw new Error("État du modèle 3D introuvable.");
        }

        return etatModele;
    }

    retrouverModeleEquivalent(modele, modelesDetectes) {
        if (!modele) {
            return null;
        }

        const idNormalise = this.normaliserIdentifiant(modele.id);
        const nomNormalise = this.normaliserIdentifiant(modele.nom);

        return modelesDetectes.find((modeleDetecte) => {
            return modeleDetecte.id === modele.id
                || modeleDetecte.nom === modele.nom
                || modeleDetecte.chemin === modele.chemin
                || this.normaliserIdentifiant(modeleDetecte.id) === idNormalise
                || this.normaliserIdentifiant(modeleDetecte.nom) === nomNormalise;
        }) ?? null;
    }

    normaliserIdentifiant(valeur) {
        return String(valeur ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "");
    }
}
