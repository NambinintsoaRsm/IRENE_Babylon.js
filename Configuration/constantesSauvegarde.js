/**
 * @file Configuration de la sauvegarde du profil utilisateur ANNA.
 *
 * La sauvegarde automatique et le bouton « Enregistrer » écrivent la même source
 * de vérité. La différence est uniquement ergonomique : la sauvegarde manuelle
 * affiche SauveRect, tandis que l'automatique reste silencieuse.
 */
export const constantesSauvegarde = Object.freeze({
    /** Clé localStorage utilisée par la version actuelle. */
    cleProfil: "anna_reglages_utilisateur",

    /**
     * Ancienne clé ANNA conservée uniquement pour la migration à la lecture.
     * Elle peut être supprimée dans une version future quand la compatibilité
     * avec les profils déjà créés ne sera plus nécessaire.
     */
    ancienneCleProfil: "anna_profil_utilisateur",

    confirmation: Object.freeze({
        /**
         * Durée d'affichage du message, en millisecondes.
         * 2500 ms laisse le temps de lire la confirmation sans occuper longtemps
         * la scène. Modifier cette valeur ne change pas la durée de la sauvegarde.
         */
        dureeAffichageMs: 2500,
        texteSucces: "Configurations sauvegardées",
        texteErreur: "Échec de la sauvegarde",

        /**
         * SauveText occupe l'essentiel du rectangle sans toucher ses bordures.
         * Les pourcentages sont relatifs à SauveRect, pas au viewport.
         */
        largeurTexte: "92%",
        hauteurTexte: "80%",

        /**
         * Décalage additionnel, en points de pourcentage de la largeur d'écran,
         * appliqué quand SauveRect est placé à côté du menu. 0 utilise la position
         * calculée automatiquement par ControleurProfil.
         */
        margeHorizontaleSupplementairePourcentage: 0
    })
});
