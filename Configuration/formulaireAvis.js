/**
 * Configuration de la fenêtre du formulaire de satisfaction.
 *
 * Pour intégrer le Google Form, remplacer uniquement urlIntegration par
 * l'URL d'intégration se terminant généralement par :
 * /viewform?embedded=true
 */
export const configurationFormulaireAvis = Object.freeze({
    actif: true,

    // Laisser "#" tant que le formulaire n'est pas encore configuré.
    urlIntegration: "https://forms.gle/keg8VvbqQZFy1WEB6",

    titreFenetre: "Donnez votre avis",
    titreIframe: "Formulaire de satisfaction IRENE",
    texteBoutonFermer: "Fermer",
    messageNonConfigure: "Le formulaire de satisfaction n'est pas encore configuré.",

    fermerAvecEchap: true,
    fermerEnCliquantSurLeFond: true,
    chargementDiffere: true
});
