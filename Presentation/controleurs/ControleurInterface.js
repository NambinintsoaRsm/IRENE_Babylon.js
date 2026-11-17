import { configurationIconesGUI } from "../../Configuration/configurationIconesGUI.js";
/**
 * @file Contrôleur des paramètres de configuration de l'interface.
 *
 * Rôle : brancher Polices et Menus aux Use Cases, puis demander aux services GUI
 * d'appliquer le texte, le thème, les bordures et la position.
 *
 * Utilisation : le contrôleur manipule les noms de contrôles fournis par main.js ;
 * il ne doit pas contenir de valeurs visuelles codées en dur qui appartiennent à
 * Configuration/ ou guiTexture.json.
 */
import { ThemeInterface } from "../../Domain/interface/ThemeInterface.js";
import { PositionMenu } from "../../Domain/interface/PositionMenu.js";
import { constantesInterface } from "../../Configuration/constantesInterface.js";

/**
 * Contrôleur des réglages d'interface.
 *
 * Il branche les contrôles GUI aux use cases, puis délègue l'affichage aux services.
 * La logique de police, de thème, de bordures et de position n'est donc plus dans main.js.
 */
export class ControleurInterface {
    constructor({
        etatApplication,
        changerPoliceUC,
        changerTaillePoliceUC,
        changerThemeInterfaceUC,
        changerPositionMenuUC,
        changerBordureMenuUC,
        changerBordureBoutonUC,
        changerGrasUC,
        reinitialiserInterfaceUC,
        serviceTexteGUI,
        serviceStyleInterfaceGUI,
        servicePolicesNavigateur = null,
        serviceControlesSpeciauxGUI = null
    }) {
        this.etatApplication = etatApplication;

        this.changerPoliceUC = changerPoliceUC;
        this.changerTaillePoliceUC = changerTaillePoliceUC;
        this.changerThemeInterfaceUC = changerThemeInterfaceUC;
        this.changerPositionMenuUC = changerPositionMenuUC;
        this.changerBordureMenuUC = changerBordureMenuUC;
        this.changerBordureBoutonUC = changerBordureBoutonUC;
        this.changerGrasUC = changerGrasUC;
        this.reinitialiserInterfaceUC = reinitialiserInterfaceUC;

        this.serviceTexteGUI = serviceTexteGUI;
        this.serviceStyleInterfaceGUI = serviceStyleInterfaceGUI;
        this.servicePolicesNavigateur = servicePolicesNavigateur;
        this.serviceControlesSpeciauxGUI = serviceControlesSpeciauxGUI;

    }

