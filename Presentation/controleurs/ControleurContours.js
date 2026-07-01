import { TypeContour } from "../../Domain/contours/TypeContour.js";
import { constantesContours } from "../../Configuration/constantesContours.js";
import { obtenirThemeInterface } from "../../Configuration/constantesInterface.js";

/**
 * Contrôleur des contours.
 *
 * Particularité importante : plusieurs contours peuvent être actifs en même temps.
 * Exemple : Silhouette + Relief + Couleur.
 */
export class ControleurContours {
    constructor({
        etatApplication,
        activerSilhouetteUC,
        activerReliefUC,
        activerContourCouleurUC,
        changerEpaisseurContourUC,
        changerCouleurContourUC,
        choisirCouleurContourAdaptativeUC = null,
        basculerMiseLumiereNormalesUC = null,
        basculerMiseLumiereCouleursUC = null,
        desactiverContoursUC,
        reinitialiserContoursUC,
        postTraitContProfNorm,
        postTraitContoursCouleur,
        postTraitMiseLumiereNormales = null,
        postTraitMiseLumiereCouleurs = null
    }) {
        this.etatApplication = etatApplication;
        this.activerSilhouetteUC = activerSilhouetteUC;
        this.activerReliefUC = activerReliefUC;
        this.activerContourCouleurUC = activerContourCouleurUC;
        this.changerEpaisseurContourUC = changerEpaisseurContourUC;
        this.changerCouleurContourUC = changerCouleurContourUC;
        this.choisirCouleurContourAdaptativeUC = choisirCouleurContourAdaptativeUC;
        this.basculerMiseLumiereNormalesUC = basculerMiseLumiereNormalesUC;
        this.basculerMiseLumiereCouleursUC = basculerMiseLumiereCouleursUC;
        this.desactiverContoursUC = desactiverContoursUC;
        this.reinitialiserContoursUC = reinitialiserContoursUC;
        this.postTraitContProfNorm = postTraitContProfNorm;
        this.postTraitContoursCouleur = postTraitContoursCouleur;
        this.postTraitMiseLumiereNormales = postTraitMiseLumiereNormales;
        this.postTraitMiseLumiereCouleurs = postTraitMiseLumiereCouleurs;
        this.boutonsType = new Map();
        this.boutonsMiseLumiere = new Map();
        this.sliderEpaisseur = null;
        this.texteEpaisseur = null;
        this.promesseCouleurAdaptative = null;
    }

    brancherSilhouette(bouton) {
        this.brancherBoutonTypeContour({ bouton, typeContour: TypeContour.SILHOUETTE });
    }

    brancherRelief(bouton) {
        this.brancherBoutonTypeContour({ bouton, typeContour: TypeContour.RELIEF });
    }

    brancherContourCouleur(bouton) {
        this.brancherBoutonTypeContour({ bouton, typeContour: TypeContour.COULEUR });
    }

    brancherMiseLumiereNormales(bouton) {
        this.brancherBoutonMiseLumiere({
            bouton,
            cle: "normales",
            basculerUC: this.basculerMiseLumiereNormalesUC,
            postTraitement: this.postTraitMiseLumiereNormales,
            lireActif: () => Boolean(this.etatApplication.contours.miseLumiereNormalesActif)
        });
    }

    brancherMiseLumiereCouleurs(bouton) {
        this.brancherBoutonMiseLumiere({
            bouton,
            cle: "couleurs",
            basculerUC: this.basculerMiseLumiereCouleursUC,
            postTraitement: this.postTraitMiseLumiereCouleurs,
            lireActif: () => Boolean(this.etatApplication.contours.miseLumiereCouleursActif)
        });
    }

