export class ServiceControlesSpeciauxGUI {
    reappliquerSliderTemperature(etatApplication) {
        const slider = etatApplication?.gui?.controles?.LumTempSlider;
        const advancedTexture = etatApplication?.gui?.advancedTexture;

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

        const mesure = slider._currentMeasure;

        if (!mesure || !mesure.width || mesure.width <= 0) {
            slider.backgroundGradient = null;
            slider.background = "#D8D8D8FF";
            slider._markAsDirty?.();
            advancedTexture?.markAsDirty?.();
            return;
        }

        const gradient = new BABYLON.GUI.LinearGradient(
            mesure.left,
            mesure.top,
            mesure.left + mesure.width,
            mesure.top
        );

        gradient.addColorStop(0, "#ff7a2f");
        gradient.addColorStop(0.5, "#f2f2f2");
        gradient.addColorStop(1, "#9fd3ff");

        slider.backgroundGradient = gradient;
        slider.background = "#00000000";

        slider._markAsDirty?.();
        advancedTexture?.markAsDirty?.();
    }

    reappliquerSliderTemperatureApresRendu(etatApplication) {
        this.reappliquerSliderTemperature(etatApplication);

        requestAnimationFrame(() => {
            this.reappliquerSliderTemperature(etatApplication);

            requestAnimationFrame(() => {
                this.reappliquerSliderTemperature(etatApplication);
            });
        });
    }
}