/**
 * Fonctions utilitaires pour lire et reconstruire les valeurs CSS/Babylon GUI.
 *
 * Exemples :
 * - "20%"  → 20
 * - "75px" → 75
 * - "-20%" → -20
 */
export function lireNombreDepuisValeurCss(valeur, valeurDefaut = 0) {
    if (typeof valeur === "number") {
        return Number.isFinite(valeur) ? valeur : valeurDefaut;
    }

    if (typeof valeur !== "string") {
        return valeurDefaut;
    }

    const nombre = parseFloat(valeur.trim());

    return Number.isFinite(nombre) ? nombre : valeurDefaut;
}

export function obtenirUniteCss(valeur) {
    if (typeof valeur !== "string") {
        return "";
    }

    const texte = valeur.trim();

    if (texte.endsWith("%")) {
        return "%";
    }

    if (texte.endsWith("px")) {
        return "px";
    }

    return "";
}

export function estValeurPourcentage(valeur) {
    return obtenirUniteCss(valeur) === "%";
}

export function estValeurPixel(valeur) {
    return obtenirUniteCss(valeur) === "px";
}

export function reconstruireValeurCss(nombre, unite = "") {
    if (!Number.isFinite(nombre)) {
        throw new Error("Nombre CSS invalide.");
    }

    return `${nombre}${unite}`;
}

export function garderUniteCss(valeurOriginale, nouvelleValeur) {
    const unite = obtenirUniteCss(valeurOriginale);

    return reconstruireValeurCss(nouvelleValeur, unite);
}