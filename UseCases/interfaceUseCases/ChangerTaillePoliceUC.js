import { ParametresInterface } from "../../Domain/interface/ParametresInterface.js";
import { estNiveauPoliceValide } from "../../Domain/interface/NiveauPolice.js";

export class ChangerTaillePoliceUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(taillePolice) {
        if (!estNiveauPoliceValide(taillePolice)) {
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