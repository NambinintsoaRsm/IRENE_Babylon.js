import { TypeContour } from "../Domain/contours/TypeContour.js";

export const constantesContours = Object.freeze({
    epaisseurDefaut: 1,
    couleurDefaut: "#000000",

    epaisseurSlider: Object.freeze({
        min: 1,
        max: 3,
        defaut: 1,
        step: 1
    }),

    /**
     * Réglages visuels par type de contour.
     *
     * Le slider utilisateur reste commun et va de 1 à 3.
     * Ensuite, chaque type convertit cette valeur en épaisseur réellement appliquée :
     * - Silhouette : 1 à 3, avec un léger renfort quand le slider vaut 1.
     * - Relief : 1 à 2, mais progressif sur les positions 1 / 2 / 3 du slider.
     * - Couleur : 1 à 2, mais progressif sur les positions 1 / 2 / 3 du slider.
     */
    epaisseursParType: Object.freeze({
        [TypeContour.SILHOUETTE]: Object.freeze({
            min: 1,
            max: 3,
            renfortBase: 0.35
        }),

        [TypeContour.RELIEF]: Object.freeze({
            min: 1,
            max: 2
        }),

        [TypeContour.COULEUR]: Object.freeze({
            min: 1,
            max: 2
        })
    }),

    seuils: Object.freeze({
        [TypeContour.SILHOUETTE]: 0.005,
        [TypeContour.RELIEF]: 0.12,
        [TypeContour.COULEUR]: 0.30
    })
});
