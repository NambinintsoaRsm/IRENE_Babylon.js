/** Règle indépendante de Babylon.js : éligibilité d'une liste à une palette fixe. */
export function doitAppliquerCouleursFixesDropdown(nomListe, configuration) {
    if (!nomListe || configuration?.actif !== true) return false;
    const inclus = configuration.nomsInclus ?? [];
    const exclus = configuration.nomsExclus ?? [];
    if (exclus.includes(nomListe)) return false;
    if (configuration.mode === "inclusion") return inclus.includes(nomListe);
    if (configuration.mode === "exclusion") return true;
    return false;
}
