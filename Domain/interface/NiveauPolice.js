/** Bornes métier communes aux niveaux additifs de taille de police. */
export const NIVEAU_POLICE_MIN = 1;
export const NIVEAU_POLICE_MAX = 7;

export function estNiveauPoliceValide(niveau) {
    return Number.isInteger(niveau)
        && niveau >= NIVEAU_POLICE_MIN
        && niveau <= NIVEAU_POLICE_MAX;
}

/** Normalise les préférences anciennes avant création du modèle. */
export function normaliserNiveauPolice(niveau, valeurParDefaut = NIVEAU_POLICE_MIN) {
    const nombre = Number(niveau);
    if (!Number.isFinite(nombre)) return valeurParDefaut;
    return Math.max(NIVEAU_POLICE_MIN, Math.min(NIVEAU_POLICE_MAX, Math.round(nombre)));
}
