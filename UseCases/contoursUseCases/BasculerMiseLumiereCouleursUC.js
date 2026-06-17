export class BasculerMiseLumiereCouleursUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer() {
        const contours = this.etatApplication.contours;

        if (!contours) {
            throw new Error("État des contours introuvable.");
        }

        contours.miseLumiereCouleursActif = !Boolean(contours.miseLumiereCouleursActif);

        return contours.miseLumiereCouleursActif;
    }
}
