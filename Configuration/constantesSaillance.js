/**
 * Paramètres de test pour la recherche de vue par saillance GMM.
 *
 * Cette version reprend la démarche fournie dans ScoreImageGMM.m :
 * 1. carte de saillance d'Achanta en Lab ;
 * 2. extraction des pixels saillants avec mean + std ;
 * 3. représentation GMM inspirée de Habibi, Mouaddib, Caron, IROS 2015 ;
 * 4. entropie du GMM ;
 * 5. dispersion spatiale ;
 * 6. score final H × D.
 */
export const constantesSaillance = Object.freeze({
    parcoursSpherique: Object.freeze({
        // Même logique que l'entropie : vues réparties sur une sphère autour de l'objet.
        pasAlphaDegres: 30,
        betasDegres: Object.freeze([20, 45, 70, 90, 110, 135, 160]),
        // Le facteur reste disponible en secours si le cadrage automatique est désactivé.
        facteurRayonObjet: 3,
        distanceMinimale: 1.5,

        // Remarque tuteur : au lancement de l'algorithme, on fixe automatiquement
        // la distance caméra-objet au lieu de garder la distance après navigation.
        // Objectif : le modèle doit occuper environ 80% de l'image rendue.
        cadrageAutomatique: Object.freeze({
            actif: true,
            occupationImageMin: 0.8,

            // 1 = cadrage calculé exactement ; > 1 éloigne légèrement la caméra ;
            // < 1 rapproche un peu mais peut couper l'objet si le modèle est très allongé.
            margeSecurite: 1
        })
    }),

    analyseImage: Object.freeze({
        // Zone analysée dans le rendu 3D. La GUI est dans une scène séparée, donc elle n'est pas lue.
        // 0 conserve toute l'image ; 0.08 réduit un peu l'influence des bords/fond.
        margeZoneCentrale: 0.08,

        // Taille maximale de la carte analysée. Plus grand = plus précis mais plus lourd.
        // La méthode GMM fait beaucoup d'exp(), donc on travaille sur une carte réduite.
        tailleCarteMax: 72,

        // Flou 3x3 comme dans ScoreImageGMM.m : fspecial('gaussian', 3, 3).
        flouGaussien: Object.freeze({
            actif: true,
            taille: 3,
            sigma: 3
        }),

        // Seuil d'extraction des pixels saillants : T = mean(SM) + std(SM).
        seuillage: Object.freeze({
            mode: "moyenne_plus_ecart_type",
            facteurEcartType: 1
        }),

        gmm: Object.freeze({
            // Conforme au fichier Matlab fourni : lambda = W / 2.
            lambdaMode: "matlab_w_sur_2",
            facteurLambdaLargeur: 0.5,

            // Conforme au fichier Matlab fourni : sigma = max(lambda * poids, 1).
            sigmaMin: 1,

            // Sécurité navigateur : on garde les pixels les plus saillants si le masque est trop dense.
            // Augmenter cette valeur rend la GMM plus fidèle mais plus lente.
            nombreMaxPixelsSaillants: 420,

            // Pour les petites sigmas, on limite le calcul à 3 sigmas. Pour les grandes, toute l'image est utilisée.
            rayonInfluenceSigma: 3
        }),

        score: Object.freeze({
            // Le classement utilise H × D. Pour l'affichage, on expose aussi une version normalisée entre 0 et 1.
            utiliserScoreNormalisePourComparaison: true
        })
    }),

    modeAnalyse: Object.freeze({
        // On conserve par défaut l'état visuel courant pour comparer ce que l'utilisateur voit vraiment.
        desactiverPostTraitements: false,
        restaurerMateriauxOriginauxPendantAnalyse: false
    }),

    modeObjetBase: Object.freeze({
        desactiverPostTraitements: false,
        restaurerMateriauxOriginauxPendantAnalyse: false
    }),

    exportCsv: Object.freeze({
        actif: true,
        nomFichier: "saillance_gmm_vues.csv"
    }),

    exportHistogramme: Object.freeze({
        // Histogramme de distribution : une barre = une plage de scores.
        // Exemple : combien de vues ont un score entre 40% et 50%.
        actif: true,
        nomFichierSvg: "saillance_gmm_histogramme.svg",
        largeurSvg: 920,
        hauteurSvg: 560,
        nombreClasses: 10,

        // true : l'histogramme étale les scores entre la moins bonne vue (0%)
        // et la meilleure vue (100%). C'est plus lisible quand tous les scores
        // absolus sont petits et tombent sinon dans la même classe 0-10%.
        normaliserRelativementAuxVues: true,
        sourceScore: "scoreFinalBrut"
    })
});
