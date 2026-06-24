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
        this.appliquerFondBoutonsOptionsSelonTheme(etatApplication, theme);
        this.corrigerContrasteBoutons(advancedTexture);
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
        if (sliderTemperature) {
            // Le slider Température garde son fond chaud/froid.
            // On ne remet pas le fond du thème ici, sinon le dégradé disparaît
            // après un changement de menu ou de position.
            sliderTemperature.metadata = sliderTemperature.metadata || {};
            sliderTemperature.metadata.nePasEcraserFond = true;
            sliderTemperature.metadata.estSliderTemperature = true;
            sliderTemperature.displayValueBar = false;
            sliderTemperature.color = "#00000000";
            sliderTemperature.borderColor = "#00000000";
            sliderTemperature.thumbColor = "#f2f2f2";
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


    appliquerFondBoutonsOptionsSelonTheme(etatApplication, theme) {
        const controles = etatApplication?.gui?.controles ?? {};
        const themeActif = etatApplication?.interface?.parametres?.theme;

        if (!this.estThemeSombre(themeActif, theme)) {
            return;
        }

        this.nomsBoutonsOptionsAvecFondAdaptatif().forEach((nom) => {
            const bouton = controles[nom]
                ?? etatApplication?.gui?.advancedTexture?.getControlByName?.(nom)
                ?? null;

            if (!bouton) {
                return;
            }

            bouton.metadata = bouton.metadata || {};

            // Sur thème noir, les boutons d'options restent noirs par défaut.
            // Seul le bouton sélectionné passe en clair avec un texte foncé.
            const actif = bouton.metadata.estOptionActive === true
                || bouton.metadata.estBoutonOptionActive === true
                || bouton.metadata.estActif === true;

            bouton.background = actif ? "#FFFFFFFF" : this.couleurFondOptionInactiveSelonTheme(themeActif);
            bouton.color = actif ? "#FFFFFFFF" : "#AFAFAFFF";

            this.appliquerCouleurTexteBouton(
                bouton,
                actif ? "#111111FF" : "#FFFFFFFF"
            );
        });
    }

    nomsBoutonsOptionsAvecFondAdaptatif() {
        return [
            // Panneau Contours.
            "ContDBtn", "ContNBtn", "ContCBtn",
            "ContLumNormBtn", "ContNormLumBtn", "ContTestNormBtn", "ReliefLumBtn", "ReliefTestBtn",
            "ContLumCoulBtn", "ContCoulLumBtn", "ContTestCoulBtn", "CouleurLumBtn", "CouleurTestBtn",

            // Panneau Highlight. Les noms varient selon les versions du JSON/snippet.
            "HighNormBtn", "HighNormalBtn", "HighNBtn", "HighReliefBtn", "HighBtnNormale",
            "HighCoulBtn", "HighCouleurBtn", "HighColorBtn", "HighCBtn", "HighBtnCouleur",

            // Panneau Texture.
            "TxtuBtn0", "TxtuBtn1", "TxtuBtn2",

            // Panneau Lumières.
            "LumTypBtn0", "LumTypBtn1", "LumTypBtn2",

            // Panneau Modèles.
            "MdlBtn0", "MdlBtn1"
        ];
    }

    estThemeSombre(themeActif, theme) {
        if (themeActif === "noir" || themeActif === "gris-fonce") {
            return true;
        }

        const couleurFond = this.normaliserCouleurHex(theme?.fondPrincipal);

        if (!couleurFond) {
            return false;
        }

        const r = parseInt(couleurFond.slice(1, 3), 16);
        const g = parseInt(couleurFond.slice(3, 5), 16);
        const b = parseInt(couleurFond.slice(5, 7), 16);
        const luminanceSimple = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        return luminanceSimple < 0.22;
    }

    appliquerCouleurTexteBouton(bouton, couleurTexte) {
        if (bouton?.textBlock) {
            bouton.textBlock.color = couleurTexte;
            bouton.textBlock._markAsDirty?.();
        }

        if (Array.isArray(bouton?.children)) {
            bouton.children.forEach((enfant) => {
                this.corrigerContrasteTexteRecursif(enfant, couleurTexte);
            });
        }
    }

    corrigerContrasteBoutons(advancedTexture) {
        if (!advancedTexture?.getDescendants) {
            return;
        }

        advancedTexture.getDescendants().forEach((controle) => {
            if (!(controle instanceof BABYLON.GUI.Button)) {
                return;
            }

            this.corrigerContrasteBouton(controle);
        });
    }

    corrigerContrasteBouton(bouton) {
        if (!bouton) {
            return;
        }

        const couleurFond = this.normaliserCouleurHex(bouton.background);

        if (!couleurFond) {
            return;
        }

        const couleurTexte = this.couleurTexteLisible(couleurFond);

        bouton.color = bouton.color || couleurTexte;

        if (bouton.textBlock) {
            bouton.textBlock.color = couleurTexte;
            bouton.textBlock._markAsDirty?.();
        }

        if (Array.isArray(bouton.children)) {
            bouton.children.forEach((enfant) => {
                this.corrigerContrasteTexteRecursif(enfant, couleurTexte);
            });
        }
    }

    corrigerContrasteTexteRecursif(controle, couleurTexte) {
        if (!controle) {
            return;
        }

        if (controle instanceof BABYLON.GUI.TextBlock) {
            controle.color = couleurTexte;
            controle._markAsDirty?.();
            return;
        }

        if (Array.isArray(controle.children)) {
            controle.children.forEach((enfant) => {
                this.corrigerContrasteTexteRecursif(enfant, couleurTexte);
            });
        }
    }

    normaliserCouleurHex(couleur) {
        if (typeof couleur !== "string") {
            return null;
        }

        const texte = couleur.trim();

        if (!texte.startsWith("#")) {
            return null;
        }

        if (texte.length === 4) {
            const r = texte[1];
            const g = texte[2];
            const b = texte[3];
            return `#${r}${r}${g}${g}${b}${b}`;
        }

        if (texte.length >= 7) {
            return texte.slice(0, 7);
        }

        return null;
    }

    couleurTexteLisible(couleurFond) {
        const r = parseInt(couleurFond.slice(1, 3), 16) / 255;
        const g = parseInt(couleurFond.slice(3, 5), 16) / 255;
        const b = parseInt(couleurFond.slice(5, 7), 16) / 255;

        const luminance = 0.2126 * this.lineariserCanalCouleur(r)
            + 0.7152 * this.lineariserCanalCouleur(g)
            + 0.0722 * this.lineariserCanalCouleur(b);

        return luminance > 0.55 ? "#111111FF" : "#FFFFFFFF";
    }

    lineariserCanalCouleur(valeur) {
        return valeur <= 0.03928
            ? valeur / 12.92
            : Math.pow((valeur + 0.055) / 1.055, 2.4);
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
            "HighRect",
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
