import { constantesEntropie } from "../../Configuration/constantesEntropie.js";

/**
 * Service de recherche de vue par entropie visuelle.
 *
 * Principe :
 * - placer la caméra sur une sphère virtuelle autour de l'objet ;
 * - parcourir plusieurs angles horizontaux alpha et verticaux beta ;
 * - rendre chaque vue avec les réglages visuels actuellement actifs ;
 * - lire les pixels du rendu 3D ;
 * - calculer l'entropie de luminance ;
 * - exporter toutes les vues analysées en CSV ;
 * - replacer la caméra sur la vue qui obtient le meilleur score.
 */
export class ServiceEntropieVueBabylon {
    async choisirVue(scene, camera, meshes, options = {}) {
        return this.placerCameraSurVueEntropieMaximale({
            scene,
            camera,
            meshes,
            ...options
        });
    }

    async placerCameraSurVueEntropieMaximale({
        scene,
        camera,
        meshes,
        conserverRayonCourant = false,
        texteResultat = null,
        modeObjetBase = false,
        exporterCsv = constantesEntropie.exportCsv.actif,
        nomFichierCsv = constantesEntropie.exportCsv.nomFichier,
        configuration = constantesEntropie
    } = {}) {
        if (!scene || !camera) {
            throw new Error("Scène ou caméra introuvable pour choisir la vue par entropie.");
        }

        const meshesValides = this.filtrerMeshesAnalysables(meshes);

        if (meshesValides.length === 0) {
            console.warn("Aucun mesh valide pour le calcul de vue par entropie.");
            return null;
        }

        const etatCameraInitial = this.capturerEtatCamera(camera);
        const etatRenduInitial = modeObjetBase
            ? this.preparerAnalyseObjetBase({ scene, camera, meshes: meshesValides, configuration })
            : null;

        const infosModele = this.calculerInfosModele(meshesValides);
        const vues = this.genererVuesSpheriques(configuration.parcoursSpherique);

        const rayonRecherche = this.calculerRayonRecherche({
            camera,
            rayonModele: infosModele.rayon,
            conserverRayonCourant,
            configuration: configuration.parcoursSpherique
        });

        const vuesAnalysees = [];
        let meilleureVue = null;

        try {
            for (let index = 0; index < vues.length; index++) {
                const vue = vues[index];

                camera.alpha = vue.alpha;
                camera.beta = vue.beta;
                camera.radius = rayonRecherche;
                camera.setTarget(infosModele.centre);

                if (texteResultat) {
                    texteResultat.text = `Analyse ${index + 1}/${vues.length}...`;
                    texteResultat._markAsDirty?.();
                }

                await this.rendreEtAttendre(scene);

                const score = await this.calculerScoreImage(scene, configuration.analyseImage);

                const resultatVue = {
                    index: index + 1,
                    alpha: camera.alpha,
                    beta: camera.beta,
                    alphaDegres: vue.alphaDegres,
                    betaDegres: vue.betaDegres,
                    distance: camera.radius,
                    rayonObjet: infosModele.rayon,
                    cible: infosModele.centre.clone(),
                    ...score
                };

                vuesAnalysees.push(resultatVue);

                if (!meilleureVue || resultatVue.scoreGlobal > meilleureVue.scoreGlobal) {
                    meilleureVue = resultatVue;
                }
            }
        } finally {
            if (etatRenduInitial) {
                this.restaurerAnalyseObjetBase(etatRenduInitial);
            }
        }

        if (!meilleureVue) {
            this.restaurerEtatCamera(camera, etatCameraInitial);

            if (texteResultat) {
                texteResultat.text = "Vue optimale : erreur";
            }

            return null;
        }

        camera.alpha = meilleureVue.alpha;
        camera.beta = meilleureVue.beta;
        camera.radius = meilleureVue.distance;
        camera.setTarget(meilleureVue.cible);

        await this.rendreEtAttendre(scene);

        const csv = this.creerCsvVuesEntropie({
            vuesAnalysees,
            infosModele,
            configuration
        });

        if (exporterCsv) {
            this.telechargerCsv(csv, nomFichierCsv);
        }

        if (texteResultat) {
            texteResultat.text = `Vue optimale : ${Math.round(meilleureVue.scoreGlobal * 100)}%`;
            texteResultat._markAsDirty?.();
        }

        return {
            ...meilleureVue,
            vuesAnalysees,
            csv,
            configurationEntropie: configuration
        };
    }

