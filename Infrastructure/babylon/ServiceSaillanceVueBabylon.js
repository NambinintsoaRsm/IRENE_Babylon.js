import { constantesSaillance } from "../../Configuration/constantesSaillance.js";
import { ServiceEntropieVueBabylon } from "./ServiceEntropieVueBabylon.js";

/**
 * Service de recherche de vue par saillance visuelle.
 *
 * Le fonctionnement reprend la logique de l'entropie : on parcourt des vues
 * autour de l'objet, on rend chaque vue, puis on calcule un score. La différence
 * est que le score ne mesure pas l'entropie globale, mais la force des zones
 * localement saillantes : ruptures de luminance, ruptures de couleur,
 * gradients et silhouette approximée.
 */
export class ServiceSaillanceVueBabylon extends ServiceEntropieVueBabylon {
    async choisirVue(scene, camera, meshes, options = {}) {
        return this.placerCameraSurVueSaillanceMaximale({
            scene,
            camera,
            meshes,
            ...options
        });
    }

    async placerCameraSurVueSaillanceMaximale(options = {}) {
        const resultat = await super.placerCameraSurVueEntropieMaximale({
            configuration: constantesSaillance,
            exporterCsv: constantesSaillance.exportCsv.actif,
            nomFichierCsv: constantesSaillance.exportCsv.nomFichier,
            ...options
        });

        if (!resultat) {
            return null;
        }

        return {
            ...resultat,
            configurationSaillance: resultat.configurationEntropie ?? constantesSaillance,
            configurationEntropie: undefined
        };
    }

    creerScoreImageVide() {
        return {
            scoreGlobal: 0,
            saillanceMoyenne: 0,
            saillanceForte: 0,
            densiteSaillante: 0,
            contrasteLuminanceMoyen: 0,
            contrasteCouleurMoyen: 0,
            gradientLuminanceMoyen: 0,
            silhouetteApproximeeMoyenne: 0,
            pixelsAnalyses: 0
        };
    }

