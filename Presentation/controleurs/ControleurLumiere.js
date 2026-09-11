import { constantesInterface } from "../../Configuration/constantesInterface.js";
import { constantesLumiere } from "../../Configuration/constantesLumiere.js";

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
        this.optionCourante = { type: "principale", libelle: "Uniforme" };
        this.optionsBoutons = [];

        // Etat purement UI : fermer l'aide centrale ne coupe ni la lumière
        // tournante ni le raccourci Espace. L'aide réapparaît seulement lors
        // d'une nouvelle sélection explicite de la lumière tournante.
        this.aideEspaceFermeeParUtilisateur = false;
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
                { bouton: this.obtenir("LumTypBtn0"), type: "haut", libelle: "Spot haut" },
                { bouton: this.obtenir("LumTypBtn1"), type: "bas", libelle: "Spot bas" },
                { bouton: this.obtenir("LumTypBtn2"), type: "tournante", libelle: "Balayage" }
            ]
        });

        this.brancherReinitialisation(this.obtenir("LumReintBtn"));
        this.brancherFermetureAideEspace(this.obtenir("FermEspBtn"));

        // Pause / reprise de la lumière tournante avec la touche espace.
        this.brancherPauseLumiereTournanteParEspace();
    }

    brancherIntensite({ slider, texteValeur }) {
        if (!slider) return;

        slider.minimum = constantesLumiere.intensite.minimum;
        slider.maximum = constantesLumiere.intensite.maximum;
        slider.step = constantesLumiere.intensite.pas;
        slider.value = constantesLumiere.intensite.defaut;
        slider.isPointerBlocker = true;

        this.serviceLumiereBabylon.appliquerIntensite(this.etatApplication.scenes.scene3D, slider.value);

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            this.serviceLumiereBabylon.appliquerIntensite(this.etatApplication.scenes.scene3D, valeur);
        });
    }

    brancherTemperature({ slider, texteValeur }) {
        if (!slider) return;

        slider.minimum = constantesLumiere.temperature.minimum;
        slider.maximum = constantesLumiere.temperature.maximum;
        slider.step = constantesLumiere.temperature.pas;
        slider.value = constantesLumiere.temperature.defaut;
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

        this.optionCourante = { type: "principale", libelle: "Uniforme" };
        this.mettreAJourVisibiliteAideEspace(false);
        this.optionsBoutons = options.filter((option) => option.bouton);

        if (texteSelection) {
            this.mettreAJourTexteDynamique(texteSelection, this.optionCourante.libelle);
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

            // Le texte d'aide ne doit jamais recouvrir la liste déroulante.
            // Il réapparaît à la fermeture uniquement si la lumière tournante est active.
            this.mettreAJourVisibiliteAideEspace(ouvrir);
        });

        this.optionsBoutons.forEach((option) => {
            const bouton = option.bouton;

            bouton.onPointerClickObservable.clear();
            bouton.onPointerClickObservable.add(() => {
                const nouvelleOption = { ...bouton.metadata.optionLumiere };
                const ancienneOption = { ...this.optionCourante };

                this.optionCourante = nouvelleOption;
                bouton.metadata.optionLumiere = ancienneOption;

                // Une nouvelle sélection explicite de la lumière tournante rend
                // de nouveau l'aide disponible, même si elle avait été fermée lors
                // de l'utilisation précédente.
                if (nouvelleOption.type === "tournante") {
                    this.aideEspaceFermeeParUtilisateur = false;
                }

                // Le service enlève la lumière précédente et applique uniquement le type choisi.
                this.serviceLumiereBabylon.appliquerType(
                    this.etatApplication.scenes.scene3D,
                    nouvelleOption.type
                );

                if (texteSelection) {
                    this.mettreAJourTexteDynamique(texteSelection, nouvelleOption.libelle);
                }

                this.mettreAJourLibellePauseLumiere(false);

                this.mettreAJourTexteBoutonOption(bouton, ancienneOption.libelle);

                liste.isVisible = false;
                liste.height = "0px";
                if (iconeDropdown) iconeDropdown.text = "▶";

                this.mettreAJourVisibiliteAideEspace(false);

                // Certains changements de police / auto-fit sont planifiés à la
                // frame suivante. On confirme donc une seconde fois le libellé et
                // l'aide après le recalcul du layout.
                requestAnimationFrame(() => {
                    if (this.optionCourante?.type !== nouvelleOption.type) return;
                    if (texteSelection) {
                        this.mettreAJourTexteDynamique(texteSelection, nouvelleOption.libelle);
                    }
                    this.mettreAJourVisibiliteAideEspace(false);
                });
            });
        });
    }


    appliquerDepuisSauvegarde(parametres = {}) {
        if (!parametres || typeof parametres !== "object") {
            return;
        }

        const typeActif = parametres.typeActif || "principale";
        const optionActuelle = this.creerOptionDepuisType(typeActif);
        const toutesOptions = [
            this.creerOptionDepuisType("principale"),
            this.creerOptionDepuisType("haut"),
            this.creerOptionDepuisType("bas"),
            this.creerOptionDepuisType("tournante")
        ];
        const optionsListe = toutesOptions.filter((option) => option.type !== optionActuelle.type);

        this.optionCourante = optionActuelle;
        this.aideEspaceFermeeParUtilisateur = false;

        const texteSelection = this.obtenir("LumDropBtnTxt");
        if (texteSelection) {
            this.mettreAJourTexteDynamique(texteSelection, optionActuelle.libelle);
        }

        this.optionsBoutons.forEach((optionBouton, index) => {
            const nouvelleOption = optionsListe[index];
            if (!optionBouton?.bouton || !nouvelleOption) return;

            optionBouton.type = nouvelleOption.type;
            optionBouton.libelle = nouvelleOption.libelle;
            optionBouton.bouton.metadata = optionBouton.bouton.metadata || {};
            optionBouton.bouton.metadata.optionLumiere = {
                type: nouvelleOption.type,
                libelle: nouvelleOption.libelle
            };
            this.mettreAJourTexteBoutonOption(optionBouton.bouton, nouvelleOption.libelle);
        });

        this.mettreAJourVisibiliteAideEspace(false);
    }

    creerOptionDepuisType(type) {
        if (type === "haut") return { type: "haut", libelle: "Spot haut" };
        if (type === "bas") return { type: "bas", libelle: "Spot bas" };
        if (type === "tournante") return { type: "tournante", libelle: "Balayage" };
        return { type: "principale", libelle: "Uniforme" };
    }

    mettreAJourTexteBoutonOption(bouton, libelle) {
        const texte = bouton?.textBlock
            || bouton?.children?.find?.((enfant) => enfant instanceof BABYLON.GUI.TextBlock);

        if (!texte) return;

        this.mettreAJourTexteDynamique(texte, libelle);
    }

    mettreAJourTexteDynamique(textBlock, valeur) {
        if (!textBlock) return;

        const texte = String(valeur ?? "");
        textBlock.metadata = textBlock.metadata || {};
        textBlock.metadata.texteDynamique = true;

        // L'auto-fit responsive mémorise aussi une valeur d'origine. Sans cette
        // synchronisation, il peut réinjecter le texte du JSON (par exemple
        // « Par défaut ») après que le contrôleur a choisi « Tournante ».
        textBlock.metadata.texteOriginal = texte;
        textBlock.metadata.responsiveTexteOriginal = texte;
        textBlock.metadata.dernierTexteAutoFit = "";
        textBlock.text = texte;
        textBlock._markAsDirty?.();
        this.etatApplication.gui.advancedTexture?.markAsDirty?.();
    }

    mettreAJourVisibiliteAideEspace(listeOuverte = null) {
        const aide = this.obtenir("EspaceRect");
        if (!aide) return;

        const liste = this.obtenir("LumTypScroll");
        const estListeOuverte = typeof listeOuverte === "boolean"
            ? listeOuverte
            : Boolean(liste?.isVisible);
        const afficher = this.optionCourante?.type === "tournante"
            && !estListeOuverte
            && !this.aideEspaceFermeeParUtilisateur;

        aide.isVisible = afficher;
        aide.notRenderable = !afficher;
        aide.isEnabled = afficher;

        // Le panneau doit rester pickable lorsqu'il est visible pour que son
        // bouton FermEspBtn puisse recevoir le clic. Le rectangle parent ne
        // bloque pas les autres contrôles : seul le bouton est PointerBlocker.
        aide.isHitTestVisible = afficher;
        aide.isPointerBlocker = false;
        aide._markAsDirty?.();
        this.etatApplication.gui.advancedTexture?.markAsDirty?.();

        if (afficher) {
            this.etatApplication.services?.texteResponsive?.planifierAjustement?.(0);
        }
    }

    brancherFermetureAideEspace(bouton) {
        if (!bouton) return;

        const texteCroix = bouton.textBlock
            || bouton.children?.find?.((enfant) => enfant instanceof BABYLON.GUI.TextBlock);
        const styleFermeture = constantesInterface.stylesComposants?.boutonFermeture;

        if (texteCroix && styleFermeture) {
            // Le JSON garde la géométrie du bouton. On renseigne seulement le
            // pictogramme depuis la configuration commune des fermetures.
            texteCroix.text = styleFermeture.caractereIcone;
            texteCroix.fontFamily = constantesInterface.flechesNavigation?.police || "Arial";
            texteCroix.fontWeight = styleFermeture.poidsIcone;
            texteCroix.fontSize = styleFermeture.tailleIcone;
            texteCroix.metadata = texteCroix.metadata || {};
            texteCroix.metadata.nePasModifierTailleTexte = true;
            texteCroix.metadata.texteOriginal = styleFermeture.caractereIcone;
            texteCroix._markAsDirty?.();
        }

        bouton.isVisible = true;
        bouton.isEnabled = true;
        bouton.isHitTestVisible = true;
        bouton.isPointerBlocker = true;

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            this.aideEspaceFermeeParUtilisateur = true;
            this.mettreAJourVisibiliteAideEspace(false);
        });
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

        this.mettreAJourTexteDynamique(
            texteSelection,
            estEnPause ? "Tournante (pause)" : "Tournante"
        );
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

        this.optionCourante = { type: "principale", libelle: "Uniforme" };
        this.aideEspaceFermeeParUtilisateur = false;

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

        if (intensite) intensite.value = constantesLumiere.intensite.defaut;
        if (temperature) {
            temperature.value = constantesLumiere.temperature.defaut;
            this.appliquerFondTemperatureSliderApresRendu(temperature);
        }
        if (texteSelection) this.mettreAJourTexteDynamique(texteSelection, "Uniforme");
        if (liste) {
            liste.isVisible = false;
            liste.height = "0px";
        }
        if (icone) icone.text = "▶";

        this.mettreAJourVisibiliteAideEspace(false);
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
