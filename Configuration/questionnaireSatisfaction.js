/**
 * Contenu du questionnaire de satisfaction ANNA.
 *
 * Ce fichier contient uniquement la structure et les formulations du formulaire.
 * Les modifications futures de questions doivent être faites ici, sans toucher
 * au service d'affichage SurveyJS.
 */

const choixOuiNon = ["Oui", "Non"];
const choixOuiNonNonUtilise = ["Oui", "Non", "Non utilisé"];

export const questionnaireSatisfactionANNA = {
    description:
        "Bienvenue dans l’enquête de satisfaction de l’application ANNA " +
        "(Aide à la visualisatioN d’objets Numériques du pAtrimoine) conçue pour les personnes malvoyantes !\n\n" +
        "Ce questionnaire a pour objectif de recueillir votre avis.\n" +
        "Ce questionnaire est anonyme et vos réponses permettront d’améliorer l’application.\n\n" +
        "Merci pour votre participation.",

    showQuestionNumbers: false,
    showCompletedPage: false,
    pageNextText: "Suivant",
    pagePrevText: "Retour",
    completeText: "Envoyer",

    pages: [
        {
            name: "configuration",
            title: "Menu configuration",
            description: "Pour le menu configuration, indiquez si :",
            elements: [
                {
                    type: "radiogroup",
                    name: "choixPolice",
                    title: "Le choix de la police vous convient-il ?",
                    choices: choixOuiNon
                },
                {
                    type: "text",
                    name: "autrePolice",
                    title: "Autre police à ajouter :"
                },
                {
                    type: "radiogroup",
                    name: "taillePolice",
                    title: "La taille de la police vous convient-elle ?",
                    choices: ["Oui", "Non", "Trop petite encore"]
                },
                {
                    type: "radiogroup",
                    name: "modeGras",
                    title: "Le mode Gras vous est-il utile ?",
                    choices: choixOuiNon
                },
                {
                    type: "radiogroup",
                    name: "couleurNoireMenu",
                    title: "La couleur noire du menu vous convient-elle ?",
                    choices: choixOuiNon
                },
                {
                    type: "radiogroup",
                    name: "themeClairMenu",
                    title: "Le thème clair du menu vous convient-il ?",
                    choices: choixOuiNon
                },
                {
                    type: "radiogroup",
                    name: "themeGrisClairMenu",
                    title: "Le thème gris clair du menu vous convient-il ?",
                    choices: choixOuiNon
                },
                {
                    type: "radiogroup",
                    name: "themeGrisFonceMenu",
                    title: "Le thème gris foncé du menu vous convient-il ?",
                    choices: choixOuiNon
                },
                {
                    type: "radiogroup",
                    name: "positionMenu",
                    title: "La position gauche / droite du menu vous convient-elle ?",
                    choices: choixOuiNon
                },
                {
                    type: "radiogroup",
                    name: "epaisseurBorduresMenus",
                    title: "L’épaisseur des bordures des menus vous convient-elle ?",
                    choices: choixOuiNon
                },
                {
                    type: "radiogroup",
                    name: "epaisseurBorduresBoutons",
                    title: "L’épaisseur des bordures des boutons vous convient-elle ?",
                    choices: choixOuiNon
                },
                {
                    type: "comment",
                    name: "remarquesConfiguration",
                    title: "Avez-vous des remarques à ajouter ?"
                }
            ]
        },
        {
            name: "reglages",
            title: "Menu réglages",
            elements: [
                {
                    type: "matrix",
                    name: "aideReglages",
                    title: "Pour chacun des réglages suivants, indiquez s’il vous a aidé à mieux percevoir l’objet ?",
                    columns: choixOuiNonNonUtilise,
                    rows: [
                        "Thème de la scène clair",
                        "Thème de la scène gris",
                        "Thème de la scène foncé",
                        "Netteté",
                        "Contraste",
                        "Luminosité",
                        "Saturation"
                    ]
                },
                {
                    type: "comment",
                    name: "remarquesReglages",
                    title: "Avez-vous des remarques à ajouter ?"
                }
            ]
        },
        {
            name: "contours",
            title: "Menu contours",
            elements: [
                {
                    type: "radiogroup",
                    name: "modeSilhouette",
                    title: "Le mode silhouette vous aide-t-il à mieux voir les contours de l’objet ?",
                    choices: choixOuiNon
                },
                {
                    type: "radiogroup",
                    name: "choixCouleurContour",
                    title: "Le choix de la couleur vous convient-il ?",
                    choices: choixOuiNonNonUtilise
                },
                {
                    type: "radiogroup",
                    name: "couleurAutomatiqueContour",
                    title: "Le choix automatique de la couleur du contour vous convient-il ?",
                    choices: choixOuiNonNonUtilise
                },
                {
                    type: "radiogroup",
                    name: "surbrillanceClaire",
                    title: "Le mode surbrillance claire vous aide-t-il à mieux voir l’objet ?",
                    choices: choixOuiNon
                },
                {
                    type: "radiogroup",
                    name: "surbrillanceSombre",
                    title: "Le mode surbrillance sombre vous aide-t-il à mieux voir l’objet ?",
                    choices: choixOuiNon
                },
                {
                    type: "radiogroup",
                    name: "epaisseurContour",
                    title: "L’épaisseur du contour vous est-elle utile ?",
                    choices: choixOuiNon
                },
                {
                    type: "comment",
                    name: "remarquesContours",
                    title: "Avez-vous des remarques à ajouter ?"
                }
            ]
        },
        {
            name: "texture",
            title: "Menu texture",
            elements: [
                {
                    type: "matrix",
                    name: "aideTextures",
                    title: "Les textures ci-dessous vous aident-elles à mieux voir ou comprendre l’objet ?",
                    columns: choixOuiNonNonUtilise,
                    rows: ["Damiers", "Rayures"]
                },
                {
                    type: "radiogroup",
                    name: "tailleDamiersRayures",
                    title: "Le choix de la taille des damiers et des rayures vous aide-t-il ?",
                    choices: choixOuiNon
                },
                {
                    type: "comment",
                    name: "remarquesTextures",
                    title: "Avez-vous des remarques à ajouter ?"
                }
            ]
        },
        {
            name: "lumieres",
            title: "Menu lumières",
            elements: [
                {
                    type: "matrix",
                    name: "aideLumieres",
                    title: "Les réglages de lumière vous aident-ils à mieux voir l’objet ?",
                    columns: choixOuiNonNonUtilise,
                    rows: ["Haute", "Basse", "Tournante"]
                },
                {
                    type: "radiogroup",
                    name: "temperatureLumiere",
                    title: "Le choix de la température vous convient-il ?",
                    choices: choixOuiNon
                },
                {
                    type: "radiogroup",
                    name: "intensiteLumiere",
                    title: "Le choix de l’intensité vous convient-il ?",
                    choices: choixOuiNon
                },
                {
                    type: "comment",
                    name: "remarquesLumieres",
                    title: "Avez-vous des remarques à ajouter ?"
                }
            ]
        },
        {
            name: "loupe",
            title: "Loupe",
            elements: [
                {
                    type: "radiogroup",
                    name: "loupeAide",
                    title: "La loupe vous aide-t-elle à mieux observer l’objet ?",
                    choices: choixOuiNon
                },
                {
                    type: "radiogroup",
                    name: "vitesseLoupe",
                    title: "La vitesse de déplacement de la loupe est-elle adaptée ?",
                    choices: choixOuiNon
                },
                {
                    type: "radiogroup",
                    name: "pertinenceLoupe",
                    title: "La loupe est-elle pertinente pour explorer les détails de l’objet ?",
                    choices: choixOuiNon
                }
            ]
        },
        {
            name: "fin",
            title: "Merci pour votre participation",
            elements: [
                {
                    type: "comment",
                    name: "remarquesGenerales",
                    title: "Avez-vous des remarques générales pour améliorer l’application ?"
                },
                {
                    type: "html",
                    name: "remerciement",
                    html: "<p class=\"anna-questionnaire-remerciement\">Merci d’avoir pris le temps de partager votre expérience.</p>"
                }
            ]
        }
    ]
};
