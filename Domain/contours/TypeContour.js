export const TypeContour = Object.freeze({
    SILHOUETTE: "silhouette",
    RELIEF: "relief",
    COULEUR: "couleur"
});

export function estTypeContourValide(typeContour) {
    return Object.values(TypeContour).includes(typeContour);
}