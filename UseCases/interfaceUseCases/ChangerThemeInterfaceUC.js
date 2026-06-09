import { estThemeInterfaceValide } from "../../Domain/interface/ThemeInterface.js";

export class ChangerThemeInterfaceUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(theme) {
        if (!estThemeInterfaceValide(theme)) {
            throw new Error(`Le thème demandé '${theme}' est invalide.`);
        }

        const parametresActuels = this.etatApplication.interface.parametres;

        const nouveauxParametres = parametresActuels.copierAvec({
            theme: theme
        });

        this.etatApplication.interface.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}