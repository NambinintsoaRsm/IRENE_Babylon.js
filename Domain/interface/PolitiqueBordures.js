/**
 * Indique si le réglage global de bordure s'applique à un bouton.
 * Ne dépend ni de Babylon.js, ni de l'état de l'application.
 */
export function peutModifierBordureBouton(nomBouton, boutonsExclus) {
    return !boutonsExclus.includes(nomBouton);
}

/** Politique indépendante de Babylon.js pour les rectangles non-boutons. */
export function peutModifierBordureRectangle(nomRectangle, rectanglesExclus) {
    return !rectanglesExclus.includes(nomRectangle);
}
