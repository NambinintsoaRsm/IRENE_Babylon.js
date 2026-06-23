import { constantesApparence } from "../../Configuration/constantesApparence.js";
/**
 * Branche les réglages d'apparence :
 * - contraste ;
 * - luminosité ;
 * - saturation ;
 * - netteté ;
 * - thème de fond de scène ;
 * - texture procédurale.
 */
export class ControleurApparence {
    constructor({
        etatApplication,
        changerContrasteUC,
        changerLuminositeUC,
        changerSaturationUC,
        changerNetteteUC,
        changerTextureUC,
        changerTailleMotifTextureUC = null,
        reinitialiserApparenceUC,
        postTraitApparence,
        postTraitNettete,
        serviceMateriauxBabylon = null,
        serviceSceneBabylon = null
    }) {
        this.etatApplication = etatApplication;

        this.changerContrasteUC = changerContrasteUC;
        this.changerLuminositeUC = changerLuminositeUC;
        this.changerSaturationUC = changerSaturationUC;
        this.changerNetteteUC = changerNetteteUC;
        this.changerTextureUC = changerTextureUC;
        this.changerTailleMotifTextureUC = changerTailleMotifTextureUC;
        this.reinitialiserApparenceUC = reinitialiserApparenceUC;

        this.postTraitApparence = postTraitApparence;
        this.postTraitNettete = postTraitNettete;
        this.serviceMateriauxBabylon = serviceMateriauxBabylon;
        this.serviceSceneBabylon = serviceSceneBabylon;
    }

    brancherSliderContraste(slider) {
        this.brancherSliderApparence(slider, (valeur) => {
            this.changerContrasteUC.executer(valeur);
            this.postTraitApparence.appliquer(this.etatApplication);
        });
    }

    brancherSliderLuminosite(slider) {
        this.brancherSliderApparence(slider, (valeur) => {
            this.changerLuminositeUC.executer(valeur);
            this.postTraitApparence.appliquer(this.etatApplication);
        });
    }

    brancherSliderSaturation(slider) {
        this.brancherSliderApparence(slider, (valeur) => {
            this.changerSaturationUC.executer(valeur);
            this.postTraitApparence.appliquer(this.etatApplication);
        });
    }

    brancherSliderNettete(slider) {
        this.brancherSliderApparence(slider, (valeur) => {
            this.changerNetteteUC.executer(valeur);
            this.postTraitNettete.appliquer(this.etatApplication);
        });
    }

