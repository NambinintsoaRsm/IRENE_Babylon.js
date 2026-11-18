/** Effet de survol discret, sans changer le texte ni les bordures. */
export const configurationHoverGUI = Object.freeze({
    actif: true,
    dropdowns: Object.freeze({
        actif: true,
        // 0 = désactivé ; 0.08 = variation légère de luminosité (8 %).
        intensite: 0.08,
        dureeTransitionMs: 120,
        nomsExclus: Object.freeze([])
    })
});
