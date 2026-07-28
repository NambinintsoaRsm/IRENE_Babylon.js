import { constantesContours } from "../../Configuration/constantesContours.js";
import { creerShaderMiseLumiereNormalesSiNecessaire } from "../shaders/ShaderMiseLumiereGradients.js";

export class PostTraitMiseLumiereNormales {
    creer(scene, camera, parametresMiseLumiere) {
        const nomShader = creerShaderMiseLumiereNormalesSiNecessaire();
        const contexteLoupe = this.obtenirContexteLoupe(camera);
        const normalRenderer = contexteLoupe?.normalTexture
            ? null
            : scene.enableGeometryBufferRenderer();

        if (!normalRenderer && !contexteLoupe?.normalTexture) {
            throw new Error("GeometryBufferRenderer indisponible pour la mise en lumière des normales.");
        }

        const conteneur = {
            postProcess: null,
            normalRenderer,
            parametresMiseLumiere
        };

        const ratioRendu = camera?.metadata?.estLoupe3D === true
            ? 1.0
            : this.borner(
                Number(constantesContours.miseLumiereGradients?.normales?.ratioRendu),
                0.5,
                1.0,
                0.85
            );

        const postProcess = new BABYLON.PostProcess(
            "PostTraitMiseLumiereNormales",
            nomShader.replace("PixelShader", ""),
            [
                "screenSize",
                "edgeWidth",
                "normalThreshold",
                "normalChainLength",
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
            ratioRendu,
            camera,
            BABYLON.Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine?.() ?? null,
            false
        );

        conteneur.postProcess = postProcess;

        postProcess.onApply = (effect) => {
            this.appliquerUniforms({
                effect,
                postProcess,
                scene,
                camera,
                normalRenderer,
                parametresContours: scene?.metadata?.saotraEtatApplication?.contours?.parametres ?? null,
                parametresMiseLumiere: conteneur.parametresMiseLumiere
            });
        };

        return conteneur;
    }

    appliquerUniforms({ effect, postProcess, scene, camera, normalRenderer, parametresContours = null, parametresMiseLumiere }) {
        const config = constantesContours.miseLumiereGradients?.normales ?? {};
        const configAnimation = constantesContours.miseLumiereGradients?.animation ?? {};
        const contexteLoupe = this.obtenirContexteLoupe(camera);
        const normalTexture = contexteLoupe?.normalTexture ?? normalRenderer?.getGBuffer?.()?.textures?.[1];
        const params = this.normaliserParametresMiseLumiere(parametresMiseLumiere, configAnimation);

        effect.setTexture("normalSampler", normalTexture);
        const tailleRendu = this.obtenirTailleRenduPostProcess(postProcess, scene, camera);
        effect.setFloat2("screenSize", tailleRendu.largeur, tailleRendu.hauteur);
        effect.setFloat("edgeWidth", params.largeur);
        effect.setFloat("normalThreshold", this.lireNombre(config.seuilGradient, config.seuilHaut, 0.12));
        effect.setFloat("normalChainLength", this.lireNombre(
            parametresContours?.longueurChaineNormales,
            constantesContours.chaineNormales?.defaut,
            7
        ));
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

        const intervalle = this.normaliserIntervalleDepuisFrequenceOuAncienIntervalle(
            parametres,
            configAnimation
        );

        const deltaBrut = Number(parametres?.luminanceDelta);
        const sensDepuisParametres = Number(parametres?.sensLuminance);
        const sens = Number.isFinite(sensDepuisParametres)
            ? (sensDepuisParametres < 0 ? -1 : 1)
            : (deltaBrut < 0 ? -1 : 1);

        const amplitudeLuminance = this.borner(
            Math.abs(deltaBrut),
            Number(luminanceConfig.deltaMin ?? 0.04),
            Number(luminanceConfig.deltaMax ?? 0.16),
            Number(luminanceConfig.deltaDefaut ?? 0.10)
        );

        const luminance = amplitudeLuminance * sens;

        const largeur = this.borner(
            Number(parametres?.largeur),
            Number(largeurConfig.min ?? 1),
            Number(largeurConfig.max ?? 10),
            Number(largeurConfig.defaut ?? 2)
        );

        return { intervalleClignotement: intervalle, luminanceDelta: luminance, largeur };
    }

    normaliserIntervalleDepuisFrequenceOuAncienIntervalle(parametres, configAnimation) {
        const intervalleConfig = configAnimation.intervalleSecondes ?? {};
        const frequenceConfig = configAnimation.frequence ?? intervalleConfig;
        const minIntervalle = Number(intervalleConfig.min ?? 1);
        const maxIntervalle = Number(intervalleConfig.max ?? 4);
        const defautIntervalle = Number(intervalleConfig.defaut ?? 3);

        const frequence = Number(parametres?.frequenceClignotement);

        if (Number.isFinite(frequence)) {
            const minFrequence = Number(frequenceConfig.min ?? minIntervalle);
            const maxFrequence = Number(frequenceConfig.max ?? maxIntervalle);
            const defautFrequence = Number(frequenceConfig.defaut ?? defautIntervalle);

            // Même règle que le contrôleur : la valeur du slider/preset est
            // directement la durée en secondes envoyée au shader.
            return this.borner(frequence, minFrequence, maxFrequence, defautFrequence);
        }

        return this.borner(
            Number(parametres?.intervalleClignotement),
            minIntervalle,
            maxIntervalle,
            defautIntervalle
        );
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

        scene.metadata = {
            ...(scene.metadata ?? {}),
            saotraEtatApplication: etatApplication
        };

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
                frequenceClignotement: animation.frequence?.defaut ?? 3,
                intervalleClignotement: animation.intervalleSecondes.defaut,
                luminanceSliderValeur: animation.luminancePourcentage.defaut,
                luminanceDelta: animation.luminancePourcentage.deltaDefaut,
                sensLuminance: animation.sensLuminance?.defaut ?? 1,
                largeur: animation.largeur.defaut,
                presetActif: null
            };
        }

