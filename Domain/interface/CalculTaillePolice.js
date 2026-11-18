/** Calcul additif indépendant des contrôles Babylon.js. */
import { estNiveauPoliceValide, NIVEAU_POLICE_MIN, NIVEAU_POLICE_MAX } from "./NiveauPolice.js";

export function calculerTaillePolicePx(tailleReferencePx, niveau) {
    if (!Number.isFinite(tailleReferencePx) || tailleReferencePx <= 0) {
        throw new Error("Taille de référence invalide.");
    }
    if (!estNiveauPoliceValide(niveau)) {
        throw new Error(`Niveau de police invalide (${NIVEAU_POLICE_MIN} à ${NIVEAU_POLICE_MAX}).`);
    }
    return tailleReferencePx + (niveau - 1);
}
