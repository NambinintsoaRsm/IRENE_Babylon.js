import { TypeContour } from "../../Domain/contours/TypeContour.js";
import { constantesContours } from "../../Configuration/constantesContours.js";
import { calculerEpaisseurContourPourType } from "../../Util/ContourEpaisseurUtils.js";
import { couleurHexaVersRgb01 } from "../../Util/CouleurUtils.js";
import { creerShaderContoursProfondeurNormalesSiNecessaire } from "../shaders/ShaderContoursProfondeurNormales.js";

export class PostTraitContProfNorm {
    creer(scene, camera, parametresContours) {
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
                "depthEdgeWidth",
                "normalEdgeWidth",
                "useDepth",
                "useNormal",
                "depthThreshold",
                "normalThreshold",
                "depthColor",
                "normalColor"
            ],
            ["depthSampler", "normalSampler"],
            1.0,
            camera
        );

        postProcess.onApply = (effect) => {
            this.appliquerUniforms({ effect, scene, depthMap, normalRenderer, parametresContours });
        };

        return { postProcess, depthRenderer, normalRenderer };
    }

    appliquerUniforms({ effect, scene, depthMap, normalRenderer, parametresContours }) {
        const utiliseSilhouette = this.estContourActif(parametresContours, TypeContour.SILHOUETTE);
        const utiliseRelief = this.estContourActif(parametresContours, TypeContour.RELIEF);
        const normalTexture = normalRenderer.getGBuffer().textures[1];

        const epaisseurSilhouette = calculerEpaisseurContourPourType(
            parametresContours.epaisseur,
            TypeContour.SILHOUETTE
        );
        const epaisseurRelief = calculerEpaisseurContourPourType(
            parametresContours.epaisseur,
            TypeContour.RELIEF
        );

        effect.setTexture("depthSampler", depthMap);
        effect.setTexture("normalSampler", normalTexture);
        effect.setFloat2("screenSize", scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight());
        effect.setFloat("depthEdgeWidth", epaisseurSilhouette);
        effect.setFloat("normalEdgeWidth", epaisseurRelief);
        effect.setFloat("useDepth", utiliseSilhouette ? 1.0 : 0.0);
        effect.setFloat("useNormal", utiliseRelief ? 1.0 : 0.0);
        effect.setFloat("depthThreshold", constantesContours.seuils[TypeContour.SILHOUETTE]);
        effect.setFloat("normalThreshold", constantesContours.seuils[TypeContour.RELIEF]);

        const couleur = couleurHexaVersRgb01(parametresContours.couleur);
        effect.setFloat3("depthColor", couleur.r, couleur.g, couleur.b);
        effect.setFloat3("normalColor", couleur.r, couleur.g, couleur.b);
    }



    estContourActif(parametresContours, typeContour) {
        if (!parametresContours?.actif) return false;
        if (typeof parametresContours.estActif === "function") {
            return parametresContours.estActif(typeContour);
        }
        if (Array.isArray(parametresContours.typesActifs)) {
            return parametresContours.typesActifs.includes(typeContour);
        }
        return parametresContours.typeActif === typeContour;
    }

    supprimer(etatApplication) {
        const conteneur = etatApplication?.contours?.postTraitementContoursProfondeurNormales;
        if (conteneur?.postProcess?.dispose) conteneur.postProcess.dispose();
        if (etatApplication?.contours) etatApplication.contours.postTraitementContoursProfondeurNormales = null;
    }

    appliquer(etatApplication) {
        const scene = etatApplication?.scenes?.scene3D;
        const camera = etatApplication?.camera?.cameraBabylon;
        const parametres = etatApplication?.contours?.parametres;

        if (!scene || !camera || !parametres) {
            throw new Error("Impossible d'appliquer les contours profondeur/normales.");
        }

        if (!etatApplication.contours.postTraitementContoursProfondeurNormales) {
            etatApplication.contours.postTraitementContoursProfondeurNormales = this.creer(scene, camera, parametres);
        }

        return etatApplication.contours.postTraitementContoursProfondeurNormales;
    }
}
