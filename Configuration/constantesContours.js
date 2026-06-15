import { TypeContour } from "../Domain/contours/TypeContour.js";

export const constantesContours = Object.freeze({
    epaisseurDefaut: 1,
    couleurDefaut: "#000000",

    // Valeurs du slider visibles dans l'interface.
    // Le slider reste global : il peut aller de 1 à 3 pour permettre à la silhouette d'aller jusqu'à 3.
    epaisseurSlider: Object.freeze({
        min: 1,
        max: 3,
        defaut: 1,
        step: 1
    }),

    // Limites réellement appliquées au rendu selon le type de contour.
    // La silhouette peut utiliser toute la plage du slider.
    // Relief et Couleur sont limités à 2, même si le slider est à 3.
    epaisseurParType: Object.freeze({
        [TypeContour.SILHOUETTE]: Object.freeze({
            min: 1.2,
            max: 3,
            renfortBase: 0.2
        }),
        [TypeContour.RELIEF]: Object.freeze({
            min: 1,
            max: 2,
            renfortBase: 0
        }),
        [TypeContour.COULEUR]: Object.freeze({
            min: 1,
            max: 2,
            renfortBase: 0
        })
    }),

    seuils: Object.freeze({
        [TypeContour.SILHOUETTE]: 0.005,
        [TypeContour.RELIEF]: 0.12,
        [TypeContour.COULEUR]: 0.30
    })
});
