/**
 * Fonctions utilitaires pour manipuler les couleurs.
 */
export function estCouleurHexa(couleur) {
    if (typeof couleur !== "string") {
        return false;
    }

    return /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(couleur.trim());
}

export function normaliserCouleurHexa(couleur, couleurDefaut = "#000000FF") {
    if (typeof couleur !== "string") {
        return couleurDefaut;
    }

    const valeur = couleur.trim();

    if (/^#[0-9A-Fa-f]{6}$/.test(valeur)) {
        return `${valeur}FF`;
    }

    if (/^#[0-9A-Fa-f]{8}$/.test(valeur)) {
        return valeur;
    }

    return couleurDefaut;
}

export function versHexa(nombre) {
    const valeur = Math.max(0, Math.min(255, Math.round(nombre)));
    return valeur.toString(16).padStart(2, "0").toUpperCase();
}

export function inverserCouleurHexa(couleur) {
    const couleurNormale = normaliserCouleurHexa(couleur);
    const hexa = couleurNormale.replace("#", "");

    const r = 255 - parseInt(hexa.substring(0, 2), 16);
    const g = 255 - parseInt(hexa.substring(2, 4), 16);
    const b = 255 - parseInt(hexa.substring(4, 6), 16);
    const a = hexa.substring(6, 8);

    return `#${versHexa(r)}${versHexa(g)}${versHexa(b)}${a}`;
}

export function couleurHexaVersRgb01(couleur) {
    const couleurNormale = normaliserCouleurHexa(couleur);
    const hexa = couleurNormale.replace("#", "");

    return {
        r: parseInt(hexa.substring(0, 2), 16) / 255,
        g: parseInt(hexa.substring(2, 4), 16) / 255,
        b: parseInt(hexa.substring(4, 6), 16) / 255,
        a: parseInt(hexa.substring(6, 8), 16) / 255
    };
}

export function couleurRgb01VersHexa({ r, g, b, a = 1 }) {
    return `#${versHexa(r * 255)}${versHexa(g * 255)}${versHexa(b * 255)}${versHexa(a * 255)}`;
}