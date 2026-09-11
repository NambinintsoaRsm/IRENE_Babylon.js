/**
 * @file Chemins applicatifs réellement consommés par le JavaScript ANNA.
 *
 * Ce fichier sert de point unique pour les ressources chargées dynamiquement.
 * Pour remplacer une interface Babylon GUI, modifier uniquement les deux lignes
 * `gui.principale` et `gui.accueil` ci-dessous.
 */
export const chemins = Object.freeze({
    /** Destination du bouton de fermeture après confirmation. */
    navigation: Object.freeze({
        fermetureApplication: "https://www.u-picardie.fr/phileas/"
    }),

    /**
     * === INTERFACES ANNA ===
     * Ces deux chemins sont les seuls à modifier pour remplacer les JSON GUI.
     */
    gui: Object.freeze({
        /** Interface principale utilisée après l'écran d'accueil. */
        principale: "assets/gui/guiTexture.json",

        /** Écran d'accueil affiché avant l'interface principale. */
        accueil: "assets/gui/guiTexture_acc.json"
    }),

    /** Racine parcourue par le mécanisme de détection des modèles 3D. */
    modeles: Object.freeze({
        dossier: "assets/modeles/"
    })
});
