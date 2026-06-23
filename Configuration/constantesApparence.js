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
        min: -0.4,
        max: 0.4,
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
    }),

    // Réglage centralisé de la taille des motifs procéduraux.
    // Le slider ne donne pas directement une taille en pixels : il donne un écart
    // autour de la valeur de base. Cela permet de garder les valeurs facilement
    // modifiables ici.
    textureMotif: Object.freeze({
        slider: Object.freeze({
            min: -5,
            max: 2,
            defaut: 0,
            step: 1
        }),

        texture: Object.freeze({
            largeur: 512,
            hauteur: 512
        }),

        damier: Object.freeze({
            tailleBase: 24,
            pas: 4,
            tailleMin: 4
        }),

        rayures: Object.freeze({
            largeurBase: 12,
            pas: 2,
            largeurMin: 2
        })
    })
});