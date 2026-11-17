/**
 * @file Application des thèmes et bordures sur Babylon GUI.
 *
 * Rôle : traduire ParametresInterface en couleurs, contrastes, épaisseurs et position
 * du menu tout en préservant les contrôles qui possèdent une couleur fonctionnelle.
 *
 * Utilisation : ControleurInterface et ControleurProfil rappellent ce service après
 * toute modification de thème ou restauration de profil.
 */
import { constantesInterface, obtenirThemeInterface } from "../../Configuration/constantesInterface.js";
import { PositionMenu } from "../../Domain/interface/PositionMenu.js";
import { configurationBorduresGUI } from "../../Configuration/configurationBorduresGUI.js";
import { peutModifierBordureBouton } from "../../Domain/interface/PolitiqueBordures.js";

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

    appliquerEpaisseurBordureBouton(bouton, taille) {
        this.memoriserStyleOriginal(bouton);

        if (!peutModifierBordureBouton(bouton.name, configurationBorduresGUI.boutonsExclus)) {
            // Un bouton exclu conserve l'épaisseur définie avant l'application du thème.
            if (bouton.metadata?.thicknessOriginal !== undefined) {
                bouton.thickness = bouton.metadata.thicknessOriginal;
            }
            return;
        }

        bouton.thickness = taille;
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

            this.appliquerEpaisseurBordureBouton(bouton, parametres.tailleBorduresBoutons);
            return;
        }

        bouton.background = theme.boutonFond;
        bouton.color = theme.boutonBordure;
        this.appliquerEpaisseurBordureBouton(bouton, parametres.tailleBorduresBoutons);

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
            // Le curseur reste blanc avec une bordure sombre pour être visible
            // sur toute la plage chaude/froide, même après un changement de thème.
            sliderTemperature.borderColor = "#202020FF";
            sliderTemperature.thumbColor = "#FFFFFFFF";
        }

        const flecheMenuRect = controles.FlecheMenuRect;
        if (flecheMenuRect) {
            flecheMenuRect.background = theme.boutonFond;
            flecheMenuRect.color = theme.boutonBordure;
        }

        // Exception d’accessibilité : le bouton de fermeture doit conserver
        // une bordure nettement visible même si l’utilisateur choisit des
        // bordures fines pour les autres boutons de l’interface.
        const boutonFermeture = controles.FermBtn;
        if (boutonFermeture) {
            const style = constantesInterface.stylesComposants?.boutonFermeture ?? {};
            const epaisseurMin = Number(style.epaisseurBordureMinimum) || 4;

            boutonFermeture.width = style.largeur ?? "14.7%";
            boutonFermeture.fixedRatio = Number(style.ratio) || 1;
            boutonFermeture.fixedRatioMasterIsWidth = style.largeurPiloteRatio !== false;
            boutonFermeture.cornerRadius = style.rayonCoin ?? 10;
            boutonFermeture.thickness = Math.max(
                Number(etatApplication.interface.parametres.tailleBorduresBoutons) || 0,
                epaisseurMin
            );
            boutonFermeture.zIndex = style.zIndex ?? 100;
            boutonFermeture.background = theme.boutonFond;
            boutonFermeture.color = theme.boutonBordure;

            const texteFermeture = controles.FermBtnTxt ?? boutonFermeture.textBlock ?? null;
            if (texteFermeture) {
                texteFermeture.color = theme.boutonTexte;
                texteFermeture.outlineColor = theme.boutonTexte;
                this.ajusterIconeFermeture(boutonFermeture, texteFermeture);
            }
        }
    }

    /**
     * Ajuste la croix de fermeture à la taille réellement disponible dans son
     * bouton sans déplacer ni redimensionner le bouton lui-même.
     *
     * La méthode est commune aux trois croix de la V1 : accueil, fermeture
     * principale et aide de la lumière tournante. Elle peut être appelée même
     * avant le premier layout Babylon : quelques frames de rattrapage sont
     * planifiées jusqu'à ce qu'une mesure exploitable soit disponible.
     */
    ajusterIconeFermeture(bouton, texte, { reessais = 8 } = {}) {
        if (!bouton || !texte || !globalThis.BABYLON?.GUI) {
            return false;
        }

        const style = constantesInterface.stylesComposants?.boutonFermeture ?? {};
        const caractere = String(style.caractereIcone ?? "X");
        const police = String(style.policeIcone ?? constantesInterface.flechesNavigation?.police ?? "Arial");
        const poids = String(style.poidsIcone ?? "700");
        const epaisseurContour = Math.max(0, Number(style.epaisseurVisuelleIcone) || 0);
        const margeRatio = Math.max(0, Math.min(0.35, Number(style.margeInterieureRatio) || 0));
        const tailleMinimum = Math.max(1, Number(style.tailleIconeMinimumPx) || 1);

        texte.metadata = texte.metadata || {};
        texte.metadata.nePasModifierTailleTexte = true;
        texte.metadata.nePasAccessibilite = true;
        texte.metadata.nePasAutoFit = true;
        texte.metadata.texteDynamique = false;
        texte.metadata.texteOriginal = caractere;

        texte.text = caractere;
        texte.fontFamily = police;
        texte.fontWeight = poids;
        texte.resizeToFit = false;
        texte.textWrapping = BABYLON.GUI.TextWrapping?.Clip ?? texte.textWrapping;
        texte.width = "100%";
        texte.height = "100%";
        texte.left = "0px";
        texte.top = "0px";
        texte.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        texte.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        texte.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        texte.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        texte.outlineWidth = epaisseurContour;

        const appliquer = () => {
            const mesure = bouton._currentMeasure;
            const largeur = Number(mesure?.width) || 0;
            const hauteur = Number(mesure?.height) || 0;

            if (largeur <= 0 || hauteur <= 0) {
                texte.fontSize = style.tailleIconeFallback ?? "75%";
                texte._markAsDirty?.();
                return false;
            }

            const largeurDisponible = Math.max(1, largeur * (1 - (2 * margeRatio)) - (2 * epaisseurContour));
            const hauteurDisponible = Math.max(1, hauteur * (1 - (2 * margeRatio)) - (2 * epaisseurContour));
            const tailleCalculee = this.calculerTailleIconeFermeturePx({
                caractere,
                police,
                poids,
                largeurDisponible,
                hauteurDisponible
            });

            texte.fontSize = Math.max(tailleMinimum, Math.floor(tailleCalculee));
            texte._markAsDirty?.();
            bouton._markAsDirty?.();
            return true;
        };

        const reessayer = (reste) => {
            if (appliquer() || reste <= 0) {
                return;
            }
            requestAnimationFrame(() => reessayer(reste - 1));
        };

        reessayer(Math.max(0, Number(reessais) || 0));
        this.brancherRecalculIconeFermetureAuResize(bouton, texte);
        return true;
    }

    calculerTailleIconeFermeturePx({ caractere, police, poids, largeurDisponible, hauteurDisponible }) {
        const tailleReference = 100;
        let largeurGlyphe = tailleReference * 0.7;
        let hauteurGlyphe = tailleReference;

        try {
            const canvasMesure = document.createElement("canvas");
            const contexte = canvasMesure.getContext("2d");
            if (contexte) {
                contexte.font = `${poids} ${tailleReference}px "${police}"`;
                const metriques = contexte.measureText(caractere);
                const largeurBoite = Number(metriques.actualBoundingBoxLeft) + Number(metriques.actualBoundingBoxRight);
                const hauteurBoite = Number(metriques.actualBoundingBoxAscent) + Number(metriques.actualBoundingBoxDescent);

                largeurGlyphe = largeurBoite > 0 ? largeurBoite : Math.max(1, Number(metriques.width) || largeurGlyphe);
                hauteurGlyphe = hauteurBoite > 0 ? hauteurBoite : hauteurGlyphe;
            }
        } catch {
            // Les valeurs de secours gardent la croix utilisable même si le
            // navigateur ne fournit pas les métriques avancées du canvas.
        }

        const facteurLargeur = largeurDisponible / Math.max(1, largeurGlyphe);
        const facteurHauteur = hauteurDisponible / Math.max(1, hauteurGlyphe);
        return tailleReference * Math.min(facteurLargeur, facteurHauteur);
    }

    brancherRecalculIconeFermetureAuResize(bouton, texte) {
        if (typeof window === "undefined") {
            return;
        }

        bouton.metadata = bouton.metadata || {};
        if (bouton.metadata.recalculIconeFermetureResizeBranche) {
            return;
        }

        bouton.metadata.recalculIconeFermetureResizeBranche = true;
        let minuterie = null;

        const recalculer = () => {
            if (minuterie) {
                clearTimeout(minuterie);
            }
            minuterie = setTimeout(() => {
                requestAnimationFrame(() => this.ajusterIconeFermeture(bouton, texte, { reessais: 3 }));
            }, 80);
        };

        window.addEventListener("resize", recalculer, { passive: true });
        bouton.metadata.detacherRecalculIconeFermetureResize = () => {
            window.removeEventListener("resize", recalculer);
            if (minuterie) {
                clearTimeout(minuterie);
            }
        };
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

    couleurFondOptionInactiveSelonTheme(themeActif) {
        const theme = String(themeActif || "").toLowerCase();

        if (theme === "gris-fonce" || theme === "grisfonce" || theme.includes("fonce")) {
            return "#1A1A1AFF";
        }

        // En thème noir, les boutons d'options doivent rester noirs
        // tant qu'ils ne sont pas sélectionnés.
        return "#000000FF";
    }

    nomsBoutonsOptionsAvecFondAdaptatif() {
        return [
            // Panneau Contours.
            "ContDBtn",

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
                this.appliquerEpaisseurBordureBouton(controle, taille);
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
            "ModelRect",
            // AccesRect est un panneau racine, contrairement à AccesBtn qui est
            // déjà enfant de MainMenuRect. Il doit donc suivre explicitement le
            // passage du menu de gauche à droite.
            "AccesRect"
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

        // Une seule source de vérité pour l'onglet de pliage :
        // ServiceAnimationGUI met à jour simultanément la position, la rotation
        // ET le symbole de la flèche selon le côté et l'état ouvert/fermé.
        // L'ancienne seconde rotation appliquée ici provoquait un décalage d'un
        // clic après un passage gauche <-> droite.
        serviceAnimationGUI?.appliquerPositionMenu?.({
            etatApplication,
            menuRect: controles.MainMenuRect,
            flecheRect: controles.FlecheMenuRect,
            flecheText: controles.FlecheMenuBtnTxt,
            animer: false
        });

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
