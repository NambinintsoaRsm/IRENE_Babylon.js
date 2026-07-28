import { TypeContour } from "../../Domain/contours/TypeContour.js";
import { constantesContours } from "../../Configuration/constantesContours.js";
import { couleurHexaVersRgb01 } from "../../Util/CouleurUtils.js";
import { creerShaderContoursProfondeurNormalesSiNecessaire } from "../shaders/ShaderContoursProfondeurNormales.js";
import { creerShadersReliefCannySiNecessaire } from "../shaders/ShaderReliefCanny.js";

export class PostTraitContProfNorm {
    creer(scene, camera, parametresContours) {
        const contexteLoupe = this.obtenirContexteLoupe(camera);

        // Pour l'instant, le vrai Canny est activé uniquement sur la scène principale.
        // La loupe conserve l'ancien post-traitement simple pour éviter de casser son pipeline.
        if (contexteLoupe) {
            return this.creerAncienPipeline(scene, camera, parametresContours, contexteLoupe);
        }

        return this.creerPipelineCanny(scene, camera, parametresContours);
    }

    creerPipelineCanny(scene, camera, parametresContours) {
        const nomsShaders = creerShadersReliefCannySiNecessaire();

        const depthRenderer = scene.enableDepthRenderer(camera);
        const depthMap = depthRenderer?.getDepthMap?.() ?? null;

        const normalRenderer = scene.enableGeometryBufferRenderer();
        if (!normalRenderer) {
            throw new Error("GeometryBufferRenderer indisponible pour les normales.");
        }

        const samplingLineaire = BABYLON.Texture?.BILINEAR_SAMPLINGMODE ?? 2;
        const samplingNearest = BABYLON.Texture?.NEAREST_SAMPLINGMODE ?? 1;

        const copieScene = new BABYLON.PostProcess(
            "PostTraitReliefCanny_CopieScene",
            nomsShaders.copieScene.replace("PixelShader", ""),
            [],
            [],
            1.0,
            camera,
            samplingLineaire
        );

        const gradient = new BABYLON.PostProcess(
            "PostTraitReliefCanny_GradientNormales",
            nomsShaders.gradient.replace("PixelShader", ""),
            [
                "screenSize",
                "prefiltrageActif",
                "rayonPrefiltrage",
                "poidsCentrePrefiltrage",
                "seuilConservationAretes",
                "multiEchelleActif",
                "rayonEchelleMoyenne",
                "poidsEchelleMoyenne"
            ],
            ["normalSampler"],
            1.0,
            camera,
            samplingNearest
        );

        gradient.onApply = (effect) => {
            const gBuffer = normalRenderer?.getGBuffer?.();
            const normalIndex = typeof normalRenderer?.getIndex === "function" && BABYLON.GeometryBufferRenderer?.NORMAL_TEXTURE_TYPE !== undefined
                ? normalRenderer.getIndex(BABYLON.GeometryBufferRenderer.NORMAL_TEXTURE_TYPE)
                : 1;
            const normalTexture = gBuffer?.textures?.[normalIndex] ?? gBuffer?.textures?.[1];
            const prefiltrage = this.obtenirParametresPrefiltrageNormalesCanny();
            const multiEchelle = this.obtenirParametresGradientMultiEchelleCanny();

            effect.setTexture("normalSampler", normalTexture);
            const tailleRendu = this.obtenirTailleRenduPostProcess(gradient, scene, camera);
            effect.setFloat2("screenSize", tailleRendu.largeur, tailleRendu.hauteur);
            effect.setFloat("prefiltrageActif", prefiltrage.actif ? 1.0 : 0.0);
            effect.setFloat("rayonPrefiltrage", prefiltrage.rayon);
            effect.setFloat("poidsCentrePrefiltrage", prefiltrage.poidsCentre);
            effect.setFloat("seuilConservationAretes", prefiltrage.seuilConservationAretes);
            effect.setFloat("multiEchelleActif", multiEchelle.actif ? 1.0 : 0.0);
            effect.setFloat("rayonEchelleMoyenne", multiEchelle.rayonMoyen);
            effect.setFloat("poidsEchelleMoyenne", multiEchelle.poidsMoyen);
        };

        const nms = new BABYLON.PostProcess(
            "PostTraitReliefCanny_NonMaximum",
            nomsShaders.nms.replace("PixelShader", ""),
            ["screenSize", "toleranceNonMaximum"],
            [],
            1.0,
            camera,
            samplingNearest
        );

        nms.onApply = (effect) => {
            const tailleRendu = this.obtenirTailleRenduPostProcess(nms, scene, camera);
            effect.setFloat2("screenSize", tailleRendu.largeur, tailleRendu.hauteur);
            effect.setFloat("toleranceNonMaximum", this.obtenirParametresCanny().toleranceNonMaximum);
        };

        const seuils = new BABYLON.PostProcess(
            "PostTraitReliefCanny_Seuils",
            nomsShaders.seuils.replace("PixelShader", ""),
            ["seuilFaible", "seuilFort"],
            [],
            1.0,
            camera,
            samplingNearest
        );

        seuils.onApply = (effect) => {
            const canny = this.obtenirParametresCanny();
            effect.setFloat("seuilFaible", canny.seuilFaible);
            effect.setFloat("seuilFort", canny.seuilFort);
        };

        const hysteresis = [];
        const nombreIterations = this.obtenirNombreIterationsHysteresis();

        for (let i = 0; i < nombreIterations; i += 1) {
            const postProcessHysteresis = new BABYLON.PostProcess(
                `PostTraitReliefCanny_Hysteresis_${i + 1}`,
                nomsShaders.hysteresis.replace("PixelShader", ""),
                ["screenSize", "utiliserDiagonales"],
                [],
                1.0,
                camera,
                samplingNearest
            );

            postProcessHysteresis.onApply = (effect) => {
                const tailleRendu = this.obtenirTailleRenduPostProcess(postProcessHysteresis, scene, camera);
                effect.setFloat2("screenSize", tailleRendu.largeur, tailleRendu.hauteur);
                effect.setFloat("utiliserDiagonales", this.obtenirParametresCanny().voisinsDiagonaux ? 1.0 : 0.0);
            };

            hysteresis.push(postProcessHysteresis);
        }

        const nettoyageLongueur = new BABYLON.PostProcess(
            "PostTraitReliefCanny_NettoyageLongueur",
            nomsShaders.nettoyageLongueur.replace("PixelShader", ""),
            [
                "screenSize",
                "nettoyageActif",
                "longueurMin",
                "rayonMax",
                "trousMax",
                "exigerDeuxCotes",
                "testerDiagonales",
                "seuilMasque"
            ],
            [],
            1.0,
            camera,
            samplingNearest
        );

        nettoyageLongueur.onApply = (effect) => {
            const tailleRendu = this.obtenirTailleRenduPostProcess(nettoyageLongueur, scene, camera);
            const nettoyage = this.obtenirParametresNettoyageLongueurCanny();

            effect.setFloat2("screenSize", tailleRendu.largeur, tailleRendu.hauteur);
            effect.setFloat("nettoyageActif", nettoyage.actif ? 1.0 : 0.0);
            effect.setFloat("longueurMin", nettoyage.longueurMin);
            effect.setFloat("rayonMax", nettoyage.rayonMax);
            effect.setFloat("trousMax", nettoyage.trousMax);
            effect.setFloat("exigerDeuxCotes", nettoyage.exigerDeuxCotes ? 1.0 : 0.0);
            effect.setFloat("testerDiagonales", nettoyage.testerDiagonales ? 1.0 : 0.0);
            effect.setFloat("seuilMasque", nettoyage.seuilMasque);
        };

        const composition = new BABYLON.PostProcess(
            "PostTraitReliefCanny_Composition",
            nomsShaders.composition.replace("PixelShader", ""),
            [
                "screenSize",
                "depthEdgeWidth",
                "normalEdgeWidth",
                "useDepth",
                "useNormal",
                "depthThreshold",
                "depthColor",
                "normalColor"
            ],
            ["sceneColorSampler", "depthSampler"],
            1.0,
            camera,
            samplingLineaire
        );

        composition.onApply = (effect) => {
            this.appliquerUniformsCompositionCanny({
                effect,
                postProcess: composition,
                scene,
                camera,
                depthMap,
                parametresContours,
                copieScene
            });
        };

        const postProcesses = [
            copieScene,
            gradient,
            nms,
            seuils,
            ...hysteresis,
            nettoyageLongueur,
            composition
        ];

        return {
            postProcess: composition,
            postProcesses,
            depthRenderer,
            normalRenderer,
            mode: "relief-canny"
        };
    }

