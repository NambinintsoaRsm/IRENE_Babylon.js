import { obtenirThemeInterface } from "../../Configuration/constantesInterface.js";

/**
 * Applique les couleurs du thème actif à l'interface.
 *
 * Les couleurs viennent de Configuration/constantesInterface.js.
 */
export class ServiceStyleInterfaceGUI {
    appliquerTheme(etatApplication) {
        const themeActif = etatApplication.interface.parametres.theme;
        const theme = obtenirThemeInterface(themeActif);
        const controles = etatApplication.gui.controles;

        this.appliquerThemeMenu(controles, theme);
        this.appliquerThemeSections(controles, theme);
        this.appliquerThemeSliders(controles, theme);

        return theme;
    }

    appliquerThemeMenu(controles, theme) {
        const menus = [
            "MainMenuRect",
            "ConfOptnRect",
            "RegOptnRect",
            "ContoRect"
        ];

        menus.forEach((nom) => {
            if (controles[nom]) {
                controles[nom].background = theme.fondPrincipal;
                controles[nom].color = theme.bordure;
            }
        });
    }

    appliquerThemeSections(controles, theme) {
        Object.values(controles).forEach((controle) => {
            if (!controle) {
                return;
            }

            if (controle.className === "Button") {
                controle.background = theme.boutonFond;
                controle.color = theme.boutonBordure;
            }

            if (controle.className === "TextBlock") {
                controle.color = theme.textePrincipal;
            }

            if (controle.className === "Rectangle") {
                controle.color = theme.bordure;
            }
        });
    }

    appliquerThemeSliders(controles, theme) {
        Object.values(controles).forEach((controle) => {
            if (!controle || controle.className !== "Slider") {
                return;
            }

            controle.background = theme.sliderFond;
            controle.color = theme.sliderBarre;
            controle.borderColor = theme.bordure;
        });
    }
}