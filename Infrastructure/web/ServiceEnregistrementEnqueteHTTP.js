/**
 * Envoie les réponses anonymes du questionnaire vers l'API PHP d'ANNA.
 * Si le serveur n'est pas disponible, une copie temporaire est conservée
 * dans le localStorage du navigateur et sera renvoyée ultérieurement.
 */
export class ServiceEnregistrementEnqueteHTTP {
    constructor({
        endpoint = "./api/enregistrer_enquete.php",
        cleStockageSecours = "anna.enquete.reponses.enAttente",
        delaiMaximumMs = 12000
    } = {}) {
        this.endpoint = endpoint;
        this.cleStockageSecours = cleStockageSecours;
        this.delaiMaximumMs = delaiMaximumMs;
    }

    async enregistrer(reponseEnquete) {
        try {
            const resultat = await this._envoyer(reponseEnquete);
            return {
                ok: true,
                sauvegardeServeur: Boolean(resultat?.sauvegardeServeur),
                emailEnvoye: Boolean(resultat?.emailEnvoye),
                dejaEnregistree: Boolean(resultat?.dejaEnregistree),
                fichierRepare: Boolean(resultat?.fichierRepare),
                identifiant: resultat?.identifiant ?? reponseEnquete.identifiant,
                message: resultat?.message ?? "Réponse enregistrée."
            };
        } catch (erreur) {
            console.warn("[Enquête] Enregistrement serveur impossible.", erreur);

            // Une erreur HTTP 4xx signifie que le serveur a bien été joint mais
            // refuse définitivement cette requête (ex. identifiant en conflit).
            // La conserver dans la file locale provoquerait une boucle de retries.
            if (!erreur?.permanente) {
                this._sauvegarderLocalement(reponseEnquete);
            }

            return {
                ok: false,
                sauvegardeServeur: false,
                emailEnvoye: false,
                dejaEnregistree: false,
                fichierRepare: false,
                identifiant: reponseEnquete.identifiant,
                message: erreur?.permanente
                    ? (erreur?.message || "La réponse a été refusée par le serveur.")
                    : "Le serveur n'a pas pu être contacté. La réponse a été conservée temporairement sur cet appareil."
            };
        }
    }

    async reessayerEnvoisEnAttente() {
        const attente = this._lireAttente();
        if (!attente.length) {
            return { envoyees: 0, restantes: 0, rejetees: 0 };
        }

        const restantes = [];
        let envoyees = 0;
        let rejetees = 0;

        for (const reponse of attente) {
            try {
                await this._envoyer(reponse);
                envoyees += 1;
            } catch (erreur) {
                if (erreur?.permanente) {
                    // Ne pas conserver indéfiniment une requête que le serveur
                    // a explicitement refusée avec une erreur 4xx.
                    rejetees += 1;
                    continue;
                }

                restantes.push(reponse);
            }
        }

        this._ecrireAttente(restantes);
        return { envoyees, restantes: restantes.length, rejetees };
    }

    async _envoyer(reponseEnquete) {
        const controleur = new AbortController();
        const minuterie = setTimeout(() => controleur.abort(), this.delaiMaximumMs);

        try {
            const reponse = await fetch(this.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(reponseEnquete),
                signal: controleur.signal,
                credentials: "same-origin",
                keepalive: true
            });

            let corps = null;
            try {
                corps = await reponse.json();
            } catch {
                corps = null;
            }

            if (!reponse.ok || corps?.ok === false) {
                const erreur = new Error(corps?.message || `Réponse HTTP ${reponse.status}`);
                erreur.statutHttp = reponse.status;
                erreur.permanente = reponse.status >= 400 && reponse.status < 500;
                throw erreur;
            }

            return corps ?? {};
        } finally {
            clearTimeout(minuterie);
        }
    }

    _sauvegarderLocalement(reponseEnquete) {
        const attente = this._lireAttente();

        // Évite d'ajouter deux fois le même identifiant si plusieurs erreurs
        // surviennent pendant une même tentative.
        const sansDoublon = attente.filter(
            (reponse) => reponse?.identifiant !== reponseEnquete?.identifiant
        );

        sansDoublon.push(reponseEnquete);
        this._ecrireAttente(sansDoublon.slice(-30));
    }

    _lireAttente() {
        try {
            const brut = localStorage.getItem(this.cleStockageSecours);
            const resultat = brut ? JSON.parse(brut) : [];
            return Array.isArray(resultat) ? resultat : [];
        } catch {
            return [];
        }
    }

    _ecrireAttente(reponses) {
        try {
            if (!reponses.length) {
                localStorage.removeItem(this.cleStockageSecours);
                return;
            }

            localStorage.setItem(this.cleStockageSecours, JSON.stringify(reponses));
        } catch (erreur) {
            console.warn("[Enquête] Impossible d'écrire la sauvegarde locale.", erreur);
        }
    }
}
