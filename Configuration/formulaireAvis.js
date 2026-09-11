/**
 * @file Configuration technique de la fenêtre « Avis » d'ANNA.
 *
 * Les questions elles-mêmes restent dans questionnaireSatisfaction.js. Ce
 * fichier configure uniquement l'affichage SurveyJS, l'adresse d'enregistrement
 * et les comportements de fermeture.
 */
import { questionnaireSatisfactionANNA } from "./questionnaireSatisfaction.js";

export const configurationFormulaireAvis = Object.freeze({
    actif: true,

    titreFenetre: "Enquête de satisfaction – ANNA",
    texteBoutonFermer: "Fermer",
    messageModuleIndisponible:
        "Le questionnaire ne peut pas être affiché pour le moment. Vérifiez que SurveyJS a bien été chargé.",

    questionnaire: questionnaireSatisfactionANNA,

    // Ressources SurveyJS chargées à la demande lors de l'ouverture du formulaire.
    // Cela évite de ralentir le démarrage de la scène quand l'utilisateur n'ouvre pas « Avis ».
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
        // 12 s laisse le temps à un serveur distant de répondre sans bloquer
        // indéfiniment l'envoi ; au-delà, le mécanisme de secours local peut agir.
        delaiMaximumMs: 12000
    }),

    fermerAvecEchap: true,
    fermerEnCliquantSurLeFond: false
});
