import { obtenirThemeInterface } from "../../Configuration/constantesInterface.js";
import { PositionMenu } from "../../Domain/interface/PositionMenu.js";

/**
 * Applique les réglages visuels de l'interface :
 * - thème complet ;
 * - bordures des panneaux ;
 * - bordures des boutons ;
 * - position gauche / droite de tous les panneaux.
 */
export class ServiceStyleInterfaceGUI {
    appliquerTheme(etatApplication) {
        const themeActif = etatApplication.interface.parametres.theme;
        const theme = obtenirThemeInterface(themeActif);
        const advancedTexture = etatApplication.gui.advancedTexture;

        if (!advancedTexture) {
            return theme;
        }

        const descendants = advancedTexture.getDescendants();

        descendants.forEach((controle) => {
            this.memoriserStyleOriginal(controle);

            if (controle instanceof BABYLON.GUI.Button) {
                this.appliquerThemeBouton(controle, theme, etatApplication.interface.parametres);
                return;
            }

            if (controle instanceof BABYLON.GUI.Rectangle) {
                this.appliquerThemeRectangle(controle, theme, etatApplication.interface.parametres);
                return;
            }

            if (controle instanceof BABYLON.GUI.TextBlock) {
                this.appliquerThemeTexte(controle, theme);
                return;
            }

            if (controle instanceof BABYLON.GUI.Slider) {
                this.appliquerThemeSlider(controle, theme);
            }
        });

        this.appliquerExceptions(etatApplication, theme);
        advancedTexture.markAsDirty();

        return theme;
    }

    memoriserStyleOriginal(controle) {
        if (!controle) {
            return;
        }

        controle.metadata = controle.metadata || {};

        if (controle.metadata.styleOriginalMemorise) {
            return;
        }

        controle.metadata.styleOriginalMemorise = true;
        controle.metadata.backgroundOriginal = controle.background;
        controle.metadata.colorOriginal = controle.color;
        controle.metadata.thicknessOriginal = controle.thickness;
    }

    appliquerThemeBouton(bouton, theme, parametres) {
        if (this.estBoutonAvecCouleurPropre(bouton)) {
            // Exception importante : les boutons de couleurs de contours
            // et les boutons de choix de thème portent une information visuelle.
            // Leur fond et leur bordure ne doivent donc pas être remplacés
            // quand on change de thème.
            if (bouton.metadata?.backgroundOriginal !== undefined) {
                bouton.background = bouton.metadata.backgroundOriginal;
            }

            if (bouton.metadata?.colorOriginal !== undefined) {
                bouton.color = bouton.metadata.colorOriginal;
            }

            bouton.thickness = parametres.tailleBorduresBoutons;
            return;
        }

        bouton.background = theme.boutonFond;
        bouton.color = theme.boutonBordure;
        bouton.thickness = parametres.tailleBorduresBoutons;

        if (bouton.textBlock) {
            bouton.textBlock.color = theme.boutonTexte;
            bouton.textBlock._markAsDirty();
        }

        if (Array.isArray(bouton.children)) {
            bouton.children.forEach((enfant) => {
                if (enfant instanceof BABYLON.GUI.TextBlock) {
                    enfant.color = theme.boutonTexte;
                    enfant._markAsDirty();
                }
            });
        }
    }

    appliquerThemeRectangle(rectangle, theme, parametres) {
        if (this.estRectangleAvecCouleurPropre(rectangle)) {
            rectangle.thickness = parametres.tailleBorduresMenu;
            return;
        }

        rectangle.background = theme.fondPrincipal;
        rectangle.color = theme.bordure;
        rectangle.thickness = parametres.tailleBorduresMenu;
    }

    appliquerThemeTexte(textBlock, theme) {
        textBlock.color = theme.textePrincipal;
        textBlock._markAsDirty();
    }

    appliquerThemeSlider(slider, theme) {
        if (!slider) return;

        if (
            slider.name === "LumTempSlider" ||
            slider.metadata?.nePasEcraserFond ||
            slider.metadata?.estSliderTemperature
        ) {
            return;
        }
        slider.background = theme.sliderFond;
        slider.color = theme.sliderBarre;
        slider.borderColor = theme.bordure;
    }

    appliquerExceptions(etatApplication, theme) {
        const controles = etatApplication.gui.controles;

        this.nomsBoutonsAvecCouleurPropre().forEach((nom) => {
            const bouton = controles[nom];

            if (bouton?.metadata?.backgroundOriginal !== undefined) {
                bouton.background = bouton.metadata.backgroundOriginal;
            }

            if (bouton?.metadata?.colorOriginal !== undefined) {
                bouton.color = bouton.metadata.colorOriginal;
            }
        });

        const sliderTemperature = controles.LumTempSlider;
        if (sliderTemperature?.metadata?.nePasEcraserFond) {
            sliderTemperature.color = "#00000000";
            sliderTemperature.displayValueBar = false;
        }

        const flecheMenuRect = controles.FlecheMenuRect;
        if (flecheMenuRect) {
            flecheMenuRect.background = theme.boutonFond;
            flecheMenuRect.color = theme.boutonBordure;
        }
    }

