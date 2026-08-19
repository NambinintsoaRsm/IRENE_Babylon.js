/**
 * Représente une réponse anonyme au questionnaire ANNA.
 * Aucune information d'identité, de navigateur ou de machine n'est ajoutée.
 */
export class ReponseEnquete {
    constructor({ reponses = {} } = {}) {
        this.identifiant = ReponseEnquete.genererIdentifiant();
        this.dateUTC = new Date().toISOString();
        this.version = "ANNA-survey-1";
        this.reponses = ReponseEnquete.copier(reponses);
    }

    static genererIdentifiant() {
        if (globalThis.crypto?.randomUUID) {
            return globalThis.crypto.randomUUID();
        }

        return `anna-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    static copier(valeur) {
        try {
            return JSON.parse(JSON.stringify(valeur ?? {}));
        } catch {
            return {};
        }
    }
}
