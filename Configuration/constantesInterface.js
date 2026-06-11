import { ThemeInterface } from "../Domain/interface/ThemeInterface.js";
import { PositionMenu } from "../Domain/interface/PositionMenu.js";

export const constantesInterface = Object.freeze({
    policeDefaut: "Arial",
    taillePoliceDefaut: 0,
    grasDefaut: false,

    themeDefaut: ThemeInterface.BLANC,
    positionMenuDefaut: PositionMenu.DROITE,

    tailleBorduresMenuDefaut: 1,
    tailleBorduresBoutonsDefaut: 1,

    policesDisponibles: Object.freeze([
        "Arial",
        "Liberation",
        "Luciole",
        "OpenDyslexic",
        "Tiresias"
    ]),

    themesDisponibles: Object.freeze([
        ThemeInterface.BLANC,
        ThemeInterface.GRIS_CLAIR,
        ThemeInterface.GRIS_FONCE,
        ThemeInterface.NOIR
    ]),

    positionsMenuDisponibles: Object.freeze([
        PositionMenu.GAUCHE,
        PositionMenu.DROITE
    ]),

    themes: Object.freeze({
        [ThemeInterface.BLANC]: Object.freeze({
            nom: "Clair",

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
            sliderBarre: "#D8D8D8FF",

            ombre: "#000000FF"
        }),

        [ThemeInterface.GRIS_CLAIR]: Object.freeze({
            nom: "Gris clair",

            fondPrincipal: "#EDEDEDFF",
            fondSecondaire: "#DCDCDCFF",
            fondSection: "#F7F7F7FF",

            textePrincipal: "#000000FF",
            texteSecondaire: "#333333FF",

            bordure: "#222222FF",

            boutonFond: "#F5F5F5FF",
            boutonTexte: "#000000FF",
            boutonBordure: "#222222FF",

            boutonActifFond: "#222222FF",
            boutonActifTexte: "#FFFFFFFF",
            boutonActifBordure: "#222222FF",

            sliderFond: "#707070FF",
            sliderBarre: "#D8D8D8FF",

            ombre: "#000000FF"
        }),

        [ThemeInterface.GRIS_FONCE]: Object.freeze({
            nom: "Gris foncé",

            fondPrincipal: "#2B2B2BFF",
            fondSecondaire: "#3A3A3AFF",
            fondSection: "#444444FF",

            textePrincipal: "#FFFFFFFF",
            texteSecondaire: "#E0E0E0FF",

            bordure: "#FFFFFFFF",

            boutonFond: "#3A3A3AFF",
            boutonTexte: "#FFFFFFFF",
            boutonBordure: "#FFFFFFFF",

            boutonActifFond: "#FFFFFFFF",
            boutonActifTexte: "#000000FF",
            boutonActifBordure: "#FFFFFFFF",

            sliderFond: "#555555FF",
            sliderBarre: "#E0E0E0FF",

            ombre: "#000000FF"
        }),

        [ThemeInterface.NOIR]: Object.freeze({
            nom: "Sombre",

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
            sliderBarre: "#FFFFFFFF",

            ombre: "#000000FF"
        })
    }),

    flechesMenu: Object.freeze({
        [PositionMenu.DROITE]: Object.freeze({
            ouvert: "▶",
            ferme: "◀"
        }),

        [PositionMenu.GAUCHE]: Object.freeze({
            ouvert: "◀",
            ferme: "▶"
        })
    }),

    flechesDropdown: Object.freeze({
        ouvert: "▼",
        ferme: "▶"
    }),

    comportementMenu: Object.freeze({
        masquerSectionsSuivantes: true,
        fermerAutresSectionsPrincipales: true
    }),

    stylesComposants: Object.freeze({
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

        boutonRetour: Object.freeze({
            largeur: "95%",
            hauteur: "75px",
            epaisseurBordure: 1,

            couleurBordure: "#000000FF",
            couleurFond: "#FFFFFFFF",
            couleurTexte: "#000000FF",

            alignementTexte: "centre",

            fontSize: "40%",
            fontWeight: "500"
        }),

        dropdown: Object.freeze({
            symboleOuvert: "▼",
            symboleFerme: "▶"
        })
    })
});

export function obtenirThemeInterface(theme) {
    return constantesInterface.themes[theme]
        ?? constantesInterface.themes[constantesInterface.themeDefaut];
}