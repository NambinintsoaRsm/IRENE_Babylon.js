/**
 * Types de contours disponibles dans ANNA V1.
 *
 * V1 ne conserve que la silhouette. Les traitements Relief et Couleur
 * sont archivés séparément pour une réintégration future en V2.
 */
export const TypeContour = Object.freeze({
    SILHOUETTE: "silhouette"
});

export function estTypeContourValide(typeContour) {
    return Object.values(TypeContour).includes(typeContour);
}
