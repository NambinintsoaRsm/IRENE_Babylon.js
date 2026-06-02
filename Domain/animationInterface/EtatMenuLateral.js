export class EtatMenuLateral {
    constructor({
                    estOuvert = true,
                    positionMenu = 0,
                    positionFleche = 0// à définir à partir de la taille du panneau
                } = {}) {
        this.estOuvert = estOuvert;
        this.positionMenu = positionMenu;
        this.positionFleche = positionFleche;

        this.valider();
    }

    valider() {
        if (typeof this.estOuvert !== "boolean") {
            throw new Error("L'état du menu latéral doit être un booléen.");
        }

        if (!Number.isFinite(this.positionMenu)) {
            throw new Error("La position du menu latéral est invalide.");
        }

        if (!Number.isFinite(this.positionFleche)) {
            throw new Error("La position de la flèche du menu est invalide.");
        }
    }

    ouvrir() {
        this.estOuvert = true;
    }

    fermer() {
        this.estOuvert = false;
    }

    basculer() {
        this.estOuvert = !this.estOuvert;
    }

    mettreAJourPositionMenu(position) {
        if (!Number.isFinite(position)) {
            throw new Error("La nouvelle position du menu est invalide.");
        }

        this.positionMenu = position;
    }

    mettreAJourPositionFleche(position) {
        if (!Number.isFinite(position)) {
            throw new Error("La nouvelle position de la flèche est invalide.");
        }

        this.positionFleche = position;
    }
}