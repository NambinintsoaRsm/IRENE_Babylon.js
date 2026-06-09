import { TypeContour } from "../../Domain/contours/TypeContour.js";
import { constantesContours } from "../../Configuration/constantesContours.js";

import {
    creerShaderContoursCouleurSiNecessaire
} from "../shaders/ShaderContoursCouleur.js";

/**
 * Crée et met à jour le post-traitement des contours basés sur la couleur.
 *
 * Il détecte les variations fortes dans l'image rendue.
 * Le seuil vient de Configuration/constantesContours.js.
 */
export class PostTraitementContoursCouleur {
    creer(scene, camera, parametresContours) {
        if (!scene) {
            throw new Error("Scène introuvable pour les contours couleur.");
        }

        if (!camera) {
            throw new Error("Caméra introuvable pour les contours couleur.");
        }

        if (!parametresContours) {
            throw new Error("Paramètres de contours introuvables.");
        }

        const nomShader = creerShaderContoursCouleurSiNecessaire();

        const postProcess = new BABYLON.PostProcess(
            "PostTraitementContoursCouleur",
            nomShader.replace("PixelShader", ""),
            [
                "screenSize",
                "colorThreshold",
                "colorEdgeColor"
            ],
            null,
            1.0,
            camera
        );

        postProcess.onApply = (effect) => {
            this.appliquerUniforms({
                effect,
                scene,
                parametresContours
            });
        };

        return postProcess;
    }

    appliquerUniforms({
                          effect,
                          scene,
                          parametresContours
                      }) {
        const utiliseCouleur = parametresContours.actif &&
            parametresContours.typeActif === TypeContour.COULEUR;

        effect.setFloat2(
            "screenSize",
            scene.getEngine().getRenderWidth(),
            scene.getEngine().getRenderHeight()
        );

        const seuil = utiliseCouleur
            ? constantesContours.seuils[TypeContour.COULEUR]
            : Number.POSITIVE_INFINITY;

        effect.setFloat("colorThreshold", seuil);

        const couleur = this.convertirCouleur(parametresContours.couleur);

        effect.setFloat3(
            "colorEdgeColor",
            couleur.r,
            couleur.g,
            couleur.b
        );
    }

    mettreAJour(postProcess, parametresContours) {
        if (!postProcess) {
            return null;
        }

        if (!parametresContours) {
            throw new Error("Paramètres de contours introuvables.");
        }

        return postProcess;
    }

    supprimer(etatApplication) {
        const postProcess = etatApplication?.contours?.postTraitementContoursCouleur;

        if (postProcess && typeof postProcess.dispose === "function") {
            postProcess.dispose();
        }

        if (etatApplication?.contours) {
            etatApplication.contours.postTraitementContoursCouleur = null;
        }
    }

    appliquer(etatApplication) {
        const scene = etatApplication?.scenes?.scene3D;
        const camera = etatApplication?.camera?.cameraBabylon;
        const parametres = etatApplication?.contours?.parametres;

        if (!scene || !camera || !parametres) {
            throw new Error("Impossible d'appliquer les contours couleur.");
        }

        if (!etatApplication.contours.postTraitementContoursCouleur) {
            etatApplication.contours.postTraitementContoursCouleur = this.creer(
                scene,
                camera,
                parametres
            );
        }

        return etatApplication.contours.postTraitementContoursCouleur;
    }

    convertirCouleur(couleurHexa) {
        const couleur = BABYLON.Color3.FromHexString(couleurHexa);

        return {
            r: couleur.r,
            g: couleur.g,
            b: couleur.b
        };
    }
}