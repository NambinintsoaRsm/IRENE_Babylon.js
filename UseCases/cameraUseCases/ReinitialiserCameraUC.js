import { ParametresCamera } from "../../Domain/camera/ParametresCamera.js";

export class ReinitialiserCameraUC {
    constructor(etatApplication, parametresCameraDefaut = null) {
        this.etatApplication = etatApplication;
        this.parametresCameraDefaut = parametresCameraDefaut;
    }

    executer() {
        const camera = this.etatApplication.camera;

        if (!camera) {
            throw new Error("Caméra introuvable dans l'état de l'application.");
        }

        const parametresParDefaut =
            this.parametresCameraDefaut ?? new ParametresCamera();

        camera.parametres = parametresParDefaut;

        return parametresParDefaut;
    }
}