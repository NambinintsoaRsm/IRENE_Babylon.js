/**
 * @file Contrôleur du bouton Avis et du questionnaire de satisfaction.
 *
 * Rôle : ouvrir le formulaire configuré, lui fournir l'apparence courante et assurer
 * son nettoyage lorsque l'application est détruite.
 */
export class ControleurAvis {
    constructor({
        etatApplication,
        serviceFormulaireAvisHTML,
        configurationFormulaireAvis,
        constantesInterface,
        enregistrerReponseEnqueteUC
    } = {}) {
        this.etatApplication = etatApplication;
        this.serviceFormulaireAvisHTML = serviceFormulaireAvisHTML;
        this.configurationFormulaireAvis = configurationFormulaireAvis;
        this.constantesInterface = constantesInterface;
        this.enregistrerReponseEnqueteUC = enregistrerReponseEnqueteUC;

        this.boutonAvis = null;
        this.observateurBouton = null;
    }

    brancherDepuisNomsGUI(nomsGUI = {}) {
        const controles = this.etatApplication?.gui?.controles ?? {};
        const bouton = controles[nomsGUI.bouton] ?? null;
        const texte = controles[nomsGUI.texte] ?? bouton?.textBlock ?? null;

        if (!bouton) {
            console.warn("[Avis] Bouton GUI introuvable :", nomsGUI.bouton);
            return;
        }

        if (!this.configurationFormulaireAvis.actif) {
            bouton.isVisible = false;
            bouton.isEnabled = false;
            return;
        }

        if (texte) {
            texte.metadata = texte.metadata ?? {};
            texte.metadata.texteDynamique = true;
        }

        this.serviceFormulaireAvisHTML.installer({
            camera: this.etatApplication?.camera?.cameraBabylon,
            canvas: this.etatApplication?.canvas,
            obtenirApparence: () => this._obtenirApparenceCourante(),
            onSoumission: (reponses) => this._enregistrerReponses(reponses)
        });

        this.boutonAvis = bouton;
        this.observateurBouton = bouton.onPointerClickObservable.add(() => {
            this.serviceFormulaireAvisHTML.ouvrir();
        });
    }

    detruire() {
        if (this.boutonAvis && this.observateurBouton) {
            this.boutonAvis.onPointerClickObservable.remove(this.observateurBouton);
        }

        this.observateurBouton = null;
        this.boutonAvis = null;
        this.serviceFormulaireAvisHTML.detruire();
    }


    async _enregistrerReponses(reponses) {
        if (!this.enregistrerReponseEnqueteUC) {
            console.warn("[Avis] Aucun mécanisme d'enregistrement n'est configuré.");
            return { ok: false, message: "Enregistrement non configuré." };
        }

        return this.enregistrerReponseEnqueteUC.executer({ reponses });
    }

    _obtenirApparenceCourante() {
        const parametres = this.etatApplication?.interface?.parametres ?? {};
        const themes = this.constantesInterface?.themes ?? {};
        const theme = themes[parametres.theme]
            ?? themes[this.constantesInterface?.themeDefaut]
            ?? {};

        return {
            police: parametres.police,
            taillePolice: parametres.taillePolice,
            gras: parametres.gras,

            // Le formulaire reprend exactement le thème courant d'ANNA.
            fond: theme.fondPrincipal,
            fondSecondaire: theme.fondSecondaire,
            fondSection: theme.fondSection,
            texte: theme.textePrincipal,
            texteSecondaire: theme.texteSecondaire,
            bordure: theme.bordure,

            // Couleurs normales des boutons de l'interface.
            boutonFond: theme.boutonFond,
            boutonTexte: theme.boutonTexte,
            boutonBordure: theme.boutonBordure,

            // Couleurs déjà définies dans ANNA pour un état mis en avant.
            boutonActifFond: theme.boutonActifFond,
            boutonActifTexte: theme.boutonActifTexte,
            boutonActifBordure: theme.boutonActifBordure
        };
    }
}
