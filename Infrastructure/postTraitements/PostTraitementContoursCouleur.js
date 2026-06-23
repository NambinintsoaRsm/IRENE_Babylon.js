import { TypeContour } from "../../Domain/contours/TypeContour.js";
import { constantesContours } from "../../Configuration/constantesContours.js";
import { couleurHexaVersRgb01 } from "../../Util/CouleurUtils.js";
import { creerShaderContoursCouleurSiNecessaire } from "../shaders/ShaderContoursCouleur.js";

export class PostTraitContoursCouleur {
    creer(scene, camera, parametresContours) {
        const nomShader = creerShaderContoursCouleurSiNecessaire();

        const postProcess = new BABYLON.PostProcess(
            "PostTraitContoursCouleur",
            nomShader.replace("PixelShader", ""),
            ["screenSize", "edgeWidth", "colorThreshold", "colorEdgeColor"],
            null,
            1.0,
            camera
        );

        postProcess.onApply = (effect) => {
            this.appliquerUniforms({ effect, scene, parametresContours });
        };

        return postProcess;
    }

    appliquerUniforms({ effect, scene, parametresContours }) {
        const utiliseCouleur = this.estContourActif(parametresContours, TypeContour.COULEUR);
        const epaisseurSlider = this.normaliserEpaisseurSlider(parametresContours?.epaisseur);
        const epaisseurCouleur = this.calculerEpaisseurPourType(TypeContour.COULEUR, epaisseurSlider);

        effect.setFloat2("screenSize", scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight());
        effect.setFloat("edgeWidth", epaisseurCouleur);
        effect.setFloat("colorThreshold", utiliseCouleur ? constantesContours.seuils[TypeContour.COULEUR] : Number.POSITIVE_INFINITY);

        const couleur = couleurHexaVersRgb01(parametresContours.couleur);
        effect.setFloat3("colorEdgeColor", couleur.r, couleur.g, couleur.b);
    }

    normaliserEpaisseurSlider(epaisseur) {
        const config = constantesContours.epaisseurSlider;
        const valeur = Number(epaisseur);

        if (!Number.isFinite(valeur)) {
            return config.defaut;
        }

        return Math.min(config.max, Math.max(config.min, valeur));
    }

    calculerEpaisseurPourType(typeContour, epaisseurSlider) {
        const slider = constantesContours.epaisseurSlider;
        const config = constantesContours.epaisseursParType?.[typeContour];

        if (!config) {
            return epaisseurSlider;
        }

        const progression = (epaisseurSlider - slider.min) / (slider.max - slider.min);
        const epaisseur = config.min + progression * (config.max - config.min);

        return Math.min(config.max, Math.max(config.min, epaisseur));
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
        const postProcess = etatApplication?.contours?.postTraitementContoursCouleur;
        if (postProcess?.dispose) postProcess.dispose();
        if (etatApplication?.contours) etatApplication.contours.postTraitementContoursCouleur = null;
    }

    appliquer(etatApplication) {
        const scene = etatApplication?.scenes?.scene3D;
        const camera = etatApplication?.camera?.cameraBabylon;
        const parametres = etatApplication?.contours?.parametres;

        if (!scene || !camera || !parametres) {
            throw new Error("Impossible d'appliquer les contours couleur.");
        }

        if (!etatApplication.contours.postTraitementContoursCouleur) {
            etatApplication.contours.postTraitementContoursCouleur = this.creer(scene, camera, parametres);
        }

        return etatApplication.contours.postTraitementContoursCouleur;
    }
}