    calculerScoreDepuisPixels(pixels, width, height, configurationAnalyse) {
        const marge = Number(configurationAnalyse.margeZoneCentrale ?? 0.12);
        const margeX = Math.floor(width * marge);
        const margeY = Math.floor(height * marge);
        const rayonVoisinage = Math.max(1, Math.round(Number(configurationAnalyse.rayonVoisinage ?? 2)));

        const xMin = Math.max(rayonVoisinage + 1, margeX);
        const xMax = Math.min(width - rayonVoisinage - 1, width - margeX);
        const yMin = Math.max(rayonVoisinage + 1, margeY);
        const yMax = Math.min(height - rayonVoisinage - 1, height - margeY);

        const resolutionAnalyse = Number(configurationAnalyse.resolutionAnalyse ?? 220);
        const pas = Math.max(1, Math.floor(Math.min(width, height) / resolutionAnalyse));
        const fond = this.estimerCouleurFond(pixels, width, height);
        const poids = configurationAnalyse.poids ?? {};

        const valeursSaillance = [];
        let sommeContrasteLuminance = 0;
        let sommeContrasteCouleur = 0;
        let sommeGradientLuminance = 0;
        let sommeSilhouette = 0;

        for (let y = yMin; y < yMax; y += pas) {
            for (let x = xMin; x < xMax; x += pas) {
                const pixelCentral = this.lirePixel(pixels, width, height, x, y);

                if (!pixelCentral) {
                    continue;
                }

                const moyenneVoisinage = this.calculerMoyenneVoisinage(
                    pixels,
                    width,
                    height,
                    x,
                    y,
                    rayonVoisinage
                );

                if (!moyenneVoisinage) {
                    continue;
                }

                const contrasteLuminance = Math.abs(pixelCentral.luminance - moyenneVoisinage.luminance) / 255;
                const contrasteCouleur = this.distanceCouleurNormalisee(pixelCentral, moyenneVoisinage);
                const gradientLuminance = this.calculerGradientLuminance(pixels, width, height, x, y);
                const silhouetteApproximee = this.estPixelSilhouetteApproximee(
                    pixels,
                    width,
                    height,
                    x,
                    y,
                    fond,
                    configurationAnalyse.seuilDifferenceFondRgb ?? 24
                ) ? 1 : 0;

                const saillance = this.limiterEntre0Et1(
                    (Number(poids.contrasteLuminance ?? 0.38) * contrasteLuminance) +
                    (Number(poids.contrasteCouleur ?? 0.27) * contrasteCouleur) +
                    (Number(poids.gradientLuminance ?? 0.20) * gradientLuminance) +
                    (Number(poids.silhouetteApproximee ?? 0.15) * silhouetteApproximee)
                );

                valeursSaillance.push(saillance);
                sommeContrasteLuminance += contrasteLuminance;
                sommeContrasteCouleur += contrasteCouleur;
                sommeGradientLuminance += gradientLuminance;
                sommeSilhouette += silhouetteApproximee;
            }
        }

        if (valeursSaillance.length === 0) {
            return this.creerScoreImageVide();
        }

        const saillanceMoyenne = this.moyenne(valeursSaillance);
        const saillanceForte = this.moyenneDesPlusFortesValeurs(
            valeursSaillance,
            configurationAnalyse.portionPixelsForts ?? 0.15
        );
        const densiteSaillante = this.calculerDensiteSaillante(
            valeursSaillance,
            configurationAnalyse.seuilPixelSaillant ?? 0.18
        );

        const poidsScore = configurationAnalyse.score ?? {};
        const scoreGlobal = this.limiterEntre0Et1(
            (Number(poidsScore.saillanceMoyenne ?? 0.25) * saillanceMoyenne) +
            (Number(poidsScore.saillanceForte ?? 0.55) * saillanceForte) +
            (Number(poidsScore.densiteSaillante ?? 0.20) * densiteSaillante)
        );

        return {
            scoreGlobal,
            saillanceMoyenne,
            saillanceForte,
            densiteSaillante,
            contrasteLuminanceMoyen: sommeContrasteLuminance / valeursSaillance.length,
            contrasteCouleurMoyen: sommeContrasteCouleur / valeursSaillance.length,
            gradientLuminanceMoyen: sommeGradientLuminance / valeursSaillance.length,
            silhouetteApproximeeMoyenne: sommeSilhouette / valeursSaillance.length,
            pixelsAnalyses: valeursSaillance.length
        };
    }

    lirePixel(pixels, width, height, x, y) {
        if (x < 0 || y < 0 || x >= width || y >= height) {
            return null;
        }

        const index = (Math.floor(y) * width + Math.floor(x)) * 4;
        const r = this.normaliserCanalPixel(pixels[index]);
        const g = this.normaliserCanalPixel(pixels[index + 1]);
        const b = this.normaliserCanalPixel(pixels[index + 2]);

        return {
            r,
            g,
            b,
            luminance: this.calculerLuminance(r, g, b)
        };
    }

