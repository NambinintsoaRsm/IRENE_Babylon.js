/**
 * @file Paramètres de référence de la caméra 3D ANNA.
 *
 * Les valeurs initiales servent avant qu'un modèle soit cadré. Après chargement,
 * ServiceCameraBabylon recalcule les limites de distance à partir du rayon réel
 * du modèle afin d'empêcher la caméra de le traverser ou de s'en éloigner trop.
 *
 * Les coefficients sont empiriques et correspondent au comportement de la base
 * stable actuelle. Toute modification doit être vérifiée sur plusieurs modèles
 * de tailles et de proportions différentes.
 */
export const constantesCamera = Object.freeze({
    /** Angle horizontal de secours avant calcul de la vue du modèle. */
    alphaInitial: Math.PI / 2,
    /** Angle vertical de secours, légèrement au-dessus d'une vue équatoriale. */
    betaInitial: Math.PI / 2.5,
    /** Distance initiale, utilisée avant le cadrage dépendant du modèle. */
    rayonInitial: 5,

    cibleInitiale: Object.freeze({ x: 0, y: 0, z: 0 }),

    /**
     * Valeur conservée dans le profil métier. Le zoom réellement visible est
     * ensuite piloté par le rayon de l'ArcRotateCamera.
     */
    zoomInitial: 1,

    /**
     * Babylon ArcRotateCamera : plus wheelPrecision est élevé, plus la molette
     * modifie lentement la distance. 150 est le réglage validé dans la V1.
     */
    wheelPrecision: 150,

    /**
     * Babylon ArcRotateCamera : plus la valeur est élevée, plus la rotation au
     * pointeur est lente. 3100 correspond à la sensibilité stable retenue.
     */
    sensibiliteRotation: 3100,

    /** Bornes génériques avant recalcul à partir du modèle. */
    distanceMin: 0.0001,
    distanceMax: 10,

    /**
     * Distance de cadrage = rayon de l'objet × 3, avec un minimum de sécurité.
     * Ce facteur donne suffisamment d'espace autour d'un modèle normalisé tout
     * en le maintenant lisible dans la scène.
     */
    facteurCadrage: 3.0,
    rayonObjetMinimal: 0.5,
    rayonCadrageMinimal: 1.4,

    /**
     * Limite proche recalculée après chargement.
     * Les valeurs 1,47 et 1,4 reprennent exactement le comportement effectif de
     * la base stable avant nettoyage (elles étaient auparavant des fallbacks
     * locaux dans ServiceCameraBabylon).
     */
    multiplicateurDistanceMin: 1.47,
    distanceMinAbsolue: 1.4,

    /**
     * Limite éloignée recalculée après chargement.
     * 5,2 × rayonObjet, avec un plancher de 5, évite un éloignement excessif tout
     * en restant utilisable sur des modèles plus grands.
     */
    multiplicateurDistanceMax: 5.2,
    distanceMaxAbsolue: 5,

    /**
     * Taille maximale cible après normalisation d'un modèle importé.
     * La valeur 2 conserve l'échelle de travail utilisée par la V1 et réduit les
     * écarts de comportement entre fichiers 3D provenant de sources différentes.
     */
    tailleModeleNormalise: 2
});
