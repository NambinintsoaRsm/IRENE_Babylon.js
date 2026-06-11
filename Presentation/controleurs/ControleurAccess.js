import { access } from "../../Configuration/accessibilite.js";

export class ControleurAccess {
    constructor({ etatApplication, toggleAccessUC }) {
        this.etatApplication = etatApplication;
        this.toggleAccessUC = toggleAccessUC;
        this.texteBouton = null;
    }

    brancherDepuisNomsGUI(noms = {}) {
        const bouton = this.obtenir(noms.bouton)
            ?? this.obtenir("AccessBtn")
            ?? this.obtenir("AccBtn");

        const texte = this.obtenir(noms.texte)
            ?? this.obtenir("AccessBtnTxt")
            ?? this.obtenir("AccBtnTxt")
            ?? this.trouverPremierTextBlock(bouton);

        if (!bouton) {
            console.warn("[Accessibilité] Bouton introuvable. Nom attendu : AccessBtn ou AccBtn.");
            return;
        }

        this.texteBouton = texte;
        this.preparerTexteBouton();
        this.mettreAJourTexte(this.etatApplication.accessibilite?.actif === true);

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            const resultat = this.toggleAccessUC.executer();
            this.mettreAJourTexte(resultat.actif);

            console.log("[Accessibilité]", resultat);
        });
    }

    preparerTexteBouton() {
        if (!this.texteBouton) return;

        this.texteBouton.metadata = this.texteBouton.metadata || {};
        this.texteBouton.metadata.texteDynamique = true;
        this.texteBouton.isVisible = true;
        this.texteBouton.color = this.texteBouton.color || "#000000FF";
    }

    mettreAJourTexte(actif) {
        if (!this.texteBouton) return;

        this.texteBouton.metadata = this.texteBouton.metadata || {};
        this.texteBouton.metadata.texteDynamique = true;
        this.texteBouton.text = actif
            ? access.bouton.texteActif
            : access.bouton.texteInactif;

        this.texteBouton._markAsDirty?.();
        this.etatApplication.gui.advancedTexture?.markAsDirty?.();
    }

    trouverPremierTextBlock(controle) {
        if (!controle) return null;
        if (controle instanceof BABYLON.GUI.TextBlock) return controle;
        if (controle.textBlock) return controle.textBlock;

        if (Array.isArray(controle.children)) {
            for (const enfant of controle.children) {
                const resultat = this.trouverPremierTextBlock(enfant);
                if (resultat) return resultat;
            }
        }

        return null;
    }

    obtenir(nom) {
        if (!nom) return null;

        const controles = this.etatApplication.gui?.controles ?? {};
        if (controles[nom]) return controles[nom];

        const controle = this.etatApplication.gui?.advancedTexture?.getControlByName?.(nom) ?? null;
        if (controle) {
            controles[nom] = controle;
        }

        return controle;
    }
}