    brancherDepuisNomsGUI(nomsGUI, serviceAnimationGUI = null) {
        const controles = this.etatApplication.gui.controles;
        this.nomsGUI = nomsGUI;

        this.initialiserValeursParDefaut();
        this.brancherPolice(controles, nomsGUI.police);
        this.brancherMenu(controles, nomsGUI.menuReglages, serviceAnimationGUI);

        this.serviceStyleInterfaceGUI.appliquerTheme(this.etatApplication);
        this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);
    }

    initialiserValeursParDefaut() {
        this.etatApplication.interface.parametres = this.etatApplication.interface.parametres.copierAvec({
            police: constantesInterface.policeDefaut,
            taillePolice: constantesInterface.taillePoliceDefaut,
            gras: constantesInterface.grasDefaut
        });
    }

    obtenirToutesOptionsPolice() {
        return [
            { nomCourt: "OpenDys", police: "OpenDyslexic" },
            { nomCourt: "Liberation", police: "Liberation" },
            { nomCourt: "Luciole", police: "Luciole" },
            { nomCourt: "Tiresias", police: "Tiresias" },
            { nomCourt: "Arial", police: "Arial" }
        ];
    }

    trouverOptionPolice(police) {
        const normalisee = String(police ?? "").toLowerCase();
        return this.obtenirToutesOptionsPolice().find((option) => {
            return option.police.toLowerCase() === normalisee
                || option.nomCourt.toLowerCase() === normalisee;
        }) ?? this.obtenirToutesOptionsPolice().find(
            (option) => option.police === constantesInterface.policeDefaut
        ) ?? { nomCourt: "Luciole", police: "Luciole" };
    }

    obtenirBoutonsOptionsPolice(controles = this.etatApplication.gui?.controles ?? {}) {
        return [
            this.obtenir(controles, "FntFmBtn0"),
            this.obtenir(controles, "FntFmBtn1"),
            this.obtenir(controles, "FntFmBtn2"),
            this.obtenir(controles, "FntFmBtn3")
        ].filter(Boolean);
    }

    synchroniserDropdownPoliceDepuisEtat() {
        const controles = this.etatApplication.gui?.controles ?? {};
        const nomsPolice = this.nomsGUI?.police;
        const texteSelection = this.obtenir(controles, nomsPolice?.texteSelection);
        const liste = this.obtenir(controles, nomsPolice?.liste);
        const policeCourante = this.etatApplication.interface?.parametres?.police ?? constantesInterface.policeDefaut;
        const selection = this.trouverOptionPolice(policeCourante);
        const boutonsOptions = this.obtenirBoutonsOptionsPolice(controles);
        const optionsListe = this.obtenirOptionsPolicePourListe(selection, boutonsOptions.length);

        this.selectionPoliceActuelle = {
            nomCourt: selection.nomCourt,
            police: selection.police
        };

        if (texteSelection) {
            this.mettreAJourLibellePoliceSelectionnee(texteSelection, selection.nomCourt);
        }

        boutonsOptions.forEach((bouton, index) => {
            const option = optionsListe[index];

            if (!option) {
                bouton.isVisible = false;
                return;
            }

            bouton.isVisible = true;
            bouton.metadata = bouton.metadata || {};
            bouton.metadata.optionPolice = {
                nomCourt: option.nomCourt,
                police: option.police
            };

            this.mettreTexteBouton(bouton, option.nomCourt);
        });

        this.reinitialiserScrollListePolice(liste);
        this.etatApplication?.services?.texteResponsive?.planifierAjustement?.(60);
    }

    obtenirOptionsPolicePourListe(selection, limite = 4) {
        const toutes = this.obtenirToutesOptionsPolice();
        const selectionPolice = selection?.police ?? constantesInterface.policeDefaut;

        // Le menu contient toujours les quatre polices autres que la sélection.
        // OpenDys reste donc disponible lorsque Luciole est la valeur par défaut,
        // et Luciole revient automatiquement dans la liste si OpenDys est choisie.
        return toutes
            .filter((option) => option.police !== selectionPolice)
            .slice(0, limite);
    }

    reinitialiserScrollListePolice(liste) {
        if (!liste) return;

        try {
            if (liste.verticalBar) liste.verticalBar.value = 0;
            if (liste.horizontalBar) liste.horizontalBar.value = 0;
            if (typeof liste.resetWindow === "function") liste.resetWindow();
        } catch (_) {
            // Le scroll n'est pas critique : on évite de bloquer le menu Police.
        }
    }

    brancherPolice(controles, nomsPolice) {
        if (!nomsPolice) {
            return;
        }

        const boutonDropdown = this.obtenir(controles, nomsPolice.boutonDropdown);
        const texteSelection = this.obtenir(controles, nomsPolice.texteSelection);
        const iconeDropdown = this.obtenir(controles, "PlcDropBtnIcoTxt")
            || this.obtenir(controles, "PlcDropBtnDropTxt");
        const liste = this.obtenir(controles, nomsPolice.liste);
        const boutonsOptions = this.obtenirBoutonsOptionsPolice(controles);

        const selectionInitiale = this.trouverOptionPolice(
            this.etatApplication.interface?.parametres?.police
            ?? constantesInterface.policeDefaut
        );
        const optionsInitiales = this.obtenirOptionsPolicePourListe(
            selectionInitiale,
            boutonsOptions.length
        );

        this.selectionPoliceActuelle = {
            nomCourt: selectionInitiale.nomCourt,
            police: selectionInitiale.police
        };

        boutonsOptions.forEach((bouton, index) => {
            const option = optionsInitiales[index];
            if (!option) return;

            bouton.metadata = bouton.metadata || {};
            bouton.metadata.optionPolice = {
                nomCourt: option.nomCourt,
                police: option.police
            };
            this.mettreTexteBouton(bouton, option.nomCourt);
        });

        if (texteSelection) {
            this.mettreAJourLibellePoliceSelectionnee(
                texteSelection,
                this.selectionPoliceActuelle.nomCourt
            );
        }

        if (liste) {
            liste.metadata = liste.metadata || {};
            liste.metadata.hauteurOuverte = liste.height || "260px";
            liste.isVisible = false;
            liste.height = "0px";
        }

        if (iconeDropdown) {
            iconeDropdown.metadata = iconeDropdown.metadata || {};
            iconeDropdown.metadata.texteDynamique = true;
            iconeDropdown.text = configurationIconesGUI.fleches.symboles.droite;
        }

        if (boutonDropdown) {
            boutonDropdown.onPointerClickObservable.clear();
            boutonDropdown.onPointerClickObservable.add(() => {
                this.basculerListePolice(liste, iconeDropdown);
            });
        }

        // Les métadonnées de chaque bouton changent lors d'un switch. Le listener
        // lit donc la valeur courante au moment du clic au lieu de figer une police.
        boutonsOptions.forEach((bouton) => {
            bouton.onPointerClickObservable.clear();
            bouton.onPointerClickObservable.add(async () => {
                await this.selectionnerPoliceParSwitch({
                    boutonOption: bouton,
                    texteSelection,
                    liste,
                    iconeDropdown
                });
            });
        });

        this.synchroniserDropdownPoliceDepuisEtat();

        this.brancherSliderTaillePoliceDepuisNoms(controles, nomsPolice);
        this.brancherBoutonGrasDepuisNoms(controles, nomsPolice);
        this.brancherReinitialisationPolice(controles, nomsPolice);
    }

    basculerListePolice(liste, iconeDropdown) {
        if (!liste) {
            return;
        }

        const doitOuvrir = !liste.isVisible;

        liste.isVisible = doitOuvrir;
        liste.height = doitOuvrir ? liste.metadata?.hauteurOuverte ?? "260px" : "0px";

        if (iconeDropdown) {
            iconeDropdown.text = doitOuvrir ? configurationIconesGUI.fleches.symboles.bas : configurationIconesGUI.fleches.symboles.droite;
        }
    }

    async selectionnerPoliceParSwitch({ boutonOption, texteSelection, liste, iconeDropdown }) {
        if (!boutonOption?.metadata?.optionPolice) {
            return;
        }

        const optionCliquee = boutonOption.metadata.optionPolice;
        const ancienneSelection = this.selectionPoliceActuelle
            ?? this.trouverOptionPolice(constantesInterface.policeDefaut);

        await this.chargerPoliceSiPossible(optionCliquee.police);

        this.changerPoliceUC.executer(optionCliquee.police);
        this.selectionPoliceActuelle = {
            nomCourt: optionCliquee.nomCourt,
            police: optionCliquee.police
        };

        // Switch : la police sélectionnée passe en haut,
        // l'ancienne sélection prend la place du bouton cliqué.
        boutonOption.metadata.optionPolice = ancienneSelection;
        this.mettreTexteBouton(boutonOption, ancienneSelection.nomCourt);

        if (texteSelection) {
            this.mettreAJourLibellePoliceSelectionnee(
                texteSelection,
                optionCliquee.nomCourt
            );
        }

        this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);
        this.mettreAJourCocheGras(
            this.obtenir(this.etatApplication.gui.controles, "PoliGrasBtnTxt"),
            this.etatApplication.interface.parametres.gras
        );

        if (liste) {
            liste.isVisible = false;
            liste.height = "0px";
        }

        if (iconeDropdown) {
            iconeDropdown.text = configurationIconesGUI.fleches.symboles.droite;
        }
    }

    async chargerPoliceSiPossible(police) {
        if (document.fonts?.load) {
            try {
                await Promise.all([
                    document.fonts.load(`400 20px "${police}"`),
                    document.fonts.load(`700 20px "${police}"`)
                ]);
                await document.fonts.ready;
            } catch (erreur) {
                console.warn("Police non chargée correctement :", police, erreur);
            }
        }

        if (this.servicePolicesNavigateur) {
            await this.servicePolicesNavigateur.chargerPolice({
                nomPolice: police
            });
        }
    }

    mettreTexteBouton(bouton, texte) {
        const textBlock = this.trouverPremierTextBlock(bouton);

        if (!textBlock) {
            return;
        }

        textBlock.metadata = textBlock.metadata || {};
        textBlock.metadata.texteDynamique = true;
        textBlock.metadata.texteOriginal = texte;
        textBlock.metadata.responsiveTexteOriginal = texte;
        delete textBlock.metadata.responsiveFontSizeBasePx;
        textBlock.text = texte;
        textBlock._markAsDirty();
    }

    mettreAJourLibellePoliceSelectionnee(textBlock, texte) {
        if (!textBlock) return;

        const libelle = String(texte ?? this.trouverOptionPolice(constantesInterface.policeDefaut).nomCourt);
        textBlock.metadata = textBlock.metadata || {};
        textBlock.metadata.texteDynamique = true;

        // Le service d'auto-fit relit texteOriginal/responsiveTexteOriginal.
        // Les deux valeurs doivent donc suivre la sélection courante, sinon
        // l'ajustement responsive réaffiche l'ancien libellé « OpenDys ».
        textBlock.metadata.texteOriginal = libelle;
        textBlock.metadata.responsiveTexteOriginal = libelle;
        delete textBlock.metadata.responsiveFontSizeBasePx;

        textBlock.text = libelle;
        textBlock._markAsDirty?.();
    }

    brancherSliderTaillePoliceDepuisNoms(controles, nomsPolice) {
        const slider = this.obtenir(controles, nomsPolice.tailleSlider);
        const texteValeur = this.obtenir(controles, nomsPolice.tailleValeurTxt);
        if (!slider) return;

        const config = constantesInterface.sliderTaillePolice;
        slider.minimum = config.minimum;
        slider.maximum = config.maximum;
        slider.step = config.step;
        const niveau = Math.max(config.minimum, Math.min(config.maximum,
            Math.round(Number(this.etatApplication.interface?.parametres?.taillePolice)
                || constantesInterface.taillePoliceDefaut)));
        slider.value = niveau;
        this.mettreAJourLibelleTaillePolice(texteValeur, niveau);

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            const nouveauNiveau = Math.max(config.minimum, Math.min(config.maximum,
                Math.round(Number(valeur) || config.minimum)));
            this.changerTaillePoliceUC.executer(nouveauNiveau);
            this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);
            this.mettreAJourLibelleTaillePolice(texteValeur, nouveauNiveau);
            this.mettreAJourCocheGras(
                this.obtenir(controles, "PoliGrasBtnTxt"),
                this.etatApplication.interface.parametres.gras
            );
        });
    }

    mettreAJourLibelleTaillePolice(texteValeur, niveau) {
        if (!texteValeur) return;
        texteValeur.metadata = texteValeur.metadata || {};
        texteValeur.metadata.texteDynamique = true;
        texteValeur.text = `${niveau}`;
        texteValeur._markAsDirty?.();
    }

    brancherBoutonGrasDepuisNoms(controles, nomsPolice) {
        const bouton = this.obtenir(controles, nomsPolice.grasBtn);
        const coche = this.obtenir(controles, "PoliGrasBtnTxt")
            || this.trouverPremierTextBlock(bouton);

        if (!bouton) {
            return;
        }

        if (coche) {
            coche.metadata = coche.metadata || {};
            coche.metadata.texteDynamique = true;
        }

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            const actif = !this.etatApplication.interface.parametres.gras;

            this.changerGrasUC.executer(actif);
            this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);
            this.mettreAJourCocheGras(coche, actif);
            });

        this.mettreAJourCocheGras(coche, this.etatApplication.interface.parametres.gras);
    }

    mettreAJourCocheGras(textBlock, actif) {
        if (!textBlock) {
            return;
        }

        textBlock.metadata = textBlock.metadata || {};
        textBlock.metadata.texteDynamique = true;
        textBlock.text = actif ? "✓" : "";
        textBlock.color = this.etatApplication.interface.parametres.theme === ThemeInterface.NOIR
            || this.etatApplication.interface.parametres.theme === ThemeInterface.GRIS_FONCE
            ? "#FFFFFFFF"
            : "#000000FF";
        textBlock.fontWeight = "700";
        textBlock.fontSize = "30px";
        textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        textBlock._markAsDirty();
    }

    brancherReinitialisationPolice(controles, nomsPolice) {
        const bouton = this.obtenir(controles, nomsPolice.reinitialiserBtn);
        const slider = this.obtenir(controles, nomsPolice.tailleSlider);
        const texteValeur = this.obtenir(controles, nomsPolice.tailleValeurTxt);
        const coche = this.obtenir(controles, "PoliGrasBtnTxt");

        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            this.changerPoliceUC.executer(constantesInterface.policeDefaut);
            this.changerTaillePoliceUC.executer(constantesInterface.taillePoliceDefaut);
            this.changerGrasUC.executer(constantesInterface.grasDefaut);

            if (slider) {
                slider.value = constantesInterface.taillePoliceDefaut;
            }

            this.mettreAJourLibelleTaillePolice(
                texteValeur,
                constantesInterface.taillePoliceDefaut
            );

            // Recompose le dropdown à partir de la sélection Luciole par défaut.
            this.synchroniserDropdownPoliceDepuisEtat();
            this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);
            this.mettreAJourCocheGras(coche, constantesInterface.grasDefaut);
            });
    }

    brancherMenu(controles, nomsMenu, serviceAnimationGUI) {
        if (!nomsMenu) {
            return;
        }

        this.brancherThemeDepuisBouton(controles, nomsMenu.blancBtn, ThemeInterface.BLANC);
        this.brancherThemeDepuisBouton(controles, nomsMenu.noirBtn, ThemeInterface.NOIR);
        this.brancherThemeDepuisBouton(controles, nomsMenu.grisClairBtn, ThemeInterface.GRIS_CLAIR);
        this.brancherThemeDepuisBouton(controles, nomsMenu.grisFonceBtn, ThemeInterface.GRIS_FONCE);

        this.brancherPositionDepuisBouton(controles, nomsMenu.gaucheBtn, PositionMenu.GAUCHE, serviceAnimationGUI);
        this.brancherPositionDepuisBouton(controles, nomsMenu.droiteBtn, PositionMenu.DROITE, serviceAnimationGUI);

        this.brancherSliderBordureBoutonDepuisNoms(controles, nomsMenu);
        this.brancherSliderBordureMenuDepuisNoms(controles, nomsMenu);
        this.brancherReinitialisationMenu(controles, nomsMenu, serviceAnimationGUI);
    }

    brancherThemeDepuisBouton(controles, nomBouton, theme) {
        const bouton = this.obtenir(controles, nomBouton);

        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            this.changerThemeInterfaceUC.executer(theme);
            this.serviceStyleInterfaceGUI.appliquerTheme(this.etatApplication);
            this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);
            this.serviceControlesSpeciauxGUI?.reappliquerSliderTemperatureApresRendu(this.etatApplication);
            this.mettreAJourCocheGras(this.obtenir(controles, "PoliGrasBtnTxt"), this.etatApplication.interface.parametres.gras);
        });
    }

    brancherPositionDepuisBouton(controles, nomBouton, positionMenu, serviceAnimationGUI) {
        const bouton = this.obtenir(controles, nomBouton);

        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            this.changerPositionMenuUC.executer(positionMenu);
            this.serviceStyleInterfaceGUI.appliquerPositionMenu(this.etatApplication, serviceAnimationGUI);

            this.serviceControlesSpeciauxGUI?.reappliquerSliderTemperatureApresRendu(
                this.etatApplication
            );
        });
    }

    brancherSliderBordureBoutonDepuisNoms(controles, nomsMenu) {
        const slider = this.obtenir(controles, nomsMenu.bordureBoutonSlider);
        const texteValeur = this.obtenir(controles, nomsMenu.bordureBoutonValeurTxt);

        if (!slider) {
            return;
        }

        const configuration = constantesInterface.sliderBordures.boutons;
        slider.minimum = configuration.minimum;
        slider.maximum = configuration.maximum;
        slider.step = configuration.step;
        slider.value = this.etatApplication.interface.parametres.tailleBorduresBoutons || 1;

        if (texteValeur) {
            texteValeur.text = String(Math.round(slider.value));
        }

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            const taille = Math.round(valeur);

            this.changerBordureBoutonUC.executer(taille);
            this.serviceStyleInterfaceGUI.appliquerBorduresBoutons(this.etatApplication, taille);

            if (texteValeur) {
                texteValeur.text = String(taille);
            }
        });
    }

    brancherSliderBordureMenuDepuisNoms(controles, nomsMenu) {
        const slider = this.obtenir(controles, nomsMenu.bordureMenuSlider);
        const texteValeur = this.obtenir(controles, nomsMenu.bordureMenuValeurTxt);

        if (!slider) {
            return;
        }

        const configuration = constantesInterface.sliderBordures.menus;
        slider.minimum = configuration.minimum;
        slider.maximum = configuration.maximum;
        slider.step = configuration.step;
        slider.value = this.etatApplication.interface.parametres.tailleBorduresMenu || 1;

        if (texteValeur) {
            texteValeur.text = String(Math.round(slider.value));
        }

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            const taille = Math.round(valeur);

            this.changerBordureMenuUC.executer(taille);
            this.serviceStyleInterfaceGUI.appliquerBorduresMenus(this.etatApplication, taille);

            if (texteValeur) {
                texteValeur.text = String(taille);
            }
        });
    }

    brancherReinitialisationMenu(controles, nomsMenu, serviceAnimationGUI) {
        const bouton = this.obtenir(controles, nomsMenu.reinitialiserBtn);

        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            // Réinitialise uniquement les réglages de menu.
            // Ne touche pas à la police sélectionnée, ni au gras, ni à la taille du texte.
            this.changerThemeInterfaceUC.executer(ThemeInterface.BLANC);
            this.changerPositionMenuUC.executer(PositionMenu.DROITE);
            this.changerBordureMenuUC.executer(1);
            this.changerBordureBoutonUC.executer(1);

            const sliderBordureBouton = this.obtenir(controles, nomsMenu.bordureBoutonSlider);
            const texteBordureBouton = this.obtenir(controles, nomsMenu.bordureBoutonValeurTxt);
            const sliderBordureMenu = this.obtenir(controles, nomsMenu.bordureMenuSlider);
            const texteBordureMenu = this.obtenir(controles, nomsMenu.bordureMenuValeurTxt);

            if (sliderBordureBouton) sliderBordureBouton.value = 1;
            if (texteBordureBouton) texteBordureBouton.text = "1";
            if (sliderBordureMenu) sliderBordureMenu.value = 1;
            if (texteBordureMenu) texteBordureMenu.text = "1";

            this.serviceStyleInterfaceGUI.appliquerTheme(this.etatApplication);
            this.serviceStyleInterfaceGUI.appliquerPositionMenu(this.etatApplication, serviceAnimationGUI);
            this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);
        });
    }

    trouverPremierTextBlock(controle) {
        if (!controle) {
            return null;
        }

        if (controle instanceof BABYLON.GUI.TextBlock) {
            return controle;
        }

        if (controle.textBlock) {
            return controle.textBlock;
        }

        if (Array.isArray(controle.children)) {
            for (const enfant of controle.children) {
                const resultat = this.trouverPremierTextBlock(enfant);
                if (resultat) {
                    return resultat;
                }
            }
        }

        return null;
    }

    obtenir(controles, nom) {
        return nom ? controles[nom] ?? null : null;
    }

    // Méthodes conservées pour compatibilité avec d'anciens appels.
    brancherDropdownPolice() {}
    brancherSliderTaillePolice() {}
    brancherBoutonGras() {}
    brancherTheme() {}
    brancherPositionMenu() {}
    brancherSliderBordureMenu() {}
    brancherSliderBordureBouton() {}

    brancherReinitialisation(bouton) {
        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.add(() => {
            this.reinitialiserInterfaceUC.executer();
            this.serviceStyleInterfaceGUI.appliquerTheme(this.etatApplication);
            this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);
            this.serviceControlesSpeciauxGUI?.reappliquerSliderTemperatureApresRendu(this.etatApplication);
        });
    }
}
