/**
 * Contrôleur des réglages de lumière.
 *
 * Le dropdown garde le même principe que la police :
 * l'option sélectionnée remonte dans le bouton principal,
 * et l'ancienne option principale redescend dans la liste.
 */
export class ControleurLumiere {
    constructor({ etatApplication, serviceLumiereBabylon }) {
        this.etatApplication = etatApplication;
        this.serviceLumiereBabylon = serviceLumiereBabylon;
        this.optionCourante = { type: "principale", libelle: "Principale" };
        this.optionsBoutons = [];
    }

    brancherDepuisNomsGUI() {
        // Par défaut : lumière principale / de base.
        this.serviceLumiereBabylon.initialiser?.(this.etatApplication.scenes.scene3D);

        this.brancherIntensite({
            slider: this.obtenir("LumIntSlider"),
            texteValeur: this.obtenir("LumIntValTxt")
        });

        this.brancherTemperature({
            slider: this.obtenir("LumTempSlider"),
            texteValeur: this.obtenir("LumTempValTxt")
        });

        this.brancherTypeLumiereSwitch({
            boutonDropdown: this.obtenir("LumDropBtn"),
            texteSelection: this.obtenir("LumDropBtnTxt"),
            iconeDropdown: this.obtenir("LumDropBtnIcoTxt"),
            liste: this.obtenir("LumTypScroll"),
            options: [
                { bouton: this.obtenir("LumTypBtn0"), type: "haut", libelle: "Haut" },
                { bouton: this.obtenir("LumTypBtn1"), type: "bas", libelle: "Bas" },
                { bouton: this.obtenir("LumTypBtn2"), type: "tournante", libelle: "Tournante" }
            ]
        });

        this.brancherReinitialisation(this.obtenir("LumReintBtn"));

        // Pause / reprise de la lumière tournante avec la touche espace.
        this.brancherPauseLumiereTournanteParEspace();
    }

