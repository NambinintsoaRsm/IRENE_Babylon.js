/**
 * @file Valeurs de référence des réglages d'apparence et des textures ANNA.
 *
 * Les bornes ci-dessous correspondent aux plages utilisées par les sliders de
 * la V1. Elles sont centralisées ici afin que les Use Cases, les contrôleurs et
 * les post-traitements appliquent les mêmes limites.
 *
 * Les valeurs sont empiriques : elles proviennent de la base fonctionnelle
 * actuelle et ne constituent pas des seuils normatifs d'accessibilité.
 */
export const constantesApparence = Object.freeze({
    nettete: Object.freeze({
        /** Aucun renforcement. */
        min: 0,
        /** Renforcement maximal accepté par le post-traitement actuel. */
        max: 2,
        /** Image non renforcée au démarrage. */
        defaut: 0
    }),

    contraste: Object.freeze({
        /** 0,5 réduit fortement les écarts clair/foncé sans annuler l'image. */
        min: 0.5,
        /** 2,5 garde un contraste marqué sans étendre inutilement le slider. */
        max: 2.5,
        /** 1 = contraste neutre. */
        defaut: 1
    }),

    luminosite: Object.freeze({
        /** Assombrissement maximal de la plage actuelle. */
        min: -0.4,
        /** Éclaircissement maximal de la plage actuelle. */
        max: 0.4,
        /** 0 = aucune correction de luminosité. */
        defaut: 0
    }),

    saturation: Object.freeze({
        /** 0 produit une image désaturée. */
        min: 0,
        /** 2 autorise une saturation renforcée sans plage excessive. */
        max: 2,
        /** 1 = saturation d'origine. */
        defaut: 1
    }),

    /** null signifie : conserver la texture originale du modèle. */
    textureDefaut: null,

    /**
     * Réglage centralisé de la taille des motifs procéduraux.
     *
     * Le slider ne représente pas une taille en pixels. Sa valeur est un écart
     * appliqué à une taille de base ; cela permet de conserver une échelle de
     * réglage simple dans l'interface tout en calculant des motifs en pixels.
     */
    textureMotif: Object.freeze({
        slider: Object.freeze({
            min: -5,
            max: 2,
            defaut: 0,
            step: 1
        }),

        /**
         * Résolution des DynamicTexture Babylon générées pour damiers/rayures.
         * 512×512 offre un compromis stable entre netteté du motif et coût GPU.
         */
        texture: Object.freeze({
            largeur: 512,
            hauteur: 512
        }),

        damier: Object.freeze({
            /** Taille de case correspondant à la position neutre du slider. */
            tailleBase: 24,
            /** Variation, en pixels, pour un pas du slider. */
            pas: 4,
            /** Garde les cases suffisamment grandes pour rester lisibles. */
            tailleMin: 4
        }),

        rayures: Object.freeze({
            /** Largeur de rayure correspondant à la position neutre. */
            largeurBase: 12,
            /** Variation, en pixels, pour un pas du slider. */
            pas: 2,
            /** Évite des rayures sous-pixel ou quasi invisibles. */
            largeurMin: 2
        })
    })
});
