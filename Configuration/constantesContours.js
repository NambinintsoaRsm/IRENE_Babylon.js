import { TypeContour } from "../Domain/contours/TypeContour.js";

export const constantesContours = Object.freeze({
    epaisseurDefaut: 1,
    couleurDefaut: "#000000",

    seuils: Object.freeze({
        [TypeContour.SILHOUETTE]: 0.005,
        [TypeContour.RELIEF]: 0.12,
        [TypeContour.COULEUR]: 0.30
    })
});