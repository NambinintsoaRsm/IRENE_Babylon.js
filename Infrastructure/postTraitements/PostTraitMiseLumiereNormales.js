import { TypeContour } from "../../Domain/contours/TypeContour.js";
import { constantesContours } from "../../Configuration/constantesContours.js";
import { creerShaderMiseLumiereNormalesSiNecessaire } from "../shaders/ShaderMiseLumiereGradients.js";

export class PostTraitMiseLumiereNormales {
    creer(scene, camera, parametresContours) {
        const nomShader = creerShaderMiseLumiereNormalesSiNecessaire();
        const normalRenderer = scene.enableGeometryBufferRenderer();

        if (!normalRenderer) {
            throw new Error("GeometryBufferRenderer indisponible pour la mise en lumière des normales.");
        }

        const postProcess = new BABYLON.PostProcess(
            "PostTraitMiseLumiereNormales",
            nomShader.replace("PixelShader", ""),
            [
                "screenSize",
                "edgeWidth",
                "normalThreshold",
                "intensity",
                "minNeighborSupport"
            ],
            ["normalSampler"],
            1.0,
            camera
        );

        postProcess.onApply = (effect) => {
            this.appliquerUniforms({ effect, scene, normalRenderer, parametresContours });
        };

        return { postProcess, normalRenderer };
    }

    appliquerUniforms({ effect, scene, normalRenderer, parametresContours }) {
        const config = constantesContours.miseLumiereGradients?.normales ?? {};
        const normalTexture = normalRenderer.getGBuffer().textures[1];
        const epaisseur = this.calculerEpaisseur(TypeContour.RELIEF, parametresContours?.epaisseur);

        effect.setTexture("normalSampler", normalTexture);
        effect.setFloat2("screenSize", scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight());
        effect.setFloat("edgeWidth", epaisseur);
        effect.setFloat("normalThreshold", this.lireNombre(config.seuilGradient, config.seuilHaut, 0.12));
        effect.setFloat("intensity", this.lireNombre(config.intensite, null, 0.22));
        effect.setFloat("minNeighborSupport", this.lireNombre(config.voisinsMin, config.voisinsFortsMin, 2));
    }

    lireNombre(valeurPrincipale, valeurSecours, defaut) {
        const principale = Number(valeurPrincipale);
        if (Number.isFinite(principale)) return principale;

        const secours = Number(valeurSecours);
        if (Number.isFinite(secours)) return secours;

        return defaut;
    }

    calculerEpaisseur(typeContour, epaisseurSlider) {
        const slider = constantesContours.epaisseurSlider;
        const config = constantesContours.epaisseursParType?.[typeContour];
        const valeur = Number(epaisseurSlider);
        const valeurSlider = Number.isFinite(valeur)
            ? Math.min(slider.max, Math.max(slider.min, valeur))
            : slider.defaut;

        if (!config) return valeurSlider;

        const progression = (valeurSlider - slider.min) / (slider.max - slider.min);
        const epaisseur = config.min + progression * (config.max - config.min);

        return Math.min(config.max, Math.max(config.min, epaisseur));
    }

    appliquer(etatApplication) {
        const scene = etatApplication?.scenes?.scene3D;
        const camera = etatApplication?.camera?.cameraBabylon;
        const parametres = etatApplication?.contours?.parametres;

        if (!scene || !camera || !parametres) {
            throw new Error("Impossible d'appliquer la mise en lumière des normales.");
        }

        if (!etatApplication.contours.postTraitMiseLumiereNormales) {
            etatApplication.contours.postTraitMiseLumiereNormales = this.creer(scene, camera, parametres);
        }

        return etatApplication.contours.postTraitMiseLumiereNormales;
    }

    supprimer(etatApplication) {
        const conteneur = etatApplication?.contours?.postTraitMiseLumiereNormales;
        if (conteneur?.postProcess?.dispose) conteneur.postProcess.dispose();
        if (etatApplication?.contours) etatApplication.contours.postTraitMiseLumiereNormales = null;
    }
}
