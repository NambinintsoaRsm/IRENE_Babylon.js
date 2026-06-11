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

        const source = this.parametresContoursDefaut ?? new ParametresContours();
        const parametresParDefaut = new ParametresContours({
            actif: source.actif,
            typeActif: source.typeActif,
            typesActifs: source.typesActifs ?? [],
            epaisseur: source.epaisseur,
            seuil: source.seuil,
            couleur: source.couleur
        });

        contours.parametres = parametresParDefaut;

        return parametresParDefaut;
    }
}
