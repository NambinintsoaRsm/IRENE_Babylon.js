import { ParametresContours } from "../../Domain/contours/ParametresContours.js";

export class ReinitialiserContoursUC {
    constructor(etatApplication, parametresContoursDefaut = null) {
        this.etatApplication = etatApplication;
        this.parametresContoursDefaut = parametresContoursDefaut;
    }

    executer() {
        const contours = this.etatApplication.contours;

        if (!contours) {
            throw new Error("État des contours introuvable.");
        }

        const parametresParDefaut =
            this.parametresContoursDefaut ?? new ParametresContours();

        contours.parametres = parametresParDefaut;

        return parametresParDefaut;
    }
}