    filtrerMeshesAnalysables(meshes) {
        if (!Array.isArray(meshes)) {
            return [];
        }

        return meshes.filter((mesh) => {
            if (!mesh) return false;
            if (mesh.isDisposed?.()) return false;
            if (mesh.isVisible === false) return false;
            if (!mesh.getBoundingInfo) return false;
            if (mesh.getTotalVertices && mesh.getTotalVertices() <= 0) return false;
            return true;
        });
    }

    capturerEtatCamera(camera) {
        return {
            alpha: camera.alpha,
            beta: camera.beta,
            radius: camera.radius,
            target: camera.target?.clone?.() ?? BABYLON.Vector3.Zero()
        };
    }

    restaurerEtatCamera(camera, etatCamera) {
        camera.alpha = etatCamera.alpha;
        camera.beta = etatCamera.beta;
        camera.radius = etatCamera.radius;
        camera.setTarget(etatCamera.target);
    }

    preparerAnalyseObjetBase({ camera, meshes, configuration }) {
        const etat = {
            postProcessStates: [],
            materiauxStates: []
        };

        const modeAnalyse = configuration.modeAnalyse ?? configuration.modeObjetBase ?? {};

        if (modeAnalyse.desactiverPostTraitements) {
            const postProcesses = Array.isArray(camera?._postProcesses)
                ? camera._postProcesses.filter(Boolean)
                : [];

            etat.postProcessStates = postProcesses.map((postProcess) => ({
                postProcess,
                isEnabled: postProcess.isEnabled,
                _isEnabled: postProcess._isEnabled
            }));

            etat.postProcessStates.forEach(({ postProcess }) => {
                if ("isEnabled" in postProcess) {
                    postProcess.isEnabled = false;
                }

                if ("_isEnabled" in postProcess) {
                    postProcess._isEnabled = false;
                }
            });
        }

        if (modeAnalyse.restaurerMateriauxOriginauxPendantAnalyse) {
            meshes.forEach((mesh) => {
                if (!mesh) return;

                etat.materiauxStates.push({
                    mesh,
                    material: mesh.material
                });

                if (mesh.metadata?.materiauOriginal) {
                    mesh.material = mesh.metadata.materiauOriginal;
                }
            });
        }

        return etat;
    }

    restaurerAnalyseObjetBase(etat) {
        etat.postProcessStates.forEach(({ postProcess, isEnabled, _isEnabled }) => {
            if (!postProcess) return;

            if ("isEnabled" in postProcess) {
                postProcess.isEnabled = isEnabled;
            }

            if ("_isEnabled" in postProcess) {
                postProcess._isEnabled = _isEnabled;
            }
        });

        etat.materiauxStates.forEach(({ mesh, material }) => {
            if (mesh && !mesh.isDisposed?.()) {
                mesh.material = material;
            }
        });
    }

    calculerInfosModele(meshes) {
        let minimum = null;
        let maximum = null;

        meshes.forEach((mesh) => {
            mesh.computeWorldMatrix(true);

            const boundingBox = mesh.getBoundingInfo().boundingBox;
            const min = boundingBox.minimumWorld;
            const max = boundingBox.maximumWorld;

            if (!minimum) {
                minimum = min.clone();
                maximum = max.clone();
                return;
            }

            minimum = BABYLON.Vector3.Minimize(minimum, min);
            maximum = BABYLON.Vector3.Maximize(maximum, max);
        });

        const centre = minimum && maximum
            ? BABYLON.Vector3.Center(minimum, maximum)
            : BABYLON.Vector3.Zero();

        const dimensions = minimum && maximum
            ? maximum.subtract(minimum)
            : new BABYLON.Vector3(1, 1, 1);

        const rayon = Math.max(dimensions.x, dimensions.y, dimensions.z, 0.5) / 2;

        return {
            centre,
            dimensions,
            rayon
        };
    }

    calculerRayonRecherche({ camera, rayonModele, conserverRayonCourant, configuration }) {
        const rayonCourant = Number(camera.radius) || rayonModele * configuration.facteurRayonObjet;
        const rayonAuto = Math.max(
            rayonModele * configuration.facteurRayonObjet,
            configuration.distanceMinimale
        );

        let rayon = conserverRayonCourant ? rayonCourant : rayonAuto;

        if (Number.isFinite(camera.lowerRadiusLimit) && camera.lowerRadiusLimit > 0) {
            rayon = Math.max(rayon, camera.lowerRadiusLimit);
        }

        if (Number.isFinite(camera.upperRadiusLimit) && camera.upperRadiusLimit > 0) {
            rayon = Math.min(rayon, camera.upperRadiusLimit);
        }

        return rayon;
    }

