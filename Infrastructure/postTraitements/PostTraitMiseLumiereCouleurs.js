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
                "colorLowThreshold",
                "colorHighThreshold",
                "colorThresholdSmoothLow",
                "colorThresholdSmoothHigh",
                "colorLightnessWeight",
                "colorChromaWeight",
                "colorChainRadius",
                "colorMinSupport",
                "colorMinSupportPerSide",
                "colorMaxGaps",
                "colorVeryStrongFactor",
                "colorVeryStrongSupportReduction",
                "colorVeryStrongSideReduction",
                "colorNoiseValidationEnabled",
                "colorNoiseValidationRadius",
                "colorNoiseValidationMinRatio",
                "colorContinuityEnabled",
                "colorContinuityBridgeThreshold",
                "colorContinuityMinSupport",
                "colorContinuityMinSupportPerSide",
                "colorContinuityMaxGaps",
                "colorSampleRadius",
                "colorHighlightSampleMultiplier",
                "colorMaskPower",
                "intensity",
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
            this.appliquerUniforms({ effect, postProcess, scene, camera, parametresMiseLumiere });
        };

        return postProcess;
    }

    appliquerUniforms({ effect, postProcess, scene, camera, parametresMiseLumiere }) {
        const config = constantesContours.miseLumiereGradients?.couleurs ?? {};
        const configAnimation = constantesContours.miseLumiereGradients?.animation ?? {};
        const configCouleur = this.obtenirConfigurationCouleurPerceptuelle();
        const params = this.normaliserParametresMiseLumiere(parametresMiseLumiere, configAnimation);

        const tailleRendu = this.obtenirTailleRenduPostProcess(postProcess, scene, camera);
        effect.setFloat2("screenSize", tailleRendu.largeur, tailleRendu.hauteur);
        effect.setFloat("edgeWidth", params.largeur);
        effect.setFloat("colorLowThreshold", configCouleur.seuilFaible);
        effect.setFloat("colorHighThreshold", configCouleur.seuilFort);
        effect.setFloat("colorThresholdSmoothLow", configCouleur.lissageBas);
        effect.setFloat("colorThresholdSmoothHigh", configCouleur.lissageHaut);
        effect.setFloat("colorLightnessWeight", configCouleur.poidsLuminance);
        effect.setFloat("colorChromaWeight", configCouleur.poidsChromatique);
        effect.setFloat("colorChainRadius", configCouleur.rayonRecherche);
        effect.setFloat("colorMinSupport", configCouleur.supportsMin);
        effect.setFloat("colorMinSupportPerSide", configCouleur.supportsMinParCote);
        effect.setFloat("colorMaxGaps", configCouleur.trousMax);
        effect.setFloat("colorVeryStrongFactor", configCouleur.multiplicateurTresFort);
        effect.setFloat("colorVeryStrongSupportReduction", configCouleur.reductionSupportsTresFort);
        effect.setFloat("colorVeryStrongSideReduction", configCouleur.reductionSupportsParCoteTresFort);
        effect.setFloat("colorNoiseValidationEnabled", configCouleur.validationBruitActive);
        effect.setFloat("colorNoiseValidationRadius", configCouleur.rayonValidationBruit);
        effect.setFloat("colorNoiseValidationMinRatio", configCouleur.forceValidationBruitMin);
        effect.setFloat("colorContinuityEnabled", configCouleur.continuiteActive);
        effect.setFloat("colorContinuityBridgeThreshold", configCouleur.forceMinPont);
        effect.setFloat("colorContinuityMinSupport", configCouleur.supportsMinPont);
        effect.setFloat("colorContinuityMinSupportPerSide", configCouleur.supportsMinParCotePont);
        effect.setFloat("colorContinuityMaxGaps", configCouleur.trousMaxPont);
        effect.setFloat("colorSampleRadius", configCouleur.rayonEchantillonnage);
        effect.setFloat("colorHighlightSampleMultiplier", configCouleur.multiplicateurHighlight);
        effect.setFloat("colorMaskPower", configCouleur.puissanceMasque);
        effect.setFloat("intensity", this.lireNombre(config.intensite, null, 1));
        effect.setFloat("time", this.lireTempsSecondes());
        effect.setFloat("blinkInterval", params.intervalleClignotement);
        effect.setFloat("blinkMinFactor", this.lireNombre(configAnimation.clignotement?.facteurMinimal, null, 0.45));
        effect.setFloat("luminanceDelta", params.luminanceDelta);
        effect.setFloat("minLightness", this.lireNombre(configAnimation.securiteLuminosite?.minLightness, null, 0.08));
        effect.setFloat("maxLightness", this.lireNombre(configAnimation.securiteLuminosite?.maxLightness, null, 0.92));
    }

    obtenirConfigurationCouleurPerceptuelle() {
        const source = constantesContours.contourCouleurPerceptuel ?? {};
        const metrique = source.metrique ?? {};
        const seuils = source.seuils ?? {};
        const chainage = source.chainage ?? {};
        const bordTresFort = chainage.bordTresFort ?? {};
        const epaisseur = source.epaisseur ?? {};
        const rendu = source.rendu ?? {};
        const bruit = source.bruit ?? {};
        const continuite = source.continuite ?? {};

        const seuilFaible = Math.max(0.000001, this.lireNombre(seuils.faible, null, 0.030));
        const seuilFort = Math.max(
            seuilFaible * 1.01,
            this.lireNombre(seuils.fort, null, 0.065)
        );
        const rayonMin = this.lireNombre(chainage.rayonMin, null, 1);
        const rayonMax = Math.max(rayonMin, this.lireNombre(chainage.rayonMax, null, 6));
        const rayonRecherche = this.borner(
            this.lireNombre(chainage.rayonRecherche, null, 4),
            rayonMin,
            rayonMax,
            4
        );
        const nombreEchantillons = 1 + 2 * Math.round(rayonRecherche);
        const echantillonsParCote = Math.round(rayonRecherche);
        const rayonEchantillonnage = this.borner(
            this.lireNombre(epaisseur.rayonEchantillonnageMin, rendu.rayonEchantillonnage, 1.0),
            0.5,
            3.0,
            1.0
        );

        return {
            seuilFaible,
            seuilFort,
            lissageBas: this.borner(this.lireNombre(seuils.lissageBas, null, 0.82), 0.05, 0.99, 0.82),
            lissageHaut: Math.max(1.001, this.lireNombre(seuils.lissageHaut, null, 1.18)),
            poidsLuminance: Math.max(0, this.lireNombre(metrique.poidsLuminance, null, 0.45)),
            poidsChromatique: Math.max(0, this.lireNombre(metrique.poidsChromatique, null, 1.25)),
            rayonRecherche,
            supportsMin: this.borner(
                this.lireNombre(chainage.supportsMin, null, 5),
                1,
                nombreEchantillons,
                5
            ),
            supportsMinParCote: this.borner(
                this.lireNombre(chainage.supportsMinParCote, null, 2),
                0,
                echantillonsParCote,
                2
            ),
            trousMax: this.borner(
                this.lireNombre(chainage.trousMax, null, 4),
                0,
                nombreEchantillons - 1,
                4
            ),
            multiplicateurTresFort: Math.max(
                1.01,
                this.lireNombre(bordTresFort.multiplicateurSeuil, null, 1.55)
            ),
            reductionSupportsTresFort: this.borner(
                this.lireNombre(bordTresFort.reductionSupports, null, 1.0),
                0,
                nombreEchantillons - 1,
                1.0
            ),
            reductionSupportsParCoteTresFort: this.borner(
                this.lireNombre(bordTresFort.reductionSupportsParCote, null, 0.5),
                0,
                echantillonsParCote,
                0.5
            ),
            validationBruitActive: bruit.validationMultiEchelle === false ? 0 : 1,
            rayonValidationBruit: this.borner(
                this.lireNombre(bruit.rayonValidation, null, 2.35),
                1.05,
                4.0,
                2.35
            ),
            forceValidationBruitMin: this.borner(
                this.lireNombre(bruit.forceValidationMin, null, 0.52),
                0.05,
                0.98,
                0.52
            ),
            continuiteActive: continuite.fermeturePetitsTrous === false ? 0 : 1,
            forceMinPont: this.borner(
                this.lireNombre(continuite.forceMinPont, null, 0.030),
                0.001,
                seuilFaible,
                0.030
            ),
            supportsMinPont: this.borner(
                this.lireNombre(continuite.supportsMinPont, null, 4),
                1,
                nombreEchantillons,
                4
            ),
            supportsMinParCotePont: this.borner(
                this.lireNombre(continuite.supportsMinParCotePont, null, 1),
                0,
                echantillonsParCote,
                1
            ),
            trousMaxPont: this.borner(
                this.lireNombre(continuite.trousMaxPont, null, 2),
                0,
                nombreEchantillons - 1,
                2
            ),
            rayonEchantillonnage,
            multiplicateurHighlight: this.borner(
                this.lireNombre(rendu.multiplicateurHighlightMax, null, 2.1),
                1.0,
                3.5,
                2.1
            ),
            puissanceMasque: this.borner(
                this.lireNombre(rendu.puissanceMasque, null, 0.72),
                0.05,
                4.0,
                0.72
            )
        };
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
        const postProcess = etatApplication?.contours?.postTraitMiseLumiereCouleurs;
        if (postProcess?.dispose) postProcess.dispose();
        if (etatApplication?.contours) etatApplication.contours.postTraitMiseLumiereCouleurs = null;
    }
}