    calculerLuminance(r, g, b) {
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    calculerMoyenneVoisinage(pixels, width, height, x, y, rayon) {
        let sommeR = 0;
        let sommeG = 0;
        let sommeB = 0;
        let sommeLuminance = 0;
        let compteur = 0;

        for (let dy = -rayon; dy <= rayon; dy++) {
            for (let dx = -rayon; dx <= rayon; dx++) {
                if (dx === 0 && dy === 0) {
                    continue;
                }

                const pixel = this.lirePixel(pixels, width, height, x + dx, y + dy);

                if (!pixel) {
                    continue;
                }

                sommeR += pixel.r;
                sommeG += pixel.g;
                sommeB += pixel.b;
                sommeLuminance += pixel.luminance;
                compteur++;
            }
        }

        if (!compteur) {
            return null;
        }

        return {
            r: sommeR / compteur,
            g: sommeG / compteur,
            b: sommeB / compteur,
            luminance: sommeLuminance / compteur
        };
    }

    calculerGradientLuminance(pixels, width, height, x, y) {
        const gauche = this.lirePixel(pixels, width, height, x - 1, y)?.luminance ?? 0;
        const droite = this.lirePixel(pixels, width, height, x + 1, y)?.luminance ?? 0;
        const haut = this.lirePixel(pixels, width, height, x, y - 1)?.luminance ?? 0;
        const bas = this.lirePixel(pixels, width, height, x, y + 1)?.luminance ?? 0;

        const gx = droite - gauche;
        const gy = bas - haut;

        return this.limiterEntre0Et1(Math.sqrt(gx * gx + gy * gy) / 255);
    }

    distanceCouleurNormalisee(a, b) {
        const dr = Number(a.r) - Number(b.r);
        const dg = Number(a.g) - Number(b.g);
        const db = Number(a.b) - Number(b.b);

        return this.limiterEntre0Et1(Math.sqrt(dr * dr + dg * dg + db * db) / (Math.sqrt(3) * 255));
    }

    estimerCouleurFond(pixels, width, height) {
        const marge = Math.max(2, Math.floor(Math.min(width, height) * 0.02));
        const positions = [
            [marge, marge],
            [width - marge - 1, marge],
            [marge, height - marge - 1],
            [width - marge - 1, height - marge - 1]
        ];

        const pixelsFond = positions
            .map(([x, y]) => this.lirePixel(pixels, width, height, x, y))
            .filter(Boolean);

        if (!pixelsFond.length) {
            return { r: 255, g: 255, b: 255, luminance: 255 };
        }

        return {
            r: this.moyenne(pixelsFond.map((p) => p.r)),
            g: this.moyenne(pixelsFond.map((p) => p.g)),
            b: this.moyenne(pixelsFond.map((p) => p.b)),
            luminance: this.moyenne(pixelsFond.map((p) => p.luminance))
        };
    }

    estPixelSilhouetteApproximee(pixels, width, height, x, y, fond, seuilDifferenceFondRgb) {
        const centre = this.lirePixel(pixels, width, height, x, y);

        if (!centre || this.distanceCouleurRgb(centre, fond) <= seuilDifferenceFondRgb) {
            return false;
        }

        const voisins = [
            this.lirePixel(pixels, width, height, x - 1, y),
            this.lirePixel(pixels, width, height, x + 1, y),
            this.lirePixel(pixels, width, height, x, y - 1),
            this.lirePixel(pixels, width, height, x, y + 1)
        ];

        return voisins.some((voisin) => voisin && this.distanceCouleurRgb(voisin, fond) <= seuilDifferenceFondRgb);
    }

    distanceCouleurRgb(a, b) {
        const dr = Number(a.r) - Number(b.r);
        const dg = Number(a.g) - Number(b.g);
        const db = Number(a.b) - Number(b.b);

        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    moyenne(valeurs) {
        if (!valeurs?.length) {
            return 0;
        }

        return valeurs.reduce((somme, valeur) => somme + valeur, 0) / valeurs.length;
    }

    moyenneDesPlusFortesValeurs(valeurs, portion) {
        if (!valeurs?.length) {
            return 0;
        }

        const portionBornee = Math.max(0.01, Math.min(1, Number(portion) || 0.15));
        const nombreValeurs = Math.max(1, Math.ceil(valeurs.length * portionBornee));
        const valeursTriees = [...valeurs].sort((a, b) => b - a);

        return this.moyenne(valeursTriees.slice(0, nombreValeurs));
    }

    calculerDensiteSaillante(valeurs, seuil) {
        if (!valeurs?.length) {
            return 0;
        }

        const seuilNombre = Number(seuil) || 0.18;
        const nombreSaillant = valeurs.filter((valeur) => valeur >= seuilNombre).length;

        return nombreSaillant / valeurs.length;
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
            "score_saillance_global",
            "saillance_moyenne",
            "saillance_forte_top",
            "densite_pixels_saillants",
            "contraste_luminance_moyen",
            "contraste_couleur_moyen",
            "gradient_luminance_moyen",
            "silhouette_approximee_moyenne",
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
                this.formaterNombre(vue.saillanceMoyenne),
                this.formaterNombre(vue.saillanceForte),
                this.formaterNombre(vue.densiteSaillante),
                this.formaterNombre(vue.contrasteLuminanceMoyen),
                this.formaterNombre(vue.contrasteCouleurMoyen),
                this.formaterNombre(vue.gradientLuminanceMoyen),
                this.formaterNombre(vue.silhouetteApproximeeMoyenne),
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
}
