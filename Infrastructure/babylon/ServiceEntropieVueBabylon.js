/**
 * Choisit une vue de départ intéressante pour le modèle 3D.
 *
 * Cette version reprend le principe de l'ancien app.js : tester plusieurs vues
 * autour de l'objet, lire les pixels rendus, calculer une entropie visuelle,
 * puis garder la vue qui expose le plus d'information utile.
 */
export class ServiceEntropieVueBabylon {
    async choisirVue(scene, camera, meshes, options = {}) {
        if (!scene || !camera) {
            throw new Error("Scène ou caméra introuvable pour choisir la vue par entropie.");
        }

        if (!Array.isArray(meshes) || meshes.length === 0) {
            return null;
        }

        const vues = this.genererVuesSpheriques(options.nombreVues ?? 16);
        const rayonInitial = camera.radius;
        const alphaInitial = camera.alpha;
        const betaInitial = camera.beta;

        let meilleureVue = null;
        let meilleurScore = -Infinity;

        for (const vue of vues) {
            camera.alpha = vue.alpha;
            camera.beta = vue.beta;
            camera.radius = rayonInitial;

            await this.attendreImageSuivante(scene);

            const score = this.calculerScoreImage(scene);

            if (score > meilleurScore) {
                meilleurScore = score;
                meilleureVue = {
                    alpha: camera.alpha,
                    beta: camera.beta,
                    rayon: camera.radius,
                    score
                };
            }
        }

        if (meilleureVue) {
            camera.alpha = meilleureVue.alpha;
            camera.beta = meilleureVue.beta;
            camera.radius = meilleureVue.rayon;
        } else {
            camera.alpha = alphaInitial;
            camera.beta = betaInitial;
            camera.radius = rayonInitial;
        }

        return meilleureVue;
    }

    genererVuesSpheriques(nombreVues = 16) {
        const vues = [];
        const betas = [Math.PI / 3, Math.PI / 2.5, Math.PI / 2, Math.PI / 1.8];

        for (let i = 0; i < nombreVues; i++) {
            const alpha = (i / nombreVues) * Math.PI * 2;
            const beta = betas[i % betas.length];
            vues.push({ alpha: this.normaliserAngle(alpha), beta });
        }

        return vues;
    }

    normaliserAngle(angle) {
        const deuxPi = Math.PI * 2;
        return ((angle % deuxPi) + deuxPi) % deuxPi;
    }

    attendreImageSuivante(scene) {
        return new Promise((resolve) => {
            scene.onAfterRenderObservable.addOnce(() => resolve());
        });
    }

    calculerScoreImage(scene) {
        const engine = scene.getEngine();
        const width = engine.getRenderWidth();
        const height = engine.getRenderHeight();

        let pixels;
        try {
            pixels = engine.readPixels(0, 0, width, height);
        } catch (erreur) {
            console.warn("Impossible de lire les pixels pour l'entropie.", erreur);
            return 0;
        }

        return this.calculerEntropieDepuisPixels(pixels, width, height);
    }

    calculerEntropieDepuisPixels(pixels, width, height) {
        const valeurs = [];
        const pas = 4 * 8; // échantillonnage pour éviter un coût trop élevé

        for (let i = 0; i < pixels.length; i += pas) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            if (this.estPixelFond(r, g, b)) {
                continue;
            }

            const gris = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            valeurs.push(Math.floor(gris / 16));
        }

        return this.calculerEntropie(valeurs);
    }

    estPixelFond(r, g, b) {
        return r > 245 && g > 245 && b > 245;
    }

    calculerEntropie(valeurs) {
        if (!valeurs.length) return 0;

        const occurrences = new Map();
        valeurs.forEach((v) => occurrences.set(v, (occurrences.get(v) ?? 0) + 1));

        let entropie = 0;
        const total = valeurs.length;

        occurrences.forEach((nombre) => {
            const p = nombre / total;
            entropie -= p * Math.log2(p);
        });

        return entropie;
    }
}
