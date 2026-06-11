import { ThemeInterface } from "../../Domain/interface/ThemeInterface.js";
import { PositionMenu } from "../../Domain/interface/PositionMenu.js";

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
        serviceStyleBoutonsGUI,
        serviceDropdownGUI,
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
        this.serviceStyleBoutonsGUI = serviceStyleBoutonsGUI;
        this.serviceDropdownGUI = serviceDropdownGUI;
        this.servicePolicesNavigateur = servicePolicesNavigateur;
    }

    brancherDepuisNomsGUI(nomsGUI, serviceAnimationGUI = null) {
        const controles = this.etatApplication.gui.controles;

        this.initialiserValeursParDefaut();
        this.brancherPolice(controles, nomsGUI.police);
        this.brancherMenu(controles, nomsGUI.menuReglages, serviceAnimationGUI);

        this.serviceStyleInterfaceGUI.appliquerTheme(this.etatApplication);
        this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);
    }

    initialiserValeursParDefaut() {
        this.etatApplication.interface.parametres = this.etatApplication.interface.parametres.copierAvec({
            police: "OpenDyslexic",
            taillePolice: 0,
            gras: false
        });
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

        const options = [
            { bouton: this.obtenir(controles, "FntFmBtn0"), nomCourt: "Liberation", police: "Liberation" },
            { bouton: this.obtenir(controles, "FntFmBtn1"), nomCourt: "Luciole", police: "Luciole" },
            { bouton: this.obtenir(controles, "FntFmBtn2"), nomCourt: "Tiresias", police: "Tiresias" },
            { bouton: this.obtenir(controles, "FntFmBtn3"), nomCourt: "Arial", police: "Arial" }
        ].filter((option) => option.bouton);

        // OpenDyslexic est la valeur sélectionnée par défaut.
        // On ne crée pas un bouton supplémentaire : quand l'utilisateur choisit
        // une autre police, le bouton cliqué récupère l'ancien label/ancienne police.
        this.selectionPoliceActuelle = {
            nomCourt: "OpenDys",
            police: "OpenDyslexic"
        };

        options.forEach((option) => {
            option.bouton.metadata = option.bouton.metadata || {};
            option.bouton.metadata.optionPolice = {
                nomCourt: option.nomCourt,
                police: option.police
            };

            this.mettreTexteBouton(option.bouton, option.nomCourt);
        });

        if (texteSelection) {
            texteSelection.metadata = texteSelection.metadata || {};
            texteSelection.metadata.texteDynamique = true;
            texteSelection.text = this.selectionPoliceActuelle.nomCourt;
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
            iconeDropdown.text = "▶";
        }

        if (boutonDropdown) {
            boutonDropdown.onPointerClickObservable.clear();
            boutonDropdown.onPointerClickObservable.add(() => {
                this.basculerListePolice(liste, iconeDropdown);
            });
        }

        options.forEach((option) => {
            option.bouton.onPointerClickObservable.clear();
            option.bouton.onPointerClickObservable.add(async () => {
                await this.selectionnerPoliceParSwitch({
                    boutonOption: option.bouton,
                    texteSelection,
                    liste,
                    iconeDropdown
                });
            });
        });

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
            iconeDropdown.text = doitOuvrir ? "▼" : "▶";
        }
    }

    async selectionnerPoliceParSwitch({ boutonOption, texteSelection, liste, iconeDropdown }) {
        if (!boutonOption?.metadata?.optionPolice) {
            return;
        }

        const optionCliquee = boutonOption.metadata.optionPolice;
        const ancienneSelection = this.selectionPoliceActuelle ?? {
            nomCourt: "OpenDys",
            police: "OpenDyslexic"
        };

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
            texteSelection.text = optionCliquee.nomCourt;
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
            iconeDropdown.text = "▶";
        }
    }

    async chargerPoliceSiPossible(police) {
        if (document.fonts?.load) {
            try {
                await document.fonts.load(`20px "${police}"`);
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
        textBlock.text = texte;
        textBlock._markAsDirty();
    }

    brancherSliderTaillePoliceDepuisNoms(controles, nomsPolice) {
        const slider = this.obtenir(controles, nomsPolice.tailleSlider);
        const texteValeur = this.obtenir(controles, nomsPolice.tailleValeurTxt);

        if (!slider) {
            return;
        }

        // 0 % correspond exactement à la taille définie dans guiTexture.json.
        // Le slider ajoute ou retire un pourcentage relatif à cette taille.
        slider.minimum = -10;
        slider.maximum = 3;
        slider.step = 1;
        slider.value = 0;

        if (texteValeur) {
            texteValeur.metadata = texteValeur.metadata || {};
            texteValeur.metadata.texteDynamique = true;
            texteValeur.text = "0%";
        }

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            const variation = Math.round(valeur);

            this.changerTaillePoliceUC.executer(variation);
            this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);

            if (texteValeur) {
                texteValeur.text = variation > 0 ? `+${variation}%` : `${variation}%`;
            }

            this.mettreAJourCocheGras(
                this.obtenir(controles, "PoliGrasBtnTxt"),
                this.etatApplication.interface.parametres.gras
            );
        });
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
        const texteSelection = this.obtenir(controles, nomsPolice.texteSelection);
        const slider = this.obtenir(controles, nomsPolice.tailleSlider);
        const texteValeur = this.obtenir(controles, nomsPolice.tailleValeurTxt);
        const coche = this.obtenir(controles, "PoliGrasBtnTxt");

        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            this.reinitialiserOptionsPolice(controles);

            this.changerPoliceUC.executer("OpenDyslexic");
            this.changerTaillePoliceUC.executer(0);
            this.changerGrasUC.executer(false);

            this.selectionPoliceActuelle = {
                nomCourt: "OpenDys",
                police: "OpenDyslexic"
            };

            if (texteSelection) {
                texteSelection.text = "OpenDys";
            }

            if (slider) {
                slider.value = 0;
            }

            if (texteValeur) {
                texteValeur.text = "0%";
            }

            this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);
            this.mettreAJourCocheGras(coche, false);
        });
    }

    reinitialiserOptionsPolice(controles) {
        const optionsInitiales = [
            { bouton: this.obtenir(controles, "FntFmBtn0"), nomCourt: "Liberation", police: "Liberation" },
            { bouton: this.obtenir(controles, "FntFmBtn1"), nomCourt: "Luciole", police: "Luciole" },
            { bouton: this.obtenir(controles, "FntFmBtn2"), nomCourt: "Tiresias", police: "Tiresias" },
            { bouton: this.obtenir(controles, "FntFmBtn3"), nomCourt: "Arial", police: "Arial" }
        ];

        optionsInitiales.forEach((option) => {
            if (!option.bouton) return;

            option.bouton.metadata = option.bouton.metadata || {};
            option.bouton.metadata.optionPolice = {
                nomCourt: option.nomCourt,
                police: option.police
            };

            this.mettreTexteBouton(option.bouton, option.nomCourt);
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

        slider.minimum = 1;
        slider.maximum = 8;
        slider.step = 1;
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

        slider.minimum = 1;
        slider.maximum = 8;
        slider.step = 1;
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
        });
    }
}
