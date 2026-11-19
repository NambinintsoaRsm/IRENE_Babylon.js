/**
 * Tracking expérimental : ratio de la taille de police, sans modification du texte.
 * Ex. 0.02 = 2 % de la taille affichée. Les graphèmes sont préservés.
 */
export function graphemesTexte(texte) {
    const chaine = String(texte ?? "");
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
        const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
        return Array.from(segmenter.segment(chaine), (segment) => segment.segment);
    }
    return Array.from(chaine);
}

export function ratioEspacementGras(configuration) {
    if (configuration?.actif !== true) return 0;
    const ratio = Number(configuration.ratio);
    return Number.isFinite(ratio) ? Math.max(0, Math.min(ratio, 0.3)) : 0;
}

/** Largeur cohérente avec le dessin caractère par caractère (sans crénage inter-glyphes). */
export function mesurerTexteAvecEspacement(contexte, texte, ratio, taillePolicePx) {
    const caracteres = graphemesTexte(texte);
    if (!caracteres.length) return 0;
    if (!(ratio > 0)) return contexte.measureText(String(texte ?? "")).width;
    const largeurGlyphes = caracteres.reduce(
        (total, caractere) => total + contexte.measureText(caractere).width, 0
    );
    return largeurGlyphes + Math.max(0, caracteres.length - 1) * taillePolicePx * ratio;
}
