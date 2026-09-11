/**
 * @file Paramètres temporels des animations de l'interface ANNA.
 *
 * Ce fichier ne contient que les valeurs réellement utilisées par le moteur
 * d'animation. Les dimensions du menu sont lues directement depuis la GUI
 * Babylon afin d'éviter d'avoir deux sources de vérité (JSON + JavaScript).
 *
 * Pour modifier la vitesse des animations, changer les durées ci-dessous sans
 * toucher à ServiceAnimationGUI.
 */
export const constantesAnimation = Object.freeze({
    /**
     * Durée, en millisecondes, du déplacement du menu latéral.
     *
     * 450 ms est la valeur empirique de la base stable : elle garde le mouvement
     * perceptible sans donner l'impression que le menu répond tardivement.
     * Une valeur plus faible accélère le déplacement ; une valeur plus élevée le
     * rend plus progressif.
     */
    dureeMenuLateral: 450,

    /**
     * Durée, en millisecondes, d'ouverture/fermeture des panneaux déroulants.
     *
     * 300 ms est volontairement plus court que le déplacement du menu principal,
     * car un accordéon parcourt une distance visuelle plus faible.
     */
    dureePanneauDeroulant: 300
});
