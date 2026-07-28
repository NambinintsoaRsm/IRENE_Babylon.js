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
        desactiverContoursUC,
        reinitialiserContoursUC,
        postTraitContProfNorm,
        postTraitContoursCouleur,
        postTraitMiseLumiereNormales = null,
        postTraitMiseLumiereCouleurs = null,
        postTraitApparence = null,
        serviceSceneBabylon = null
    }) {
        this.etatApplication = etatApplication;
        this.activerSilhouetteUC = activerSilhouetteUC;
        this.activerReliefUC = activerReliefUC;
        this.activerContourCouleurUC = activerContourCouleurUC;
        this.changerEpaisseurContourUC = changerEpaisseurContourUC;
        this.changerCouleurContourUC = changerCouleurContourUC;
        this.choisirCouleurContourAdaptativeUC = choisirCouleurContourAdaptativeUC;
        this.desactiverContoursUC = desactiverContoursUC;
        this.reinitialiserContoursUC = reinitialiserContoursUC;
        this.postTraitContProfNorm = postTraitContProfNorm;
        this.postTraitContoursCouleur = postTraitContoursCouleur;
        this.postTraitMiseLumiereNormales = postTraitMiseLumiereNormales;
        this.postTraitMiseLumiereCouleurs = postTraitMiseLumiereCouleurs;
        this.postTraitApparence = postTraitApparence;
        this.serviceSceneBabylon = serviceSceneBabylon;
        this.boutonsType = new Map();
        this.boutonsPresets = new Map();
        this.sauvegardeAvantPresetHighlight = null;
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

    /**
     * L'ancienne interface Highlight avec boutons/sliders a été retirée du GUI.
     * Les presets utilisent encore la mise en lumière des normales en interne,
     * mais il n'y a plus de branchement direct sur des contrôles dédiés.
     */

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

        const parametres = this.etatApplication.contours.parametres;
        const valeurInitiale = this.obtenirEpaisseurAfficheeDepuisEtat(parametres);

        const configurationEpaisseur = constantesContours.epaisseurSlider ?? {};
        const epaisseurMin = configurationEpaisseur.min ?? 1;
        const epaisseurMax = configurationEpaisseur.max ?? 2;
        const epaisseurStep = configurationEpaisseur.step ?? 1;

        slider.minimum = epaisseurMin;
        slider.maximum = epaisseurMax;
        slider.step = epaisseurStep;
        slider.value = valeurInitiale;

        // Si aucun contour n'est actif au démarrage, on garde l'accord décidé :
        // l'affichage et l'état interne reviennent à 1, même si une ancienne
        // sauvegarde contient encore 2 ou 3.
        if (!this.desContoursSontActifs(parametres)) {
            parametres?.changerEpaisseur?.(valeurInitiale);
        }

        if (texteValeur) {
            texteValeur.metadata = texteValeur.metadata || {};
            texteValeur.metadata.texteDynamique = true;
            texteValeur.text = String(valeurInitiale);
        }

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            const epaisseur = Math.min(epaisseurMax, Math.max(epaisseurMin, Math.round(valeur)));

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

    garantirParametresMiseLumiere() {
        const animation = constantesContours.miseLumiereGradients.animation;

        this.etatApplication.contours.parametresMiseLumiere = this.etatApplication.contours.parametresMiseLumiere || {
            frequenceClignotement: animation.frequence?.defaut ?? 3,
            intervalleClignotement: animation.intervalleSecondes.defaut,
            luminanceSliderValeur: animation.luminancePourcentage.defaut,
            luminanceDelta: animation.luminancePourcentage.deltaDefaut,
            sensLuminance: animation.sensLuminance?.defaut ?? 1,
            largeur: animation.largeur.defaut,
            presetActif: null
        };

        const parametres = this.etatApplication.contours.parametresMiseLumiere;

        if (!Number.isFinite(Number(parametres.frequenceClignotement))) {
            parametres.frequenceClignotement = this.convertirIntervalleEnFrequence(
                parametres.intervalleClignotement,
                animation
            );
        }

        parametres.intervalleClignotement = this.convertirFrequenceEnIntervalle(
            parametres.frequenceClignotement,
            animation
        );

        if (!Number.isFinite(Number(parametres.luminanceDelta))) {
            parametres.luminanceDelta = animation.luminancePourcentage.deltaDefaut;
        }

        if (!Number.isFinite(Number(parametres.luminanceSliderValeur))) {
            parametres.luminanceSliderValeur = animation.luminancePourcentage.defaut;
        }

        if (!Number.isFinite(Number(parametres.sensLuminance))) {
            parametres.sensLuminance = animation.sensLuminance?.defaut ?? 1;
        }

        if (Number(parametres.luminanceDelta) < 0) {
            parametres.sensLuminance = -1;
        }

        return parametres;
    }

    obtenirFrequenceMiseLumiereDepuisParametres(parametres, configuration) {
        const frequence = Number(parametres?.frequenceClignotement);

        if (Number.isFinite(frequence)) {
            return frequence;
        }

        return this.convertirIntervalleEnFrequence(
            parametres?.intervalleClignotement,
            configuration
        );
    }

    convertirFrequenceEnIntervalle(frequence, configuration) {
        const configFrequence = configuration.frequence ?? configuration.intervalleSecondes;
        const configIntervalle = configuration.intervalleSecondes ?? configFrequence;

        const min = Number(configIntervalle.min ?? configFrequence.min ?? 1);
        const max = Number(configIntervalle.max ?? configFrequence.max ?? 4);
        const defaut = Number(configIntervalle.defaut ?? configFrequence.defaut ?? 3);

        // Ici, la valeur affichée par le slider correspond directement
        // à la durée du clignotement en secondes.
        // Donc 3 dans le preset = 3 secondes envoyées au shader.
        return this.bornerNombre(frequence, min, max, defaut);
    }

    convertirIntervalleEnFrequence(intervalle, configuration) {
        const configFrequence = configuration.frequence ?? configuration.intervalleSecondes;
        const configIntervalle = configuration.intervalleSecondes ?? configFrequence;

        const min = Number(configFrequence.min ?? configIntervalle.min ?? 1);
        const max = Number(configFrequence.max ?? configIntervalle.max ?? 4);
        const defaut = Number(configFrequence.defaut ?? configIntervalle.defaut ?? 3);

        return this.bornerNombre(intervalle, min, max, defaut);
    }

    convertirSliderLuminanceEnDelta(valeurSlider, configurationLuminance, sensLuminance = 1) {
        const minSlider = Number(configurationLuminance?.min ?? 0);
        const maxSlider = Number(configurationLuminance?.max ?? 100);
        const minDelta = Number(configurationLuminance?.deltaMin ?? 0.04);
        const maxDelta = Number(configurationLuminance?.deltaMax ?? 0.16);
        const defautDelta = Number(configurationLuminance?.deltaDefaut ?? 0.10);
        const sens = Number(sensLuminance) < 0 ? -1 : 1;

        const valeur = this.bornerNombre(
            valeurSlider,
            minSlider,
            maxSlider,
            Number(configurationLuminance?.defaut ?? 50)
        );

        if (maxSlider <= minSlider || !Number.isFinite(minDelta) || !Number.isFinite(maxDelta)) {
            return defautDelta * sens;
        }

        const ratio = (valeur - minSlider) / (maxSlider - minSlider);
        return (minDelta + ratio * (maxDelta - minDelta)) * sens;
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
            this.reinitialiserParametresMiseLumiere();
            this.supprimerMiseLumiereActive();
            this.mettreAJourBoutonsPresets();
            this.mettreAJourBoutonsCouleurs(null);
            this.mettreAJourBoutonCouleurAdaptative(null);
        });    }



    brancherPresetsDepuisNomsGUI({
        sombreBtns = [],
        clairBtns = [],
        reinitialiserBtns = []
    } = {}) {
        const controles = this.etatApplication.gui?.controles ?? {};

        this.brancherBoutonsPreset("sombre", this.obtenirControles(controles, sombreBtns));
        this.brancherBoutonsPreset("clair", this.obtenirControles(controles, clairBtns));

        this.obtenirControles(controles, reinitialiserBtns).forEach((bouton) => {
            bouton.onPointerClickObservable?.clear?.();
            bouton.onPointerClickObservable?.add?.(() => this.reinitialiserReglagesContoursHighlight());
        });

        this.mettreAJourBoutonsPresets();
    }

    brancherBoutonsPreset(nomPreset, boutons = []) {
        boutons.forEach((bouton) => {
            if (!bouton) return;

            bouton.metadata = bouton.metadata || {};
            bouton.metadata.estBoutonPresetHighlight = true;
            bouton.metadata.presetContours = nomPreset;
            bouton.metadata.backgroundOriginal = bouton.metadata.backgroundOriginal ?? bouton.background;
            bouton.metadata.thicknessOriginal = bouton.metadata.thicknessOriginal ?? bouton.thickness;
            bouton.metadata.colorOriginal = bouton.metadata.colorOriginal ?? bouton.color;

            this.boutonsPresets.set(bouton.name || `${nomPreset}-${this.boutonsPresets.size}`, {
                bouton,
                preset: nomPreset
            });

            bouton.onPointerClickObservable?.clear?.();
            bouton.onPointerClickObservable?.add?.(() => this.basculerPresetContours(nomPreset));
        });
    }

    obtenirControles(controles, noms = []) {
        const liste = Array.isArray(noms) ? noms : [noms];
        const controlesTrouves = [];
        const dejaAjoutes = new Set();

        for (const nom of liste) {
            const controle = nom ? controles[nom] : null;

            if (!controle || dejaAjoutes.has(controle)) {
                continue;
            }

            controlesTrouves.push(controle);
            dejaAjoutes.add(controle);
        }

        return controlesTrouves;
    }

    obtenirPremierControle(controles, noms = []) {
        return this.obtenirControles(controles, noms)[0] ?? null;
    }

    basculerPresetContours(nomPreset) {
        const dejaActif = this.estPresetContoursActif(nomPreset);

        if (dejaActif) {
            return this.desactiverPresetContours({ reinitialiserScene: false });
        }

        return this.appliquerPresetContours(nomPreset);
    }

    estPresetContoursActif(nomPreset) {
        const parametresMiseLumiere = this.etatApplication.contours?.parametresMiseLumiere;
        const miseLumiereActive = Boolean(this.etatApplication.contours?.miseLumiereNormalesActif)
            || Boolean(this.etatApplication.contours?.miseLumiereCouleursActif);

        return miseLumiereActive && parametresMiseLumiere?.presetActif === nomPreset;
    }

    desactiverPresetContours({ reinitialiserScene = false } = {}) {
        const restaurationEffectuee = this.restaurerSauvegardeAvantPresetHighlight();
        const parametresMiseLumiere = this.garantirParametresMiseLumiere();
        parametresMiseLumiere.presetActif = null;

        if (!restaurationEffectuee) {
            this.supprimerMiseLumiereActive();

            if (reinitialiserScene) {
                this.appliquerApparencePreset({
                    fondScene: 0,
                    luminositeScene: 0
                });
            }
        }

        this.mettreAJourInterfaceApparencePreset();
        this.mettreAJourBoutonsPresets();
        this.etatApplication.gui?.advancedTexture?.markAsDirty?.();

        return {
            preset: null,
            miseLumiereActive: Boolean(this.etatApplication.contours?.miseLumiereNormalesActif)
                || Boolean(this.etatApplication.contours?.miseLumiereCouleursActif),
            miseLumiere: { ...parametresMiseLumiere },
            apparence: this.etatApplication.apparence?.parametres ?? null
        };
    }

    appliquerPresetContours(nomPreset) {
        const preset = constantesContours.presetsContours?.[nomPreset];

        if (!preset) {
            console.warn(`[Contours] Preset inconnu : ${nomPreset}`);
            return null;
        }

        const parametresContours = this.etatApplication.contours?.parametres;
        const parametresMiseLumiere = this.garantirParametresMiseLumiere();

        // On mémorise la configuration utilisateur uniquement quand on part
        // d'un état sans preset. Si on passe directement de sombre à clair
        // ou de clair à sombre, on garde la même sauvegarde de base.
        if (!parametresMiseLumiere.presetActif
            && !this.etatApplication.contours?.sauvegardeAvantPresetHighlight) {
            this.memoriserSauvegardeAvantPresetHighlight();
        }

        const animation = constantesContours.miseLumiereGradients.animation;
        const configLum = animation.luminancePourcentage;
        const configLargeur = animation.largeur;

        // Les presets highlight ne doivent pas activer le contour Relief/normal
        // par défaut. Si l'utilisateur l'avait déjà activé, on garde son choix ;
        // sinon on applique uniquement le highlight.
        if (preset.contourReliefActif === true && parametresContours && !this.estContourActif(parametresContours, TypeContour.RELIEF)) {
            this.activerReliefUC?.executer?.();
        }

        if (preset.highlightNormalesActif) {
            this.etatApplication.contours.miseLumiereNormalesActif = true;
            this.etatApplication.contours.miseLumiereCouleursActif = false;
            this.postTraitMiseLumiereCouleurs?.supprimer?.(this.etatApplication);
        }

        const frequence = Number.isFinite(Number(preset.frequence))
            ? Number(preset.frequence)
            : animation.frequence?.defaut ?? 3;

        const largeur = preset.largeur === "max"
            ? Number(configLargeur.max ?? 10)
            : this.bornerNombre(preset.largeur, configLargeur.min ?? 1, configLargeur.max ?? 10, configLargeur.defaut ?? 6);

        const luminanceSliderValeur = preset.luminance === "max"
            ? Number(configLum.max ?? 8)
            : this.bornerNombre(preset.luminance, configLum.min ?? 1, configLum.max ?? 8, configLum.defaut ?? 1);

        const sensLuminance = Number(preset.sensLuminance) < 0 ? -1 : 1;

        parametresMiseLumiere.frequenceClignotement = frequence;
        parametresMiseLumiere.intervalleClignotement = this.convertirFrequenceEnIntervalle(frequence, animation);
        parametresMiseLumiere.luminanceSliderValeur = luminanceSliderValeur;
        parametresMiseLumiere.sensLuminance = sensLuminance;
        parametresMiseLumiere.luminanceDelta = this.convertirSliderLuminanceEnDelta(
            luminanceSliderValeur,
            configLum,
            sensLuminance
        );
        parametresMiseLumiere.largeur = largeur;
        parametresMiseLumiere.presetActif = preset.nom ?? nomPreset;

        this.appliquerApparencePreset({
            fondScene: preset.fondScene,
            luminositeScene: preset.luminositeScene
        });

        this.appliquerContours();

        if (this.etatApplication.contours.miseLumiereNormalesActif) {
            this.postTraitMiseLumiereNormales?.appliquer?.(this.etatApplication);
        }

        this.mettreAJourSliderEpaisseur(this.obtenirEpaisseurAfficheeDepuisEtat(parametresContours));
        this.mettreAJourInterfaceApparencePreset();
        this.mettreAJourBoutonsTypes();
        this.mettreAJourBoutonsPresets();
        this.mettreAJourBoutonCouleurAdaptative();
        this.etatApplication.gui?.advancedTexture?.markAsDirty?.();

        return {
            preset: preset.nom ?? nomPreset,
            miseLumiere: { ...parametresMiseLumiere },
            apparence: this.etatApplication.apparence?.parametres ?? null
        };
    }

    appliquerApparencePreset({ fondScene, luminositeScene }) {
        const apparence = this.etatApplication.apparence?.parametres;

        if (!apparence?.copierAvec) {
            return;
        }

        const nouveauxParametres = apparence.copierAvec({
            fondScene: Number.isFinite(Number(fondScene)) ? Number(fondScene) : apparence.fondScene,
            luminosite: Number.isFinite(Number(luminositeScene)) ? Number(luminositeScene) : apparence.luminosite
        });

        this.etatApplication.apparence.parametres = nouveauxParametres;

        this.serviceSceneBabylon?.appliquerFondSceneDepuisPourcentage?.(
            this.etatApplication.scenes?.scene3D,
            nouveauxParametres.fondScene ?? 0
        );

        this.postTraitApparence?.appliquer?.(this.etatApplication);
    }

    reinitialiserReglagesContoursHighlight({ reinitialiserScene = true } = {}) {
        if (this.etatApplication.contours?.sauvegardeAvantPresetHighlight) {
            return this.desactiverPresetContours({ reinitialiserScene: false });
        }

        const parametres = this.reinitialiserContoursUC?.executer?.() ?? this.etatApplication.contours?.parametres;

        this.reinitialiserParametresMiseLumiere();
        this.supprimerMiseLumiereActive();

        if (reinitialiserScene) {
            this.appliquerApparencePreset({
                fondScene: 0,
                luminositeScene: 0
            });
        }

        this.appliquerContours();
        this.mettreAJourSliderEpaisseurSiContoursDesactives();
        this.mettreAJourSliderEpaisseur(this.obtenirEpaisseurAfficheeDepuisEtat(this.etatApplication.contours?.parametres ?? parametres));
        this.mettreAJourInterfaceApparencePreset();
        this.mettreAJourBoutonsTypes();
        this.mettreAJourBoutonsPresets();
        this.mettreAJourBoutonsCouleurs(null);
        this.mettreAJourBoutonCouleurAdaptative();
        this.etatApplication.gui?.advancedTexture?.markAsDirty?.();

        return {
            contours: this.etatApplication.contours?.parametres ?? null,
            miseLumiere: this.etatApplication.contours?.parametresMiseLumiere ?? null,
            apparence: this.etatApplication.apparence?.parametres ?? null
        };
    }

    memoriserSauvegardeAvantPresetHighlight() {
        if (!this.etatApplication.contours) return null;

        const scene = this.etatApplication.scenes?.scene3D;
        const apparence = this.etatApplication.apparence?.parametres;
        const parametresMiseLumiere = this.garantirParametresMiseLumiere();

        const sauvegarde = {
            apparence: apparence ? { ...apparence } : null,
            miseLumiereNormalesActif: Boolean(this.etatApplication.contours.miseLumiereNormalesActif),
            miseLumiereCouleursActif: Boolean(this.etatApplication.contours.miseLumiereCouleursActif),
            parametresMiseLumiere: { ...parametresMiseLumiere },
            fondScene: scene?.clearColor
                ? {
                    r: scene.clearColor.r,
                    g: scene.clearColor.g,
                    b: scene.clearColor.b,
                    a: scene.clearColor.a
                }
                : null
        };

        this.etatApplication.contours.sauvegardeAvantPresetHighlight = sauvegarde;
        this.sauvegardeAvantPresetHighlight = sauvegarde;
        return sauvegarde;
    }

    restaurerSauvegardeAvantPresetHighlight() {
        const sauvegarde = this.etatApplication.contours?.sauvegardeAvantPresetHighlight
            ?? this.sauvegardeAvantPresetHighlight;

        if (!sauvegarde) {
            return false;
        }

        const contours = this.etatApplication.contours;
        const parametresMiseLumiere = this.garantirParametresMiseLumiere();

        Object.assign(parametresMiseLumiere, sauvegarde.parametresMiseLumiere ?? {});
        parametresMiseLumiere.presetActif = null;

        contours.miseLumiereNormalesActif = Boolean(sauvegarde.miseLumiereNormalesActif);
        contours.miseLumiereCouleursActif = Boolean(sauvegarde.miseLumiereCouleursActif);

        if (sauvegarde.apparence && this.etatApplication.apparence?.parametres?.copierAvec) {
            this.etatApplication.apparence.parametres = this.etatApplication.apparence.parametres.copierAvec(sauvegarde.apparence);
        }

        const scene = this.etatApplication.scenes?.scene3D;
        if (scene && sauvegarde.fondScene && globalThis.BABYLON?.Color4) {
            scene.clearColor = new BABYLON.Color4(
                sauvegarde.fondScene.r,
                sauvegarde.fondScene.g,
                sauvegarde.fondScene.b,
                sauvegarde.fondScene.a ?? 1
            );
        }

        this.postTraitApparence?.appliquer?.(this.etatApplication);

        if (contours.miseLumiereNormalesActif) {
            this.postTraitMiseLumiereNormales?.appliquer?.(this.etatApplication);
        } else {
            this.postTraitMiseLumiereNormales?.supprimer?.(this.etatApplication);
        }

        if (contours.miseLumiereCouleursActif) {
            this.postTraitMiseLumiereCouleurs?.appliquer?.(this.etatApplication);
        } else {
            this.postTraitMiseLumiereCouleurs?.supprimer?.(this.etatApplication);
        }

        contours.sauvegardeAvantPresetHighlight = null;
        this.sauvegardeAvantPresetHighlight = null;
        return true;
    }

    reinitialiserParametresMiseLumiere() {
        const animation = constantesContours.miseLumiereGradients.animation;
        const parametres = this.garantirParametresMiseLumiere();

        parametres.frequenceClignotement = animation.frequence?.defaut ?? 3;
        parametres.intervalleClignotement = this.convertirFrequenceEnIntervalle(
            parametres.frequenceClignotement,
            animation
        );
        parametres.luminanceSliderValeur = animation.luminancePourcentage.defaut;
        parametres.sensLuminance = animation.sensLuminance?.defaut ?? 1;
        parametres.luminanceDelta = this.convertirSliderLuminanceEnDelta(
            parametres.luminanceSliderValeur,
            animation.luminancePourcentage,
            parametres.sensLuminance
        );
        parametres.largeur = animation.largeur.defaut;
        parametres.presetActif = null;

        return parametres;
    }

    supprimerMiseLumiereActive() {
        if (!this.etatApplication.contours) return;

        this.etatApplication.contours.miseLumiereNormalesActif = false;
        this.etatApplication.contours.miseLumiereCouleursActif = false;
        this.postTraitMiseLumiereNormales?.supprimer?.(this.etatApplication);
        this.postTraitMiseLumiereCouleurs?.supprimer?.(this.etatApplication);
    }

    mettreAJourInterfaceApparencePreset() {
        const c = this.etatApplication.gui?.controles ?? {};
        const apparence = this.etatApplication.apparence?.parametres;

        if (!apparence) return;

        this.reglerSliderGui(c.LuminositeSlider, apparence.luminosite);
        this.reglerSliderGui(c.ThmSlider, apparence.fondScene ?? 0);
        this.reglerTextePourcentageGui(c.RegLumValTxt, apparence.luminosite, true);

        const resultatFond = this.serviceSceneBabylon?.appliquerFondSceneDepuisPourcentage?.(
            this.etatApplication.scenes?.scene3D,
            apparence.fondScene ?? 0
        );

        if (c.RegThmValTxt && resultatFond?.libelle) {
            c.RegThmValTxt.metadata = c.RegThmValTxt.metadata || {};
            c.RegThmValTxt.metadata.texteDynamique = true;
            c.RegThmValTxt.text = resultatFond.libelle;
            c.RegThmValTxt._markAsDirty?.();
        }
    }

    reglerSliderGui(slider, valeur) {
        if (!slider || !Number.isFinite(Number(valeur))) return;
        slider.value = Number(valeur);
        slider._markAsDirty?.();
    }

    reglerTextePourcentageGui(textBlock, valeur, afficherSigne = false) {
        if (!textBlock || !Number.isFinite(Number(valeur))) return;
        const pourcentage = Math.round(Number(valeur) * 100);
        textBlock.metadata = textBlock.metadata || {};
        textBlock.metadata.texteDynamique = true;
        textBlock.text = afficherSigne && pourcentage > 0 ? `+${pourcentage}%` : `${pourcentage}%`;
        textBlock._markAsDirty?.();
    }

    proposerPresetSelonAccessibilite({ appliquer = false } = {}) {
        const themeInterface = this.etatApplication.interface?.parametres?.theme;
        const preset = themeInterface === "noir" || themeInterface === "gris-fonce"
            ? "sombre"
            : "clair";

        if (appliquer) {
            return this.appliquerPresetContours(preset);
        }

        return preset;
    }

    mettreAJourBoutonsPresets() {
        if (!this.boutonsPresets || this.boutonsPresets.size === 0) {
            return;
        }

        this.boutonsPresets.forEach(({ bouton, preset }) => {
            const actif = this.estPresetContoursActif(preset);
            this.mettreAJourCocheBouton(bouton, actif);
        });
    }

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

    mettreAJourBoutonCouleurAdaptative(couleur = null) {
        const parametres = this.etatApplication.contours?.parametres;
        const autoActif = Boolean(parametres?.couleurAutomatiqueActive);

        Object.values(this.etatApplication.gui.controles).forEach((controle) => {
            if (!controle?.metadata?.estBoutonCouleurAdaptative) return;

            // Même mécanisme visuel que le bouton Gras : une coche dans le
            // TextBlock interne, sans remplacer le fond par la couleur calculée.
            this.mettreAJourCocheBoutonAutomatique(controle, autoActif);
        });
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

        if (this.desContoursSontActifs(parametres)) {
            return;
        }

        const valeurDefaut = constantesContours.epaisseurSlider?.defaut ?? constantesContours.epaisseurDefaut ?? 1;
        parametres?.changerEpaisseur?.(valeurDefaut);
        this.mettreAJourSliderEpaisseur(valeurDefaut);
    }

    mettreAJourSliderEpaisseur(epaisseur) {
        const valeur = Math.min(
            constantesContours.epaisseurSlider?.max ?? 3,
            Math.max(
                constantesContours.epaisseurSlider?.min ?? 1,
                Math.round(Number(epaisseur) || constantesContours.epaisseurSlider?.defaut || 1)
            )
        );

        if (this.sliderEpaisseur) {
            this.sliderEpaisseur.value = valeur;
            this.sliderEpaisseur._markAsDirty?.();
        }

        if (this.texteEpaisseur) {
            this.texteEpaisseur.text = String(valeur);
            this.texteEpaisseur._markAsDirty?.();
        }
    }

    mettreAJourInterfaceDepuisEtat() {
        const parametres = this.etatApplication.contours?.parametres;

        if (!parametres) {
            return;
        }

        this.mettreAJourSliderEpaisseur(this.obtenirEpaisseurAfficheeDepuisEtat(parametres));
        this.mettreAJourBoutonsTypes();
        this.mettreAJourBoutonCouleurAdaptative();
    }

    obtenirEpaisseurAfficheeDepuisEtat(parametres) {
        const configuration = constantesContours.epaisseurSlider ?? {};
        const defaut = configuration.defaut ?? constantesContours.epaisseurDefaut ?? 1;

        if (!this.desContoursSontActifs(parametres)) {
            return defaut;
        }

        return Math.min(
            configuration.max ?? 3,
            Math.max(
                configuration.min ?? 1,
                Math.round(Number(parametres?.epaisseur) || defaut)
            )
        );
    }

    desContoursSontActifs(parametres) {
        return Boolean(parametres?.actif)
            && (
                (Array.isArray(parametres?.typesActifs) && parametres.typesActifs.length > 0)
                || Boolean(parametres?.typeActif)
            );
    }

    obtenirTextBlockBouton(bouton, nomPrioritaire = null) {
        if (!bouton) return null;

        if (nomPrioritaire && this.etatApplication.gui?.controles?.[nomPrioritaire]) {
            return this.etatApplication.gui.controles[nomPrioritaire];
        }

        if (bouton.textBlock) {
            return bouton.textBlock;
        }

        if (Array.isArray(bouton.children)) {
            return bouton.children.find((enfant) => enfant instanceof BABYLON.GUI.TextBlock) ?? null;
        }

        return null;
    }

    mettreAJourCocheBoutonAutomatique(bouton, actif) {
        this.mettreAJourCocheBouton(bouton, actif, "ContoAutoBtnTxt");
    }

    mettreAJourCocheBouton(bouton, actif, nomTextBlock = null) {
        if (!bouton) return;

        const fond = actif
            ? this.couleurFondCheckboxActive()
            : this.couleurFondCheckboxInactive();
        const couleurTexte = this.couleurTexteLisible(fond);
        const theme = this.obtenirThemeActif();

        bouton.metadata = {
            ...(bouton.metadata ?? {}),
            checkboxActif: Boolean(actif),
            estOptionActive: Boolean(actif)
        };
        bouton.background = fond;
        bouton.color = actif
            ? fond
            : (theme?.boutonBordure || bouton.metadata?.colorOriginal || "#000000FF");
        bouton.thickness = actif
            ? Math.max(Number(bouton.metadata?.thicknessOriginal ?? bouton.thickness ?? 1), 2)
            : Math.max(Number(bouton.metadata?.thicknessOriginal ?? bouton.thickness ?? 1), 1);
        bouton._markAsDirty?.();

        const coche = this.obtenirTextBlockBouton(bouton, nomTextBlock);
        if (!coche) return;

        coche.metadata = {
            ...(coche.metadata ?? {}),
            texteDynamique: true,
            nePasAutoFit: true,
            fontSizeOriginal: "30px"
        };

        coche.text = actif ? "✓" : "";
        coche.color = couleurTexte;
        coche.fontWeight = "700";
        coche.fontSize = "30px";
        coche.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        coche.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        coche._markAsDirty?.();
    }

    couleurFondCheckboxInactive() {
        const themeActif = String(this.etatApplication.interface?.parametres?.theme ?? "").toLowerCase();
        const theme = this.obtenirThemeActif();

        if (themeActif === "noir") {
            return "#000000FF";
        }

        if (themeActif === "gris-fonce" || themeActif.includes("fonce")) {
            return "#1A1A1AFF";
        }

        return theme?.boutonFond || "#FFFFFFFF";
    }

    couleurFondCheckboxActive() {
        const themeActif = String(this.etatApplication.interface?.parametres?.theme ?? "").toLowerCase();

        if (themeActif === "noir" || themeActif === "gris-fonce" || themeActif.includes("fonce")) {
            return "#FFFFFFFF";
        }

        return "#111111FF";
    }

    couleurCocheSelonTheme() {
        return this.couleurTexteLisible(this.couleurFondCheckboxActive());
    }

    appliquerContours() {
        this.postTraitContProfNorm.appliquer(this.etatApplication);
        this.postTraitContoursCouleur.appliquer(this.etatApplication);
    }
}
