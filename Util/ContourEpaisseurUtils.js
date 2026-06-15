import { constantesContours } from "../Configuration/constantesContours.js";

export function calculerEpaisseurContourPourType(epaisseurDemandee, typeContour) {
    const slider = constantesContours.epaisseurSlider;
    const regle = constantesContours.epaisseurParType?.[typeContour];

    const valeurSlider = Math.min(
        slider.max,
        Math.max(slider.min, Number(epaisseurDemandee) || slider.defaut)
    );

    if (!regle) {
        return valeurSlider;
    }

    const valeurAvecRenfort = valeurSlider <= slider.defaut
        ? valeurSlider + Number(regle.renfortBase || 0)
        : valeurSlider;

    return Math.min(
        regle.max,
        Math.max(regle.min, valeurAvecRenfort)
    );
}
