import { TypeContour } from "../../Domain/contours/TypeContour.js";
import { constantesContours } from "../../Configuration/constantesContours.js";

import {
    creerShaderContoursProfondeurNormalesSiNecessaire
} from "../shaders/ShaderContoursProfondeurNormales.js";

/**
 * Crée et met à jour le post-traitement des contours basés sur :
 * - la profondeur pour la silhouette ;
 * - les normales pour le relief.
 *
 * Le seuil n'est pas modifié par l'utilisateur.
 * Il vient de Configuration/constantesContours.js.
 */
export class PostTraitContProfNorm {
    creer(scene, camera, parametresContours) {
        if (!scene) {
            throw new Error("Scène introuvable pour les contours profondeur/normales.");
        }

        if (!camera) {
            throw new Error("Caméra introuvable pour les contours profondeur/normales.");
        }

        if (!parametresContours) {
            throw new Error("Paramètres de contours introuvables.");
        }

        const nomShader = creerShaderContoursProfondeurNormalesSiNecessaire();

        const depthRenderer = scene.enableDepthRenderer(camera);
        const depthMap = depthRenderer.getDepthMap();

        const normalRenderer = scene.enableGeometryBufferRenderer();

        if (!normalRenderer) {
            throw new Error("GeometryBufferRenderer indisponible pour les normales.");
        }

        const postProcess = new BABYLON.PostProcess(
            "PostTraitContProfNorm",
            nomShader.replace("PixelShader", ""),
            [
                "screenSize",
                "useDepth",
                "useNormal",
                "depthThreshold",
                "normalThreshold",
                "depthColor",
                "normalColor"
            ],
            [
                "depthSampler",
                "normalSampler"
            ],
            1.0,
            camera
        );

        postProcess.onApply = (effect) => {
            this.appliquerUniforms({
                effect,
                scene,
                depthMap,
                normalRenderer,
                parametresContours
            });
        };

        return {
            postProcess,
            depthRenderer,
            normalRenderer
        };
    }

    appliquerUniforms({
                          effect,
                          scene,
                          depthMap,
                          normalRenderer,
                          parametresContours
                      }) {
        const typeActif = parametresContours.typeActif;

        const utiliseSilhouette = parametresContours.actif &&
            typeActif === TypeContour.SILHOUETTE;

        const utiliseRelief = parametresContours.actif &&
            typeActif === TypeContour.RELIEF;

        const normalTexture = normalRenderer.getGBuffer().textures[1];

        effect.setTexture("depthSampler", depthMap);
        effect.setTexture("normalSampler", normalTexture);

        effect.setFloat2(
            "screenSize",
            scene.getEngine().getRenderWidth(),
            scene.getEngine().getRenderHeight()
        );

        effect.setFloat("useDepth", utiliseSilhouette ? 1.0 : 0.0);
        effect.setFloat("useNormal", utiliseRelief ? 1.0 : 0.0);

        effect.setFloat(
            "depthThreshold",
            constantesContours.seuils[TypeContour.SILHOUETTE]
        );

        effect.setFloat(
            "normalThreshold",
            constantesContours.seuils[TypeContour.RELIEF]
        );

        const couleur = this.convertirCouleur(parametresContours.couleur);

        effect.setFloat3(
            "depthColor",
            couleur.r,
            couleur.g,
            couleur.b
        );

        effect.setFloat3(
            "normalColor",
            couleur.r,
            couleur.g,
            couleur.b
        );
    }

    mettreAJour(conteneurPostProcess, parametresContours) {
        if (!conteneurPostProcess?.postProcess) {
            return null;
        }

        if (!parametresContours) {
            throw new Error("Paramètres de contours introuvables.");
        }

        const ancienOnApply = conteneurPostProcess.postProcess.onApply;

        conteneurPostProcess.postProcess.onApply = (effect) => {
            if (typeof ancienOnApply === "function") {
                ancienOnApply(effect);
            }
        };

        return conteneurPostProcess;
    }

    supprimer(etatApplication) {
        const conteneur = etatApplication?.contours?.postTraitContProfNorm;

        if (conteneur?.postProcess && typeof conteneur.postProcess.dispose === "function") {
            conteneur.postProcess.dispose();
        }

        if (etatApplication?.contours) {
            etatApplication.contours.postTraitContProfNorm = null;
        }
    }

    appliquer(etatApplication) {
        const scene = etatApplication?.scenes?.scene3D;
        const camera = etatApplication?.camera?.cameraBabylon;
        const parametres = etatApplication?.contours?.parametres;

        if (!scene || !camera || !parametres) {
            throw new Error("Impossible d'appliquer les contours profondeur/normales.");
        }

        if (!etatApplication.contours.postTraitContProfNorm) {
            etatApplication.contours.postTraitContProfNorm = this.creer(
                scene,
                camera,
                parametres
            );
        }

        return etatApplication.contours.postTraitContProfNorm;
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