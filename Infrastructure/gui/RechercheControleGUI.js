/**
 * Centralise la recherche des composants GUI par nom.
 *
 * Cela évite d'appeler directement getControlByName partout dans le code.
 */
export class RechercheControleGUI {
    constructor(advancedTexture) {
        this.advancedTexture = advancedTexture;
    }

    obtenir(nomControle, obligatoire = true) {
        if (!this.advancedTexture) {
            throw new Error("AdvancedDynamicTexture introuvable.");
        }

        const controle = this.advancedTexture.getControlByName(nomControle);

        if (!controle && obligatoire) {
            throw new Error(`Contrôle GUI introuvable : ${nomControle}`);
        }

        return controle;
    }

    obtenirPlusieurs(nomsControles = []) {
        const controles = {};

        nomsControles.forEach((nom) => {
            controles[nom] = this.obtenir(nom, false);
        });

        return controles;
    }

    remplirEtatControles(etatApplication, nomsControles = []) {
        if (!etatApplication?.gui) {
            throw new Error("État GUI introuvable.");
        }

        nomsControles.forEach((nom) => {
            etatApplication.gui.controles[nom] = this.obtenir(nom, false);
        });

        return etatApplication.gui.controles;
    }
}