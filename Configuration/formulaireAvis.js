import { questionnaireSatisfactionANNA } from "./questionnaireSatisfaction.js";

/**
 * Configuration de la fenêtre du questionnaire de satisfaction ANNA.
 *
 * Le contenu des questions se trouve dans questionnaireSatisfaction.js afin
 * de pouvoir le modifier sans intervenir dans le code d'affichage.
 */
export const configurationFormulaireAvis = Object.freeze({
    actif: true,

    titreFenetre: "Enquête de satisfaction – ANNA",
    texteBoutonFermer: "Fermer",
    messageModuleIndisponible:
        "Le questionnaire ne peut pas être affiché pour le moment. Vérifiez que SurveyJS a bien été chargé.",

    questionnaire: questionnaireSatisfactionANNA,

    // Ressources officielles SurveyJS. Elles sont chargées seulement à
    // l'ouverture du questionnaire afin de ne pas modifier index.html.
    ressourcesSurveyJS: Object.freeze({
        css: "https://unpkg.com/survey-core/survey-core.min.css",
        core: "https://unpkg.com/survey-core/survey.core.min.js",
        ui: "https://unpkg.com/survey-js-ui/survey-js-ui.min.js"
    }),

    contactEmail: "dominique.groux@u-picardie.fr",
    sujetEmail: "Réponses anonymes – Questionnaire ANNA",
    prefixeNomFichier: "reponses_questionnaire_ANNA",

    // Enregistrement des réponses. Le chemin est relatif à index.html afin
    // de fonctionner également lorsque ANNA est publié dans un sous-dossier.
    enregistrement: Object.freeze({
        endpoint: "./api/enregistrer_enquete.php",
        cleStockageSecours: "anna.enquete.reponses.enAttente",
        delaiMaximumMs: 12000
    }),

    fermerAvecEchap: true,
    fermerEnCliquantSurLeFond: false
});
