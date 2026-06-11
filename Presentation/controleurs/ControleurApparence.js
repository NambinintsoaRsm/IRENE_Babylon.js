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
            this.changerTextureUC.executer(typeTexture);

            if (this.serviceMateriauxBabylon) {
                this.serviceMateriauxBabylon.appliquerTextureProcedurale(
                    this.etatApplication.modele3d.meshesImportes,
                    typeTexture
                );
            }
        });
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

            const sliderTheme = this.etatApplication.gui.controles.ThmSlider;
            const texteTheme = this.etatApplication.gui.controles.RegThmValTxt;

            if (sliderTheme) {
                sliderTheme.value = 0;
            }

            this.appliquerFondScene(0, texteTheme);
        });
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
