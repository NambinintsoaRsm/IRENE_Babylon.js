/** Configuration centralisée des pictogrammes GUI. Les tailles JSON restent prioritaires. */
export const configurationIconesGUI = Object.freeze({
    fleches: Object.freeze({
        symboles: Object.freeze({ droite: "▶", gauche: "◀", haut: "▲", bas: "▼" }),
        police: "Arial",
        debugCentrage: false,
        // Déploiement progressif : seule la flèche du sélecteur de police
        // utilise pour l'instant la taille commune, quelle que soit sa direction.
        // Le mécanisme est générique : ajouter des noms après validation.
        tailleUniforme: Object.freeze({
            actif: true,
            taillePx: 55,
            nomsControles: Object.freeze(["PlcDropBtnIcoTxt"])
        }),
        // Une même forme géométrique tournée garantit des proportions visuelles
        // identiques ; seuls les contrôles inscrits utilisent ce mécanisme.
        normalisationVisuelle: Object.freeze({
            actif: true,
            nomsControles: Object.freeze(["PlcDropBtnIcoTxt"]),
            symboleReference: "▶"
        }),
        // Toutes les autres flèches conservent les tailles JSON.
        tailles: Object.freeze({}),
        noms: Object.freeze([
            "FlecheMenuBtnTxt", "FichDropBtnTxt", "OuvBtnDropText",
            "EnrBtnDropText", "ConfDropBtnTxt", "PolBtnDropText",
            "MenuBtnDropText", "OutiBtnDropText", "RegBtnDropTxt",
            "ContBtnDropText", "TextuBtnDropTxt", "LumBtnDropTxt",
            "PlcDropBtnIcoTxt", "LumDropBtnIcoTxt", "ZoomBtnDropTxt"
        ]),
        exclusCentrageOptique: Object.freeze(["FlecheMenuBtnTxt"])
    }),
    fermeture: Object.freeze({ symbole: "X", police: "Arial" }),
    accueil: Object.freeze({ resolutionCanvas: 128, zIndex: 20 }),
    accessibilite: Object.freeze({
        nom: "AccesBtnIcon", largeur: "85%", hauteur: "85%", zIndex: 10,
        cheminSvg: "M12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm8.5 0c-2.76.8-5.69 1-8.5 1s-5.74-.2-8.5-1L3 8c2.04.59 4.16.91 6.31 1.06L9 22h2l.31-6h1.38L13 22h2l-.31-12.94C16.84 8.91 18.96 8.59 21 8l-.5-2z"
    })
});
