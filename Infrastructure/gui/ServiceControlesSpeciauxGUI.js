export class ServiceControlesSpeciauxGUI {
    constructor() {
        this.nombreFramesRafraichissement = 12;
    }

    installerSuiviSliderTemperature(etatApplication) {
        const slider = this.obtenirSliderTemperature(etatApplication);
        const sceneGUI = etatApplication?.scenes?.sceneGUI;
        const advancedTexture = etatApplication?.gui?.advancedTexture;

        if (!slider) {
            return;
        }

        this.preparerSliderTemperature(slider);

        if (!slider.metadata.suiviTemperatureApresRenduInstalle && sceneGUI?.onAfterRenderObservable) {
            slider.metadata.suiviTemperatureApresRenduInstalle = true;
            slider.metadata.suiviTemperatureApresRenduObserver = sceneGUI.onAfterRenderObservable.add(() => {
                this.reappliquerSliderTemperature(etatApplication, { force: false });
            });
        }

        if (!slider.metadata.suiviTemperatureLayoutInstalle && advancedTexture?.onEndLayoutObservable) {
            slider.metadata.suiviTemperatureLayoutInstalle = true;
            slider.metadata.suiviTemperatureLayoutObserver = advancedTexture.onEndLayoutObservable.add(() => {
                this.reappliquerSliderTemperature(etatApplication, { force: false });
            });
        }

        this.reappliquerSliderTemperatureApresRendu(etatApplication);
    }

    reappliquerSliderTemperature(etatApplication, options = {}) {
        const { force = true } = options;
        const slider = this.obtenirSliderTemperature(etatApplication);
        const advancedTexture = etatApplication?.gui?.advancedTexture;

        if (!slider) {
            return false;
        }

        this.preparerSliderTemperature(slider);

        const mesure = slider._currentMeasure;

        // Point important : quand le panneau Lumières est fermé, Babylon peut donner
        // une mesure vide ou encore non recalculée. Dans ce cas, on ne remet surtout
        // pas un fond gris : on attend une mesure valide.
        if (!this.estMesureValide(mesure)) {
            return false;
        }

        const signature = this.creerSignatureMesure(mesure);
        const gradientDejaValide = slider.metadata.signatureGradientTemperature === signature
            && slider.backgroundGradient
            && slider.background === "#00000000";

        if (!force && gradientDejaValide) {
            return true;
        }

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
        slider.metadata.signatureGradientTemperature = signature;

        slider._markAsDirty?.();
        advancedTexture?.markAsDirty?.();

        return true;
    }

    reappliquerSliderTemperatureApresRendu(etatApplication) {
        this.planifierRafraichissementSliderTemperature(
            etatApplication,
            this.nombreFramesRafraichissement
        );
    }

    signalerChangementDisposition(etatApplication) {
        const slider = this.obtenirSliderTemperature(etatApplication);

        if (slider?.metadata) {
            // On force un recalcul au prochain passage, car la position ou la taille
            // du contrôle peut avoir changé même si le slider lui-même est le même.
            slider.metadata.signatureGradientTemperature = null;
        }

        this.reappliquerSliderTemperatureApresRendu(etatApplication);
    }

    planifierRafraichissementSliderTemperature(etatApplication, framesRestantes) {
        if (framesRestantes <= 0) {
            return;
        }

        requestAnimationFrame(() => {
            this.reappliquerSliderTemperature(etatApplication, { force: true });
            this.planifierRafraichissementSliderTemperature(etatApplication, framesRestantes - 1);
        });
    }

    obtenirSliderTemperature(etatApplication) {
        const controles = etatApplication?.gui?.controles;
        const advancedTexture = etatApplication?.gui?.advancedTexture;

        let slider = controles?.LumTempSlider ?? null;

        if (!slider && advancedTexture?.getControlByName) {
            slider = advancedTexture.getControlByName("LumTempSlider") ?? null;

            if (slider && controles) {
                controles.LumTempSlider = slider;
            }
        }

        return slider;
    }

    preparerSliderTemperature(slider) {
        if (!slider) {
            return;
        }

        slider.metadata = slider.metadata || {};
        slider.metadata.nePasEcraserFond = true;
        slider.metadata.estSliderTemperature = true;

        slider.displayValueBar = false;
        slider.color = "#00000000";
        slider.borderColor = "#00000000";
        slider.thumbColor = "#f2f2f2";
        slider.isVisible = true;
        slider.isEnabled = true;
    }

    estMesureValide(mesure) {
        return Boolean(
            mesure
            && Number.isFinite(mesure.left)
            && Number.isFinite(mesure.top)
            && Number.isFinite(mesure.width)
            && Number.isFinite(mesure.height)
            && mesure.width > 0
            && mesure.height > 0
        );
    }

    creerSignatureMesure(mesure) {
        return [
            Math.round(mesure.left),
            Math.round(mesure.top),
            Math.round(mesure.width),
            Math.round(mesure.height)
        ].join("|");
    }
}
