export class ChangerVitesseCameraUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer({ sensibiliteRotation = null, wheelPrecision = null } = {}) {
        const camera = this.etatApplication.camera;

        if (!camera || !camera.parametres) {
            throw new Error("Paramètres de caméra introuvables.");
        }

        let nouveauxParametres = camera.parametres;

        if (sensibiliteRotation !== null) {
            if (!Number.isFinite(sensibiliteRotation) || sensibiliteRotation <= 0) {
                throw new Error("Sensibilité de rotation invalide.");
            }

            nouveauxParametres = nouveauxParametres.copierAvec({
                sensibiliteRotation
            });
        }

        if (wheelPrecision !== null) {
            if (!Number.isFinite(wheelPrecision) || wheelPrecision <= 0) {
                throw new Error("Précision de molette invalide.");
            }

            nouveauxParametres = nouveauxParametres.copierAvec({
                wheelPrecision
            });
        }

        camera.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}