    brancherBoutonMiseLumiere({ bouton, cle, basculerUC, postTraitement, lireActif }) {
        if (!bouton || !basculerUC || !postTraitement) return;

        bouton.metadata = bouton.metadata || {};
        bouton.metadata.backgroundOriginal = bouton.metadata.backgroundOriginal ?? bouton.background;
        bouton.metadata.thicknessOriginal = bouton.metadata.thicknessOriginal ?? bouton.thickness;
        bouton.metadata.colorOriginal = bouton.metadata.colorOriginal ?? bouton.color;

        this.boutonsMiseLumiere.set(cle, { bouton, lireActif });

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            const actif = basculerUC.executer();

            if (actif) {
                postTraitement.appliquer(this.etatApplication);
            } else {
                postTraitement.supprimer(this.etatApplication);
            }

            this.mettreAJourBoutonsMiseLumiere();
        });

        this.mettreAJourBoutonsMiseLumiere();
    }

    brancherBoutonTypeContour({ bouton, typeContour }) {
        if (!bouton) return;

        bouton.metadata = bouton.metadata || {};
        bouton.metadata.backgroundOriginal = bouton.metadata.backgroundOriginal ?? bouton.background;
        bouton.metadata.thicknessOriginal = bouton.metadata.thicknessOriginal ?? bouton.thickness;
        bouton.metadata.colorOriginal = bouton.metadata.colorOriginal ?? bouton.color;

        this.boutonsType.set(typeContour, { bouton });

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(async () => {
            const parametres = this.etatApplication.contours.parametres;
            const dejaActif = this.estContourActif(parametres, typeContour);

            try {
                if (dejaActif) {
                    this.desactiverContoursUC.executer(typeContour);
                } else {
                    if (typeContour === TypeContour.SILHOUETTE) this.activerSilhouetteUC.executer();
                    if (typeContour === TypeContour.RELIEF) this.activerReliefUC.executer();
                    if (typeContour === TypeContour.COULEUR) this.activerContourCouleurUC.executer();

                    // Si l'utilisateur n'a pas choisi de couleur manuelle,
                    // le contour utilise automatiquement la couleur calculée.
                    await this.recalculerCouleurAdaptativeSiNecessaire({
                        forcer: false,
                        raison: "activation-contour"
                    });
                }

                this.mettreAJourSliderEpaisseurSiContoursDesactives();
                this.appliquerContours();
                this.mettreAJourBoutonsTypes();
                this.mettreAJourBoutonsCouleurs(null);
                this.mettreAJourBoutonCouleurAdaptative();
            } catch (erreur) {
                console.error("Erreur pendant l'activation du contour.", erreur);
            }
        });
    }

    brancherSliderEpaisseur({ slider, texteValeur = null }) {
        if (!slider) return;
        this.sliderEpaisseur = slider;
        this.texteEpaisseur = texteValeur;

        const valeurInitiale = Math.min(
            3,
            Math.max(1, Math.round(this.etatApplication.contours.parametres.epaisseur ?? 1))
        );

        slider.minimum = 1;
        slider.maximum = 3;
        slider.step = 1;
        slider.value = valeurInitiale;

        if (texteValeur) {
            texteValeur.metadata = texteValeur.metadata || {};
            texteValeur.metadata.texteDynamique = true;
            texteValeur.text = String(valeurInitiale);
        }

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            const epaisseur = Math.min(3, Math.max(1, Math.round(valeur)));

            if (texteValeur) {
                texteValeur.text = String(epaisseur);
            }

            this.changerEpaisseurContourUC.executer(epaisseur);
            this.appliquerContours();
        });
    }

    brancherCouleur({ bouton, couleur }) {
        if (!bouton) return;

        bouton.metadata = bouton.metadata || {};
        bouton.metadata.estBoutonCouleurContour = true;
        bouton.metadata.backgroundOriginal = bouton.metadata.backgroundOriginal ?? bouton.background;
        bouton.metadata.thicknessOriginal = bouton.metadata.thicknessOriginal ?? bouton.thickness;
        bouton.metadata.colorOriginal = bouton.metadata.colorOriginal ?? bouton.color;

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            this.changerCouleurContourUC.executer(couleur);
            this.appliquerContours();
            this.mettreAJourBoutonsCouleurs(bouton);
            this.mettreAJourBoutonCouleurAdaptative();
        });
    }

    brancherCouleurAdaptative(bouton) {
        if (!bouton) return;

        bouton.metadata = bouton.metadata || {};
        bouton.metadata.estBoutonCouleurAdaptative = true;
        bouton.metadata.backgroundOriginal = bouton.metadata.backgroundOriginal ?? bouton.background;
        bouton.metadata.thicknessOriginal = bouton.metadata.thicknessOriginal ?? bouton.thickness;
        bouton.metadata.colorOriginal = bouton.metadata.colorOriginal ?? bouton.color;
        bouton.metadata.cocheCouleurAdaptative = this.obtenirTexteCocheCouleurAdaptative(bouton);

        if (bouton.metadata.cocheCouleurAdaptative) {
            bouton.metadata.cocheCouleurAdaptative.metadata = bouton.metadata.cocheCouleurAdaptative.metadata || {};
            bouton.metadata.cocheCouleurAdaptative.metadata.texteDynamique = true;
        }

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(async () => {
            const parametres = this.etatApplication.contours?.parametres;

            if (!parametres) {
                return;
            }

            const prochainEtat = !Boolean(parametres.couleurAutomatiqueActive);
            parametres.couleurAutomatiqueActive = prochainEtat;

            if (prochainEtat) {
                parametres.couleurManuelleChoisie = false;
            }

            bouton.isEnabled = false;

            try {
                if (prochainEtat) {
                    await this.recalculerCouleurAdaptativeSiNecessaire({
                        forcer: true,
                        raison: "checkbox-auto"
                    });
                    this.appliquerContours();
                }

                this.mettreAJourBoutonsCouleurs(null);
                this.mettreAJourBoutonCouleurAdaptative();
            } catch (erreur) {
                console.error("Erreur pendant le choix automatique de couleur de contour.", erreur);
            } finally {
                bouton.isEnabled = true;
            }
        });

        this.mettreAJourBoutonCouleurAdaptative();
    }

    async recalculerCouleurAdaptativeSiNecessaire({ forcer = false, raison = "" } = {}) {
        const parametres = this.etatApplication.contours?.parametres;

        if (!parametres || !this.choisirCouleurContourAdaptativeUC) {
            return null;
        }

        const autoActif = Boolean(parametres.couleurAutomatiqueActive);
        const couleurManuelleChoisie = Boolean(parametres.couleurManuelleChoisie);

        if (!forcer && !autoActif && couleurManuelleChoisie) {
            return null;
        }

        const signatureCourante = this.obtenirSignatureCouleurAdaptative();
        const signatureIdentique = parametres.signatureCouleurAutomatique === signatureCourante;

        if (!forcer && autoActif && parametres.couleurAutomatiqueCalculee && signatureIdentique) {
            return null;
        }

        if (this.promesseCouleurAdaptative) {
            return this.promesseCouleurAdaptative;
        }

        this.promesseCouleurAdaptative = this.choisirCouleurContourAdaptativeUC
            .executer({ activerSilhouette: false, raison })
            .then((resultat) => {
                const parametresActuels = this.etatApplication.contours?.parametres;
                if (parametresActuels) {
                    parametresActuels.signatureCouleurAutomatique = this.obtenirSignatureCouleurAdaptative();
                }
                this.mettreAJourBoutonCouleurAdaptative();
                return resultat;
            })
            .finally(() => {
                this.promesseCouleurAdaptative = null;
            });

        return this.promesseCouleurAdaptative;
    }

    obtenirSignatureCouleurAdaptative() {
        const scene = this.etatApplication.scenes?.scene3D;
        const camera = this.etatApplication.camera?.cameraBabylon;
        const clearColor = scene?.clearColor;
        const cible = camera?.target;

        const arrondir = (valeur) => {
            const nombre = Number(valeur);
            return Number.isFinite(nombre) ? Math.round(nombre * 1000) / 1000 : null;
        };

        return JSON.stringify({
            modele: this.etatApplication.modele3d?.modeleActuel?.id
                ?? this.etatApplication.modele3d?.modeleSelectionne?.id
                ?? null,
            texture: this.etatApplication.apparence?.parametres?.textureActive ?? null,
            tailleMotif: this.etatApplication.apparence?.parametres?.textureMotifTaille ?? null,
            fondScene: this.etatApplication.apparence?.parametres?.fondScene ?? null,
            clearColor: clearColor
                ? [arrondir(clearColor.r), arrondir(clearColor.g), arrondir(clearColor.b), arrondir(clearColor.a)]
                : null,
            camera: camera
                ? {
                    alpha: arrondir(camera.alpha),
                    beta: arrondir(camera.beta),
                    rayon: arrondir(camera.radius),
                    cible: cible
                        ? [arrondir(cible.x), arrondir(cible.y), arrondir(cible.z)]
                        : null
                }
                : null
        });
    }

    brancherParametresMiseLumiere({
        sliderFrequence = null,
        sliderLuminance = null,
        sliderLargeur = null
    } = {}) {
        const parametres = this.garantirParametresMiseLumiere();
        const configuration = constantesContours.miseLumiereGradients.animation;

        this.brancherSliderNumerique({
            slider: sliderFrequence,
            min: configuration.intervalleSecondes.min,
            max: configuration.intervalleSecondes.max,
            step: configuration.intervalleSecondes.step,
            valeurInitiale: parametres.intervalleClignotement,
            normaliser: (valeur) => this.bornerNombre(
                valeur,
                configuration.intervalleSecondes.min,
                configuration.intervalleSecondes.max,
                configuration.intervalleSecondes.defaut
            ),
            appliquer: (valeur) => {
                parametres.intervalleClignotement = valeur;
            }
        });

        this.brancherSliderNumerique({
            slider: sliderLuminance,
            min: configuration.luminancePourcentage.min,
            max: configuration.luminancePourcentage.max,
            step: configuration.luminancePourcentage.step,
            valeurInitiale: parametres.luminanceSliderValeur ?? configuration.luminancePourcentage.defaut,
            normaliser: (valeur) => Math.round(this.bornerNombre(
                valeur,
                configuration.luminancePourcentage.min,
                configuration.luminancePourcentage.max,
                configuration.luminancePourcentage.defaut
            )),
            appliquer: (valeur) => {
                parametres.luminanceSliderValeur = valeur;
                parametres.luminanceDelta = this.convertirSliderLuminanceEnDelta(
                    valeur,
                    configuration.luminancePourcentage
                );
            }
        });

        this.brancherSliderNumerique({
            slider: sliderLargeur,
            min: configuration.largeur.min,
            max: configuration.largeur.max,
            step: configuration.largeur.step,
            valeurInitiale: parametres.largeur,
            normaliser: (valeur) => Math.round(this.bornerNombre(
                valeur,
                configuration.largeur.min,
                configuration.largeur.max,
                configuration.largeur.defaut
            )),
            appliquer: (valeur) => {
                parametres.largeur = valeur;
            }
        });
    }

    brancherSliderNumerique({ slider, min, max, step, valeurInitiale, normaliser, appliquer }) {
        if (!slider) return;

        slider.minimum = min;
        slider.maximum = max;
        slider.step = step;
        slider.value = normaliser(valeurInitiale);

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            appliquer(normaliser(Number(valeur)));
        });
    }

    garantirParametresMiseLumiere() {
        const animation = constantesContours.miseLumiereGradients.animation;

        this.etatApplication.contours.parametresMiseLumiere = this.etatApplication.contours.parametresMiseLumiere || {
            intervalleClignotement: animation.intervalleSecondes.defaut,
            luminanceSliderValeur: animation.luminancePourcentage.defaut,
            luminanceDelta: animation.luminancePourcentage.deltaDefaut,
            largeur: animation.largeur.defaut
        };

        if (!Number.isFinite(Number(this.etatApplication.contours.parametresMiseLumiere.luminanceDelta))) {
            this.etatApplication.contours.parametresMiseLumiere.luminanceDelta = animation.luminancePourcentage.deltaDefaut;
        }

        if (!Number.isFinite(Number(this.etatApplication.contours.parametresMiseLumiere.luminanceSliderValeur))) {
            this.etatApplication.contours.parametresMiseLumiere.luminanceSliderValeur = animation.luminancePourcentage.defaut;
        }

        return this.etatApplication.contours.parametresMiseLumiere;
    }

    convertirSliderLuminanceEnDelta(valeurSlider, configurationLuminance) {
        const minSlider = Number(configurationLuminance?.min ?? 0);
        const maxSlider = Number(configurationLuminance?.max ?? 100);
        const minDelta = Number(configurationLuminance?.deltaMin ?? 0.04);
        const maxDelta = Number(configurationLuminance?.deltaMax ?? 0.16);
        const defautDelta = Number(configurationLuminance?.deltaDefaut ?? 0.10);

        const valeur = this.bornerNombre(
            valeurSlider,
            minSlider,
            maxSlider,
            Number(configurationLuminance?.defaut ?? 50)
        );

        if (maxSlider <= minSlider || !Number.isFinite(minDelta) || !Number.isFinite(maxDelta)) {
            return defautDelta;
        }

        const ratio = (valeur - minSlider) / (maxSlider - minSlider);
        return minDelta + ratio * (maxDelta - minDelta);
    }

    bornerNombre(valeur, min, max, defaut) {
        const nombre = Number(valeur);
        if (!Number.isFinite(nombre)) return defaut;
        return Math.min(max, Math.max(min, nombre));
    }

    brancherReinitialisation(bouton) {
        if (!bouton) return;

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            const parametres = this.reinitialiserContoursUC.executer();

            this.mettreAJourSliderEpaisseur(parametres.epaisseur ?? 1);
            this.appliquerContours();
            this.mettreAJourBoutonsTypes();
            this.mettreAJourBoutonsCouleurs(null);
            this.mettreAJourBoutonCouleurAdaptative(null);
        });    }

    mettreAJourBoutonsTypes() {
        const parametres = this.etatApplication.contours.parametres;

        this.boutonsType.forEach(({ bouton }, typeContour) => {
            const actif = this.estContourActif(parametres, typeContour);
            this.appliquerStyleBoutonOption({ bouton, actif });
        });
    }

    couleurActiveFaibleSelonTheme() {
        return this.couleurFondOptionActive();
    }

    obtenirThemeActif() {
        const themeActif = this.etatApplication.interface?.parametres?.theme;
        return obtenirThemeInterface(themeActif);
    }

    couleurFondOptionInactive() {
        const themeActif = this.etatApplication.interface?.parametres?.theme;
        const theme = this.obtenirThemeActif();

        if (themeActif === "noir") {
            return "#000000FF";
        }

        if (themeActif === "gris-fonce") {
            return "#3A3A3AFF";
        }

        return theme?.boutonFond || "#FFFFFFFF";
    }

    couleurFondOptionActive() {
        const themeActif = this.etatApplication.interface?.parametres?.theme;

        if (themeActif === "noir" || themeActif === "gris-fonce") {
            // Sur panneau foncé, l'option choisie passe en clair.
            // Le texte est ensuite forcé en foncé par contraste.
            return "#FFFFFFFF";
        }

        return "#3A3A3AFF";
    }

    appliquerStyleBoutonOption({ bouton, actif }) {
        if (!bouton) return;

        const fond = actif ? this.couleurFondOptionActive() : this.couleurFondOptionInactive();
        const theme = this.obtenirThemeActif();

        bouton.metadata = bouton.metadata || {};
        bouton.metadata.estOptionActive = Boolean(actif);

        bouton.background = fond;
        bouton.color = theme?.boutonBordure || bouton.metadata?.colorOriginal || "#000000FF";
        bouton.thickness = actif
            ? Math.max(Number(bouton.metadata?.thicknessOriginal ?? 1), 2)
            : bouton.metadata?.thicknessOriginal;

        this.appliquerCouleurTexteBouton(bouton, this.couleurTexteLisible(fond));
    }

    appliquerCouleurTexteBouton(bouton, couleurTexte) {
        if (bouton?.textBlock) {
            bouton.textBlock.color = couleurTexte;
            bouton.textBlock._markAsDirty?.();
        }

        if (Array.isArray(bouton?.children)) {
            bouton.children.forEach((enfant) => {
                if (enfant instanceof BABYLON.GUI.TextBlock) {
                    enfant.color = couleurTexte;
                    enfant._markAsDirty?.();
                }
            });
        }
    }

    mettreAJourBoutonsCouleurs(boutonActif) {
        Object.values(this.etatApplication.gui.controles).forEach((controle) => {
            if (!controle?.metadata?.estBoutonCouleurContour) return;

            controle.background = controle.metadata.backgroundOriginal;
            controle.color = controle.metadata.colorOriginal;
            controle.thickness = controle === boutonActif
                ? 3
                : controle.metadata.thicknessOriginal;
        });
    }

    mettreAJourBoutonsMiseLumiere() {
        if (!this.boutonsMiseLumiere) return;

        this.boutonsMiseLumiere.forEach(({ bouton, lireActif }) => {
            if (!bouton) return;

            const actif = typeof lireActif === "function"
                ? Boolean(lireActif())
                : false;

            this.appliquerStyleBoutonOption({ bouton, actif });
        });
    }

    mettreAJourBoutonCouleurAdaptative() {
        const parametres = this.etatApplication.contours?.parametres;
        const autoActif = Boolean(parametres?.couleurAutomatiqueActive);

        Object.values(this.etatApplication.gui.controles).forEach((controle) => {
            if (!controle?.metadata?.estBoutonCouleurAdaptative) return;

            controle.background = controle.metadata.backgroundOriginal;
            controle.color = controle.metadata.colorOriginal;
            controle.thickness = controle.metadata.thicknessOriginal;

            const coche = controle.metadata.cocheCouleurAdaptative
                ?? this.obtenirTexteCocheCouleurAdaptative(controle);

            controle.metadata.cocheCouleurAdaptative = coche;
            this.mettreAJourCocheCouleurAdaptative(coche, autoActif);
        });
    }

    obtenirTexteCocheCouleurAdaptative(bouton) {
        const controles = this.etatApplication.gui?.controles ?? {};

        return controles.ContoAutoBtnTxt
            ?? controles.ContAutoBtnTxt
            ?? controles.ContCouleurAutoBtnTxt
            ?? bouton?.textBlock
            ?? this.trouverPremierTextBlock(bouton);
    }

    trouverPremierTextBlock(controle) {
        if (!controle) {
            return null;
        }

        if (controle instanceof BABYLON.GUI.TextBlock) {
            return controle;
        }

        if (Array.isArray(controle.children)) {
            for (const enfant of controle.children) {
                const trouve = this.trouverPremierTextBlock(enfant);

                if (trouve) {
                    return trouve;
                }
            }
        }

        return null;
    }

    mettreAJourCocheCouleurAdaptative(textBlock, actif) {
        if (!textBlock) {
            return;
        }

        textBlock.metadata = textBlock.metadata || {};
        textBlock.metadata.texteDynamique = true;
        textBlock.text = actif ? "✓" : "";
        textBlock.color = this.etatApplication.interface?.parametres?.theme === "noir"
            || this.etatApplication.interface?.parametres?.theme === "gris-fonce"
            ? "#FFFFFFFF"
            : "#000000FF";
        textBlock.fontWeight = "700";
        textBlock.fontSize = "30px";
        textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        textBlock._markAsDirty?.();
    }

    mettreAJourInterfaceDepuisEtat() {
        this.mettreAJourBoutonsTypes();
        this.mettreAJourBoutonsMiseLumiere();
        this.mettreAJourBoutonCouleurAdaptative();
        this.mettreAJourSliderEpaisseur(this.etatApplication.contours?.parametres?.epaisseur ?? 1);
    }

    couleurTexteLisible(couleur) {
        const rgb = this.extraireRgbDepuisHex(couleur);

        if (!rgb) {
            return "#000000FF";
        }

        const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
        return luminance > 0.55 ? "#000000FF" : "#FFFFFFFF";
    }

    extraireRgbDepuisHex(couleur) {
        if (typeof couleur !== "string") {
            return null;
        }

        const hex = couleur.trim().replace("#", "");

        if (![6, 8].includes(hex.length)) {
            return null;
        }

        const r = Number.parseInt(hex.slice(0, 2), 16);
        const g = Number.parseInt(hex.slice(2, 4), 16);
        const b = Number.parseInt(hex.slice(4, 6), 16);

        if ([r, g, b].some((valeur) => Number.isNaN(valeur))) {
            return null;
        }

        return { r, g, b };
    }

    estContourActif(parametres, typeContour) {
        if (!parametres?.actif) return false;
        if (typeof parametres.estActif === "function") return parametres.estActif(typeContour);
        if (Array.isArray(parametres.typesActifs)) return parametres.typesActifs.includes(typeContour);
        return parametres.typeActif === typeContour;
    }
    mettreAJourSliderEpaisseurSiContoursDesactives() {
        const parametres = this.etatApplication.contours.parametres;

        if (parametres?.actif) {
            return;
        }

        this.mettreAJourSliderEpaisseur(parametres?.epaisseur ?? 1);
    }

    mettreAJourSliderEpaisseur(epaisseur) {
        const valeur = Math.round(epaisseur);

        if (this.sliderEpaisseur) {
            this.sliderEpaisseur.value = valeur;
        }

        if (this.texteEpaisseur) {
            this.texteEpaisseur.text = String(valeur);
        }
    }

    appliquerContours() {
        this.postTraitContProfNorm.appliquer(this.etatApplication);
        this.postTraitContoursCouleur.appliquer(this.etatApplication);
    }
}
