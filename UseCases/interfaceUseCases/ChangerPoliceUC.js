import { ParametresInterface } from "../../Domain/interface/ParametresInterface.js";

export class ChangerPoliceUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(police) {
        if (typeof police !== "string" || police.trim() === "") {
            throw new Error("La police demandée est invalide.");
        }

        const parametresActuels = this.etatApplication.interface.parametres;

        const nouveauxParametres = parametresActuels.copierAvec({
            police: police
        });

        this.etatApplication.interface.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}