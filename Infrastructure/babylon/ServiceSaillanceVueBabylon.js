import { constantesSaillance } from "../../Configuration/constantesSaillance.js";
import { ServiceEntropieVueBabylon } from "./ServiceEntropieVueBabylon.js";

/**
 * Service de recherche de vue par saillance GMM.
 *
 * Cette classe garde la mécanique de parcours des vues déjà utilisée par
 * l'entropie : on parcourt des positions de caméra autour de l'objet, on rend
 * chaque vue, puis on choisit celle qui maximise le score.
 *
 * Le score de chaque rendu reprend l'algorithme Matlab fourni :
 * - carte de saillance d'Achanta en Lab ;
 * - pixels saillants : SM > moyenne(SM) + ecartType(SM) ;
 * - chaque pixel saillant devient une gaussienne ;
 * - on construit le GMM ;
 * - H = entropie du GMM ;
 * - D = dispersion spatiale des pixels saillants ;
 * - score final = H × D.
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

    calculerRayonRecherche({ camera, rayonModele, conserverRayonCourant, configuration }) {
        const cadrage = configuration?.cadrageAutomatique
            ?? constantesSaillance.cadrageAutomatique
            ?? null;

        if (!cadrage?.actif) {
            return super.calculerRayonRecherche({
                camera,
                rayonModele,
                conserverRayonCourant,
                configuration
            });
        }

        return this.calculerRayonPourOccupationImage({
            camera,
            rayonModele,
            configuration,
            cadrage
        });
    }

    calculerRayonPourOccupationImage({ camera, rayonModele, configuration = {}, cadrage = {} }) {
        const occupation = this.limiterValeur(
            Number(cadrage.occupationImageMin ?? 0.8),
            0.1,
            0.95
        );
        const margeSecurite = Math.max(0.5, Number(cadrage.margeSecurite ?? 1));
        const distanceMinimale = Math.max(
            Number(configuration.distanceMinimale ?? 0),
            Number(camera?.lowerRadiusLimit ?? 0) || 0
        );

        const scene = camera?.getScene?.();
        const engine = scene?.getEngine?.();
        const largeur = Math.max(1, Number(engine?.getRenderWidth?.()) || 16);
        const hauteur = Math.max(1, Number(engine?.getRenderHeight?.()) || 9);
        const ratioAspect = largeur / hauteur;

        const fovCamera = Number(camera?.fov) || Math.PI / 4;
        const fovVertical = camera?.fovMode === BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED
            ? 2 * Math.atan(Math.tan(fovCamera / 2) / ratioAspect)
            : fovCamera;
        const fovHorizontal = 2 * Math.atan(Math.tan(fovVertical / 2) * ratioAspect);

        const rayon = Math.max(Number(rayonModele) || 0.5, 0.5);
        const distanceVerticale = rayon / (occupation * Math.tan(fovVertical / 2));
        const distanceHorizontale = rayon / (occupation * Math.tan(fovHorizontal / 2));

        let distance = Math.max(distanceVerticale, distanceHorizontale, distanceMinimale) * margeSecurite;

        if (Number.isFinite(camera?.upperRadiusLimit) && camera.upperRadiusLimit > 0) {
            distance = Math.min(distance, camera.upperRadiusLimit);
        }

        return distance;
    }

    limiterValeur(valeur, min, max) {
        if (!Number.isFinite(valeur)) return min;
        return Math.min(max, Math.max(min, valeur));
    }

    creerScoreImageVide() {
        return {
            scoreGlobal: 0,
            scoreFinalBrut: 0,
            scoreFinalNormalise: 0,
            entropieGmm: 0,
            entropieGmmNormalisee: 0,
            dispersionSpatiale: 0,
            dispersionSpatialeNormalisee: 0,
            moyenneSaillance: 0,
            ecartTypeSaillance: 0,
            seuilSaillance: 0,
            nombrePixelsSaillants: 0,
            pixelsAnalyses: 0,
            largeurCarte: 0,
            hauteurCarte: 0,
            lambdaGmm: 0
        };
    }

    calculerRayonRecherche({ camera, rayonModele, conserverRayonCourant, configuration }) {
        const cadrage = configuration?.cadrageAutomatique;

        if (cadrage?.actif !== false) {
            const occupation = this.limiterEntre0Et1(Number(cadrage?.occupationImageMin ?? 0.8)) || 0.8;
            const margeSecurite = Math.max(0.5, Number(cadrage?.margeSecurite ?? 1));
            const fovVertical = Number(camera?.fov) || Math.PI / 4;
            const distanceCadrage = rayonModele / (occupation * Math.tan(fovVertical / 2));

            let rayon = Math.max(
                distanceCadrage * margeSecurite,
                Number(configuration?.distanceMinimale ?? 1.5)
            );

            if (Number.isFinite(camera?.lowerRadiusLimit) && camera.lowerRadiusLimit > 0) {
                rayon = Math.max(rayon, camera.lowerRadiusLimit);
            }

            if (Number.isFinite(camera?.upperRadiusLimit) && camera.upperRadiusLimit > 0) {
                rayon = Math.min(rayon, camera.upperRadiusLimit);
            }

            return rayon;
        }

        return super.calculerRayonRecherche({
            camera,
            rayonModele,
            conserverRayonCourant,
            configuration
        });
    }

    calculerScoreDepuisPixels(pixels, width, height, configurationAnalyse = {}) {
        const carte = this.calculerCarteSaillanceAchanta(pixels, width, height, configurationAnalyse);

        if (!carte || !carte.valeurs?.length) {
            return this.creerScoreImageVide();
        }

        const statistiques = this.calculerStatistiques(carte.valeurs);
        const facteurEcartType = Number(configurationAnalyse.seuillage?.facteurEcartType ?? 1);
        const seuil = statistiques.moyenne + facteurEcartType * statistiques.ecartType;
        const pixelsSaillants = this.extrairePixelsSaillants({
            carte,
            seuil,
            configurationAnalyse
        });

        if (pixelsSaillants.length === 0) {
            return {
                ...this.creerScoreImageVide(),
                moyenneSaillance: statistiques.moyenne,
                ecartTypeSaillance: statistiques.ecartType,
                seuilSaillance: seuil,
                pixelsAnalyses: carte.largeur * carte.hauteur,
                largeurCarte: carte.largeur,
                hauteurCarte: carte.hauteur
            };
        }

        const resultatGmm = this.construireGmmDepuisPixelsSaillants({
            pixelsSaillants,
            largeur: carte.largeur,
            hauteur: carte.hauteur,
            configurationAnalyse
        });

        const entropieGmm = this.calculerEntropieDepuisCarte(resultatGmm.gmm);
        const entropieMax = Math.log2(Math.max(2, carte.largeur * carte.hauteur));
        const entropieGmmNormalisee = this.limiterEntre0Et1(entropieGmm / entropieMax);

        const dispersionSpatiale = this.calculerDispersionSpatiale(pixelsSaillants);
        const diagonale = Math.sqrt(
            Math.pow(Math.max(1, carte.largeur - 1), 2) +
            Math.pow(Math.max(1, carte.hauteur - 1), 2)
        );
        const dispersionSpatialeNormalisee = this.limiterEntre0Et1(dispersionSpatiale / diagonale);

        const scoreFinalBrut = entropieGmm * dispersionSpatiale;
        const scoreFinalNormalise = this.limiterEntre0Et1(entropieGmmNormalisee * dispersionSpatialeNormalisee);
        const utiliserScoreNormalise = configurationAnalyse.score?.utiliserScoreNormalisePourComparaison !== false;
        const scoreGlobal = utiliserScoreNormalise ? scoreFinalNormalise : scoreFinalBrut;

        return {
            scoreGlobal,
            scoreFinalBrut,
            scoreFinalNormalise,
            entropieGmm,
            entropieGmmNormalisee,
            dispersionSpatiale,
            dispersionSpatialeNormalisee,
            moyenneSaillance: statistiques.moyenne,
            ecartTypeSaillance: statistiques.ecartType,
            seuilSaillance: seuil,
            nombrePixelsSaillants: pixelsSaillants.length,
            pixelsAnalyses: carte.largeur * carte.hauteur,
            largeurCarte: carte.largeur,
            hauteurCarte: carte.hauteur,
            lambdaGmm: resultatGmm.lambda
        };
    }

    calculerCarteSaillanceAchanta(pixels, width, height, configurationAnalyse) {
        const marge = Number(configurationAnalyse.margeZoneCentrale ?? 0);
        const margeX = Math.floor(width * marge);
        const margeY = Math.floor(height * marge);
        const xSourceMin = Math.max(0, margeX);
        const ySourceMin = Math.max(0, margeY);
        const largeurSource = Math.max(2, width - 2 * margeX);
        const hauteurSource = Math.max(2, height - 2 * margeY);

        const tailleMax = Math.max(16, Math.round(Number(configurationAnalyse.tailleCarteMax ?? 72)));
        const facteur = Math.min(tailleMax / largeurSource, tailleMax / hauteurSource, 1);
        const largeurCarte = Math.max(2, Math.round(largeurSource * facteur));
        const hauteurCarte = Math.max(2, Math.round(hauteurSource * facteur));

        let rgb = new Array(largeurCarte * hauteurCarte);

        for (let y = 0; y < hauteurCarte; y++) {
            for (let x = 0; x < largeurCarte; x++) {
                const sx = xSourceMin + Math.floor((x + 0.5) * largeurSource / largeurCarte);
                const sy = ySourceMin + Math.floor((y + 0.5) * hauteurSource / hauteurCarte);
                const pixel = this.lirePixelRgb(pixels, width, height, sx, sy);
                rgb[y * largeurCarte + x] = pixel;
            }
        }

        if (configurationAnalyse.flouGaussien?.actif !== false) {
            rgb = this.appliquerFlouGaussien3x3(
                rgb,
                largeurCarte,
                hauteurCarte,
                Number(configurationAnalyse.flouGaussien?.sigma ?? 3)
            );
        }

        const lab = rgb.map((pixel) => this.rgbVersLab(pixel.r, pixel.g, pixel.b));
        const moyenneL = this.moyenne(lab.map((p) => p.l));
        const moyenneA = this.moyenne(lab.map((p) => p.a));
        const moyenneB = this.moyenne(lab.map((p) => p.b));

        const valeursBrutes = lab.map((p) => {
            const dl = p.l - moyenneL;
            const da = p.a - moyenneA;
            const db = p.b - moyenneB;
            return dl * dl + da * da + db * db;
        });

        const min = Math.min(...valeursBrutes);
        const max = Math.max(...valeursBrutes);
        const amplitude = max - min;
        const valeurs = amplitude > 0
            ? valeursBrutes.map((valeur) => (valeur - min) / amplitude)
            : valeursBrutes.map(() => 0);

        return {
            valeurs,
            largeur: largeurCarte,
            hauteur: hauteurCarte
        };
    }

    extrairePixelsSaillants({ carte, seuil, configurationAnalyse }) {
        const pixelsSaillants = [];

        for (let y = 0; y < carte.hauteur; y++) {
            for (let x = 0; x < carte.largeur; x++) {
                const poids = carte.valeurs[y * carte.largeur + x];

                if (poids > seuil) {
                    pixelsSaillants.push({ x, y, poids });
                }
            }
        }

        const maxPixels = Math.max(1, Math.round(Number(configurationAnalyse.gmm?.nombreMaxPixelsSaillants ?? 420)));

        if (pixelsSaillants.length <= maxPixels) {
            return pixelsSaillants;
        }

        return pixelsSaillants
            .sort((a, b) => b.poids - a.poids)
            .slice(0, maxPixels);
    }

    construireGmmDepuisPixelsSaillants({ pixelsSaillants, largeur, hauteur, configurationAnalyse }) {
        const gmm = new Float64Array(largeur * hauteur);
        const gmmConfig = configurationAnalyse.gmm ?? {};
        const lambda = this.calculerLambdaGmm({
            pixelsSaillants,
            largeur,
            configurationAnalyse
        });
        const sigmaMin = Math.max(0.0001, Number(gmmConfig.sigmaMin ?? 1));
        const rayonInfluenceSigma = Math.max(1, Number(gmmConfig.rayonInfluenceSigma ?? 3));

        for (const pixelSaillant of pixelsSaillants) {
            const sigma = Math.max(sigmaMin, lambda * pixelSaillant.poids);
            const deuxSigmaCarre = 2 * sigma * sigma;
            const rayon = Math.ceil(rayonInfluenceSigma * sigma);
            const utiliseImageComplete = rayon >= Math.max(largeur, hauteur);

            const xMin = utiliseImageComplete ? 0 : Math.max(0, pixelSaillant.x - rayon);
            const xMax = utiliseImageComplete ? largeur - 1 : Math.min(largeur - 1, pixelSaillant.x + rayon);
            const yMin = utiliseImageComplete ? 0 : Math.max(0, pixelSaillant.y - rayon);
            const yMax = utiliseImageComplete ? hauteur - 1 : Math.min(hauteur - 1, pixelSaillant.y + rayon);

            for (let y = yMin; y <= yMax; y++) {
                const dy = y - pixelSaillant.y;

                for (let x = xMin; x <= xMax; x++) {
                    const dx = x - pixelSaillant.x;
                    const distanceCarree = dx * dx + dy * dy;
                    gmm[y * largeur + x] += pixelSaillant.poids * Math.exp(-distanceCarree / deuxSigmaCarre);
                }
            }
        }

        return { gmm, lambda };
    }

    calculerLambdaGmm({ pixelsSaillants, largeur, configurationAnalyse }) {
        const gmmConfig = configurationAnalyse.gmm ?? {};
        const mode = gmmConfig.lambdaMode ?? "matlab_w_sur_2";

        if (mode === "habibi_moyenne_saillance") {
            const moyennePoids = this.moyenne(pixelsSaillants.map((p) => p.poids));
            return largeur / (2 * Math.max(0.0001, moyennePoids));
        }

        // Mode par défaut conforme à ScoreImageGMM.m : lambda = W / 2.
        return largeur * Number(gmmConfig.facteurLambdaLargeur ?? 0.5);
    }

    calculerEntropieDepuisCarte(gmm) {
        let somme = 0;

        for (let i = 0; i < gmm.length; i++) {
            somme += gmm[i];
        }

        if (!Number.isFinite(somme) || somme <= 0) {
            return 0;
        }

        let entropie = 0;

        for (let i = 0; i < gmm.length; i++) {
            const valeur = gmm[i];

            if (valeur <= 0) {
                continue;
            }

            const p = valeur / somme;
            entropie -= p * Math.log2(p);
        }

        return entropie;
    }

    calculerDispersionSpatiale(pixelsSaillants) {
        let sommePoids = 0;
        let sommeX = 0;
        let sommeY = 0;

        pixelsSaillants.forEach((pixel) => {
            sommePoids += pixel.poids;
            sommeX += pixel.x * pixel.poids;
            sommeY += pixel.y * pixel.poids;
        });

        if (sommePoids <= 0) {
            return 0;
        }

        const xc = sommeX / sommePoids;
        const yc = sommeY / sommePoids;
        let sommeDistances = 0;

        pixelsSaillants.forEach((pixel) => {
            const dx = pixel.x - xc;
            const dy = pixel.y - yc;
            sommeDistances += pixel.poids * (dx * dx + dy * dy);
        });

        return Math.sqrt(sommeDistances / sommePoids);
    }

    lirePixelRgb(pixels, width, height, x, y) {
        const ix = Math.max(0, Math.min(width - 1, Math.floor(x)));
        const iy = Math.max(0, Math.min(height - 1, Math.floor(y)));
        const index = (iy * width + ix) * 4;

        return {
            r: this.normaliserCanalPixel(pixels[index]),
            g: this.normaliserCanalPixel(pixels[index + 1]),
            b: this.normaliserCanalPixel(pixels[index + 2])
        };
    }

    appliquerFlouGaussien3x3(rgb, largeur, hauteur, sigma = 3) {
        const noyau = this.creerNoyauGaussien3x3(sigma);
        const resultat = new Array(rgb.length);

        for (let y = 0; y < hauteur; y++) {
            for (let x = 0; x < largeur; x++) {
                let sommeR = 0;
                let sommeG = 0;
                let sommeB = 0;
                let sommePoids = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const sx = this.reflechirIndice(x + kx, largeur);
                        const sy = this.reflechirIndice(y + ky, hauteur);
                        const poids = noyau[ky + 1][kx + 1];
                        const pixel = rgb[sy * largeur + sx];

                        sommeR += pixel.r * poids;
                        sommeG += pixel.g * poids;
                        sommeB += pixel.b * poids;
                        sommePoids += poids;
                    }
                }

                resultat[y * largeur + x] = {
                    r: sommeR / sommePoids,
                    g: sommeG / sommePoids,
                    b: sommeB / sommePoids
                };
            }
        }

        return resultat;
    }

    creerNoyauGaussien3x3(sigma) {
        const noyau = [];
        const sigmaCarre2 = 2 * sigma * sigma;

        for (let y = -1; y <= 1; y++) {
            const ligne = [];

            for (let x = -1; x <= 1; x++) {
                ligne.push(Math.exp(-(x * x + y * y) / sigmaCarre2));
            }

            noyau.push(ligne);
        }

        return noyau;
    }

    reflechirIndice(index, taille) {
        if (index < 0) {
            return Math.min(taille - 1, -index);
        }

        if (index >= taille) {
            return Math.max(0, (taille - 1) - (index - taille + 1));
        }

        return index;
    }

    rgbVersLab(r, g, b) {
        const linearR = this.srgbVersLineaire(r / 255);
        const linearG = this.srgbVersLineaire(g / 255);
        const linearB = this.srgbVersLineaire(b / 255);

        // sRGB D65 vers XYZ.
        const x = linearR * 0.4124564 + linearG * 0.3575761 + linearB * 0.1804375;
        const y = linearR * 0.2126729 + linearG * 0.7151522 + linearB * 0.0721750;
        const z = linearR * 0.0193339 + linearG * 0.1191920 + linearB * 0.9503041;

        // Blanc de référence D65.
        const xn = 0.95047;
        const yn = 1.00000;
        const zn = 1.08883;

        const fx = this.fLab(x / xn);
        const fy = this.fLab(y / yn);
        const fz = this.fLab(z / zn);

        return {
            l: 116 * fy - 16,
            a: 500 * (fx - fy),
            b: 200 * (fy - fz)
        };
    }

    srgbVersLineaire(canal) {
        if (canal <= 0.04045) {
            return canal / 12.92;
        }

        return Math.pow((canal + 0.055) / 1.055, 2.4);
    }

    fLab(t) {
        const delta = 6 / 29;
        const deltaCube = delta * delta * delta;

        if (t > deltaCube) {
            return Math.cbrt(t);
        }

        return t / (3 * delta * delta) + 4 / 29;
    }

    calculerStatistiques(valeurs) {
        const moyenne = this.moyenne(valeurs);
        const variance = this.moyenne(valeurs.map((valeur) => {
            const ecart = valeur - moyenne;
            return ecart * ecart;
        }));

        return {
            moyenne,
            ecartType: Math.sqrt(variance)
        };
    }

    moyenne(valeurs) {
        if (!valeurs?.length) {
            return 0;
        }

        return valeurs.reduce((somme, valeur) => somme + valeur, 0) / valeurs.length;
    }

    creerCsvVuesEntropie({ vuesAnalysees, infosModele, configuration }) {
        this._dernieresVuesSaillanceAnalysees = vuesAnalysees;
        this._derniereConfigurationSaillance = configuration;

        const lignes = [];
        const c = infosModele.centre;

        lignes.push([
            "index",
            "alpha_degres",
            "beta_degres",
            "distance_camera_centre",
            "rayon_objet",
            "score_global_utilise",
            "score_final_HxD_brut",
            "score_final_HxD_normalise",
            "entropie_gmm_bits",
            "entropie_gmm_normalisee",
            "dispersion_spatiale_pixels",
            "dispersion_spatiale_normalisee",
            "moyenne_saillance_SM",
            "ecart_type_saillance_SM",
            "seuil_mean_plus_std",
            "nb_pixels_saillants",
            "largeur_carte",
            "hauteur_carte",
            "lambda_gmm",
            "centre_x",
            "centre_y"
        ].join(";"));

        vuesAnalysees.forEach((vue) => {
            lignes.push([
                vue.index,
                this.formaterNombre(vue.alphaDegres),
                this.formaterNombre(vue.betaDegres),
                this.formaterNombre(vue.distance),
                this.formaterNombre(vue.rayonObjet),
                this.formaterNombre(vue.scoreGlobal),
                this.formaterNombre(vue.scoreFinalBrut),
                this.formaterNombre(vue.scoreFinalNormalise),
                this.formaterNombre(vue.entropieGmm),
                this.formaterNombre(vue.entropieGmmNormalisee),
                this.formaterNombre(vue.dispersionSpatiale),
                this.formaterNombre(vue.dispersionSpatialeNormalisee),
                this.formaterNombre(vue.moyenneSaillance),
                this.formaterNombre(vue.ecartTypeSaillance),
                this.formaterNombre(vue.seuilSaillance),
                vue.nombrePixelsSaillants,
                vue.largeurCarte,
                vue.hauteurCarte,
                this.formaterNombre(vue.lambdaGmm),
                this.formaterNombre(c.x),
                this.formaterNombre(c.y)
            ].join(";"));
        });

        return lignes.join("\n");
    }

    telechargerCsv(contenuCsv, nomFichier) {
        super.telechargerCsv(contenuCsv, nomFichier);

        const configuration = this._derniereConfigurationSaillance ?? constantesSaillance;
        const exportHistogramme = configuration.exportHistogramme ?? constantesSaillance.exportHistogramme;

        if (exportHistogramme?.actif === false) {
            return;
        }

        const vuesAnalysees = this._dernieresVuesSaillanceAnalysees ?? [];

        if (!Array.isArray(vuesAnalysees) || vuesAnalysees.length === 0) {
            return;
        }

        // Histogramme de distribution : une barre = une plage de scores.
        // Exemple : combien de vues ont un score entre 40% et 50%.
        this.telechargerTexte(
            this.creerSvgHistogrammeDistributionScores(vuesAnalysees, exportHistogramme),
            exportHistogramme.nomFichierSvg || "saillance_gmm_histogramme.svg",
            "image/svg+xml;charset=utf-8"
        );
    }

    creerSvgHistogrammeDistributionScores(vuesAnalysees, configurationHistogramme = {}) {
        const sourceScore = configurationHistogramme.sourceScore ?? "scoreFinalBrut";
        const valeursBrutes = vuesAnalysees
            .map((vue) => Number(vue[sourceScore] ?? vue.scoreFinalBrut ?? vue.scoreGlobal))
            .filter((score) => Number.isFinite(score));

        const normaliserRelativement = configurationHistogramme.normaliserRelativementAuxVues !== false;
        const minScore = valeursBrutes.length ? Math.min(...valeursBrutes) : 0;
        const maxScore = valeursBrutes.length ? Math.max(...valeursBrutes) : 0;
        const amplitudeScore = maxScore - minScore;

        const scores = valeursBrutes.map((score) => {
            if (normaliserRelativement && amplitudeScore > 0) {
                return ((score - minScore) / amplitudeScore) * 100;
            }

            return this.limiterEntre0Et1(score) * 100;
        });

        const largeur = Math.max(720, Number(configurationHistogramme.largeurSvg ?? 920));
        const hauteur = Math.max(420, Number(configurationHistogramme.hauteurSvg ?? 560));
        const nombreClasses = Math.max(5, Math.min(20, Math.round(Number(configurationHistogramme.nombreClasses ?? 10))));
        const marge = { haut: 86, droite: 44, bas: 76, gauche: 76 };
        const largeurGraphique = largeur - marge.gauche - marge.droite;
        const hauteurGraphique = hauteur - marge.haut - marge.bas;
        const pasClasse = 100 / nombreClasses;

        const classes = Array.from({ length: nombreClasses }, (_, index) => {
            const debut = index * pasClasse;
            const fin = (index + 1) * pasClasse;

            return {
                index,
                debut,
                fin,
                libelle: `${Math.round(debut)}-${Math.round(fin)}`,
                nombre: 0
            };
        });

        scores.forEach((score) => {
            const indexClasse = Math.min(nombreClasses - 1, Math.max(0, Math.floor(score / pasClasse)));
            classes[indexClasse].nombre += 1;
        });

        const maxNombre = Math.max(1, ...classes.map((classe) => classe.nombre));
        const maxAxeY = Math.max(1, Math.ceil(maxNombre / 5) * 5);
        const largeurBarre = largeurGraphique / nombreClasses;

        const barres = classes.map((classe) => {
            const hauteurBarre = hauteurGraphique * (classe.nombre / maxAxeY);
            const x = marge.gauche + classe.index * largeurBarre + 1;
            const y = marge.haut + hauteurGraphique - hauteurBarre;
            const w = Math.max(1, largeurBarre - 2);
            const titre = `${classe.nombre} vue(s) avec un score relatif entre ${Math.round(classe.debut)}% et ${Math.round(classe.fin)}%`;

            return `
        <g>
            <title>${this.echapperXml(titre)}</title>
            <rect x="${this.formaterSvg(x)}" y="${this.formaterSvg(y)}" width="${this.formaterSvg(w)}" height="${this.formaterSvg(hauteurBarre)}" />
        </g>`;
        }).join("\n");

        const graduationsY = Array.from({ length: 6 }, (_, index) => {
            const ratio = index / 5;
            const valeur = Math.round(maxAxeY * ratio);
            const y = marge.haut + hauteurGraphique - ratio * hauteurGraphique;

            return `
        <line x1="${marge.gauche - 8}" y1="${this.formaterSvg(y)}" x2="${marge.gauche}" y2="${this.formaterSvg(y)}" class="tick-line" />
        <text x="${marge.gauche - 16}" y="${this.formaterSvg(y + 4)}" text-anchor="end" class="tick">${valeur}</text>`;
        }).join("\n");

        const graduationsX = Array.from({ length: nombreClasses + 1 }, (_, index) => {
            const x = marge.gauche + index * largeurBarre;
            const valeur = Math.round(index * pasClasse);

            return `
        <line x1="${this.formaterSvg(x)}" y1="${marge.haut + hauteurGraphique}" x2="${this.formaterSvg(x)}" y2="${marge.haut + hauteurGraphique + 8}" class="tick-line" />
        <text x="${this.formaterSvg(x)}" y="${marge.haut + hauteurGraphique + 28}" text-anchor="middle" class="tick">${valeur}</text>`;
        }).join("\n");

        return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}" viewBox="0 0 ${largeur} ${hauteur}" role="img" aria-label="Histogramme de distribution des scores de saillance GMM">
    <style>
        .titre { font: 700 17px Arial, sans-serif; fill: #000; }
        .sous-titre { font: 700 16px Arial, sans-serif; fill: #000; }
        .axe { stroke: #222; stroke-width: 1.2; }
        .tick-line { stroke: #222; stroke-width: 1; }
        .tick { font: 400 13px Arial, sans-serif; fill: #000; }
        .label { font: 400 14px Arial, sans-serif; fill: #000; }
        rect { fill: #f4a0af; stroke: #222; stroke-width: 1; }
    </style>
    <rect width="100%" height="100%" fill="white" />
    <text x="16" y="24" class="titre">Graphique 5.7.1</text>
    <text x="16" y="45" class="sous-titre">Distribution relative des scores de saillance GMM</text>
    <g>
        ${graduationsY}
        ${graduationsX}
        <line x1="${marge.gauche}" y1="${marge.haut}" x2="${marge.gauche}" y2="${marge.haut + hauteurGraphique}" class="axe" />
        <line x1="${marge.gauche}" y1="${marge.haut + hauteurGraphique}" x2="${largeur - marge.droite}" y2="${marge.haut + hauteurGraphique}" class="axe" />
        ${barres}
        <text x="${marge.gauche + largeurGraphique / 2}" y="${hauteur - 24}" text-anchor="middle" class="label">Score relatif de saillance (%)</text>
        <text x="24" y="${marge.haut + hauteurGraphique / 2}" text-anchor="middle" transform="rotate(-90 24 ${marge.haut + hauteurGraphique / 2})" class="label">Nombre de vues</text>
    </g>
</svg>`;
    }

    telechargerTexte(contenu, nomFichier, typeMime = "text/plain;charset=utf-8") {
        if (typeof document === "undefined" || typeof Blob === "undefined") {
            return;
        }

        const blob = new Blob([contenu], { type: typeMime });
        const url = URL.createObjectURL(blob);
        const lien = document.createElement("a");
        lien.href = url;
        lien.download = nomFichier;
        lien.style.display = "none";
        document.body.appendChild(lien);
        lien.click();
        document.body.removeChild(lien);

        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    formaterPourcentage(valeur) {
        const nombre = Number(valeur);

        if (!Number.isFinite(nombre)) {
            return "0%";
        }

        return `${Math.round(nombre * 100)}%`;
    }

    formaterSvg(valeur) {
        const nombre = Number(valeur);

        if (!Number.isFinite(nombre)) {
            return "0";
        }

        return nombre.toFixed(2).replace(/\.00$/, "");
    }

    echapperXml(valeur) {
        return String(valeur)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }
}
