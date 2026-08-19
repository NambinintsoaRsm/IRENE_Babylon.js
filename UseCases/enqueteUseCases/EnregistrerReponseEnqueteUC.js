import { ReponseEnquete } from "../../Domain/enquete/ReponseEnquete.js";

/**
 * Cas d'utilisation : enregistrer une réponse au questionnaire de satisfaction.
 */
export class EnregistrerReponseEnqueteUC {
    constructor({ serviceEnregistrement } = {}) {
        if (!serviceEnregistrement) {
            throw new Error("Le service d'enregistrement du questionnaire est requis.");
        }

        this.serviceEnregistrement = serviceEnregistrement;
    }

    async executer({ reponses = {} } = {}) {
        const reponseEnquete = new ReponseEnquete({ reponses });
        return this.serviceEnregistrement.enregistrer(reponseEnquete);
    }
}
