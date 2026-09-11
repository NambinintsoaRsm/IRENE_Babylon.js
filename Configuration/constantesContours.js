/**
 * @file Configuration du module Contours de la V1 d'ANNA.
 *
 * La V1 expose uniquement la silhouette. Les anciens traitements Relief,
 * détection de contours par couleur et surbrillance restent hors de cette base
 * afin de pouvoir être réintégrés dans une V2 sans mélanger les responsabilités.
 *
 * Important : « choix de couleur » désigne ici la couleur d'affichage de la
 * silhouette, pas une détection de contours à partir de la couleur du modèle.
 */
import { TypeContour } from "../Domain/contours/TypeContour.js";


export const constantesContours = Object.freeze({
    /** Épaisseur métier utilisée lorsqu'aucun profil n'est chargé. */
    epaisseurDefaut: 2,
    /** Noir, choisi comme valeur de secours avant un choix manuel/automatique. */
    couleurDefaut: "#000000",

    /**
     * Valeurs proposées par le slider de la GUI.
     * Le slider reste volontairement court : la V1 privilégie quelques niveaux
     * clairement différenciables plutôt qu'une variation très fine.
     */
    epaisseurSlider: Object.freeze({
        min: 1,
        max: 3,
        defaut: 2,
        step: 1
    }),

    epaisseursParType: Object.freeze({
        [TypeContour.SILHOUETTE]: Object.freeze({
            /** Bornes réellement envoyées au shader. */
            min: 1,
            max: 3,

            /**
             * Renfort appliqué au premier niveau du slider.
             * 0,35 est une correction empirique de la base stable : sans ce
             * renfort, le niveau minimal apparaissait trop fin selon la résolution.
             */
            renfortBase: 0.35
        })
    }),

    seuils: Object.freeze({
        /**
         * Seuil du gradient de profondeur utilisé par ShaderSilhouette.
         * 0,00009 est une valeur empirique validée sur la V1. La diminuer rend
         * le détecteur plus sensible (davantage de pixels peuvent devenir des
         * contours) ; l'augmenter peut supprimer des portions de silhouette.
         */
        [TypeContour.SILHOUETTE]: 0.00009
    }),

    /**
     * Réglages du choix automatique de la couleur de silhouette.
     *
     * Le service capture le rendu sans contour, repère une bande autour de la
     * silhouette puis évalue des couleurs candidates selon le contraste local
     * et la distance perceptuelle OKLab.
     */
    couleurOptimaleSilhouette: Object.freeze({
        /** Active le diagnostic détaillé dans la console développeur. */
        debugConsole: true,

        analyseLocale: Object.freeze({
            /** Rayon servant à décider si un pixel objet touche le fond. */
            rayonVoisinageSilhouette: 1,
            /** Largeur de la bande objet/fond échantillonnée autour du contour. */
            rayonBandeContour: 2,
            /** Un pixel sur deux est testé pour limiter le coût CPU. */
            pasEchantillonnageContour: 2,
            /** Différence minimale avec la profondeur de fond. */
            seuilDifferenceProfondeurFond: 0.0005,
            /** Secours RGB lorsque le depth buffer n'est pas exploitable. */
            seuilDifferenceCouleurFondRgb: 24,
            /** Plafond de sécurité pour garder l'analyse interactive. */
            maxPixelsAnalyse: 6000,
            /** Regroupe les couleurs proches par pas de 16 niveaux RGB. */
            tailleQuantification: 16,
            /** Nombre maximal de groupes dominants conservés par zone. */
            nombreCouleursLocales: 18
        }),

        generationCouleurs: Object.freeze({
            /** Pas de génération RGB ; 32 limite le nombre de candidats testés. */
            pasRgb: 32
        }),

        seuilsSelection: Object.freeze({
            /** Contraste local minimal avant qu'un candidat soit préféré. */
            contrasteLocalMinimal: 3,
            /** Distance perceptuelle minimale dans l'espace OKLab. */
            distanceOklabMinimale: 0.10
        }),

        /**
         * Pondérations du score de sélection.
         * Ces coefficients sont empiriques : ils privilégient le pire cas local
         * pour éviter de choisir une couleur excellente sur une zone mais illisible
         * sur une autre. Leur modification doit être comparée sur plusieurs fonds.
         */
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
