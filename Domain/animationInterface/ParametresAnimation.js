export class ParametresAnimation {
    constructor({
                    dureeMenuLateral,
                    dureePanneauDeroulant,
                    largeurMenu,
                    largeurPanneauSecondaire
                } = {}) {
        this.dureeMenuLateral = dureeMenuLateral;
        this.dureePanneauDeroulant = dureePanneauDeroulant;
        this.largeurMenu = largeurMenu;
        this.largeurPanneauSecondaire = largeurPanneauSecondaire;

        this.valider();
    }

    valider() {
        if (!Number.isFinite(this.dureeMenuLateral) || this.dureeMenuLateral <= 0) {
            throw new Error("La durée d'animation du menu latéral est invalide.");
        }

        if (!Number.isFinite(this.dureePanneauDeroulant) || this.dureePanneauDeroulant <= 0) {
            throw new Error("La durée d'animation du panneau déroulant est invalide.");
        }

        if (!Number.isFinite(this.largeurMenu) || this.largeurMenu <= 0) {
            throw new Error("La largeur du menu est invalide.");
        }

        if (!Number.isFinite(this.largeurPanneauSecondaire) || this.largeurPanneauSecondaire <= 0) {
            throw new Error("La largeur du panneau secondaire est invalide.");
        }
    }
}