/**
 * @file Configuration visuelle de l'interface Babylon GUI d'ANNA.
 *
 * Ce fichier centralise uniquement les valeurs réellement lues par la V1 :
 * profil par défaut, palettes de thèmes, flèches et styles des composants créés
 * dynamiquement. Les dimensions déjà définies dans guiTexture.json ne sont pas
 * dupliquées ici sauf lorsqu'un composant est ajusté par le code.
 *
 * Les couleurs utilisent le format Babylon #RRGGBBAA. Pour ajouter un thème,
 * compléter ThemeInterface puis ajouter sa palette dans `themes`.
 */
import { ThemeInterface } from "../Domain/interface/ThemeInterface.js";
import { PositionMenu } from "../Domain/interface/PositionMenu.js";

export const constantesInterface = Object.freeze({
    /** Valeurs chargées lorsqu'aucun profil utilisateur n'est disponible. */
    policeDefaut: "Luciole",
    taillePoliceDefaut: 0,
    grasDefaut: false,

    themeDefaut: ThemeInterface.BLANC,
    positionMenuDefaut: PositionMenu.DROITE,

    tailleBorduresMenuDefaut: 1,
    tailleBorduresBoutonsDefaut: 1,

    /**
     * Paramètres techniques du slider de taille de police.
     * La borne maximale n'est volontairement pas configurée ici : elle est
     * calculée à partir de l'espace réellement disponible dans la GUI et de la
     * police active.
     */
    sliderTaillePolice: Object.freeze({
        pasPourcentage: 1,
        delaiRecalculMs: 80,

        // Babylon GUI ne dessine plus correctement le thumb lorsque minimum === maximum.
        // Cette plage n'est utilisée que pour le rendu : la borne fonctionnelle
        // reste conservée séparément dans les metadata du slider.
        plageVisuelleMinimale: 1,

        // Diagnostics temporaires pour stabiliser le comportement du slider.
        // Ils sont centralisés ici afin de pouvoir être coupés sans modifier
        // les services GUI.
        debugCalculMaximum: true,
        debugAutoFit: true
    }),

    /**
     * Pictogrammes de navigation qui gardent leur police et leur taille propres.
     * Le fichier GUI reste la source de vérité pour leurs dimensions et leur
     * position de base. Le code ne fait qu'appliquer une compensation optique
     * calculée à partir des métriques réelles du navigateur afin que le glyphe
     * reste visuellement centré dans son espace sur Firefox, Chromium/Brave, etc.
     */
    flechesNavigation: Object.freeze({
        police: "Arial",
        debugCentrage: false,
        noms: Object.freeze([
            "FlecheMenuBtnTxt",
            "FichDropBtnTxt",
            "OuvBtnDropText",
            "EnrBtnDropText",
            "ConfDropBtnTxt",
            "PolBtnDropText",
            "MenuBtnDropText",
            "OutiBtnDropText",
            "RegBtnDropTxt",
            "ContBtnDropText",
            "TextuBtnDropTxt",
            "LumBtnDropTxt",
            "PlcDropBtnIcoTxt",
            "LumDropBtnIcoTxt"
        ]),
        // La grande flèche latérale est volontairement laissée exactement comme
        // dans guiTexture.json.
        exclusCentrageOptique: Object.freeze([
            "FlecheMenuBtnTxt"
        ])
    }),

    /**
     * Liste volontairement limitée aux polices proposées par le menu Polices.
     * Les fichiers correspondants sont déclarés dans index.html/CSS.
     */
    policesDisponibles: Object.freeze([
        "Arial",
        "Liberation",
        "Luciole",
        "OpenDyslexic",
        "Tiresias"
    ]),

    /**
     * Palettes appliquées à la GUI et au questionnaire. Les contrastes sont
     * volontairement francs pour rester cohérents avec les quatre thèmes de la V1.
     */
    themes: Object.freeze({
        [ThemeInterface.BLANC]: Object.freeze({

            fondPrincipal: "#FFFFFFFF",
            fondSecondaire: "#F5F5F5FF",
            fondSection: "#FFFFFFFF",

            textePrincipal: "#000000FF",
            texteSecondaire: "#333333FF",

            bordure: "#000000FF",

            boutonFond: "#FFFFFFFF",
            boutonTexte: "#000000FF",
            boutonBordure: "#000000FF",

            boutonActifFond: "#000000FF",
            boutonActifTexte: "#FFFFFFFF",
            boutonActifBordure: "#000000FF",

            sliderFond: "#707070FF",
            sliderBarre: "#D8D8D8FF"
        }),

        [ThemeInterface.GRIS_CLAIR]: Object.freeze({

            // Fonds
            fondPrincipal: "#C8C9C8FF",   // couleur principale choisie
            fondSecondaire: "#D8D9D8FF", // légèrement plus clair
            fondSection: "#E7E8E7FF",    // sections / sous-zones encore plus claires

            // Textes
            textePrincipal: "#000000FF",
            texteSecondaire: "#333333FF",

            // Bordure générale
            bordure: "#222222FF",

            // Boutons
            boutonFond: "#F4F4F4FF",
            boutonTexte: "#000000FF",
            boutonBordure: "#222222FF",

            // Bouton sélectionné / actif
            boutonActifFond: "#303030FF",
            boutonActifTexte: "#FFFFFFFF",
            boutonActifBordure: "#000000FF",

            // Sliders
            sliderFond: "#777777FF",
            sliderBarre: "#E8E8E8FF"
        }),


        [ThemeInterface.GRIS_FONCE]: Object.freeze({

            // Fonds
            fondPrincipal: "#575657FF",   // couleur principale choisie
            fondSecondaire: "#484748FF", // légèrement plus sombre
            fondSection: "#666566FF",    // séparation visible sans sortir du gris

            // Textes
            textePrincipal: "#FFFFFFFF",
            texteSecondaire: "#E5E5E5FF",

            // Bordure générale
            bordure: "#FFFFFFFF",

            // Boutons
            boutonFond: "#353535FF",
            boutonTexte: "#FFFFFFFF",
            boutonBordure: "#FFFFFFFF",

            // Bouton sélectionné / actif
            boutonActifFond: "#FFFFFFFF",
            boutonActifTexte: "#000000FF",
            boutonActifBordure: "#FFFFFFFF",

            // Sliders
            sliderFond: "#303030FF",
            sliderBarre: "#DDDDDDFF"
        }),

        [ThemeInterface.NOIR]: Object.freeze({

            fondPrincipal: "#000000FF",
            fondSecondaire: "#1A1A1AFF",
            fondSection: "#111111FF",

            textePrincipal: "#FFFFFFFF",
            texteSecondaire: "#E0E0E0FF",

            bordure: "#FFFFFFFF",

            boutonFond: "#000000FF",
            boutonTexte: "#FFFFFFFF",
            boutonBordure: "#FFFFFFFF",

            boutonActifFond: "#FFFFFFFF",
            boutonActifTexte: "#000000FF",
            boutonActifBordure: "#FFFFFFFF",

            sliderFond: "#444444FF",
            sliderBarre: "#FFFFFFFF"
        })
    }),

    /** Sens de la flèche latérale selon le côté du menu et son état. */
    flechesMenu: Object.freeze({
        // Menu à droite : l'onglet est à gauche du menu.
        // Ouvert => la flèche indique le repli vers la droite.
        // Fermé  => la flèche indique l'ouverture vers la gauche.
        [PositionMenu.DROITE]: Object.freeze({
            ouvert: "▶",
            ferme: "◀"
        }),

        // Menu à gauche : l'onglet est à droite du menu.
        // Ouvert => la flèche indique le repli vers la gauche.
        // Fermé  => la flèche indique l'ouverture vers la droite.
        [PositionMenu.GAUCHE]: Object.freeze({
            ouvert: "◀",
            ferme: "▶"
        })
    }),

    /** Symboles des accordéons internes : ▼ ouvert, ▶ fermé. */
    flechesDropdown: Object.freeze({
        ouvert: "▼",
        ferme: "▶"
    }),

    /**
     * Styles des contrôles qui sont créés ou normalisés dynamiquement.
     * Les autres composants gardent leurs dimensions définies dans la GUI JSON.
     */
    stylesComposants: Object.freeze({
        // Bouton flottant permettant de demander la fermeture d’ANNA.
        // Il reste volontairement plus marqué que les autres contrôles pour être
        // repérable. Les pourcentages sont relatifs au conteneur Babylon parent,
        // et non directement à la largeur de la fenêtre.
        boutonFermeture: Object.freeze({
            largeur: "14.7%",
            ratio: 1,
            largeurPiloteRatio: true,
            // 75 % conserve la croix lisible sans toucher la bordure du bouton.
            tailleIcone: "75%",
            poidsIcone: "700",
            caractereIcone: "X",
            epaisseurVisuelleIcone: 1,
            epaisseurBordureMinimum: 4,
            rayonCoin: 10,
            zIndex: 100
        }),

        boutonModele: Object.freeze({
            largeur: "95%",
            hauteur: "75px",
            epaisseurBordure: 1,

            couleurBordure: "#000000FF",
            couleurFond: "#FFFFFFFF",
            couleurTexte: "#000000FF",

            paddingHaut: "5px",
            paddingBas: "5px",

            alignementTexte: "gauche",
            paddingTexteGauche: "5%",

            fontSize: "40%",
            fontWeight: "500"
        }),

        boutonModeleActif: Object.freeze({
            couleurFond: "#000000FF",
            couleurTexte: "#FFFFFFFF",
            couleurBordure: "#000000FF"
        }),
    })
});

export function obtenirThemeInterface(theme) {
    return constantesInterface.themes[theme]
        ?? constantesInterface.themes[constantesInterface.themeDefaut];
}