import { ParametresInterface } from "../../Domain/interface/ParametresInterface.js";

export class ReinitialiserInterfaceUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer() {
        const parametresParDefaut = new ParametresInterface();

        this.etatApplication.interface.parametres = parametresParDefaut;

        return parametresParDefaut;
    }
}