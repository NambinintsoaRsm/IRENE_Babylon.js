export class BloquerCameraUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer() {
        const camera = this.etatApplication.camera;

        if (!camera || !camera.parametres) {
            throw new Error("Paramètres de caméra introuvables.");
        }

        const nouveauxParametres = camera.parametres.copierAvec({
            estBloquee: true
        });

        camera.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}
