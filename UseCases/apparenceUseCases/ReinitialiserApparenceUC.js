import { ParametresApparence } from "../../Domain/apparence/ParametresApparence.js";

export class ReinitialiserApparenceUC {
    constructor(etatApplication, profilParDefaut = null) {
        this.etatApplication = etatApplication;
        this.profilParDefaut = profilParDefaut;
    }

    executer() {
        const parametresParDefaut =
            this.profilParDefaut?.apparence ?? new ParametresApparence();

        this.etatApplication.apparence.parametres = parametresParDefaut;

        return parametresParDefaut;
    }
}