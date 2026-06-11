/**
 * Service de recherche de vue par entropie visuelle.
 *
 * Le principe est le même que dans l'ancien app.js :
 * - faire tourner temporairement la caméra autour du modèle ;
 * - rendre chaque vue ;
 * - lire les pixels du rendu ;
 * - calculer un score d'entropie ;
 * - conserver la vue la plus informative ;
 * - replacer la caméra sur cette vue.
 *
 * Contrairement au calcul de démarrage isolé, cette version prend en compte
 * l'environnement actuellement affiché : fond de scène, lumière, texture,
 * contraste, luminosité, saturation et netteté.
 */
export class ServiceEntropieVueBabylon {
    async choisirVue(scene, camera, meshes, options = {}) {
        return this.placerCameraSurVueEntropieMaximale({
            scene,
            camera,
            meshes,
            nombreVues: options.nombreVues ?? 32,
            conserverRayonCourant: true,
            texteResultat: options.texteResultat ?? null
        });
    }

    async placerCameraSurVueEntropieMaximale({
        scene,
        camera,
        meshes,
        nombreVues = 48,
        conserverRayonCourant = true,
        texteResultat = null
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
        const infosModele = this.calculerInfosModele(meshesValides);
        const vues = this.genererVuesSpheriques(nombreVues);

        const rayonRecherche = this.calculerRayonRecherche({
            camera,
            rayonModele: infosModele.rayon,
            conserverRayonCourant
        });

        let meilleureVue = null;

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

            const score = this.calculerScoreImage(scene);

            const resultatVue = {
                alpha: camera.alpha,
                beta: camera.beta,
                rayon: camera.radius,
                cible: infosModele.centre.clone(),
                ...score
            };

            if (!meilleureVue || resultatVue.scoreGlobal > meilleureVue.scoreGlobal) {
                meilleureVue = resultatVue;
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
        camera.radius = meilleureVue.rayon;
        camera.setTarget(meilleureVue.cible);

        await this.rendreEtAttendre(scene);

        if (texteResultat) {
            texteResultat.text = `Vue optimale : ${Math.round(meilleureVue.entropieNormalisee * 100)}%`;
            texteResultat._markAsDirty?.();
        }

        return meilleureVue;
    }

    filtrerMeshesAnalysables(meshes) {
        if (!Array.isArray(meshes)) {
            return [];
        }

        return meshes.filter((mesh) => {
            if (!mesh) {
                return false;
            }

            if (mesh.isDisposed?.()) {
                return false;
            }

            if (mesh.isVisible === false) {
                return false;
            }

            if (!mesh.getBoundingInfo) {
                return false;
            }

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

    calculerRayonRecherche({ camera, rayonModele, conserverRayonCourant }) {
        const rayonCourant = Number(camera.radius) || rayonModele * 3;
        const rayonAuto = Math.max(rayonModele * 3, 1.5);
        let rayon = conserverRayonCourant ? rayonCourant : rayonAuto;

        if (Number.isFinite(camera.lowerRadiusLimit) && camera.lowerRadiusLimit > 0) {
            rayon = Math.max(rayon, camera.lowerRadiusLimit);
        }

        if (Number.isFinite(camera.upperRadiusLimit) && camera.upperRadiusLimit > 0) {
            rayon = Math.min(rayon, camera.upperRadiusLimit);
        }

        return rayon;
    }

    genererVuesSpheriques(nombreVues = 48) {
        const vues = [];
        const nombreAnneaux = 4;
        const nombreParAnneau = Math.max(8, Math.ceil(nombreVues / nombreAnneaux));

        const betas = [
            Math.PI / 3.2,
            Math.PI / 2.55,
            Math.PI / 2,
            Math.PI / 1.72
        ];

        betas.forEach((beta) => {
            for (let i = 0; i < nombreParAnneau; i++) {
                const alpha = (i / nombreParAnneau) * Math.PI * 2;

                vues.push({
                    alpha: this.normaliserAngle(alpha),
                    beta: this.limiterBeta(beta)
                });
            }
        });

        return vues.slice(0, nombreVues);
    }

    normaliserAngle(angle) {
        const deuxPi = Math.PI * 2;
        return ((angle % deuxPi) + deuxPi) % deuxPi;
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

    calculerScoreImage(scene) {
        const engine = scene.getEngine();
        const width = engine.getRenderWidth(true);
        const height = engine.getRenderHeight(true);

        let pixels;

        try {
            pixels = engine.readPixels(0, 0, width, height);
        } catch (erreur) {
            console.warn("Impossible de lire les pixels pour l'entropie.", erreur);

            return {
                scoreGlobal: 0,
                entropieBrute: 0,
                entropieNormalisee: 0,
                contrasteNormalise: 0,
                pixelsAnalyses: 0
            };
        }

        return this.calculerScoreDepuisPixels(pixels, width, height);
    }

    calculerScoreDepuisPixels(pixels, width, height) {
        const histogramme = new Array(256).fill(0);
        const valeursGris = [];

        // On analyse surtout la zone centrale : elle contient normalement l'objet,
        // tout en gardant le fond, la lumière et les traitements visibles autour.
        const margeX = Math.floor(width * 0.12);
        const margeY = Math.floor(height * 0.12);
        const xMin = margeX;
        const xMax = width - margeX;
        const yMin = margeY;
        const yMax = height - margeY;

        const pas = Math.max(1, Math.floor(Math.min(width, height) / 220));

        for (let y = yMin; y < yMax; y += pas) {
            for (let x = xMin; x < xMax; x += pas) {
                const index = (y * width + x) * 4;

                const r = pixels[index];
                const g = pixels[index + 1];
                const b = pixels[index + 2];

                const gris = Math.round(
                    0.299 * r +
                    0.587 * g +
                    0.114 * b
                );

                histogramme[gris]++;
                valeursGris.push(gris);
            }
        }

        const entropieBrute = this.calculerEntropieHistogramme(histogramme, valeursGris.length);
        const entropieNormalisee = this.limiterEntre0Et1(entropieBrute / 8);
        const contrasteNormalise = this.calculerContrasteNormalise(valeursGris);

        // Score volontairement mixte : l'entropie mesure la richesse visuelle,
        // le contraste évite de privilégier une vue riche mais trop plate.
        const scoreGlobal = this.limiterEntre0Et1(
            entropieNormalisee * 0.75 + contrasteNormalise * 0.25
        );

        return {
            scoreGlobal,
            entropieBrute,
            entropieNormalisee,
            contrasteNormalise,
            pixelsAnalyses: valeursGris.length
        };
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

    limiterEntre0Et1(valeur) {
        return Math.max(0, Math.min(1, Number(valeur) || 0));
    }
}
