/**
 * Applique les réglages de texte sur les composants Babylon GUI.
 *
 * Il gère la police, la taille et le gras.
 */
export class ServiceTexteGUI {
    appliquerParametresTexte(etatApplication) {
        const parametres = etatApplication.interface.parametres;
        const controles = etatApplication.gui.controles;

        Object.values(controles).forEach((controle) => {
            this.appliquerTexteSurControle(controle, parametres);
        });
    }

    appliquerTexteSurControle(controle, parametres) {
        if (!controle) {
            return;
        }

        if (controle.className === "TextBlock") {
            this.appliquerSurTextBlock(controle, parametres);
        }

        if (controle.children) {
            controle.children.forEach((enfant) => {
                this.appliquerTexteSurControle(enfant, parametres);
            });
        }
    }

    appliquerSurTextBlock(textBlock, parametres) {
        textBlock.fontFamily = parametres.police;
        textBlock.fontWeight = parametres.gras ? "700" : "400";

        if (typeof textBlock.fontSize === "string" && textBlock.fontSize.includes("%")) {
            textBlock.fontSize = textBlock.fontSize;
        } else {
            textBlock.fontSize = `${parametres.taillePolice * 18}px`;
        }
    }

    appliquerPoliceAuxTextes(controles, police) {
        Object.values(controles).forEach((controle) => {
            this.appliquerPoliceControle(controle, police);
        });
    }

    appliquerPoliceControle(controle, police) {
        if (!controle) {
            return;
        }

        if (controle.className === "TextBlock") {
            controle.fontFamily = police;
        }

        if (controle.children) {
            controle.children.forEach((enfant) => {
                this.appliquerPoliceControle(enfant, police);
            });
        }
    }
}