    creerAncienPipeline(scene, camera, parametresContours, contexteLoupe = null) {
        const nomShader = creerShaderContoursProfondeurNormalesSiNecessaire();

        const depthRenderer = contexteLoupe?.depthTexture
            ? null
            : scene.enableDepthRenderer(camera);
        const depthMap = contexteLoupe?.depthTexture ?? depthRenderer?.getDepthMap?.() ?? null;

        const normalRenderer = contexteLoupe?.normalTexture
            ? null
            : scene.enableGeometryBufferRenderer();

        if (!normalRenderer && !contexteLoupe?.normalTexture) {
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
                "normalChainLength",
                "depthColor",
                "normalColor"
            ],
            ["depthSampler", "normalSampler"],
            1.0,
            camera
        );

        postProcess.onApply = (effect) => {
            this.appliquerUniformsAncienPipeline({ effect, postProcess, scene, camera, depthMap, normalRenderer, parametresContours });
        };

        return { postProcess, depthRenderer, normalRenderer, mode: "ancien" };
    }

    appliquerUniformsCompositionCanny({ effect, postProcess, scene, camera, depthMap, parametresContours, copieScene }) {
        const utiliseSilhouette = this.estContourActif(parametresContours, TypeContour.SILHOUETTE);
        const utiliseRelief = this.estContourActif(parametresContours, TypeContour.RELIEF);
        const epaisseurSlider = this.normaliserEpaisseurSlider(parametresContours?.epaisseur);
        const epaisseurSilhouette = this.calculerEpaisseurPourType(TypeContour.SILHOUETTE, epaisseurSlider);
        const epaisseurRelief = this.calculerEpaisseurPourType(TypeContour.RELIEF, epaisseurSlider);

        if (typeof effect.setTextureFromPostProcess === "function") {
            effect.setTextureFromPostProcess("sceneColorSampler", copieScene);
        }

        effect.setTexture("depthSampler", depthMap);

        const tailleRendu = this.obtenirTailleRenduPostProcess(postProcess, scene, camera);
        effect.setFloat2("screenSize", tailleRendu.largeur, tailleRendu.hauteur);
        effect.setFloat("depthEdgeWidth", epaisseurSilhouette);
        effect.setFloat("normalEdgeWidth", epaisseurRelief);
        effect.setFloat("useDepth", utiliseSilhouette ? 1.0 : 0.0);
        effect.setFloat("useNormal", utiliseRelief ? 1.0 : 0.0);
        effect.setFloat("depthThreshold", constantesContours.seuils[TypeContour.SILHOUETTE]);

        const couleur = couleurHexaVersRgb01(parametresContours.couleur);
        effect.setFloat3("depthColor", couleur.r, couleur.g, couleur.b);
        effect.setFloat3("normalColor", couleur.r, couleur.g, couleur.b);
    }

    appliquerUniformsAncienPipeline({ effect, postProcess, scene, camera, depthMap, normalRenderer, parametresContours }) {
        const utiliseSilhouette = this.estContourActif(parametresContours, TypeContour.SILHOUETTE);
        const utiliseRelief = this.estContourActif(parametresContours, TypeContour.RELIEF);
        const contexteLoupe = this.obtenirContexteLoupe(camera);
        const normalTexture = contexteLoupe?.normalTexture ?? normalRenderer?.getGBuffer?.()?.textures?.[1];
        const profondeurTexture = contexteLoupe?.depthTexture ?? depthMap;
        const epaisseurSlider = this.normaliserEpaisseurSlider(parametresContours?.epaisseur);
        const epaisseurSilhouette = this.calculerEpaisseurPourType(TypeContour.SILHOUETTE, epaisseurSlider);
        const epaisseurRelief = this.calculerEpaisseurPourType(TypeContour.RELIEF, epaisseurSlider);

        effect.setTexture("depthSampler", profondeurTexture);
        effect.setTexture("normalSampler", normalTexture);
        const tailleRendu = this.obtenirTailleRenduPostProcess(postProcess, scene, camera);
        effect.setFloat2("screenSize", tailleRendu.largeur, tailleRendu.hauteur);
        effect.setFloat("depthEdgeWidth", epaisseurSilhouette);
        effect.setFloat("normalEdgeWidth", epaisseurRelief);
        effect.setFloat("useDepth", utiliseSilhouette ? 1.0 : 0.0);
        effect.setFloat("useNormal", utiliseRelief ? 1.0 : 0.0);
        effect.setFloat("depthThreshold", constantesContours.seuils[TypeContour.SILHOUETTE]);
        effect.setFloat("normalThreshold", constantesContours.seuils[TypeContour.RELIEF]);
        effect.setFloat("normalChainLength", this.normaliserLongueurChaineNormales(parametresContours?.longueurChaineNormales));

        const couleur = couleurHexaVersRgb01(parametresContours.couleur);
        effect.setFloat3("depthColor", couleur.r, couleur.g, couleur.b);
        effect.setFloat3("normalColor", couleur.r, couleur.g, couleur.b);
    }

    obtenirParametresGradientMultiEchelleCanny() {
        const config = constantesContours.reliefCanny?.gradientMultiEchelle ?? {};

        const nettoyerNombre = (valeur, defaut, min, max) => {
            const nombre = Number(valeur);
            if (!Number.isFinite(nombre)) {
                return defaut;
            }
            return Math.min(max, Math.max(min, nombre));
        };

        return {
            actif: config.actif !== false,
            rayonMoyen: nettoyerNombre(config.rayonMoyen, 2.0, 1.5, 4.0),
            poidsMoyen: nettoyerNombre(config.poidsMoyen, 0.85, 0.0, 1.5)
        };
    }

    obtenirParametresPrefiltrageNormalesCanny() {
        const config = constantesContours.reliefCanny?.prefiltrageNormales ?? {};

        const nettoyerNombre = (valeur, defaut, min, max) => {
            const nombre = Number(valeur);
            if (!Number.isFinite(nombre)) {
                return defaut;
            }
            return Math.min(max, Math.max(min, nombre));
        };

        return {
            actif: config.actif !== false,
            rayon: nettoyerNombre(config.rayon, 1.0, 1.0, 3.0),
            poidsCentre: nettoyerNombre(config.poidsCentre, 2.0, 1.0, 8.0),
            seuilConservationAretes: nettoyerNombre(config.seuilConservationAretes, 0.72, 0.0, 0.98)
        };
    }

    obtenirParametresNettoyageLongueurCanny() {
        const config = constantesContours.reliefCanny?.nettoyageLongueur ?? {};

        const nettoyerNombre = (valeur, defaut, min, max) => {
            const nombre = Number(valeur);
            if (!Number.isFinite(nombre)) {
                return defaut;
            }
            return Math.min(max, Math.max(min, nombre));
        };

        return {
            actif: config.actif !== false,
            longueurMin: nettoyerNombre(config.longueurMin, 9, 1, 25),
            rayonMax: nettoyerNombre(config.rayonMax, 12, 1, 12),
            trousMax: nettoyerNombre(config.trousMax, 1, 0, 4),
            exigerDeuxCotes: config.exigerDeuxCotes !== false,
            testerDiagonales: config.testerDiagonales !== false,
            seuilMasque: nettoyerNombre(config.seuilMasque, 0.5, 0.05, 0.95)
        };
    }

    obtenirParametresCanny() {
        const config = constantesContours.reliefCanny ?? {};
        const seuilRelief = Number(constantesContours.seuils?.[TypeContour.RELIEF]);

        const seuilFort = Number.isFinite(Number(config.seuilFort))
            ? Number(config.seuilFort)
            : (Number.isFinite(seuilRelief) ? seuilRelief : 0.36);

        const seuilFaible = Number.isFinite(Number(config.seuilFaible))
            ? Number(config.seuilFaible)
            : seuilFort * 0.70;

        return {
            seuilFaible,
            seuilFort,
            iterationsHysteresis: this.obtenirNombreIterationsHysteresis(),
            toleranceNonMaximum: Number.isFinite(Number(config.toleranceNonMaximum))
                ? Number(config.toleranceNonMaximum)
                : 0.92,
            voisinsDiagonaux: config.voisinsDiagonaux === true
        };
    }

    obtenirNombreIterationsHysteresis() {
        const config = constantesContours.reliefCanny ?? {};
        const valeur = Number(config.iterationsHysteresis);

        if (!Number.isFinite(valeur)) {
            return 5;
        }

        return Math.min(8, Math.max(1, Math.round(valeur)));
    }

    normaliserLongueurChaineNormales(longueur) {
        const config = constantesContours.chaineNormales;
        const valeur = Number(longueur);

        if (!Number.isFinite(valeur)) {
            return config.defaut;
        }

        return Math.min(config.max, Math.max(config.min, Math.round(valeur)));
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

        if (typeContour === TypeContour.SILHOUETTE) {
            const epaisseurRenforcee = epaisseurSlider <= slider.min
                ? epaisseurSlider + Number(config.renfortBase ?? 0)
                : epaisseurSlider;

            return Math.min(config.max, Math.max(config.min, epaisseurRenforcee));
        }

        const amplitudeSlider = slider.max - slider.min;
        const progression = amplitudeSlider <= 0
            ? 0
            : (epaisseurSlider - slider.min) / amplitudeSlider;
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

    supprimerConteneur(conteneur) {
        if (!conteneur) return;

        if (Array.isArray(conteneur.postProcesses)) {
            for (let i = conteneur.postProcesses.length - 1; i >= 0; i -= 1) {
                const postProcess = conteneur.postProcesses[i];
                if (postProcess?.dispose) {
                    try {
                        postProcess.dispose();
                    } catch (_) {
                        // rien à faire
                    }
                }
            }
        } else if (conteneur.postProcess?.dispose) {
            try {
                conteneur.postProcess.dispose();
            } catch (_) {
                // rien à faire
            }
        }

        if (conteneur.depthRenderer?.dispose) {
            try {
                conteneur.depthRenderer.dispose();
            } catch (_) {
                // rien à faire
            }
        }
    }

    supprimer(etatApplication) {
        const conteneur = etatApplication?.contours?.postTraitementContoursProfondeurNormales;
        this.supprimerConteneur(conteneur);
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
