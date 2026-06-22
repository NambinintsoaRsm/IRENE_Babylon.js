/**
 * Paramètres de test pour la recherche de vue par saillance visuelle.
 *
 * L'objectif est de tester une alternative à l'entropie : au lieu de mesurer
 * la quantité globale d'information dans l'image, on mesure la présence de
 * zones visuellement importantes autour de l'objet rendu.
 */
export const constantesSaillance = Object.freeze({
    parcoursSpherique: Object.freeze({
        // Même principe que l'entropie : vues réparties sur une sphère autour de l'objet.
        pasAlphaDegres: 30,
        betasDegres: Object.freeze([20, 45, 70, 90, 110, 135, 160]),
        facteurRayonObjet: 3,
        distanceMinimale: 1.5
    }),

    analyseImage: Object.freeze({
        // On reste sur la zone centrale du rendu 3D pour éviter que le fond domine trop le score.
        margeZoneCentrale: 0.12,
        resolutionAnalyse: 220,

        // Taille du voisinage utilisé pour comparer un pixel avec son entourage.
        rayonVoisinage: 2,

        // Les pixels les plus saillants sont très importants pour choisir une vue lisible.
        portionPixelsForts: 0.15,
        seuilPixelSaillant: 0.18,

        // Estimation simple de la silhouette à partir de la différence avec le fond.
        seuilDifferenceFondRgb: 24,

        poids: Object.freeze({
            contrasteLuminance: 0.38,
            contrasteCouleur: 0.27,
            gradientLuminance: 0.20,
            silhouetteApproximee: 0.15
        }),

        score: Object.freeze({
            saillanceMoyenne: 0.25,
            saillanceForte: 0.55,
            densiteSaillante: 0.20
        })
    }),

    modeAnalyse: Object.freeze({
        // Comme pour l'entropie, on conserve par défaut l'état visuel courant.
        desactiverPostTraitements: false,
        restaurerMateriauxOriginauxPendantAnalyse: false
    }),

    modeObjetBase: Object.freeze({
        desactiverPostTraitements: false,
        restaurerMateriauxOriginauxPendantAnalyse: false
    }),

    exportCsv: Object.freeze({
        actif: true,
        nomFichier: "saillance_vues.csv"
    })
});
