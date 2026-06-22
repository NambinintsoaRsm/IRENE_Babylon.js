import { constantesContours } from "../../Configuration/constantesContours.js";
import { creerShaderMiseLumiereCouleursSiNecessaire } from "../shaders/ShaderMiseLumiereGradients.js";

export class PostTraitMiseLumiereCouleurs {
    creer(scene, camera, parametresMiseLumiere) {
        const nomShader = creerShaderMiseLumiereCouleursSiNecessaire();

        const postProcess = new BABYLON.PostProcess(
            "PostTraitMiseLumiereCouleurs",
            nomShader.replace("PixelShader", ""),
            [
                "screenSize",
                "edgeWidth",
                "colorThreshold",
                "intensity",
                "minNeighborSupport",
                "time",
                "blinkInterval",
                "blinkMinFactor",
                "luminanceDelta",
                "minLightness",
                "maxLightness"
            ],
            null,
            1.0,
            camera
        );

        postProcess.onApply = (effect) => {
            this.appliquerUniforms({ effect, scene, parametresMiseLumiere });
        };

        return postProcess;
    }

    appliquerUniforms({ effect, scene, parametresMiseLumiere }) {
        const config = constantesContours.miseLumiereGradients?.couleurs ?? {};
        const configAnimation = constantesContours.miseLumiereGradients?.animation ?? {};
        const params = this.normaliserParametresMiseLumiere(parametresMiseLumiere, configAnimation);

        effect.setFloat2("screenSize", scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight());
        effect.setFloat("edgeWidth", params.largeur);
        effect.setFloat("colorThreshold", this.lireNombre(config.seuilGradient, config.seuilHaut, 0.55));
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
            Number(largeurConfig.max ?? 5),
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
            throw new Error("Impossible d'appliquer la mise en lumière des couleurs.");
        }

        if (!etatApplication.contours.postTraitMiseLumiereCouleurs) {
            etatApplication.contours.postTraitMiseLumiereCouleurs = this.creer(scene, camera, parametresMiseLumiere);
        }

        return etatApplication.contours.postTraitMiseLumiereCouleurs;
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
        const postProcess = etatApplication?.contours?.postTraitMiseLumiereCouleurs;
        if (postProcess?.dispose) postProcess.dispose();
        if (etatApplication?.contours) etatApplication.contours.postTraitMiseLumiereCouleurs = null;
    }
}
