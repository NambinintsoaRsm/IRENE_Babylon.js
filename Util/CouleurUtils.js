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

export function couleurHexaVersRgb255(couleur) {
    const couleurNormale = normaliserCouleurHexa(couleur);
    const hexa = couleurNormale.replace("#", "");

    return {
        r: parseInt(hexa.substring(0, 2), 16),
        g: parseInt(hexa.substring(2, 4), 16),
        b: parseInt(hexa.substring(4, 6), 16),
        a: parseInt(hexa.substring(6, 8), 16)
    };
}

export function couleurRgb255VersHexa({ r, g, b, a = 255 }) {
    return `#${versHexa(r)}${versHexa(g)}${versHexa(b)}${versHexa(a)}`;
}

export function couleurBabylonVersRgb255(couleur, couleurDefaut = { r: 0, g: 0, b: 0, a: 255 }) {
    if (!couleur) {
        return couleurDefaut;
    }

    return {
        r: Math.round(Math.max(0, Math.min(1, couleur.r ?? 0)) * 255),
        g: Math.round(Math.max(0, Math.min(1, couleur.g ?? 0)) * 255),
        b: Math.round(Math.max(0, Math.min(1, couleur.b ?? 0)) * 255),
        a: Math.round(Math.max(0, Math.min(1, couleur.a ?? 1)) * 255)
    };
}

export function distanceRgb(couleurA, couleurB) {
    const dr = (couleurA.r ?? 0) - (couleurB.r ?? 0);
    const dg = (couleurA.g ?? 0) - (couleurB.g ?? 0);
    const db = (couleurA.b ?? 0) - (couleurB.b ?? 0);

    return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function luminanceRelative(couleur) {
    const convertirCanal = (valeur) => {
        const v = Math.max(0, Math.min(255, valeur)) / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * convertirCanal(couleur.r ?? 0) +
        0.7152 * convertirCanal(couleur.g ?? 0) +
        0.0722 * convertirCanal(couleur.b ?? 0);
}

export function contrasteLuminance(couleurA, couleurB) {
    const l1 = luminanceRelative(couleurA);
    const l2 = luminanceRelative(couleurB);
    const clair = Math.max(l1, l2);
    const sombre = Math.min(l1, l2);

    return (clair + 0.05) / (sombre + 0.05);
}

function srgbVersLineaire(canal255) {
    const c = Math.max(0, Math.min(255, canal255)) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function rgb255VersOklab(couleur) {
    const r = srgbVersLineaire(couleur.r ?? 0);
    const g = srgbVersLineaire(couleur.g ?? 0);
    const b = srgbVersLineaire(couleur.b ?? 0);

    const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
    const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
    const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

    const lRacine = Math.cbrt(l);
    const mRacine = Math.cbrt(m);
    const sRacine = Math.cbrt(s);

    return {
        l: 0.2104542553 * lRacine + 0.7936177850 * mRacine - 0.0040720468 * sRacine,
        a: 1.9779984951 * lRacine - 2.4285922050 * mRacine + 0.4505937099 * sRacine,
        b: 0.0259040371 * lRacine + 0.7827717662 * mRacine - 0.8086757660 * sRacine
    };
}

export function distanceOklab(couleurA, couleurB) {
    const a = rgb255VersOklab(couleurA);
    const b = rgb255VersOklab(couleurB);
    const dl = a.l - b.l;
    const da = a.a - b.a;
    const db = a.b - b.b;

    return Math.sqrt(dl * dl + da * da + db * db);
}
