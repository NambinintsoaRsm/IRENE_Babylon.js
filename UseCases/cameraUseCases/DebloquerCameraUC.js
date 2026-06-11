export class DebloquerCameraUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer() {
        const camera = this.etatApplication.camera;

        if (!camera || !camera.parametres) {
            throw new Error("Paramètres de caméra introuvables.");
        }

        const nouveauxParametres = camera.parametres.copierAvec({
            estBloquee: false
        });

        camera.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}