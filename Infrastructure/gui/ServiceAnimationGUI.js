import { PositionMenu } from "../../Domain/interface/PositionMenu.js";
import { constantesInterface } from "../../Configuration/constantesInterface.js";

/**
 * Gère les animations de l'interface :
 * - ouverture / fermeture du menu principal ;
 * - ouverture / fermeture des dropdowns ;
 * - déplacement de la flèche selon la position du menu ;
 * - masquage des sections suivantes pour éviter la surcharge visuelle.
 */
export class ServiceAnimationGUI {
    constructor(serviceDimensionsGUI) {
        this.serviceDimensionsGUI = serviceDimensionsGUI;
    }

    basculerMenu({
                     etatApplication,
                     menuRect,
                     flecheRect,
                     flecheText
                 }) {
        const menu = etatApplication.animation.menuLateral;
        const positionMenu = etatApplication.interface.parametres.positionMenu;

        const largeurMenu =
            etatApplication.gui.dimensionsInitiales.menu?.largeurValeur ??
            etatApplication.animation.parametres.largeurMenu;

        if (positionMenu === PositionMenu.DROITE) {
            menuRect.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            flecheRect.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;

            if (menu.estOuvert) {
                menuRect.left = "0%";
                flecheRect.left = `-${largeurMenu}%`;
            } else {
                menuRect.left = `${largeurMenu}%`;
                flecheRect.left = "0%";
            }
        }

        if (positionMenu === PositionMenu.GAUCHE) {
            menuRect.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            flecheRect.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

            if (menu.estOuvert) {
                menuRect.left = "0%";
                flecheRect.left = `${largeurMenu}%`;
            } else {
                menuRect.left = `-${largeurMenu}%`;
                flecheRect.left = "0%";
            }
        }

        this.mettreAJourFlecheMenu({
            flecheText,
            positionMenu,
            menuOuvert: menu.estOuvert
        });
    }

    mettreAJourFlecheMenu({ flecheText, positionMenu, menuOuvert }) {
        if (!flecheText) {
            return;
        }

        const configFleches = constantesInterface.flechesMenu[positionMenu];

        flecheText.text = menuOuvert
            ? configFleches.ouvert
            : configFleches.ferme;
    }

    basculerSection({
                        section,
                        controleSection,
                        texteFleche,
                        hauteurInitiale
                    }) {
        if (!section || !controleSection) {
            throw new Error("Section ou contrôle GUI introuvable.");
        }

        if (section.estOuvert) {
            controleSection.isVisible = true;
            controleSection.height = hauteurInitiale;
        } else {
            controleSection.height = "0px";
            controleSection.isVisible = false;
        }

        this.mettreAJourFlecheDropdown(texteFleche, section.estOuvert);
    }

    mettreAJourFlecheDropdown(texteFleche, estOuvert) {
        if (!texteFleche) {
            return;
        }

        texteFleche.text = estOuvert
            ? constantesInterface.flechesDropdown.ouvert
            : constantesInterface.flechesDropdown.ferme;
    }

    masquerSectionsSuivantes(stackPanelPrincipal, nomSectionActive) {
        if (!constantesInterface.comportementMenu.masquerSectionsSuivantes) {
            return;
        }

        if (!stackPanelPrincipal?.children) {
            return;
        }

        let sectionTrouvee = false;

        stackPanelPrincipal.children.forEach((enfant) => {
            if (!enfant?.name) {
                return;
            }

            if (enfant.name === nomSectionActive) {
                sectionTrouvee = true;
                enfant.isVisible = true;
                return;
            }

            if (sectionTrouvee) {
                enfant.isVisible = false;
            }
        });
    }

    afficherToutesLesSections(stackPanelPrincipal) {
        if (!stackPanelPrincipal?.children) {
            return;
        }

        stackPanelPrincipal.children.forEach((enfant) => {
            enfant.isVisible = true;
        });
    }

    fermerSectionGUI(controleSection, texteFleche = null) {
        if (!controleSection) {
            return;
        }

        controleSection.height = "0px";
        controleSection.isVisible = false;

        if (texteFleche) {
            this.mettreAJourFlecheDropdown(texteFleche, false);
        }
    }
}