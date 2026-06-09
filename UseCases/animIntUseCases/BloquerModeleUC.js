export class BloquerModeleUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(doitBloquer) {
        if (typeof doitBloquer !== "boolean") {
            throw new Error("Valeur de blocage invalide.");
        }

        const camera = this.etatApplication.camera;

        if (!camera || !camera.parametres) {
            throw new Error("Paramètres de caméra introuvables.");
        }

        if (doitBloquer) {
            camera.parametres.bloquer();
        } else {
            camera.parametres.debloquer();
        }

        return {
            cameraBloquee: camera.parametres.estBloquee
        };
    }
}