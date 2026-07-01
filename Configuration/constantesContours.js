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
        [TypeContour.SILHOUETTE]: 0.00009,
        [TypeContour.RELIEF]: 0.12,
        [TypeContour.COULEUR]: 0.30
    }),


    /**
     * Test de mise en lumière locale des gradients.
     *
     * Les boutons ContLumNormBtn / ContLumCoulBtn n'affichent pas un trait coloré :
     * ils renforcent uniquement la luminosité locale des zones de fort gradient.
     */
    miseLumiereGradients: Object.freeze({
        normales: Object.freeze({
            // Seuil abaissé : le masque normal détecte davantage de reliefs,
            // ce qui rend le Highlight visible sur plus de modèles.
            seuilGradient: 0.4,
            intensite:0.9,
            voisinsMin: 2
        }),

        couleurs: Object.freeze({
            seuilGradient: 0.35,
            intensite: 0.9,
            voisinsMin: 2
        }),

        animation: Object.freeze({
            intervalleSecondes: Object.freeze({
                min: 1,
                max: 4,
                defaut: 2,
                step: 1
            }),

            /**
             * Le slider reste simple côté interface : 0 à 100.
             * Il est ensuite converti en légère variation HSL autour d'une valeur de base.
             * Cela évite les effets extrêmes noir/blanc.
             */
            luminancePourcentage: Object.freeze({
                // Aligné avec le GUI : HighLumSlider va de 1 à 10.
                min: 1,
                max: 8,
                defaut: 1,
                step: 0.001,

                // Plage progressive pour éviter un changement trop brutal.
                // deltaMin = effet léger au minimum.
                // deltaMax = effet fort mais pas brûlé au maximum.
                deltaMin: 0.02,
                deltaMax: 0.20,
                deltaDefaut: 0.06
            }),

            /**
             * La largeur n'est pas un tracé de contour.
             * Elle élargit seulement le masque de pixels affectés autour des gradients.
             */
            largeur: Object.freeze({
                min: 1,
                // Aligné avec le nouveau GUI : HighLargSlider va de 1 à 10.
                max: 4,
                defaut: 2,
                step: 0.5
            }),

            clignotement: Object.freeze({
                // 0 = le highlight peut vraiment disparaître pendant le clignotement,
                // ce qui rend l'effet plus marqué sans augmenter le coût du shader.
                facteurMinimal: 0.0
            }),

            securiteLuminosite: Object.freeze({
                minLightness: 0.08,
                maxLightness: 0.995
            })
        })
    }),

    /**
     * Réglages du bouton de test "couleur optimale" pour la silhouette.
     *
     * La couleur n'est plus choisie dans une palette fixe : le service génère
     * des candidats RGB et les compare uniquement aux pixels proches de la
     * silhouette, côté objet et côté fond.
     */
    couleurOptimaleSilhouette: Object.freeze({
        debugConsole: true,

        analyseLocale: Object.freeze({
            // Rayon de voisinage pour détecter si un pixel objet touche le fond.
            rayonVoisinageSilhouette: 1,

            // Rayon de la bande analysée autour de la silhouette.
            rayonBandeContour: 2,

            // Échantillonnage pour limiter le coût du calcul. 1 = tous les pixels.
            pasEchantillonnageContour: 2,

            // Seuil utilisé si la profondeur est disponible.
            seuilDifferenceProfondeurFond: 0.0005,

            // Seuil de secours si la profondeur n'est pas lisible.
            seuilDifferenceCouleurFondRgb: 24,

            // Nombre maximal de pixels conservés dans chaque bande locale.
            maxPixelsAnalyse: 6000,

            // Regroupement des couleurs locales proches.
            tailleQuantification: 16,
            nombreCouleursLocales: 18
        }),

        generationCouleurs: Object.freeze({
            // 32 donne environ 729 candidats RGB + quelques couleurs extrêmes.
            pasRgb: 32
        }),

        seuilsSelection: Object.freeze({
            contrasteLocalMinimal: 3,
            distanceOklabMinimale: 0.10
        }),

        poids: Object.freeze({
            pireContrasteLocal: 14,
            contrasteObjetMoyen: 3,
            contrasteFondMoyen: 5,
            pireDistanceLocale: 18,
            distanceObjetMoyenne: 4,
            distanceFondMoyenne: 6,
            facteurDistanceOklab: 10
        })
    })
});
