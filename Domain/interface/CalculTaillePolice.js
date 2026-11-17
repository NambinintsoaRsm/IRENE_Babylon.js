/** Calcul additif indépendant des contrôles Babylon.js. */
export function calculerTaillePolicePx(tailleReferencePx, niveau) {
    if (!Number.isFinite(tailleReferencePx) || tailleReferencePx <= 0) {
        throw new Error("Taille de référence invalide.");
    }
    if (!Number.isInteger(niveau) || niveau < 1 || niveau > 6) {
        throw new Error("Niveau de police invalide (1 à 6).");
    }
    return tailleReferencePx + (niveau - 1);
}
