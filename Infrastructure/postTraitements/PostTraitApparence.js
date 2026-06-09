import {
    creerShaderApparenceSiNecessaire
} from "../shaders/ShaderApparence.js";

/**
 * Crée et met à jour le post-traitement d'apparence.
 *
 * Il applique les réglages globaux :
 * - contraste ;
 * - luminosité ;
 * - saturation.
 *
 * La netteté est séparée, car elle utilise un post-process Babylon dédié.
 */
export class PostTraitApparence {
    creer(camera, parametresApparence) {
        if (!camera) {
            throw new Error("Caméra introuvable pour créer le post-traitement d'apparence.");
        }

        if (!parametresApparence) {
            throw new Error("Paramètres d'apparence introuvables.");
        }

        const nomShader = creerShaderApparenceSiNecessaire();

        const postProcess = new BABYLON.PostProcess(
            "PostTraitApparence",
            nomShader.replace("PixelShader", ""),
            ["contrast", "brightness", "saturation"],
            null,
            1.0,
            camera
        );

        postProcess.onApply = (effect) => {
            effect.setFloat("contrast", parametresApparence.contraste);
            effect.setFloat("brightness", parametresApparence.luminosite);
            effect.setFloat("saturation", parametresApparence.saturation);
        };

        return postProcess;
    }

    mettreAJour(postProcess, parametresApparence) {
        if (!postProcess) {
            return null;
        }

        if (!parametresApparence) {
            throw new Error("Paramètres d'apparence introuvables.");
        }

        postProcess.onApply = (effect) => {
            effect.setFloat("contrast", parametresApparence.contraste);
            effect.setFloat("brightness", parametresApparence.luminosite);
            effect.setFloat("saturation", parametresApparence.saturation);
        };

        return postProcess;
    }

    supprimer(etatApplication) {
        const postProcess = etatApplication?.apparence?.postTraitementApparence;

        if (postProcess && typeof postProcess.dispose === "function") {
            postProcess.dispose();
        }

        if (etatApplication?.apparence) {
            etatApplication.apparence.postTraitementApparence = null;
        }
    }

    appliquer(etatApplication) {
        const camera = etatApplication?.camera?.cameraBabylon;
        const parametres = etatApplication?.apparence?.parametres;

        if (!camera || !parametres) {
            throw new Error("Impossible d'appliquer le post-traitement d'apparence.");
        }

        if (!etatApplication.apparence.postTraitementApparence) {
            etatApplication.apparence.postTraitementApparence = this.creer(
                camera,
                parametres
            );
        } else {
            this.mettreAJour(
                etatApplication.apparence.postTraitementApparence,
                parametres
            );
        }

        return etatApplication.apparence.postTraitementApparence;
    }
}