/**
 * Crée et met à jour le post-traitement de netteté.
 *
 * Contrairement au contraste, à la luminosité et à la saturation,
 * la netteté utilise le post-process Babylon SharpenPostProcess.
 */
export class PostTraitNettete {
    creer(camera, parametresApparence) {
        if (!camera) {
            throw new Error("Caméra introuvable pour créer le post-traitement de netteté.");
        }

        if (!parametresApparence) {
            throw new Error("Paramètres d'apparence introuvables.");
        }

        const postProcess = new BABYLON.SharpenPostProcess(
            "PostTraitNettete",
            1.0,
            camera
        );

        this.mettreAJour(postProcess, parametresApparence);

        return postProcess;
    }

    mettreAJour(postProcess, parametresApparence) {
        if (!postProcess) {
            return null;
        }

        if (!parametresApparence) {
            throw new Error("Paramètres d'apparence introuvables.");
        }

        postProcess.edgeAmount = parametresApparence.nettete;
        postProcess.colorAmount = 1.0;

        return postProcess;
    }

    supprimer(etatApplication) {
        const postProcess = etatApplication?.apparence?.postTraitementNettete;

        if (postProcess && typeof postProcess.dispose === "function") {
            postProcess.dispose();
        }

        if (etatApplication?.apparence) {
            etatApplication.apparence.postTraitementNettete = null;
        }
    }

    appliquer(etatApplication) {
        const camera = etatApplication?.camera?.cameraBabylon;
        const parametres = etatApplication?.apparence?.parametres;

        if (!camera || !parametres) {
            throw new Error("Impossible d'appliquer le post-traitement de netteté.");
        }

        if (!etatApplication.apparence.postTraitementNettete) {
            etatApplication.apparence.postTraitementNettete = this.creer(
                camera,
                parametres
            );
        } else {
            this.mettreAJour(
                etatApplication.apparence.postTraitementNettete,
                parametres
            );
        }

        return etatApplication.apparence.postTraitementNettete;
    }
}