    genererVuesSpheriques(configuration) {
        const vues = [];
        const pasAlpha = Math.max(1, Number(configuration.pasAlphaDegres) || 30);
        const betasDegres = Array.isArray(configuration.betasDegres)
            ? configuration.betasDegres
            : [20, 45, 70, 90, 110, 135, 160];

        for (const betaDegres of betasDegres) {
            for (let alphaDegres = 0; alphaDegres < 360; alphaDegres += pasAlpha) {
                vues.push({
                    alphaDegres,
                    betaDegres,
                    alpha: this.degresVersRadians(alphaDegres),
                    beta: this.limiterBeta(this.degresVersRadians(betaDegres))
                });
            }
        }

        return vues;
    }

    degresVersRadians(degres) {
        return Number(degres) * Math.PI / 180;
    }

    radiansVersDegres(radians) {
        return Number(radians) * 180 / Math.PI;
    }

    limiterBeta(beta) {
        const marge = 0.08;
        return Math.max(marge, Math.min(Math.PI - marge, beta));
    }

    rendreEtAttendre(scene) {
        return new Promise((resolve) => {
            scene.onAfterRenderObservable.addOnce(() => {
                requestAnimationFrame(() => resolve());
            });

            scene.render();
        });
    }

    async calculerScoreImage(scene, configurationAnalyse) {
        const engine = scene.getEngine();
        const width = engine.getRenderWidth(true);
        const height = engine.getRenderHeight(true);

        let pixels;

        try {
            pixels = engine.readPixels(0, 0, width, height);

            // Selon le backend Babylon/WebGL/WebGPU, readPixels peut renvoyer
            // directement un tableau de pixels ou une Promise. Sans await, les
            // composantes RGB deviennent undefined et toute l'entropie vaut 0.
            if (pixels && typeof pixels.then === "function") {
                pixels = await pixels;
            }
        } catch (erreur) {
            console.warn("Impossible de lire les pixels pour l'entropie.", erreur);

            return this.creerScoreImageVide();
        }

        const donneesPixels = pixels?.data ?? pixels;

        if (!donneesPixels || typeof donneesPixels.length !== "number" || donneesPixels.length === 0) {
            console.warn("Lecture des pixels vide pour le calcul d'entropie.");
            return this.creerScoreImageVide();
        }

        return this.calculerScoreDepuisPixels(donneesPixels, width, height, configurationAnalyse);
    }

    creerScoreImageVide() {
        return {
            scoreGlobal: 0,
            entropieBrute: 0,
            entropieNormalisee: 0,
            contrasteNormalise: 0,
            pixelsAnalyses: 0
        };
    }

    calculerScoreDepuisPixels(pixels, width, height, configurationAnalyse) {
        const nombreClasses = configurationAnalyse.nombreClassesHistogramme ?? 256;
        const histogramme = new Array(nombreClasses).fill(0);
        const valeursGris = [];

        const marge = Number(configurationAnalyse.margeZoneCentrale ?? 0.12);
        const margeX = Math.floor(width * marge);
        const margeY = Math.floor(height * marge);
        const xMin = margeX;
        const xMax = width - margeX;
        const yMin = margeY;
        const yMax = height - margeY;

        const resolutionAnalyse = Number(configurationAnalyse.resolutionAnalyse ?? 220);
        const pas = Math.max(1, Math.floor(Math.min(width, height) / resolutionAnalyse));

        for (let y = yMin; y < yMax; y += pas) {
            for (let x = xMin; x < xMax; x += pas) {
                const index = (y * width + x) * 4;

                const r = this.normaliserCanalPixel(pixels[index]);
                const g = this.normaliserCanalPixel(pixels[index + 1]);
                const b = this.normaliserCanalPixel(pixels[index + 2]);

                // Luminance perceptuelle simple utilisée pour l'histogramme d'entropie.
                const gris = Math.round(
                    0.299 * r +
                    0.587 * g +
                    0.114 * b
                );

                if (!Number.isFinite(gris)) {
                    continue;
                }

                const classe = Math.max(0, Math.min(nombreClasses - 1, gris));
                histogramme[classe]++;
                valeursGris.push(classe);
            }
        }

        const entropieBrute = this.calculerEntropieHistogramme(histogramme, valeursGris.length);
        const entropieMaximale = Math.log2(nombreClasses);
        const entropieNormalisee = this.limiterEntre0Et1(entropieBrute / entropieMaximale);
        const contrasteNormalise = this.calculerContrasteNormalise(valeursGris);

        // Pour ce test, le score est volontairement l'entropie normalisée seule.
        // Le contraste est exporté à titre de diagnostic, mais il ne pondère pas le score.
        const scoreGlobal = entropieNormalisee;

        return {
            scoreGlobal,
            entropieBrute,
            entropieNormalisee,
            contrasteNormalise,
            pixelsAnalyses: valeursGris.length
        };
    }

