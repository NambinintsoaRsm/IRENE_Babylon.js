/**
 * Paramètres d'animation modifiables pendant l'exécution.
 *
 * Les largeurs ne sont pas stockées ici : la GUI Babylon reste la source de
 * vérité pour les dimensions. Cette classe ne conserve que les durées que le
 * mode Accessibilité peut temporairement ralentir puis restaurer.
 */
export class ParametresAnimation {
    constructor({
        dureeMenuLateral,
        dureePanneauDeroulant
    } = {}) {
        this.dureeMenuLateral = dureeMenuLateral;
        this.dureePanneauDeroulant = dureePanneauDeroulant;

        this.valider();
    }

    /**
     * Vérifie que les durées sont des nombres strictement positifs.
     *
     * Une durée nulle ou négative rendrait les interpolations du service GUI
     * incohérentes et empêcherait le mode Accessibilité de restaurer un état
     * valide.
     */
    valider() {
        if (!Number.isFinite(this.dureeMenuLateral) || this.dureeMenuLateral <= 0) {
            throw new Error("La durée d'animation du menu latéral est invalide.");
        }

        if (!Number.isFinite(this.dureePanneauDeroulant) || this.dureePanneauDeroulant <= 0) {
            throw new Error("La durée d'animation du panneau déroulant est invalide.");
        }
    }
}
