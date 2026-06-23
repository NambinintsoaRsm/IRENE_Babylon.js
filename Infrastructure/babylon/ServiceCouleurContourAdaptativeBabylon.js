import { constantesContours } from "../../Configuration/constantesContours.js";
import {
    contrasteLuminance,
    couleurBabylonVersRgb255,
    couleurRgb255VersHexa,
    distanceOklab,
    distanceRgb
} from "../../Util/CouleurUtils.js";

/**
 * Calcule une couleur optimale pour le contour de silhouette.
 *
 * Version locale demandée :
 * - on utilise les pixels du rendu actuel, pas seulement les couleurs des matériaux ;
 * - on analyse uniquement une bande de pixels autour de la silhouette ;
 * - on compare les pixels côté objet et côté fond ;
 * - la couleur peut être générée et n'est pas limitée aux couleurs du GUI.
 */
export class ServiceCouleurContourAdaptativeBabylon {
    async choisir(etatApplication) {
        const config = constantesContours.couleurOptimaleSilhouette;
        const scene = etatApplication?.scenes?.scene3D;
        const camera = etatApplication?.camera?.cameraBabylon;

        if (!scene || !camera) {
            return this.resultatSecours("scene-ou-camera-indisponible");
        }

        const capture = await this.capturerRenduSansContours(etatApplication, scene, camera);
        const fondRendu = this.estimerCouleurFondDepuisRendu(capture);
        const profondeur = await this.lireProfondeur(scene, camera);
        const bandes = this.extraireBandesLocalesSilhouette({
            capture,
            profondeur,
            fondRendu,
            config
        });

        const couleursObjet = this.regrouperCouleursDominantes(
            bandes.objet,
            config.analyseLocale,
            "objet-proche-silhouette"
        );
        const couleursFond = this.regrouperCouleursDominantes(
            bandes.fond,
            config.analyseLocale,
            "fond-proche-silhouette"
        );

        if (couleursObjet.length === 0 || couleursFond.length === 0) {
            const resultat = this.choisirCouleurSecoursDepuisFond(fondRendu);
            return {
                ...resultat,
                methode: "secours-local-insuffisant",
                fondRendu: couleurRgb255VersHexa(fondRendu),
                pixelsObjetLocaux: bandes.objet.length,
                pixelsFondLocaux: bandes.fond.length,
                couleursObjet,
                couleursFond
            };
        }

        const evaluations = this.genererCandidats(config).map((candidat) =>
            this.evaluerCandidat({ candidat, couleursObjet, couleursFond, config })
        );

        const seuils = config.seuilsSelection;
        const admissibles = evaluations.filter((evaluation) =>
            evaluation.pireContrasteLocal >= seuils.contrasteLocalMinimal &&
            evaluation.pireDistanceLocale >= seuils.distanceOklabMinimale
        );

        const liste = admissibles.length > 0 ? admissibles : evaluations;
        liste.sort((a, b) => b.score - a.score);

        const meilleur = liste[0] ?? this.choisirCouleurSecoursDepuisFond(fondRendu);
        const resultat = {
            ...meilleur,
            methode: "rendu-local-silhouette",
            admissibles: admissibles.length,
            candidatsTestes: evaluations.length,
            fondRendu: couleurRgb255VersHexa(fondRendu),
            pixelsObjetLocaux: bandes.objet.length,
            pixelsFondLocaux: bandes.fond.length,
            couleursObjet: couleursObjet.map((entree) => ({
                couleur: couleurRgb255VersHexa(entree.rgb),
                poids: entree.poids,
                source: entree.source
            })),
            couleursFond: couleursFond.map((entree) => ({
                couleur: couleurRgb255VersHexa(entree.rgb),
                poids: entree.poids,
                source: entree.source
            }))
        };

        if (config.debugConsole) {
            console.info("Couleur optimale silhouette", resultat);
        }

        return resultat;
    }

