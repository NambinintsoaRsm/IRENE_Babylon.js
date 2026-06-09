export const constantesApparence = Object.freeze({
    nettete: Object.freeze({
        min: 0,
        max: 2,
        defaut: 0
    }),

    contraste: Object.freeze({
        min: 0.5,
        max: 2.5,
        defaut: 1
    }),

    luminosite: Object.freeze({
        min: -0.5,
        max: 0.5,
        defaut: 0
    }),

    saturation: Object.freeze({
        min: 0,
        max: 2,
        defaut: 1
    }),

    textureDefaut: null,

    texturesDisponibles: Object.freeze({
        ORIGINALE: "originale",
        DAMIER: "damier",
        RAYURES: "rayures"
    }),

    texturesProcedurales: Object.freeze({
        DAMIER: "damier",
        RAYURES: "rayures"
    })
});