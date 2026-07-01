import { constantesContours } from "../../Configuration/constantesContours.js";
import { creerShaderMiseLumiereNormalesSiNecessaire } from "../shaders/ShaderMiseLumiereGradients.js";

export class PostTraitMiseLumiereNormales {
    creer(scene, camera, parametresMiseLumiere) {
        const nomShader = creerShaderMiseLumiereNormalesSiNecessaire();
        const normalRenderer = scene.enableGeometryBufferRenderer();

        if (!normalRenderer) {
            throw new Error("GeometryBufferRenderer indisponible pour la mise en lumière des normales.");
        }

        const conteneur = {
            postProcess: null,
            normalRenderer,
            parametresMiseLumiere
        };

        const postProcess = new BABYLON.PostProcess(
            "PostTraitMiseLumiereNormales",
            nomShader.replace("PixelShader", ""),
            [
                "screenSize",
                "edgeWidth",
                "normalThreshold",
                "intensity",
                "minNeighborSupport",
                "time",
                "blinkInterval",
                "blinkMinFactor",
                "luminanceDelta",
                "minLightness",
                "maxLightness"
            ],
            ["normalSampler"],
            1.0,
            camera
        );

        conteneur.postProcess = postProcess;

        postProcess.onApply = (effect) => {
            this.appliquerUniforms({
                effect,
                scene,
                normalRenderer,
                parametresMiseLumiere: conteneur.parametresMiseLumiere
            });
        };

        return conteneur;
    }

    appliquerUniforms({ effect, scene, normalRenderer, parametresMiseLumiere }) {
        const config = constantesContours.miseLumiereGradients?.normales ?? {};
        const configAnimation = constantesContours.miseLumiereGradients?.animation ?? {};
        const normalTexture = normalRenderer.getGBuffer().textures[1];
        const params = this.normaliserParametresMiseLumiere(parametresMiseLumiere, configAnimation);

        effect.setTexture("normalSampler", normalTexture);
        effect.setFloat2("screenSize", scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight());
        effect.setFloat("edgeWidth", params.largeur);
        effect.setFloat("normalThreshold", this.lireNombre(config.seuilGradient, config.seuilHaut, 0.12));
        effect.setFloat("intensity", this.lireNombre(config.intensite, null, 1));
        effect.setFloat("minNeighborSupport", this.lireNombre(config.voisinsMin, config.voisinsFortsMin, 2));
        effect.setFloat("time", this.lireTempsSecondes());
        effect.setFloat("blinkInterval", params.intervalleClignotement);
        effect.setFloat("blinkMinFactor", this.lireNombre(configAnimation.clignotement?.facteurMinimal, null, 0.45));
        effect.setFloat("luminanceDelta", params.luminanceDelta);
        effect.setFloat("minLightness", this.lireNombre(configAnimation.securiteLuminosite?.minLightness, null, 0.08));
        effect.setFloat("maxLightness", this.lireNombre(configAnimation.securiteLuminosite?.maxLightness, null, 0.92));
    }

    normaliserParametresMiseLumiere(parametres, configAnimation) {
        const intervalleConfig = configAnimation.intervalleSecondes ?? {};
        const luminanceConfig = configAnimation.luminancePourcentage ?? {};
        const largeurConfig = configAnimation.largeur ?? {};

        const intervalle = this.borner(
            Number(parametres?.intervalleClignotement),
            Number(intervalleConfig.min ?? 1),
            Number(intervalleConfig.max ?? 4),
            Number(intervalleConfig.defaut ?? 2)
        );

        const luminance = this.borner(
            Number(parametres?.luminanceDelta),
            Number(luminanceConfig.deltaMin ?? 0.04),
            Number(luminanceConfig.deltaMax ?? 0.16),
            Number(luminanceConfig.deltaDefaut ?? 0.10)
        );

        const largeur = this.borner(
            Number(parametres?.largeur),
            Number(largeurConfig.min ?? 1),
            Number(largeurConfig.max ?? 10),
            Number(largeurConfig.defaut ?? 2)
        );

        return { intervalleClignotement: intervalle, luminanceDelta: luminance, largeur };
    }

    borner(valeur, min, max, defaut) {
        const nombre = Number(valeur);
        if (!Number.isFinite(nombre)) return defaut;
        return Math.min(max, Math.max(min, nombre));
    }

    lireTempsSecondes() {
        if (typeof performance !== "undefined" && typeof performance.now === "function") {
            return performance.now() / 1000;
        }

        return Date.now() / 1000;
    }

    lireNombre(valeurPrincipale, valeurSecours, defaut) {
        const principale = Number(valeurPrincipale);
        if (Number.isFinite(principale)) return principale;

        const secours = Number(valeurSecours);
        if (Number.isFinite(secours)) return secours;

        return defaut;
    }

    appliquer(etatApplication) {
        const scene = etatApplication?.scenes?.scene3D;
        const camera = etatApplication?.camera?.cameraBabylon;
        const parametresMiseLumiere = this.obtenirParametresMiseLumiere(etatApplication);

        if (!scene || !camera || !parametresMiseLumiere) {
            throw new Error("Impossible d'appliquer la mise en lumière des normales.");
        }

        if (!etatApplication.contours.postTraitMiseLumiereNormales) {
            etatApplication.contours.postTraitMiseLumiereNormales = this.creer(scene, camera, parametresMiseLumiere);
        } else {
            etatApplication.contours.postTraitMiseLumiereNormales.parametresMiseLumiere = parametresMiseLumiere;
        }

        return etatApplication.contours.postTraitMiseLumiereNormales;
    }

    obtenirParametresMiseLumiere(etatApplication) {
        if (!etatApplication?.contours) return null;

        const animation = constantesContours.miseLumiereGradients.animation;

        if (!etatApplication.contours.parametresMiseLumiere) {
            etatApplication.contours.parametresMiseLumiere = {
                intervalleClignotement: animation.intervalleSecondes.defaut,
                luminanceSliderValeur: animation.luminancePourcentage.defaut,
                luminanceDelta: animation.luminancePourcentage.deltaDefaut,
                largeur: animation.largeur.defaut
            };
        }

        return etatApplication.contours.parametresMiseLumiere;
    }

    supprimer(etatApplication) {
        const conteneur = etatApplication?.contours?.postTraitMiseLumiereNormales;
        if (conteneur?.postProcess?.dispose) conteneur.postProcess.dispose();
        if (etatApplication?.contours) etatApplication.contours.postTraitMiseLumiereNormales = null;
    }
}