    brancherSliderThemeScene({ slider, texteValeur }) {
        if (!slider || !this.serviceSceneBabylon) {
            return;
        }

        slider.minimum = 0;
        slider.maximum = 100;
        slider.step = 1;
        slider.value = 0;

        this.appliquerFondScene(0, texteValeur);

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            this.appliquerFondScene(valeur, texteValeur);
        });
    }

    appliquerFondScene(valeur, texteValeur) {
        const resultat = this.serviceSceneBabylon.appliquerFondSceneDepuisPourcentage(
            this.etatApplication.scenes.scene3D,
            valeur
        );

        if (texteValeur && resultat) {
            texteValeur.metadata = texteValeur.metadata || {};
            texteValeur.metadata.texteDynamique = true;
            texteValeur.text = resultat.libelle;
            texteValeur._markAsDirty?.();
        }
    }

    brancherTexture({ bouton, typeTexture }) {
        if (!bouton) {
            throw new Error(`Bouton texture introuvable : ${typeTexture}`);
        }

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            const parametres = this.changerTextureUC.executer(typeTexture);
            this.appliquerTextureActive(parametres.textureActive, parametres.textureMotifTaille);
        });
    }

    brancherTailleMotifTexture({ slider, texteValeur }) {
        if (!slider || !this.changerTailleMotifTextureUC) {
            return;
        }

        const config = constantesApparence.textureMotif.slider;

        slider.minimum = config.min;
        slider.maximum = config.max;
        slider.step = config.step;
        slider.value = config.defaut;

        this.mettreAJourTexteTailleMotif(texteValeur, config.defaut);

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            const parametres = this.changerTailleMotifTextureUC.executer(valeur);
            this.mettreAJourTexteTailleMotif(texteValeur, parametres.textureMotifTaille);

            // Sur la texture par défaut/originale, le slider ne fait rien visuellement.
            // Il agit seulement si damier ou rayures est actif.
            this.appliquerTextureActive(parametres.textureActive, parametres.textureMotifTaille);
        });
    }

    brancherReinitialisationTexture({ bouton, slider, texteValeur }) {
        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            const tailleDefaut = constantesApparence.textureMotif.slider.defaut;
            const parametresTaille = this.changerTailleMotifTextureUC
                ? this.changerTailleMotifTextureUC.executer(tailleDefaut)
                : this.etatApplication.apparence.parametres;

            const parametresTexture = this.changerTextureUC.executer("originale");
            const tailleMotif = parametresTaille?.textureMotifTaille ?? tailleDefaut;

            if (slider) {
                slider.value = tailleDefaut;
            }

            this.mettreAJourTexteTailleMotif(texteValeur, tailleDefaut);
            this.appliquerTextureActive(parametresTexture.textureActive, tailleMotif);
            this.etatApplication.gui.advancedTexture?.markAsDirty?.();
        });
    }

    appliquerTextureActive(typeTexture, decalageMotif = 0) {
        if (!this.serviceMateriauxBabylon) {
            return;
        }

        if (typeTexture !== "damier" && typeTexture !== "rayures" && typeTexture !== "originale") {
            return;
        }

        this.serviceMateriauxBabylon.appliquerTextureProcedurale(
            this.etatApplication.modele3d.meshesImportes,
            typeTexture,
            { decalageMotif }
        );
    }

    mettreAJourTexteTailleMotif(texte, valeur) {
        if (!texte) {
            return;
        }

        texte.metadata = texte.metadata || {};
        texte.metadata.texteDynamique = true;

        if (Number(valeur) === 0) {
            texte.text = "Taille : défaut";
        } else if (Number(valeur) > 0) {
            texte.text = `Taille : +${Math.round(Number(valeur))}`;
        } else {
            texte.text = `Taille : ${Math.round(Number(valeur))}`;
        }

        texte._markAsDirty?.();
    }

    brancherReinitialisation(bouton) {
        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            this.reinitialiserApparenceUC.executer();

            this.postTraitApparence.appliquer(this.etatApplication);
            this.postTraitNettete.appliquer(this.etatApplication);

            const c = this.etatApplication.gui.controles;

            this.reglerSliderEtTexte(c.NetteteSlider, c.RegNetValTxt, constantesApparence.nettete.defaut, false);
            this.reglerSliderEtTexte(c.ContrasteSlider, c.RegConValTxt, constantesApparence.contraste.defaut, false);
            this.reglerSliderEtTexte(c.LuminositeSlider, c.RegLumValTxt, constantesApparence.luminosite.defaut, true);
            this.reglerSliderEtTexte(c.SaturationSlider, c.RegLumSatTxt, constantesApparence.saturation.defaut, false);

            const sliderTheme = c.ThmSlider;
            const texteTheme = c.RegThmValTxt;

            if (sliderTheme) {
                sliderTheme.value = 0;
            }

            this.appliquerFondScene(0, texteTheme);
            this.etatApplication.gui.advancedTexture?.markAsDirty?.();
        });
    }

    reglerSliderEtTexte(slider, texte, valeur, signe = false) {
        if (slider) slider.value = valeur;

        if (texte) {
            const pourcentage = Math.round(valeur * 100);
            texte.metadata = texte.metadata || {};
            texte.metadata.texteDynamique = true;
            texte.text = signe && pourcentage > 0 ? `+${pourcentage}%` : `${pourcentage}%`;
            texte._markAsDirty?.();
        }
    }

    brancherSliderApparence(slider, callback) {
        if (!slider) {
            throw new Error("Slider d'apparence introuvable.");
        }

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            callback(valeur);
        });
    }
}