    normaliserCanalPixel(valeur) {
        const nombre = Number(valeur);

        if (!Number.isFinite(nombre)) {
            return 0;
        }

        // Certains backends retournent des pixels en flottants normalisés [0, 1],
        // d'autres en entiers [0, 255]. On ramène toujours la valeur en [0, 255].
        if (nombre >= 0 && nombre <= 1) {
            return nombre * 255;
        }

        return Math.max(0, Math.min(255, nombre));
    }

    calculerEntropieHistogramme(histogramme, total) {
        if (!total) {
            return 0;
        }

        let entropie = 0;

        histogramme.forEach((nombre) => {
            if (nombre === 0) {
                return;
            }

            const p = nombre / total;
            entropie -= p * Math.log2(p);
        });

        return entropie;
    }

    calculerContrasteNormalise(valeurs) {
        if (!valeurs.length) {
            return 0;
        }

        const moyenne = valeurs.reduce((somme, valeur) => somme + valeur, 0) / valeurs.length;
        const variance = valeurs.reduce((somme, valeur) => {
            const ecart = valeur - moyenne;
            return somme + ecart * ecart;
        }, 0) / valeurs.length;

        const ecartType = Math.sqrt(variance);

        // 64 est une valeur empirique : au-delà, l'image est déjà très contrastée.
        return this.limiterEntre0Et1(ecartType / 64);
    }

    creerCsvVuesEntropie({ vuesAnalysees, infosModele, configuration }) {
        const lignes = [];
        const c = infosModele.centre;
        const dimensions = infosModele.dimensions;
        const parcours = configuration.parcoursSpherique;

        lignes.push([
            "index",
            "alpha_degres",
            "beta_degres",
            "distance_camera_centre",
            "rayon_objet",
            "score_entropie_normalise",
            "entropie_brute_bits",
            "contraste_normalise_diagnostic",
            "pixels_analyses",
            "centre_x",
            "centre_y",
            "centre_z",
            "dimension_x",
            "dimension_y",
            "dimension_z",
            "pas_alpha_degres",
            "betas_degres",
            "distance_formule"
        ].join(";"));

        vuesAnalysees.forEach((vue) => {
            lignes.push([
                vue.index,
                this.formaterNombre(vue.alphaDegres),
                this.formaterNombre(vue.betaDegres),
                this.formaterNombre(vue.distance),
                this.formaterNombre(vue.rayonObjet),
                this.formaterNombre(vue.scoreGlobal),
                this.formaterNombre(vue.entropieBrute),
                this.formaterNombre(vue.contrasteNormalise),
                vue.pixelsAnalyses,
                this.formaterNombre(c.x),
                this.formaterNombre(c.y),
                this.formaterNombre(c.z),
                this.formaterNombre(dimensions.x),
                this.formaterNombre(dimensions.y),
                this.formaterNombre(dimensions.z),
                this.formaterNombre(parcours.pasAlphaDegres),
                `"${parcours.betasDegres.join(",")}"`,
                `"max(rayonObjet * ${parcours.facteurRayonObjet}, ${parcours.distanceMinimale})"`
            ].join(";"));
        });

        return lignes.join("\n");
    }

    telechargerCsv(contenuCsv, nomFichier) {
        if (typeof document === "undefined" || typeof Blob === "undefined") {
            return;
        }

        const blob = new Blob([contenuCsv], {
            type: "text/csv;charset=utf-8"
        });

        const url = URL.createObjectURL(blob);
        const lien = document.createElement("a");
        lien.href = url;
        lien.download = nomFichier || "entropie_vues.csv";
        lien.style.display = "none";
        document.body.appendChild(lien);
        lien.click();
        document.body.removeChild(lien);

        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    formaterNombre(valeur) {
        const nombre = Number(valeur);

        if (!Number.isFinite(nombre)) {
            return "";
        }

        return nombre.toFixed(6).replace(".", ",");
    }

    limiterEntre0Et1(valeur) {
        return Math.max(0, Math.min(1, Number(valeur) || 0));
    }
}
