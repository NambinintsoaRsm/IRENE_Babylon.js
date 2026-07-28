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
                "colorSampleRadiusMin",
                "colorSampleRadiusMax",
                "colorThicknessSliderMin",
                "colorThicknessSliderMax",
                "colorMaskPower",
                "colorAntiFlickerEnabled",
                "colorAntiFlickerSnapUv",
                "colorAntiFlickerCenterThreshold",
                "colorAntiFlickerNeighborThreshold",
                "colorAntiFlickerMinNeighbors",
                "colorAntiFlickerNeighborRadius",
                "colorAntiFlickerHardMask",
                "colorEdgeColor"
            ],
            null,
            1.0,
            camera
        );

        postProcess.onApply = (effect) => {
            this.appliquerUniforms({ effect, postProcess, scene, camera, parametresContours });
        };

        return postProcess;
    }

    appliquerUniforms({ effect, postProcess, scene, camera, parametresContours }) {
        const utiliseCouleur = this.estContourActif(parametresContours, TypeContour.COULEUR);
        const epaisseurSlider = this.normaliserEpaisseurSlider(parametresContours?.epaisseur);
        const epaisseurCouleur = this.calculerEpaisseurPourType(TypeContour.COULEUR, epaisseurSlider);

        const tailleRendu = this.obtenirTailleRenduPostProcess(postProcess, scene, camera);
        const config = this.obtenirConfigurationCouleurPerceptuelle();
        const seuilDesactive = 10000;

        effect.setFloat2("screenSize", tailleRendu.largeur, tailleRendu.hauteur);
        effect.setFloat("edgeWidth", epaisseurCouleur);
        effect.setFloat("colorLowThreshold", utiliseCouleur ? config.seuilFaible : seuilDesactive);
        effect.setFloat("colorHighThreshold", utiliseCouleur ? config.seuilFort : seuilDesactive);
        effect.setFloat("colorThresholdSmoothLow", config.lissageBas);
        effect.setFloat("colorThresholdSmoothHigh", config.lissageHaut);
        effect.setFloat("colorLightnessWeight", config.poidsLuminance);
        effect.setFloat("colorChromaWeight", config.poidsChromatique);
        effect.setFloat("colorChainRadius", config.rayonRecherche);
        effect.setFloat("colorMinSupport", config.supportsMin);
        effect.setFloat("colorMinSupportPerSide", config.supportsMinParCote);
        effect.setFloat("colorMaxGaps", config.trousMax);
        effect.setFloat("colorVeryStrongFactor", config.multiplicateurTresFort);
        effect.setFloat("colorVeryStrongSupportReduction", config.reductionSupportsTresFort);
        effect.setFloat("colorVeryStrongSideReduction", config.reductionSupportsParCoteTresFort);
        effect.setFloat("colorNoiseValidationEnabled", config.validationBruitActive);
        effect.setFloat("colorNoiseValidationRadius", config.rayonValidationBruit);
        effect.setFloat("colorNoiseValidationMinRatio", config.forceValidationBruitMin);
        effect.setFloat("colorContinuityEnabled", config.continuiteActive);
        effect.setFloat("colorContinuityBridgeThreshold", config.forceMinPont);
        effect.setFloat("colorContinuityMinSupport", config.supportsMinPont);
        effect.setFloat("colorContinuityMinSupportPerSide", config.supportsMinParCotePont);
        effect.setFloat("colorContinuityMaxGaps", config.trousMaxPont);
        effect.setFloat("colorSampleRadiusMin", config.rayonEchantillonnageMin);
        effect.setFloat("colorSampleRadiusMax", config.rayonEchantillonnageMax);
        effect.setFloat("colorThicknessSliderMin", config.sliderEpaisseurMin);
        effect.setFloat("colorThicknessSliderMax", config.sliderEpaisseurMax);
        effect.setFloat("colorMaskPower", config.puissanceMasque);
        effect.setFloat("colorAntiFlickerEnabled", config.antiClignotementActif);
        effect.setFloat("colorAntiFlickerSnapUv", config.antiClignotementQuantificationPixel);
        effect.setFloat("colorAntiFlickerCenterThreshold", config.antiClignotementSeuilCentre);
        effect.setFloat("colorAntiFlickerNeighborThreshold", config.antiClignotementSeuilVoisin);
        effect.setFloat("colorAntiFlickerMinNeighbors", config.antiClignotementVoisinsMin);
        effect.setFloat("colorAntiFlickerNeighborRadius", config.antiClignotementRayonVoisinage);
        effect.setFloat("colorAntiFlickerHardMask", config.antiClignotementMasqueFranc);

        const couleur = couleurHexaVersRgb01(parametresContours.couleur);
        effect.setFloat3("colorEdgeColor", couleur.r, couleur.g, couleur.b);
    }

    obtenirConfigurationCouleurPerceptuelle() {
        const source = constantesContours.contourCouleurPerceptuel ?? {};
        const metrique = source.metrique ?? {};
        const seuils = source.seuils ?? {};
        const chainage = source.chainage ?? {};
        const bordTresFort = chainage.bordTresFort ?? {};
        const epaisseur = source.epaisseur ?? {};
        const rendu = source.rendu ?? {};
        const antiClignotement = source.antiClignotement ?? {};
        const bruit = source.bruit ?? {};
        const continuite = source.continuite ?? {};

        const rayonMin = this.lireNombre(chainage.rayonMin, 1);
        const rayonMax = Math.max(rayonMin, this.lireNombre(chainage.rayonMax, 6));
        const rayonRecherche = this.borner(
            this.lireNombre(chainage.rayonRecherche, 3),
            rayonMin,
            rayonMax
        );
        const nombreEchantillons = 1 + 2 * Math.round(rayonRecherche);
        const echantillonsParCote = Math.round(rayonRecherche);

        const seuilFaible = Math.max(0.000001, this.lireNombre(seuils.faible, 0.045));
        const seuilFort = Math.max(
            seuilFaible * 1.01,
            this.lireNombre(seuils.fort, 0.085)
        );

        const sliderGlobal = constantesContours.epaisseurSlider ?? {};
        const sliderMin = this.lireNombre(epaisseur.sliderMin, this.lireNombre(sliderGlobal.min, 1));
        const sliderMax = Math.max(
            sliderMin + 0.001,
            this.lireNombre(epaisseur.sliderMax, this.lireNombre(sliderGlobal.max, 2))
        );
        const rayonEchantillonnageMin = this.borner(
            this.lireNombre(epaisseur.rayonTaille1 ?? epaisseur.rayonEchantillonnageMin, 1.25),
            0.5,
            3.0
        );

        return {
            seuilFaible,
            seuilFort,
            lissageBas: this.borner(this.lireNombre(seuils.lissageBas, 0.82), 0.05, 0.99),
            lissageHaut: Math.max(1.001, this.lireNombre(seuils.lissageHaut, 1.18)),
            poidsLuminance: Math.max(0, this.lireNombre(metrique.poidsLuminance, 0.35)),
            poidsChromatique: Math.max(0, this.lireNombre(metrique.poidsChromatique, 1.10)),
            rayonRecherche,
            supportsMin: this.borner(
                this.lireNombre(chainage.supportsMin, 6),
                1,
                nombreEchantillons
            ),
            supportsMinParCote: this.borner(
                this.lireNombre(chainage.supportsMinParCote, 2),
                0,
                echantillonsParCote
            ),
            trousMax: this.borner(
                this.lireNombre(chainage.trousMax, 1),
                0,
                nombreEchantillons - 1
            ),
            multiplicateurTresFort: Math.max(
                1.01,
                this.lireNombre(bordTresFort.multiplicateurSeuil, 1.55)
            ),
            reductionSupportsTresFort: this.borner(
                this.lireNombre(bordTresFort.reductionSupports, 1.0),
                0,
                nombreEchantillons - 1
            ),
            reductionSupportsParCoteTresFort: this.borner(
                this.lireNombre(bordTresFort.reductionSupportsParCote, 0.5),
                0,
                echantillonsParCote
            ),
            validationBruitActive: bruit.validationMultiEchelle === false ? 0 : 1,
            rayonValidationBruit: this.borner(
                this.lireNombre(bruit.rayonValidation, 2.35),
                1.05,
                4.0
            ),
            forceValidationBruitMin: this.borner(
                this.lireNombre(bruit.forceValidationMin, 0.52),
                0.05,
                0.98
            ),
            continuiteActive: continuite.fermeturePetitsTrous === false ? 0 : 1,
            forceMinPont: this.borner(
                this.lireNombre(continuite.forceMinPont, 0.030),
                0.001,
                seuilFaible
            ),
            supportsMinPont: this.borner(
                this.lireNombre(continuite.supportsMinPont, 4),
                1,
                nombreEchantillons
            ),
            supportsMinParCotePont: this.borner(
                this.lireNombre(continuite.supportsMinParCotePont, 1),
                0,
                echantillonsParCote
            ),
            trousMaxPont: this.borner(
                this.lireNombre(continuite.trousMaxPont, 2),
                0,
                nombreEchantillons - 1
            ),
            rayonEchantillonnageMin,
            rayonEchantillonnageMax: this.borner(
                this.lireNombre(epaisseur.rayonTaille2 ?? epaisseur.rayonEchantillonnageMax, 1.80),
                rayonEchantillonnageMin,
                4.0
            ),
            sliderEpaisseurMin: sliderMin,
            sliderEpaisseurMax: sliderMax,
            puissanceMasque: this.borner(
                this.lireNombre(rendu.puissanceMasque, 0.72),
                0.05,
                4.0
            ),
            antiClignotementActif: antiClignotement.actif === false ? 0 : 1,
            antiClignotementQuantificationPixel: antiClignotement.quantificationPixel === false ? 0 : 1,
            antiClignotementSeuilCentre: this.borner(
                this.lireNombre(antiClignotement.seuilCentre, 0.48),
                0.05,
                0.95
            ),
            antiClignotementSeuilVoisin: this.borner(
                this.lireNombre(antiClignotement.seuilVoisin, 0.34),
                0.02,
                0.95
            ),
            antiClignotementVoisinsMin: this.borner(
                this.lireNombre(antiClignotement.voisinsMin, 2),
                0,
                4
            ),
            antiClignotementRayonVoisinage: this.borner(
                this.lireNombre(antiClignotement.rayonVoisinage, 1.0),
                0.5,
                2.5
            ),
            antiClignotementMasqueFranc: antiClignotement.masqueFranc === false ? 0 : 1
        };
    }

    lireNombre(valeur, defaut) {
        const nombre = Number(valeur);
        return Number.isFinite(nombre) ? nombre : defaut;
    }

    borner(valeur, min, max) {
        return Math.min(max, Math.max(min, valeur));
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
