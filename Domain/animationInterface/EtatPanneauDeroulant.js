export class EtatPanneauDeroulant {
    constructor({
                    nom,
                    estOuvert = false,
                    hauteurOuverte = 0 // à définir
                } = {}) {
        this.nom = nom;
        this.estOuvert = estOuvert;
        this.hauteurOuverte = hauteurOuverte;

        this.valider();
    }

    valider() {
        if (typeof this.nom !== "string" || this.nom.trim() === "") {
            throw new Error("Le nom du panneau déroulant est invalide.");
        }

        if (typeof this.estOuvert !== "boolean") {
            throw new Error("L'état du panneau déroulant doit être un booléen.");
        }

        if (!Number.isFinite(this.hauteurOuverte) || this.hauteurOuverte < 0) {
            throw new Error("La hauteur ouverte du panneau déroulant est invalide.");
        }
    }

    ouvrir() {
        this.estOuvert = true;
    }

    fermer() {
        this.estOuvert = false;
    }

    // pour ouvrir ou fermer le pannel
    basculer() {
        this.estOuvert = !this.estOuvert;
    }
}