    brancherIntensite({ slider, texteValeur }) {
        if (!slider) return;

        slider.minimum = 0.2;
        slider.maximum = 2.5;
        slider.step = 0.1;
        slider.value = 1.2;
        slider.isPointerBlocker = true;

        this.serviceLumiereBabylon.appliquerIntensite(this.etatApplication.scenes.scene3D, slider.value);

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            this.serviceLumiereBabylon.appliquerIntensite(this.etatApplication.scenes.scene3D, valeur);
        });
    }

    brancherTemperature({ slider, texteValeur }) {
        if (!slider) return;

        slider.minimum = 0;
        slider.maximum = 100;
        slider.step = 1;
        slider.value = 50;
        slider.displayValueBar = false;
        slider.color = "#00000000";
        slider.isPointerBlocker = true;
        slider.metadata = slider.metadata || {};
        slider.metadata.nePasEcraserFond = true;
        slider.metadata.estSliderTemperature = true;

        this.serviceLumiereBabylon.appliquerTemperature(this.etatApplication.scenes.scene3D, slider.value);
        this.appliquerFondTemperatureSliderApresRendu(slider);

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            this.serviceLumiereBabylon.appliquerTemperature(this.etatApplication.scenes.scene3D, valeur);
        });
    }

    appliquerFondTemperatureSliderApresRendu(slider) {
        const sceneGUI = this.etatApplication.scenes.sceneGUI;

        const appliquer = () => {
            const mesure = slider._currentMeasure;

            // Si le panneau Lumières est fermé ou vient d'être déplacé, la mesure
            // peut être encore vide. On n'écrase pas le fond par un gris : le
            // service dédié le recalculera dès que la position réelle sera connue.
            if (!mesure || mesure.width <= 0 || mesure.height <= 0) {
                return false;
            }

            try {
                const yMilieu = mesure.top + (mesure.height / 2);
                const gradient = new BABYLON.GUI.LinearGradient(
                    mesure.left,
                    yMilieu,
                    mesure.left + mesure.width,
                    yMilieu
                );

                gradient.addColorStop(0, "#ff7a2f");
                gradient.addColorStop(0.5, "#f2f2f2");
                gradient.addColorStop(1, "#9fd3ff");

                slider.backgroundGradient = gradient;
                slider.background = "#00000000";
                slider.thumbColor = "#f2f2f2";
                slider.displayValueBar = false;
                slider.color = "#00000000";
                slider.metadata = slider.metadata || {};
                slider.metadata.signatureGradientTemperature = [
                    Math.round(mesure.left),
                    Math.round(mesure.top),
                    Math.round(mesure.width),
                    Math.round(mesure.height)
                ].join("|");
                slider._markAsDirty?.();

                return true;
            } catch (erreur) {
                return false;
            }
        };

        if (sceneGUI?.onAfterRenderObservable) {
            sceneGUI.onAfterRenderObservable.addOnce(appliquer);
        } else {
            appliquer();
        }

        let framesRestantes = 6;
        const reessayer = () => {
            if (framesRestantes <= 0) return;
            framesRestantes -= 1;
            appliquer();
            requestAnimationFrame(reessayer);
        };

        requestAnimationFrame(reessayer);
    }

    brancherTypeLumiereSwitch({ boutonDropdown, texteSelection, iconeDropdown, liste, options = [] }) {
        if (!boutonDropdown || !liste) return;

        liste.metadata = liste.metadata || {};
        liste.metadata.hauteurOuverte = liste.height || "180px";
        liste.isVisible = false;
        liste.height = "0px";

        this.optionCourante = { type: "principale", libelle: "Principale" };
        this.optionsBoutons = options.filter((option) => option.bouton);

        if (texteSelection) {
            texteSelection.metadata = texteSelection.metadata || {};
            texteSelection.metadata.texteDynamique = true;
            texteSelection.text = this.optionCourante.libelle;
        }

        if (iconeDropdown) {
            iconeDropdown.metadata = iconeDropdown.metadata || {};
            iconeDropdown.metadata.texteDynamique = true;
            iconeDropdown.text = "▶";
        }

        this.optionsBoutons.forEach((option) => {
            option.bouton.metadata = option.bouton.metadata || {};
            option.bouton.metadata.optionLumiere = {
                type: option.type,
                libelle: option.libelle
            };
            this.mettreAJourTexteBoutonOption(option.bouton, option.libelle);
        });

        this.serviceLumiereBabylon.appliquerType(this.etatApplication.scenes.scene3D, this.optionCourante.type);

        boutonDropdown.onPointerClickObservable.clear();
        boutonDropdown.onPointerClickObservable.add(() => {
            const ouvrir = !liste.isVisible;
            liste.isVisible = ouvrir;
            liste.height = ouvrir ? liste.metadata.hauteurOuverte : "0px";
            if (iconeDropdown) iconeDropdown.text = ouvrir ? "▼" : "▶";
        });

        this.optionsBoutons.forEach((option) => {
            const bouton = option.bouton;

            bouton.onPointerClickObservable.clear();
            bouton.onPointerClickObservable.add(() => {
                const nouvelleOption = { ...bouton.metadata.optionLumiere };
                const ancienneOption = { ...this.optionCourante };

                this.optionCourante = nouvelleOption;
                bouton.metadata.optionLumiere = ancienneOption;

                // Le service enlève la lumière précédente et applique uniquement le type choisi.
                this.serviceLumiereBabylon.appliquerType(
                    this.etatApplication.scenes.scene3D,
                    nouvelleOption.type
                );

                if (texteSelection) {
                    texteSelection.text = nouvelleOption.libelle;
                    texteSelection._markAsDirty?.();
                }

                this.mettreAJourLibellePauseLumiere(false);

                this.mettreAJourTexteBoutonOption(bouton, ancienneOption.libelle);

                liste.isVisible = false;
                liste.height = "0px";
                if (iconeDropdown) iconeDropdown.text = "▶";
            });
        });
    }

    mettreAJourTexteBoutonOption(bouton, libelle) {
        const texte = bouton?.textBlock
            || bouton?.children?.find?.((enfant) => enfant instanceof BABYLON.GUI.TextBlock);

        if (!texte) return;

        texte.metadata = texte.metadata || {};
        texte.metadata.texteDynamique = true;
        texte.text = libelle;
        texte._markAsDirty?.();
    }

    brancherPauseLumiereTournanteParEspace() {
        // Si le contrôleur est rebranché, on évite d'empiler plusieurs écouteurs clavier.
        if (this.detacherRaccourciEspace) {
            this.detacherRaccourciEspace();
        }

        const gererTouche = (event) => {
            if (!this.estToucheEspace(event)) return;

            // Evite qu'un appui long déclenche pause/reprise en boucle.
            if (event.repeat) return;

            // On ne bloque pas l'espace quand l'utilisateur saisit du texte.
            if (this.estSaisieTexteActive(event.target)) return;

            const scene = this.etatApplication.scenes.scene3D;
            const estEnPause = this.serviceLumiereBabylon.basculerPauseRotation(scene);

            // Si la lumière tournante n'est pas active, la touche espace garde son comportement normal.
            if (estEnPause === null) return;

            // Empêche le scroll de la page ou une action navigateur liée à l'espace.
            event.preventDefault();
            event.stopPropagation();

           // this.mettreAJourLibellePauseLumiere(estEnPause);
        };

        // Capture = true pour reconnaître l'espace même si le canvas ou un contrôle GUI a le focus.
        window.addEventListener("keydown", gererTouche, true);

        this.detacherRaccourciEspace = () => {
            window.removeEventListener("keydown", gererTouche, true);
        };
    }

    estToucheEspace(event) {
        return event.code === "Space"
            || event.key === " "
            || event.key === "Space"
            || event.key === "Spacebar"
            || event.keyCode === 32
            || event.which === 32;
    }

    estSaisieTexteActive(cible) {
        if (!cible) return false;

        const nomBalise = cible.tagName?.toLowerCase?.();

        return nomBalise === "input"
            || nomBalise === "textarea"
            || nomBalise === "select"
            || cible.isContentEditable === true;
    }
    //  peut être utile si on peut indication textuelle
    mettreAJourLibellePauseLumiere(estEnPause) {
        const texteSelection = this.obtenir("LumDropBtnTxt");
        if (!texteSelection) return;

        if (this.optionCourante?.type !== "tournante") return;

        texteSelection.metadata = texteSelection.metadata || {};
        texteSelection.metadata.texteDynamique = true;
        texteSelection.text = estEnPause ? "Tournante (pause)" : "Tournante";
        texteSelection._markAsDirty?.();
    }

    brancherReinitialisation(bouton) {
        if (!bouton) return;

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            this.serviceLumiereBabylon.reinitialiser(this.etatApplication.scenes.scene3D);
            this.reinitialiserInterfaceLumiere();
        });
    }

    reinitialiserInterfaceLumiere() {
        const intensite = this.obtenir("LumIntSlider");
        const temperature = this.obtenir("LumTempSlider");
        const texteSelection = this.obtenir("LumDropBtnTxt");
        const liste = this.obtenir("LumTypScroll");
        const icone = this.obtenir("LumDropBtnIcoTxt");

        this.optionCourante = { type: "principale", libelle: "Principale" };

        const optionsInitiales = [
            { bouton: this.obtenir("LumTypBtn0"), type: "haut", libelle: "Haut" },
            { bouton: this.obtenir("LumTypBtn1"), type: "bas", libelle: "Bas" },
            { bouton: this.obtenir("LumTypBtn2"), type: "tournante", libelle: "Tournante" }
        ];

        optionsInitiales.forEach((option) => {
            if (!option.bouton) return;
            option.bouton.metadata = option.bouton.metadata || {};
            option.bouton.metadata.optionLumiere = {
                type: option.type,
                libelle: option.libelle
            };
            this.mettreAJourTexteBoutonOption(option.bouton, option.libelle);
        });

        if (intensite) intensite.value = 1.2;
        if (temperature) {
            temperature.value = 50;
            this.appliquerFondTemperatureSliderApresRendu(temperature);
        }
        if (texteSelection) texteSelection.text = "Principale";
        if (liste) {
            liste.isVisible = false;
            liste.height = "0px";
        }
        if (icone) icone.text = "▶";

    }


    obtenir(nom) {
        if (!nom) return null;

        const depuisEtat = this.etatApplication.gui.controles[nom];
        if (depuisEtat) return depuisEtat;

        // Sécurité : si un nom n'a pas été ajouté dans recupererTousLesControles,
        // on le récupère directement depuis l'AdvancedDynamicTexture.
        const depuisTexture = this.etatApplication.gui.advancedTexture?.getControlByName?.(nom) ?? null;

        if (depuisTexture) {
            this.etatApplication.gui.controles[nom] = depuisTexture;
        } else {
            console.warn(`[Lumière] Contrôle introuvable : ${nom}`);
        }

        return depuisTexture;
    }
}
