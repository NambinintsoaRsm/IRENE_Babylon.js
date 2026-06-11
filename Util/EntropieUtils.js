/**
 * Fonctions utilitaires liées à l'entropie visuelle.
 *
 * Pour l'instant, elles servent de base simple.
 * Le calcul pourra être enrichi ensuite si on décide d'analyser
 * réellement les pixels ou la complexité d'une vue du modèle.
 */

export function calculerEntropieDepuisValeurs(valeurs = []) {
    if (!Array.isArray(valeurs) || valeurs.length === 0) {
        return 0;
    }

    const occurrences = new Map();

    valeurs.forEach((valeur) => {
        occurrences.set(valeur, (occurrences.get(valeur) ?? 0) + 1);
    });

    let entropie = 0;
    const total = valeurs.length;

    occurrences.forEach((nombre) => {
        const probabilite = nombre / total;

        if (probabilite > 0) {
            entropie -= probabilite * Math.log2(probabilite);
        }
    });

    return entropie;
}

export function normaliserValeurPourEntropie(valeur, nombreClasses = 16) {
    if (!Number.isFinite(valeur)) {
        return 0;
    }

    const valeurBornee = Math.max(0, Math.min(1, valeur));
    return Math.floor(valeurBornee * (nombreClasses - 1));
}

export function calculerEntropieLuminositeDepuisPixels(pixels = []) {
    if (!Array.isArray(pixels) || pixels.length === 0) {
        return 0;
    }

    const valeursLuminosite = pixels.map((pixel) => {
        const r = pixel.r ?? 0;
        const g = pixel.g ?? 0;
        const b = pixel.b ?? 0;

        const luminosite = 0.299 * r + 0.587 * g + 0.114 * b;

        return normaliserValeurPourEntropie(luminosite);
    });

    return calculerEntropieDepuisValeurs(valeursLuminosite);
}

export function choisirMeilleureVueParEntropie(vues = []) {
    if (!Array.isArray(vues) || vues.length === 0) {
        return null;
    }

    let meilleureVue = null;
    let meilleureEntropie = -Infinity;

    vues.forEach((vue) => {
        const entropie = vue.entropie ?? 0;

        if (entropie > meilleureEntropie) {
            meilleureEntropie = entropie;
            meilleureVue = vue;
        }
    });

    return meilleureVue;
}