import { constantesApparence } from "../../Configuration/constantesApparence.js";

export class ChangerTailleMotifTextureUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(tailleMotif) {
        if (!Number.isFinite(Number(tailleMotif))) {
            throw new Error("Taille de motif invalide.");
        }

        const parametres = this.etatApplication.apparence.parametres;

        if (!parametres) {
            throw new Error("Paramètres d'apparence introuvables.");
        }

        const bornes = constantesApparence.textureMotif.slider;
        const valeurBornee = Math.min(
            bornes.max,
            Math.max(bornes.min, Math.round(Number(tailleMotif)))
        );

        const nouveauxParametres = parametres.copierAvec({
            textureMotifTaille: valeurBornee
        });

        this.etatApplication.apparence.parametres = nouveauxParametres;

        return nouveauxParametres;
    }
}
