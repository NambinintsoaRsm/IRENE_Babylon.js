export class BasculerMiseLumiereNormalesUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer() {
        const contours = this.etatApplication.contours;

        if (!contours) {
            throw new Error("État des contours introuvable.");
        }

        contours.miseLumiereNormalesActif = !Boolean(contours.miseLumiereNormalesActif);

        return contours.miseLumiereNormalesActif;
    }
}
