import { estPositionMenuValide } from "../../Domain/interface/PositionMenu.js";

export class ChangerPositionMenuUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(positionMenu) {
        if (!estPositionMenuValide(positionMenu)) {
            throw new Error(`La position du menu '${positionMenu}' est invalide.`);
        }

        const parametresActuels = this.etatApplication.interface.parametres;

        const nouveauxParametres = parametresActuels.copierAvec({
            positionMenu: positionMenu
        });

        this.etatApplication.interface.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}