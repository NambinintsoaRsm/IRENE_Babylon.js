import { obtenirThemeInterface } from "../../Configuration/constantesInterface.js";

/**
 * Gère le style des boutons :
 * état normal, actif, bordures et retour visuel.
 */
export class ServiceStyleBoutonsGUI {
    appliquerStyleBouton(bouton, theme) {
        if (!bouton) {
            return;
        }

        bouton.background = theme.boutonFond;
        bouton.color = theme.boutonBordure;
        bouton.thickness = bouton.thickness ?? 1;

        this.appliquerTexteBouton(bouton, theme.boutonTexte);
    }

    appliquerStyleBoutonActif(bouton, theme) {
        if (!bouton) {
            return;
        }

        bouton.background = theme.boutonActifFond;
        bouton.color = theme.boutonBordure;

        this.appliquerTexteBouton(bouton, theme.boutonActifTexte);
    }

    appliquerTexteBouton(bouton, couleurTexte) {
        if (!bouton.children) {
            return;
        }

        bouton.children.forEach((enfant) => {
            if (enfant.className === "TextBlock") {
                enfant.color = couleurTexte;
            }
        });
    }

    appliquerBordureBouton(bouton, tailleBordure) {
        if (!bouton) {
            return;
        }

        bouton.thickness = tailleBordure;
    }

    appliquerBorduresAuxBoutons(controles, tailleBordure) {
        Object.values(controles).forEach((controle) => {
            if (controle?.className === "Button") {
                this.appliquerBordureBouton(controle, tailleBordure);
            }
        });
    }

    marquerBoutonActif(etatApplication, nomBoutonActif, nomsBoutons = []) {
        const theme = obtenirThemeInterface(etatApplication.interface.parametres.theme);
        const controles = etatApplication.gui.controles;

        nomsBoutons.forEach((nomBouton) => {
            const bouton = controles[nomBouton];

            if (!bouton) {
                return;
            }

            if (nomBouton === nomBoutonActif) {
                this.appliquerStyleBoutonActif(bouton, theme);
            } else {
                this.appliquerStyleBouton(bouton, theme);
            }
        });
    }
}