    async capturerRenduSansContours(etatApplication, scene, camera) {
        const parametresContours = etatApplication?.contours?.parametres;
        const sauvegardeContours = parametresContours
            ? {
                actif: parametresContours.actif,
                typeActif: parametresContours.typeActif,
                typesActifs: Array.isArray(parametresContours.typesActifs)
                    ? [...parametresContours.typesActifs]
                    : []
            }
            : null;

        // On désactive uniquement les contours pendant la capture pour éviter
        // que l'ancienne couleur de contour fausse le choix de la nouvelle.
        if (parametresContours) {
            parametresContours.actif = false;
            parametresContours.typeActif = null;
            parametresContours.typesActifs = [];
        }

        try {
            await this.rendreEtAttendre(scene);
            const engine = scene.getEngine();
            const largeur = engine.getRenderWidth(true);
            const hauteur = engine.getRenderHeight(true);
            const lecture = engine.readPixels(0, 0, largeur, hauteur);
            const pixels = typeof lecture?.then === "function" ? await lecture : lecture;

            if (!pixels) {
                throw new Error("Lecture des pixels du rendu impossible.");
            }

            return { pixels, largeur, hauteur };
        } finally {
            if (parametresContours && sauvegardeContours) {
                parametresContours.actif = sauvegardeContours.actif;
                parametresContours.typeActif = sauvegardeContours.typeActif;
                parametresContours.typesActifs = sauvegardeContours.typesActifs;
            }
        }
    }

    async rendreEtAttendre(scene) {
        scene.render();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        scene.render();
    }

    async lireProfondeur(scene, camera) {
        try {
            const depthRenderer = scene.enableDepthRenderer(camera);
            const depthMap = depthRenderer?.getDepthMap?.();

            if (!depthMap || typeof depthMap.readPixels !== "function") {
                return null;
            }

            scene.render();
            const lecture = depthMap.readPixels();
            const pixels = typeof lecture?.then === "function" ? await lecture : lecture;
            const taille = depthMap.getSize?.() ?? {};

            if (!pixels || !taille.width || !taille.height) {
                return null;
            }

            return {
                pixels,
                largeur: taille.width,
                hauteur: taille.height,
                fond: this.estimerProfondeurFond(pixels, taille.width, taille.height)
            };
        } catch (erreur) {
            console.warn("Couleur optimale : lecture de profondeur impossible, secours par couleur du fond.", erreur);
            return null;
        }
    }

    estimerProfondeurFond(pixels, largeur, hauteur) {
        const echantillons = [];
        const marge = 5;
        const coords = [
            [marge, marge],
            [largeur - 1 - marge, marge],
            [marge, hauteur - 1 - marge],
            [largeur - 1 - marge, hauteur - 1 - marge],
            [Math.floor(largeur / 2), marge],
            [Math.floor(largeur / 2), hauteur - 1 - marge]
        ];

        coords.forEach(([x, y]) => {
            echantillons.push(this.lireValeurProfondeur(pixels, largeur, hauteur, x, y));
        });

        const valides = echantillons.filter((v) => Number.isFinite(v));
        if (valides.length === 0) return 1;

        valides.sort((a, b) => a - b);
        return valides[Math.floor(valides.length / 2)];
    }

    extraireBandesLocalesSilhouette({ capture, profondeur, fondRendu, config }) {
        const analyse = config.analyseLocale;
        const objet = [];
        const fond = [];
        const pas = Math.max(1, Number(analyse.pasEchantillonnageContour ?? 2));
        const rayonVoisinage = Math.max(1, Number(analyse.rayonVoisinageSilhouette ?? 1));
        const rayonBande = Math.max(1, Number(analyse.rayonBandeContour ?? 2));
        const maxPixels = Math.max(100, Number(analyse.maxPixelsAnalyse ?? 6000));
        const largeur = capture.largeur;
        const hauteur = capture.hauteur;

        for (let y = rayonBande; y < hauteur - rayonBande; y += pas) {
            for (let x = rayonBande; x < largeur - rayonBande; x += pas) {
                if (!this.estPixelObjet({ x, y, capture, profondeur, fondRendu, config })) {
                    continue;
                }

                if (!this.estSurSilhouette({ x, y, capture, profondeur, fondRendu, config, rayonVoisinage })) {
                    continue;
                }

                this.collecterBandeAutourPixel({
                    x,
                    y,
                    rayonBande,
                    capture,
                    profondeur,
                    fondRendu,
                    config,
                    objet,
                    fond,
                    maxPixels
                });

                if (objet.length >= maxPixels && fond.length >= maxPixels) {
                    return { objet, fond };
                }
            }
        }

        return { objet, fond };
    }

