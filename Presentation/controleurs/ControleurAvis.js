export class ControleurAvis {
    constructor({
        etatApplication,
        serviceFormulaireAvisHTML,
        configurationFormulaireAvis,
        constantesInterface
    } = {}) {
        this.etatApplication = etatApplication;
        this.serviceFormulaireAvisHTML = serviceFormulaireAvisHTML;
        this.configurationFormulaireAvis = configurationFormulaireAvis;
        this.constantesInterface = constantesInterface;

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
            obtenirApparence: () => this._obtenirApparenceCourante()
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
            fond: theme.fondPrincipal,
            texte: theme.textePrincipal,
            bordure: theme.bordure,
            boutonFond: theme.boutonActifFond,
            boutonTexte: theme.boutonActifTexte
        };
    }
}
