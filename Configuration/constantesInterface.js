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
    taillePoliceDefaut: 1,
    grasDefaut: false,

    /**
     * Approximation du gras TextMesh Pro : caractères Regular renforcés
     * par un fin contour, sans basculer sur le fichier Bold natif.
     * La valeur n'est PAS l'équivalent numérique du _WeightBold Unity.
     * Pour retrouver le rendu historique, mettre actif à false.
     */
    grasTexte: Object.freeze({
        actif: true,
        poidsBase: "400",
        epaisseurContourPx: 1.6
    }),

    themeDefaut: ThemeInterface.BLANC,
    positionMenuDefaut: PositionMenu.DROITE,

    tailleBorduresMenuDefaut: 1,
    tailleBorduresBoutonsDefaut: 1,

    /**
     * Plages des curseurs d'épaisseur des bordures.
     * Le contrôleur applique ces valeurs après le chargement de guiTexture.json.
     */
    sliderBordures: Object.freeze({
        boutons: Object.freeze({
            minimum: 1,
            maximum: 5,
            step: 1
        }),
        menus: Object.freeze({
            minimum: 1,
            maximum: 7,
            step: 1
        })
    }),

    /** Réglage additif : niveau 1 = taille JSON, niveau 6 = +5 px. */
    sliderTaillePolice: Object.freeze({
        minimum: 1,
        maximum: 6,
        step: 1,
        augmentationParNiveauPx: 1,
        debugAutoFit: false
    }),

    /**
     * Petite sécurité appliquée uniquement lorsqu'un texte a réellement dû
     * être réduit par l'auto-fit. Elle évite qu'un glyphe touche exactement
     * la limite du TextBlock puis soit rogné différemment selon le navigateur.
     */
    autoFitTexte: Object.freeze({
        reductionSecuritePx: 1
    }),

    /**
     * Pictogrammes de navigation qui gardent leur police et leur taille propres.
     * Le fichier GUI reste la source de vérité pour leurs dimensions et leur
     * position de base. Le code ne fait qu'appliquer une compensation optique
     * calculée à partir des métriques réelles du navigateur afin que le glyphe
     * reste visuellement centré dans son espace sur Firefox, Chromium/Brave, etc.
     */
    /** Compensation optique verticale des libellés de boutons, après AutoFit. */
    centrageOptiqueBoutons: Object.freeze({
        actif: true,
        decalageMaxPx: 8,
        nomsExclus: Object.freeze([])
    }),

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
            fondPrincipal: "#5D5D5DFF", // gris anthracite uniforme du panneau de référence
            fondSecondaire: "#575757FF",
            fondSection: "#666666FF",

            // Textes
            textePrincipal: "#FFFFFFFF",
            texteSecondaire: "#E5E5E5FF",

            // Bordure générale
            bordure: "#FFFFFFFF",

            // Boutons
            boutonFond: "#000000FF",
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

            // Le JSON reste la source de vérité pour la taille et la position
            // des boutons. La taille de la croix est calculée au runtime à
            // partir de l'espace réellement disponible dans le bouton.
            caractereIcone: "X",
            policeIcone: "Arial",
            poidsIcone: "700",
            epaisseurVisuelleIcone: 1,
            margeInterieureRatio: 0.12,
            tailleIconeMinimumPx: 12,
            // Fallback uniquement si Babylon n'a pas encore calculé la mesure
            // réelle du bouton au moment du premier passage.
            tailleIconeFallback: "75%",
            nomsTextesIcones: Object.freeze([
                "FermBtnTxt",
                "FermEspBtnTxt",
                "AccFermBtnTxt"
            ]),

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