        return etatApplication.contours.parametresMiseLumiere;
    }

    obtenirContexteLoupe(camera) {
        const contexte = camera?.metadata?.saotraLoupe3D ?? null;
        if (!camera?.metadata?.estLoupe3D || !contexte) return null;
        return contexte;
    }

    obtenirTailleRenduPostProcess(postProcess, scene, camera = null) {
        const contexteLoupe = this.obtenirContexteLoupe(camera);
        const tailleLoupe = contexteLoupe?.renderSize;

        if (tailleLoupe) {
            const largeur = Number(tailleLoupe.largeur);
            const hauteur = Number(tailleLoupe.hauteur);
            if (Number.isFinite(largeur) && largeur > 0 && Number.isFinite(hauteur) && hauteur > 0) {
                return { largeur, hauteur };
            }
        }

        const largeurPostProcess = Number(postProcess?.width);
        const hauteurPostProcess = Number(postProcess?.height);

        if (Number.isFinite(largeurPostProcess) && largeurPostProcess > 0
            && Number.isFinite(hauteurPostProcess) && hauteurPostProcess > 0) {
            return { largeur: largeurPostProcess, hauteur: hauteurPostProcess };
        }

        const moteur = scene?.getEngine?.();
        return {
            largeur: Math.max(1, Number(moteur?.getRenderWidth?.()) || 1),
            hauteur: Math.max(1, Number(moteur?.getRenderHeight?.()) || 1)
        };
    }

    supprimer(etatApplication) {
        const conteneur = etatApplication?.contours?.postTraitMiseLumiereNormales;
        if (conteneur?.postProcess?.dispose) conteneur.postProcess.dispose();
        if (etatApplication?.contours) etatApplication.contours.postTraitMiseLumiereNormales = null;
    }
}
