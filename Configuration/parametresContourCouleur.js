/**
 * PARAMÈTRES DU CONTOUR COULEUR
 * =============================
 *
 * Ce fichier est l'unique endroit à modifier pour régler le contour couleur.
 * Les shaders ne contiennent pas de seuil métier à rechercher ailleurs.
 *
 * Base conservée : calcul OKLab + chaînage à 8 directions espacées de 22,5°.
 * Le correctif allège le rendu : un seul masque couleur est calculé, puis
 * l'épaisseur modifie uniquement le rayon d'échantillonnage utilisé.
 *
 * Réglages rapides :
 * - des contours utiles disparaissent pendant la rotation : diminuer
 *   `chainage.supportsMin` ou `chainage.supportsMinParCote` ;
 * - trop de petits traits : augmenter `chainage.supportsMin`, puis les seuils ;
 * - les contours colorés (jaune/orange, rouge/vert, etc.) sont trop faibles :
 *   augmenter `metrique.poidsChromatique` ;
 * - trop de contours dus aux ombres : diminuer `metrique.poidsLuminance` ;
 * - taille 1 trop fine : augmenter `epaisseur.rayonTaille1` ;
 * - taille 2 trop épaisse : diminuer `epaisseur.rayonTaille2` ;
 * - petits ronds/bruits de texture : augmenter légèrement
 *   `bruit.forceValidationMin` ou `bruit.rayonValidation`.
 */
export const parametresContourCouleur = Object.freeze({
    metrique: Object.freeze({
        espace: "OKLab",

        // Valeurs conservées depuis ton réglage validé.
        poidsLuminance: 0.15,
        poidsChromatique: 1.20
    }),

    seuils: Object.freeze({
        // Seuil de prolongement d'une ligne déjà cohérente.
        faible: 0.040,

        // Seuil d'ancrage : au moins une partie de la chaîne doit être nette.
        fort: 0.075,

        // Adoucissement autour des seuils pour limiter le scintillement.
        lissageBas: 0.82,
        lissageHaut: 1.18
    }),

    orientation: Object.freeze({
        // Le shader utilise huit orientations fixes, espacées de 22,5°.
        nombreDirections: 8
    }),

    chainage: Object.freeze({
        // Nombre de pixels inspectés de chaque côté du pixel courant.
        rayonRecherche: 4,
        rayonMin: 1,
        rayonMax: 6,

        // Valeurs conservées depuis ton réglage validé.
        supportsMin: 5,
        supportsMinParCote: 2,
        trousMax: 2,

        // Conservé depuis le correctif 22,5° : assouplissement léger uniquement
        // pour une rupture couleur très forte.
        bordTresFort: Object.freeze({
            multiplicateurSeuil: 1.55,
            reductionSupports: 1.0,
            reductionSupportsParCote: 0.5
        })
    }),

    epaisseur: Object.freeze({
        // Le slider utilisateur s'arrête à 2. La taille 1 est volontairement
        // renforcée par rapport à l'ancienne valeur 1.0, qui était trop fine.
        sliderMin: 1,
        sliderMax: 2,

        // Taille 1 : contour plus lisible, sans atteindre l'ancienne taille 2.
        rayonTaille1: 1.55,

        // Taille 2 : proche de l'ancienne taille 2 du correctif précédent.
        rayonTaille2: 2.55,

        // Alias conservés pour les modules existants.
        rayonEchantillonnageMin: 1.55,
        rayonEchantillonnageMax: 2.55
    }),

    rendu: Object.freeze({
        // < 1 renforce légèrement les traits acceptés ; 1 garde un masque linéaire.
        puissanceMasque: 0.85,

        // Le highlight couleur conserve sa propre plage de largeur (1 à 10).
        multiplicateurHighlightMax: 2.10
    }),

    antiClignotement: Object.freeze({
        actif: true,
        quantificationPixel: true,

        // Plus haut = moins de petits points isolés
        seuilCentre: 0.45,

        // Plus haut = les voisins faibles comptent moins facilement
        seuilVoisin: 0.30,

        // 3 supprime beaucoup plus les points seuls
        voisinsMin: 2,

        rayonVoisinage: 1.0,

        // À garder sur true, sinon les petits défauts reviennent
        masqueFranc: true
    }),

    bruit: Object.freeze({
        // Validation légère anti-bruit : on confirme que le contour reste visible
        // à une échelle un peu plus large. Les petits ronds de texture disparaissent
        // plus facilement, alors que les vraies jonctions jaune/orange restent.
        validationMultiEchelle: true,

        // Rayon de confirmation. Augmenter légèrement vers 2.6 si les petits points
        // restent visibles ; diminuer vers 2.0 si des bases jaunes disparaissent.
        rayonValidation: 3.0,

        // Rapport minimal entre la réponse large et la réponse locale.
        // Plus haut = moins de bruit, mais plus strict.
        forceValidationMin: 0.50
    }),

    continuite: Object.freeze({
        // Comble les petites coupures dans un contour déjà détecté, sans baisser
        // les seuils globaux. Le pixel de jonction doit avoir une réponse faible
        // minimale et être entouré par des supports de chaque côté.
        fermeturePetitsTrous: true,

        // Réponse minimale du pixel à remplir. Augmenter vers 0.035 si la fermeture
        // relie encore des micro-détails ; diminuer vers 0.024 si les bases jaunes
        // restent trop interrompues.
        forceMinPont: 0.015,

        // Longueur minimale exigée autour du pixel lorsqu'il sert de pont.
        // Cette valeur est volontairement inférieure à chainage.supportsMin pour
        // reconnecter les petits trous, sans rendre le contour global plus permissif.
        supportsMinPont: 3,

        // Nombre minimal de supports de chaque côté du pixel pont.
        supportsMinParCotePont: 1,

        // Le pixel pont compte déjà comme une coupure ; on accepte donc une
        // petite marge supplémentaire pour relier des segments réellement proches.
        trousMaxPont: 2
    }),

    loupe: Object.freeze({
        // 1 = exactement les mêmes seuils que la scène principale.
        multiplicateurSeuils: 1.0,

        // 1 = même rayon de chaîne que la scène principale.
        multiplicateurRayonChaine: 1.0
    })
});
