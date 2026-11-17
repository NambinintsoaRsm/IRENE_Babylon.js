import { ParametresInterface } from "../../Domain/interface/ParametresInterface.js";

export class ChangerTaillePoliceUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(taillePolice) {
        if (!Number.isInteger(taillePolice) || taillePolice < 1 || taillePolice > 6) {
            throw new Error("La taille de police demandée est invalide.");
        }

        const parametresActuels = this.etatApplication.interface.parametres;

        const nouveauxParametres = parametresActuels.copierAvec({
            taillePolice: taillePolice
        });

        this.etatApplication.interface.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}