    collecterBandeAutourPixel({ x, y, rayonBande, capture, profondeur, fondRendu, config, objet, fond, maxPixels }) {
        for (let dy = -rayonBande; dy <= rayonBande; dy += 1) {
            for (let dx = -rayonBande; dx <= rayonBande; dx += 1) {
                const nx = x + dx;
                const ny = y + dy;
                const couleur = this.lireCouleurPixel(capture, nx, ny);

                if (!couleur) continue;

                if (this.estPixelObjet({ x: nx, y: ny, capture, profondeur, fondRendu, config })) {
                    if (objet.length < maxPixels) objet.push(couleur);
                } else if (fond.length < maxPixels) {
                    fond.push(couleur);
                }
            }
        }
    }

    estSurSilhouette({ x, y, capture, profondeur, fondRendu, config, rayonVoisinage }) {
        for (let dy = -rayonVoisinage; dy <= rayonVoisinage; dy += 1) {
            for (let dx = -rayonVoisinage; dx <= rayonVoisinage; dx += 1) {
                if (dx === 0 && dy === 0) continue;

                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= capture.largeur || ny >= capture.hauteur) continue;

                if (!this.estPixelObjet({ x: nx, y: ny, capture, profondeur, fondRendu, config })) {
                    return true;
                }
            }
        }