    estBoutonAvecCouleurPropre(bouton) {
        return this.nomsBoutonsAvecCouleurPropre().includes(bouton?.name);
    }

    estRectangleAvecCouleurPropre(rectangle) {
        return rectangle?.metadata?.nePasEcraserTheme === true;
    }

    nomsBoutonsAvecCouleurPropre() {
        return [
            // Boutons de choix de couleur des contours.
            "ContBtn1", "ContBtn2", "ContBtn3", "ContBtn4",
            "ContBtn5", "ContBtn6", "ContBtn7", "ContBtn8",

            // Boutons de choix de thème : leur couleur est une information.
            "BlancBtn", "NoirBtn", "GrisBtn", "GrisFoncBtn"
        ];
    }

    appliquerBorduresBoutons(etatApplication, taille) {
        const advancedTexture = etatApplication.gui.advancedTexture;

        if (!advancedTexture) {
            return;
        }

        advancedTexture.getDescendants().forEach((controle) => {
            if (controle instanceof BABYLON.GUI.Button) {
                controle.thickness = taille;
            }
        });

        advancedTexture.markAsDirty();
    }

    appliquerBorduresMenus(etatApplication, taille) {
        const advancedTexture = etatApplication.gui.advancedTexture;

        if (!advancedTexture) {
            return;
        }

        advancedTexture.getDescendants().forEach((controle) => {
            if (controle instanceof BABYLON.GUI.Rectangle && !(controle instanceof BABYLON.GUI.Button)) {
                controle.thickness = taille;
            }
        });

        advancedTexture.markAsDirty();
    }

    appliquerPositionMenu(etatApplication, serviceAnimationGUI = null) {
        const controles = etatApplication.gui.controles;
        const positionMenu = etatApplication.interface.parametres.positionMenu;
        const alignement = positionMenu === PositionMenu.GAUCHE || positionMenu === "gauche"
            ? BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT
            : BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;

        // On déplace uniquement les rectangles/panneaux racines.
        // Les StackPanel et les boutons internes restent exactement comme dans le JSON.
        const panneaux = [
            "MainMenuRect",
            "FlecheMenuRect",
            "MenuRect",
            "PoliRect",
            "ContoRect",
            "TextuRect",
            "LumRect",
            "ModelRect"
        ].map((nom) => controles[nom]).filter(Boolean);

        // Important : les dropdowns internes restent dans leur parent JSON.
        // On ne déplace pas ConfOptnRect / RegOptnRect directement, sinon ils
        // bougent pendant le passage gauche/droite comme si c'étaient des panneaux racines.
        // Ils suivent MainMenuRect naturellement, comme ZoomReintBtn.

        if (serviceAnimationGUI?.deplacerPanneaux) {
            serviceAnimationGUI.deplacerPanneaux(alignement, panneaux);
        } else {
            panneaux.forEach((panneau) => {
                panneau.horizontalAlignment = alignement;
            });
        }

        serviceAnimationGUI?.appliquerPositionMenu?.({
            etatApplication,
            menuRect: controles.MainMenuRect,
            flecheRect: controles.FlecheMenuRect,
            flecheText: controles.FlecheMenuBtnTxt,
            animer: false
        });

        this.retournerOngletPliageSelonPosition(controles, positionMenu);

        etatApplication.gui.advancedTexture?.markAsDirty();
    }

    retournerOngletPliageSelonPosition(controles, positionMenu) {
        const flecheRect = controles.FlecheMenuRect;
        const flecheBtn = controles.FlecheMenuBtn;

        if (!flecheRect) {
            return;
        }

        flecheRect.metadata = flecheRect.metadata || {};

        if (flecheRect.metadata.rotationInitiale === undefined) {
            flecheRect.metadata.rotationInitiale = Number.isFinite(flecheRect.rotation)
                ? flecheRect.rotation
                : 0;
        }

        const estAGauche = positionMenu === PositionMenu.GAUCHE || positionMenu === "gauche";

        flecheRect.rotation = estAGauche
            ? flecheRect.metadata.rotationInitiale + Math.PI
            : flecheRect.metadata.rotationInitiale;

        if (flecheBtn) {
            flecheBtn.rotation = estAGauche ? Math.PI : 0;
        }
    }
}
