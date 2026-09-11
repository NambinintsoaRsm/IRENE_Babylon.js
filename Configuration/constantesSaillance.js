/**
 * @file Paramètres de la recherche automatique de vue par saillance GMM.
 *
 * Le contrôleur de modèle utilise ce calcul après l'orientation/normalisation
 * afin de choisir une vue initiale informative. L'algorithme suit la démarche
 * Achanta + GMM documentée dans le projet ; les seuils numériques restent des
 * réglages expérimentaux de la base stable et doivent être comparés sur plusieurs
 * modèles avant toute modification.
 */
export const constantesSaillance = Object.freeze({
    /**
     * Calque réservé au modèle pendant la recherche de la vue de départ.
     * La caméra principale l'exclut ; la caméra hors écran de saillance l'inclut.
     * Cette valeur doit rester identique à celle de ControleurModele3D.
     */
    masqueModeleChargement: 0x10000000,

    parcoursSpherique: Object.freeze({
        // Même logique que l'entropie : vues réparties sur une sphère autour de l'objet.
        pasAlphaDegres: 30,
        // On ajoute les vues quasi verticales pour tester aussi le dessus
        // et le dessous de l'objet pendant la recherche GMM.
        betasDegres: Object.freeze([0, 20, 45, 70, 90, 110, 135, 160, 180]),
        facteurRayonObjet: 3,
        distanceMinimale: 1.5,

        // Pour la saillance, on fixe automatiquement la distance au lancement :
        // l'objet doit occuper environ 80 % de l'image analysée, indépendamment
        // de la distance courante de la caméra après interaction utilisateur.
        cadrageAutomatique: Object.freeze({
            actif: true,
            occupationImageMin: 0.8,
            margeSecurite: 1,

            // L'analyse de la vue initiale doit être indépendante du format
            // courant de la fenêtre/navigateur. Le render target hors écran est
            // carré ; on utilise donc le même ratio pour le cadrage analytique.
            ratioAspectAnalyse: 1
        })
    }),

    analyseImage: Object.freeze({
        // Conforme au script Matlab : on analyse toute l'image rendue.
        // La GUI est dans une scène séparée, donc elle n'est pas lue.
        margeZoneCentrale: 0,

        // Taille maximale de la carte analysée. Plus grand = plus précis mais plus lourd.
        // On augmente légèrement pour stabiliser les scores entre deux calculs identiques.
        tailleCarteMax: 96,

        // Résolution fixe du rendu hors écran. Avant, elle dépendait de la
        // taille du canvas visible : deux sessions avec des dimensions
        // légèrement différentes pouvaient donc classer deux vues proches dans
        // un ordre différent. Une texture carrée fixe stabilise le calcul.
        resolutionRenduHorsEcranFixe: 384,

        // Avant le calcul Achanta/GMM, on recadre automatiquement la zone utile
        // autour de l'objet rendu. Cela évite que de grandes zones de fond blanc/noir
        // dominent le score. L'objet doit occuper environ 80 % de la zone analysée
        // quand c'est possible.
        recadrageObjet: Object.freeze({
            actif: true,
            occupationImageMin: 0.8,
            seuilDifferenceFond: 12,
            alphaMin: 8,
            resolutionDetectionMax: 360
        }),

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
            // Valeur augmentée pour éviter que le classement varie trop quand beaucoup
            // de pixels dépassent mean + std.
            nombreMaxPixelsSaillants: 900,

            // Pour les petites sigmas, on limite le calcul à 3 sigmas. Pour les grandes, toute l'image est utilisée.
            rayonInfluenceSigma: 3
        }),

        score: Object.freeze({
            // Conforme au Matlab : le classement prend directement Score = H_G × D.
            // La version normalisée reste calculée, mais seulement comme indicateur d'affichage/debug.
            utiliserScoreNormalisePourComparaison: false
        })
    }),

    selectionVue: Object.freeze({
        // Deux scores GMM très proches sont considérés comme équivalents.
        // Dans ce cas on conserve la première vue du parcours sphérique, dont
        // l'ordre est fixe. Cela élimine les changements d'angle dus au faible
        // bruit de readPixels entre deux exécutions.
        toleranceRelativeScore: 0.0075,
        toleranceAbsolueScore: 1e-8
    }),

    modeAnalyse: Object.freeze({
        // On conserve par défaut l'état visuel courant pour comparer ce que l'utilisateur voit vraiment.
        desactiverPostTraitements: false,
        restaurerMateriauxOriginauxPendantAnalyse: false
    }),

    // Conservé comme dans le backup : le moteur générique peut utiliser ce bloc
    // lorsqu'une analyse explicite de l'objet de base est demandée.
    modeObjetBase: Object.freeze({
        desactiverPostTraitements: false,
        restaurerMateriauxOriginauxPendantAnalyse: false
    }),

    exportCsv: Object.freeze({
        actif: true,
        nomFichier: "saillance_gmm_vues.csv"
    }),

    exportHistogramme: Object.freeze({
        // L'histogramme reste désactivé sur cette branche.
        actif: false,
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