        return false;
    }

    estPixelObjet({ x, y, capture, profondeur, fondRendu, config }) {
        if (profondeur) {
            const d = this.lireProfondeurAdaptee(profondeur, x, y, capture.largeur, capture.hauteur);
            const seuil = Number(config.analyseLocale.seuilDifferenceProfondeurFond ?? 0.0005);

            if (Number.isFinite(d)) {
                return Math.abs(d - profondeur.fond) > seuil;
            }
        }

        const couleur = this.lireCouleurPixel(capture, x, y);
        if (!couleur) return false;

        return distanceRgb(couleur, fondRendu) >= Number(config.analyseLocale.seuilDifferenceCouleurFondRgb ?? 24);
    }

    lireProfondeurAdaptee(profondeur, x, y, largeurRendu, hauteurRendu) {
        const sx = Math.min(
            profondeur.largeur - 1,
            Math.max(0, Math.round((x / Math.max(1, largeurRendu - 1)) * (profondeur.largeur - 1)))
        );
        const sy = Math.min(
            profondeur.hauteur - 1,
            Math.max(0, Math.round((y / Math.max(1, hauteurRendu - 1)) * (profondeur.hauteur - 1)))
        );

        return this.lireValeurProfondeur(profondeur.pixels, profondeur.largeur, profondeur.hauteur, sx, sy);
    }

    lireValeurProfondeur(pixels, largeur, hauteur, x, y) {
        if (!pixels || x < 0 || y < 0 || x >= largeur || y >= hauteur) return NaN;

        const nbPixels = largeur * hauteur;
        const indexMono = y * largeur + x;
        let valeur;

        if (pixels.length === nbPixels) {
            valeur = pixels[indexMono];
        } else {
            valeur = pixels[indexMono * 4];
        }

        if (!Number.isFinite(valeur)) return NaN;
        return valeur > 1 ? valeur / 255 : valeur;
    }

    lireCouleurPixel(capture, x, y) {
        if (!capture?.pixels || x < 0 || y < 0 || x >= capture.largeur || y >= capture.hauteur) {
            return null;
        }

        const index = (y * capture.largeur + x) * 4;
        const r = capture.pixels[index] ?? 0;
        const g = capture.pixels[index + 1] ?? 0;
        const b = capture.pixels[index + 2] ?? 0;
        const a = capture.pixels[index + 3] ?? 255;

        const normaliser = (v) => v <= 1 ? v * 255 : v;

        return {
            r: normaliser(r),
            g: normaliser(g),
            b: normaliser(b),
            a: normaliser(a)
        };
    }

    estimerCouleurFondDepuisRendu(capture) {
        const marge = 8;
        const points = [
            [marge, marge],
            [capture.largeur - 1 - marge, marge],
            [marge, capture.hauteur - 1 - marge],
            [capture.largeur - 1 - marge, capture.hauteur - 1 - marge]
        ];
        const couleurs = points
            .map(([x, y]) => this.lireCouleurPixel(capture, x, y))
            .filter(Boolean);

        if (couleurs.length === 0) {
            return couleurBabylonVersRgb255(null, { r: 255, g: 255, b: 255, a: 255 });
        }

        const total = couleurs.reduce((acc, couleur) => ({
            r: acc.r + couleur.r,
            g: acc.g + couleur.g,
            b: acc.b + couleur.b,
            a: acc.a + couleur.a
        }), { r: 0, g: 0, b: 0, a: 0 });

        return {
            r: total.r / couleurs.length,
            g: total.g / couleurs.length,
            b: total.b / couleurs.length,
            a: total.a / couleurs.length
        };
    }

    regrouperCouleursDominantes(couleurs, analyse, source) {
        const tailleQuantification = Math.max(1, Number(analyse.tailleQuantification ?? 16));
        const groupes = new Map();

        couleurs.forEach((rgb) => {
            if (!rgb) return;

            const cle = this.cleQuantifiee(rgb, tailleQuantification);
            const existant = groupes.get(cle) ?? {
                totalR: 0,
                totalG: 0,
                totalB: 0,
                compteur: 0
            };

            existant.totalR += rgb.r;
            existant.totalG += rgb.g;
            existant.totalB += rgb.b;
            existant.compteur += 1;
            groupes.set(cle, existant);
        });

        return Array.from(groupes.values())
            .sort((a, b) => b.compteur - a.compteur)
            .slice(0, Number(analyse.nombreCouleursLocales ?? 18))
            .map((groupe) => ({
                rgb: {
                    r: groupe.totalR / groupe.compteur,
                    g: groupe.totalG / groupe.compteur,
                    b: groupe.totalB / groupe.compteur,
                    a: 255
                },
                poids: groupe.compteur,
                source
            }));
    }

    cleQuantifiee(rgb, tailleQuantification) {
        const q = (v) => Math.round(Number(v ?? 0) / tailleQuantification) * tailleQuantification;
        return `${q(rgb.r)}_${q(rgb.g)}_${q(rgb.b)}`;
    }

    genererCandidats(config) {
        const pas = Math.max(8, Number(config.generationCouleurs.pasRgb ?? 32));
        const valeurs = [];

        for (let v = 0; v <= 255; v += pas) {
            valeurs.push(v);
        }

        if (!valeurs.includes(255)) valeurs.push(255);

        const candidats = new Map();
        const ajouter = (rgb) => candidats.set(couleurRgb255VersHexa(rgb), { ...rgb, a: 255 });

        valeurs.forEach((r) => {
            valeurs.forEach((g) => {
                valeurs.forEach((b) => {
                    ajouter({ r, g, b, a: 255 });
                });
            });
        });

        // Quelques candidats saturés utiles si le pas RGB ne tombe pas exactement dessus.
        [
            { r: 255, g: 255, b: 0, a: 255 },
            { r: 0, g: 255, b: 255, a: 255 },
            { r: 255, g: 0, b: 255, a: 255 },
            { r: 255, g: 96, b: 0, a: 255 },
            { r: 127, g: 0, b: 255, a: 255 }
        ].forEach(ajouter);

        return Array.from(candidats.values());
    }

    evaluerCandidat({ candidat, couleursObjet, couleursFond, config }) {
        const poids = config.poids;
        const facteurDistance = Number(poids.facteurDistanceOklab ?? 10);
        const statsObjet = this.evaluerFaceAListe(candidat, couleursObjet, facteurDistance);
        const statsFond = this.evaluerFaceAListe(candidat, couleursFond, facteurDistance);
        const pireContrasteLocal = Math.min(statsObjet.contrasteMin, statsFond.contrasteMin);
        const pireDistanceLocale = Math.min(statsObjet.distanceMin, statsFond.distanceMin);

        const score =
            pireContrasteLocal * poids.pireContrasteLocal +
            statsObjet.contrasteMoyen * poids.contrasteObjetMoyen +
            statsFond.contrasteMoyen * poids.contrasteFondMoyen +
            (pireDistanceLocale * facteurDistance) * poids.pireDistanceLocale +
            (statsObjet.distanceMoyenne * facteurDistance) * poids.distanceObjetMoyenne +
            (statsFond.distanceMoyenne * facteurDistance) * poids.distanceFondMoyenne;

        return {
            couleur: couleurRgb255VersHexa(candidat),
            score,
            pireContrasteLocal,
            contrasteObjetMin: statsObjet.contrasteMin,
            contrasteObjetMoyen: statsObjet.contrasteMoyen,
            contrasteFondMin: statsFond.contrasteMin,
            contrasteFondMoyen: statsFond.contrasteMoyen,
            pireDistanceLocale,
            distanceObjetMin: statsObjet.distanceMin,
            distanceObjetMoyenne: statsObjet.distanceMoyenne,
            distanceFondMin: statsFond.distanceMin,
            distanceFondMoyenne: statsFond.distanceMoyenne
        };
    }

    evaluerFaceAListe(candidat, entrees, facteurDistance) {
        let contrasteMin = Number.POSITIVE_INFINITY;
        let contrastePondere = 0;
        let distanceMin = Number.POSITIVE_INFINITY;
        let distancePonderee = 0;
        let totalPoids = 0;

        entrees.forEach((entree) => {
            const poids = Math.max(1, Number(entree.poids ?? 1));
            const contraste = contrasteLuminance(candidat, entree.rgb);
            const distance = distanceOklab(candidat, entree.rgb);

            contrasteMin = Math.min(contrasteMin, contraste);
            distanceMin = Math.min(distanceMin, distance);
            contrastePondere += contraste * poids;
            distancePonderee += distance * poids;
            totalPoids += poids;
        });

        if (totalPoids === 0) {
            return {
                contrasteMin: 1,
                contrasteMoyen: 1,
                distanceMin: 0,
                distanceMoyenne: 0
            };
        }

        return {
            contrasteMin,
            contrasteMoyen: contrastePondere / totalPoids,
            distanceMin,
            distanceMoyenne: distancePonderee / totalPoids,
            distanceMinScore: distanceMin * facteurDistance,
            distanceMoyenneScore: (distancePonderee / totalPoids) * facteurDistance
        };
    }

    choisirCouleurSecoursDepuisFond(fond) {
        const noir = { r: 0, g: 0, b: 0, a: 255 };
        const blanc = { r: 255, g: 255, b: 255, a: 255 };
        const couleur = contrasteLuminance(noir, fond) > contrasteLuminance(blanc, fond)
            ? noir
            : blanc;

        return {
            couleur: couleurRgb255VersHexa(couleur),
            score: 0,
            methode: "secours-contraste-fond"
        };
    }

    resultatSecours(raison) {
        return {
            couleur: "#000000FF",
            score: 0,
            methode: raison
        };
    }
}
