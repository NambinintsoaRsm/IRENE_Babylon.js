/**
 * Indique si le réglage global de bordure s'applique à un bouton.
 * Ne dépend ni de Babylon.js, ni de l'état de l'application.
 */
export function peutModifierBordureBouton(nomBouton, boutonsExclus) {
    return !boutonsExclus.includes(nomBouton);
}
