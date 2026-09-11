/**
 * @file Correction prudente de l'orientation des modèles 3D importés.
 *
 * Rôle : comparer plusieurs orientations candidates à partir des dimensions et des
 * sections du maillage, puis appliquer une rotation seulement lorsque le résultat
 * est suffisamment dominant.
 *
 * Utilisation : ControleurModele3D appelle corrigerOrientation() juste après le
 * chargement et avant la normalisation/cadrage. Une décision ambiguë conserve
 * volontairement l'orientation importée afin d'éviter les faux redressements.
 */
import {
    filtrerMeshesValides,
    calculerBornesMeshes,
    creerOuTrouverRacineModeleANNA
} from "../../Util/BabylonUtils.js";

/**
 * Corrige l'orientation générale du modèle.
 *
 * Cette version reste prudente : si l'analyse est ambiguë, elle conserve
 * l'orientation importée. Elle évite le cas par cas en comparant plusieurs
 * orientations candidates standard, sans modifier définitivement les sommets.
 *
 * Principe :
 * - créer / retrouver une racine commune ;
 * - extraire un échantillon de points monde ;
 * - tester virtuellement plusieurs rotations possibles ;
 * - noter chaque orientation selon la plausibilité d'une base basse, d'une
 *   hauteur cohérente et d'une section verticale structurée ;
 * - appliquer la meilleure rotation uniquement si elle domine clairement
 *   l'orientation actuelle.
 */
export class ServiceOrientationModeleBabylon {
    constructor({
                    epaisseurTranche = 0.05,
                    seuilDominanceScoreZ = 1.9,
                    ratioDimensionZMin = 0.92,
                    limitePointsAnalyse = 160000,

                    // Nouveaux réglages du choix par candidats.
                    utiliserOrientationParCandidats = true,
                    seuilDominanceCandidat = 1.18,
                    margeScoreConserver = 0.10,
                    scoreMinimalCandidat = 0.08,
                    debugOrientation = true
                } = {}) {
        this.epaisseurTranche = epaisseurTranche;
        this.seuilDominanceScoreZ = seuilDominanceScoreZ;
        this.ratioDimensionZMin = ratioDimensionZMin;
        this.limitePointsAnalyse = limitePointsAnalyse;

        this.utiliserOrientationParCandidats = utiliserOrientationParCandidats;
        this.seuilDominanceCandidat = seuilDominanceCandidat;
        this.margeScoreConserver = margeScoreConserver;
        this.scoreMinimalCandidat = scoreMinimalCandidat;
        this.debugOrientation = debugOrientation;
    }

    corrigerOrientation(meshes = []) {
        const meshesValides = filtrerMeshesValides(meshes);

        if (meshesValides.length === 0) {
            return null;
        }

        const racine = creerOuTrouverRacineModeleANNA(meshes, {
            nom: "ANNAModeleRacine"
        });

        if (!racine) {
            return null;
        }

        this.reinitialiserRacine(racine);
        this.rafraichirMatricesEnfants(meshesValides);

        const infos = calculerBornesMeshes(meshesValides);

        if (!infos) {
            return null;
        }

        const dimensions = this.extraireDimensions(infos);
        const points = this.extrairePointsMonde(meshesValides);
        const analyseSections = this.analyserSectionsExtremesDepuisPoints(points, dimensions);

        let decision;

        if (this.utiliserOrientationParCandidats && points && points.length >= 30) {
            decision = this.determinerOrientationParCandidats(points, dimensions, analyseSections);
        } else {
            decision = this.determinerOrientation(dimensions, analyseSections);
        }

        this.logInfo("[Orientation modèle] Analyse des axes", {
            ...dimensions,
            analyseSections,
            decision
        });

        if (decision.action === "appliquer-candidat") {
            this.appliquerRotationCandidate(racine, decision.candidat);
            racine.computeWorldMatrix(true);
            this.rafraichirMatricesEnfants(meshesValides);

            this.logInfo("[Orientation modèle] Correction appliquée par candidat.", {
                candidat: decision.candidat?.nom,
                rotation: decision.candidat?.rotation,
                raison: decision.raison
            });

            return {
                orientationModifiee: true,
                axeDominant: decision.axeReference,
                rotation: decision.candidat?.nom ?? "candidat",
                dimensions,
                analyseSections,
                analyseCandidats: decision.analyseCandidats,
                raison: decision.raison,
                racine
            };
        }

        if (decision.action === "redresser-z-vers-y") {
            racine.rotation.x = -Math.PI / 2;
            racine.computeWorldMatrix(true);
            this.rafraichirMatricesEnfants(meshesValides);

            this.logInfo("[Orientation modèle] Correction appliquée : axe Z redressé vers Y.");

            return {
                orientationModifiee: true,
                axeDominant: "Z",
                rotation: "racine.x = -PI/2",
                dimensions,
                analyseSections,
                raison: decision.raison,
                racine
            };
        }

        this.logInfo("[Orientation modèle] Orientation conservée.", decision.raison);

        return {
            orientationModifiee: false,
            axeDominant: decision.axeReference,
            dimensions,
            analyseSections,
            analyseCandidats: decision.analyseCandidats,
            raison: decision.raison,
            racine
        };
    }

    reinitialiserRacine(racine) {
        racine.rotation = BABYLON.Vector3.Zero();
        racine.rotationQuaternion = null;
        racine.scaling = BABYLON.Vector3.One();
        racine.position = BABYLON.Vector3.Zero();
        racine.computeWorldMatrix(true);
    }

    extraireDimensions(infos) {
        const x = Math.abs(infos.taille.x);
        const y = Math.abs(infos.taille.y);
        const z = Math.abs(infos.taille.z);

        return {
            x,
            y,
            z,
            ratioZY: y > 0 ? z / y : Number.POSITIVE_INFINITY,
            ratioYZ: z > 0 ? y / z : Number.POSITIVE_INFINITY
        };
    }

    /**
     * Nouvelle stratégie générique : plusieurs rotations candidates sont testées
     * virtuellement sur les points extraits. Aucune rotation n'est appliquée tant
     * que la meilleure orientation ne domine pas clairement l'orientation actuelle.
     */
    determinerOrientationParCandidats(points, dimensionsInitiales, analyseSectionsInitiale) {
        const candidats = this.creerCandidatsOrientation();
        const analyses = candidats
            .map((candidat) => this.evaluerCandidatOrientation(points, candidat))
            .filter(Boolean)
            .sort((a, b) => b.score - a.score);

        const conserver = analyses.find((analyse) => analyse.candidat.nom === "conserver");
        const meilleur = analyses[0];
        const second = analyses[1] ?? null;

        if (!meilleur || !conserver) {
            return this.determinerOrientation(dimensionsInitiales, analyseSectionsInitiale);
        }

        const scoreConserver = conserver.score;
        const ratioSecond = second && second.score > 0
            ? meilleur.score / second.score
            : Number.POSITIVE_INFINITY;
        const gainSurConserver = meilleur.score - scoreConserver;

        const analyseCandidats = analyses.map((analyse) => ({
            nom: analyse.candidat.nom,
            score: Number(analyse.score.toFixed(4)),
            axeReference: analyse.candidat.axeReference,
            dimensions: analyse.dimensions,
            metriques: analyse.metriques
        }));

        if (meilleur.candidat.nom === "conserver") {
            return {
                action: "conserver",
                axeReference: "Y",
                analyseCandidats,
                raison: `l'orientation importée obtient le meilleur score (${meilleur.score.toFixed(3)})`
            };
        }

        if (meilleur.score < this.scoreMinimalCandidat) {
            return {
                action: "conserver",
                axeReference: "indetermine",
                analyseCandidats,
                raison: `score candidat trop faible (${meilleur.score.toFixed(3)} < ${this.scoreMinimalCandidat})`
            };
        }

        if (gainSurConserver < this.margeScoreConserver) {
            return {
                action: "conserver",
                axeReference: "Y-candidat-non-dominant",
                analyseCandidats,
                raison: `gain insuffisant sur l'orientation importée (${gainSurConserver.toFixed(3)} < ${this.margeScoreConserver})`
            };
        }

        if (ratioSecond < this.seuilDominanceCandidat) {
            return {
                action: "conserver",
                axeReference: "ambigu",
                analyseCandidats,
                raison: `meilleur candidat trop proche du second (${ratioSecond.toFixed(3)} < ${this.seuilDominanceCandidat})`
            };
        }

        return {
            action: "appliquer-candidat",
            axeReference: meilleur.candidat.axeReference,
            candidat: meilleur.candidat,
            analyseCandidats,
            raison: `candidat ${meilleur.candidat.nom} dominant : score=${meilleur.score.toFixed(3)}, conserver=${scoreConserver.toFixed(3)}, ratioSecond=${ratioSecond.toFixed(3)}`
        };
    }

    creerCandidatsOrientation() {
        return [
            {
                nom: "conserver",
                axeReference: "Y",
                rotation: { x: 0, y: 0, z: 0 }
            },
            {
                nom: "x-90",
                axeReference: "+Z vers +Y",
                rotation: { x: -Math.PI / 2, y: 0, z: 0 }
            },
            {
                nom: "x+90",
                axeReference: "-Z vers +Y",
                rotation: { x: Math.PI / 2, y: 0, z: 0 }
            },

            {
                nom: "z+90",
                axeReference: "+X vers +Y",
                rotation: { x: 0, y: 0, z: Math.PI / 2 }
            },
            {
                nom: "z-90",
                axeReference: "-X vers +Y",
                rotation: { x: 0, y: 0, z: -Math.PI / 2 }
            }
        ];
    }

    evaluerCandidatOrientation(points, candidat) {
        const pointsTransformes = points.map((point) => this.transformerPointCandidat(point, candidat.nom));
        const bornes = this.calculerBornesPoints(pointsTransformes);

        if (!bornes) {
            return null;
        }

        const dimensions = this.extraireDimensionsDepuisBornes(bornes);
        const metriques = this.calculerMetriquesOrientation(pointsTransformes, bornes, dimensions);
        const score = this.calculerScoreOrientation(metriques, candidat.nom);

        return {
            candidat,
            points: pointsTransformes,
            dimensions,
            metriques,
            score
        };
    }

    transformerPointCandidat(point, nomCandidat) {
        const { x, y, z } = point;

        switch (nomCandidat) {
            case "x-90":
                return { x, y: z, z: -y };
            case "x+90":
                return { x, y: -z, z: y };
            case "z+90":
                return { x: -y, y: x, z };
            case "z-90":
                return { x: y, y: -x, z };
            case "conserver":
            default:
                return { x, y, z };
        }
    }

    appliquerRotationCandidate(racine, candidat) {
        racine.rotationQuaternion = null;
        racine.rotation.x = candidat.rotation.x;
        racine.rotation.y = candidat.rotation.y;
        racine.rotation.z = candidat.rotation.z;
    }

    calculerBornesPoints(points) {
        if (!points || points.length === 0) {
            return null;
        }

        const min = {
            x: Number.POSITIVE_INFINITY,
            y: Number.POSITIVE_INFINITY,
            z: Number.POSITIVE_INFINITY
        };
        const max = {
            x: Number.NEGATIVE_INFINITY,
            y: Number.NEGATIVE_INFINITY,
            z: Number.NEGATIVE_INFINITY
        };

        points.forEach((point) => {
            min.x = Math.min(min.x, point.x);
            min.y = Math.min(min.y, point.y);
            min.z = Math.min(min.z, point.z);

            max.x = Math.max(max.x, point.x);
            max.y = Math.max(max.y, point.y);
            max.z = Math.max(max.z, point.z);
        });

        if (![min.x, min.y, min.z, max.x, max.y, max.z].every(Number.isFinite)) {
            return null;
        }

        return { min, max };
    }

    extraireDimensionsDepuisBornes(bornes) {
        const x = Math.abs(bornes.max.x - bornes.min.x);
        const y = Math.abs(bornes.max.y - bornes.min.y);
        const z = Math.abs(bornes.max.z - bornes.min.z);

        return {
            x,
            y,
            z,
            ratioZY: y > 0 ? z / y : Number.POSITIVE_INFINITY,
            ratioYZ: z > 0 ? y / z : Number.POSITIVE_INFINITY
        };
    }

    calculerMetriquesOrientation(points, bornes, dimensions) {
        const hauteur = Math.max(dimensions.y, 0.000001);
        const largeur = Math.max(dimensions.x, 0.000001);
        const profondeur = Math.max(dimensions.z, 0.000001);
        const aireHorizontale = Math.max(largeur * profondeur, 0.000001);
        const marge = hauteur * this.epaisseurTranche;

        const bas = this.creerAccumulateurSection(["x", "z"]);
        const haut = this.creerAccumulateurSection(["x", "z"]);
        let sommeY = 0;

        points.forEach((point) => {
            sommeY += point.y;

            if (point.y <= bornes.min.y + marge) {
                this.ajouterPointSection(bas, point, ["x", "z"]);
            }

            if (point.y >= bornes.max.y - marge) {
                this.ajouterPointSection(haut, point, ["x", "z"]);
            }
        });

        const aireBas = this.calculerAireSection(bas);
        const aireHaut = this.calculerAireSection(haut);
        const scoreAireBas = this.borner01(aireBas / aireHorizontale);
        const scoreAireHaut = this.borner01(aireHaut / aireHorizontale);
        const ratioPointsBas = this.borner01(bas.count / Math.max(points.length, 1));
        const ratioPointsHaut = this.borner01(haut.count / Math.max(points.length, 1));

        const centreRelatif = this.borner01((sommeY / points.length - bornes.min.y) / hauteur);
        const scoreCentre = this.borner01(1.0 - Math.abs(centreRelatif - 0.48) / 0.48);
        const ratioHauteur = hauteur / Math.max(largeur, profondeur, 0.000001);
        const scoreVerticalite = this.borner01(ratioHauteur / 1.35);

        const scoreSectionsExtremes = this.borner01((scoreAireBas + scoreAireHaut) * 0.5);
        const scoreBase = this.borner01(scoreAireBas * 0.75 + ratioPointsBas * 2.0);
        const penaliteTopPlusSolide = Math.max(0, scoreAireHaut - scoreAireBas) * 0.35;

        return {
            hauteur,
            largeur,
            profondeur,
            aireBas,
            aireHaut,
            scoreAireBas,
            scoreAireHaut,
            pointsBas: bas.count,
            pointsHaut: haut.count,
            ratioPointsBas,
            ratioPointsHaut,
            centreRelatif,
            scoreCentre,
            ratioHauteur,
            scoreVerticalite,
            scoreSectionsExtremes,
            scoreBase,
            penaliteTopPlusSolide
        };
    }

    calculerScoreOrientation(metriques, nomCandidat) {
        const bonusConserver = nomCandidat === "conserver" ? 0.035 : 0;

        return Math.max(
            0,
            metriques.scoreBase * 2.1
            + metriques.scoreSectionsExtremes * 1.2
            + metriques.scoreVerticalite * 0.55
            + metriques.scoreCentre * 0.45
            + bonusConserver
            - metriques.penaliteTopPlusSolide
        );
    }

    determinerOrientation(dimensions, analyseSections) {
        const { y, z, ratioZY } = dimensions;
        const scoreY = analyseSections?.y?.score ?? 0;
        const scoreZ = analyseSections?.z?.score ?? 0;
        const ratioScoresZY = scoreY > 0 ? scoreZ / scoreY : Number.POSITIVE_INFINITY;

        if (y <= 0 && z <= 0) {
            return {
                action: "conserver",
                axeReference: "indetermine",
                raison: "dimensions Y/Z insuffisantes"
            };
        }

        if (!analyseSections?.analyseDisponible) {
            return this.determinerOrientationParDimensions(dimensions);
        }

        if (
            scoreZ > 0 &&
            scoreY > 0 &&
            ratioScoresZY >= this.seuilDominanceScoreZ &&
            ratioZY >= this.ratioDimensionZMin
        ) {
            return {
                action: "redresser-z-vers-y",
                axeReference: "Z",
                raison: `les sections extrêmes de Z dominent Y (${ratioScoresZY.toFixed(3)} >= ${this.seuilDominanceScoreZ})`
            };
        }

        if (scoreY >= scoreZ) {
            return {
                action: "conserver",
                axeReference: "Y",
                raison: `Y est l'axe vertical le plus probable d'après les sections extrêmes (Y=${scoreY.toFixed(3)}, Z=${scoreZ.toFixed(3)})`
            };
        }

        return {
            action: "conserver",
            axeReference: "Y/Z-ambigu",
            raison: `Z ne domine pas assez Y pour justifier une rotation automatique (ratio=${ratioScoresZY.toFixed(3)}, seuil=${this.seuilDominanceScoreZ})`
        };
    }

    determinerOrientationParDimensions({ y, z, ratioZY }) {
        // Fallback volontairement prudent : si on ne peut pas lire les vertices,
        // on évite de tourner les objets uniquement parce qu'une dimension est
        // un peu plus grande. Cela rapproche le comportement du Babylon Sandbox.
        if (z > y && ratioZY >= 1.25) {
            return {
                action: "redresser-z-vers-y",
                axeReference: "Z",
                raison: `fallback dimensions : Z domine fortement Y (${ratioZY.toFixed(3)} >= 1.25)`
            };
        }

        return {
            action: "conserver",
            axeReference: "Y",
            raison: "fallback dimensions prudent : orientation importée conservée"
        };
    }

    analyserSectionsExtremes(meshesValides, dimensions) {
        const points = this.extrairePointsMonde(meshesValides);
        return this.analyserSectionsExtremesDepuisPoints(points, dimensions);
    }

    analyserSectionsExtremesDepuisPoints(points, dimensions) {
        if (!points || points.length < 30) {
            return {
                analyseDisponible: false,
                raison: "pas assez de points pour analyser les sections extrêmes"
            };
        }

        const scoreY = this.calculerScoreSectionsPourAxe(points, 1, dimensions);
        const scoreZ = this.calculerScoreSectionsPourAxe(points, 2, dimensions);

        return {
            analyseDisponible: true,
            epaisseurTranche: this.epaisseurTranche,
            pointsAnalyses: points.length,
            y: scoreY,
            z: scoreZ
        };
    }

    extrairePointsMonde(meshesValides) {
        const totalVertices = meshesValides.reduce((total, mesh) => {
            const positions = mesh.getVerticesData?.(BABYLON.VertexBuffer.PositionKind);
            return total + (positions ? Math.floor(positions.length / 3) : 0);
        }, 0);

        if (totalVertices <= 0) {
            return [];
        }

        const pas = Math.max(1, Math.ceil(totalVertices / this.limitePointsAnalyse));
        const points = [];
        let indexGlobal = 0;
        const local = new BABYLON.Vector3();
        const monde = new BABYLON.Vector3();

        meshesValides.forEach((mesh) => {
            const positions = mesh.getVerticesData?.(BABYLON.VertexBuffer.PositionKind);

            if (!positions) {
                return;
            }

            mesh.computeWorldMatrix(true);
            const matriceMonde = mesh.getWorldMatrix();

            for (let i = 0; i < positions.length; i += 3) {
                if (indexGlobal % pas === 0) {
                    local.set(positions[i], positions[i + 1], positions[i + 2]);
                    BABYLON.Vector3.TransformCoordinatesToRef(local, matriceMonde, monde);
                    points.push({
                        x: monde.x,
                        y: monde.y,
                        z: monde.z
                    });
                }

                indexGlobal += 1;
            }
        });

        return points;
    }

    calculerScoreSectionsPourAxe(points, axeIndex, dimensions) {
        const coord = this.nomCoordonnee(axeIndex);
        const autres = [0, 1, 2]
            .filter((index) => index !== axeIndex)
            .map((index) => this.nomCoordonnee(index));

        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;

        points.forEach((point) => {
            const valeur = point[coord];
            min = Math.min(min, valeur);
            max = Math.max(max, valeur);
        });

        const taille = max - min;

        if (!Number.isFinite(taille) || taille <= 0) {
            return {
                score: 0,
                aireBasse: 0,
                aireHaute: 0,
                pointsBas: 0,
                pointsHaut: 0
            };
        }

        const marge = taille * this.epaisseurTranche;
        const bas = this.creerAccumulateurSection(autres);
        const haut = this.creerAccumulateurSection(autres);

        points.forEach((point) => {
            const valeur = point[coord];

            if (valeur <= min + marge) {
                this.ajouterPointSection(bas, point, autres);
            }

            if (valeur >= max - marge) {
                this.ajouterPointSection(haut, point, autres);
            }
        });

        const aireBasse = this.calculerAireSection(bas, autres);
        const aireHaute = this.calculerAireSection(haut, autres);
        const aireMax = Math.max(
            this.dimensionPourCoordonnee(autres[0], dimensions) * this.dimensionPourCoordonnee(autres[1], dimensions),
            0.000001
        );

        // Score normalisé entre 0 et ~1 : plus les sections extrêmes occupent
        // une vraie surface, plus l'axe ressemble à un axe vertical plausible.
        const score = (aireBasse + aireHaute) / (2 * aireMax);

        return {
            score,
            aireBasse,
            aireHaute,
            aireMax,
            pointsBas: bas.count,
            pointsHaut: haut.count
        };
    }

    creerAccumulateurSection(autres) {
        return {
            count: 0,
            minA: Number.POSITIVE_INFINITY,
            maxA: Number.NEGATIVE_INFINITY,
            minB: Number.POSITIVE_INFINITY,
            maxB: Number.NEGATIVE_INFINITY,
            coordA: autres[0],
            coordB: autres[1]
        };
    }

    ajouterPointSection(section, point, autres) {
        const a = point[autres[0]];
        const b = point[autres[1]];

        section.count += 1;
        section.minA = Math.min(section.minA, a);
        section.maxA = Math.max(section.maxA, a);
        section.minB = Math.min(section.minB, b);
        section.maxB = Math.max(section.maxB, b);
    }

    calculerAireSection(section) {
        if (!section || section.count < 8) {
            return 0;
        }

        const largeurA = Math.max(0, section.maxA - section.minA);
        const largeurB = Math.max(0, section.maxB - section.minB);

        return largeurA * largeurB;
    }

    nomCoordonnee(index) {
        return ["x", "y", "z"][index] ?? "y";
    }

    dimensionPourCoordonnee(coord, dimensions) {
        return Math.abs(dimensions?.[coord] ?? 0);
    }

    borner01(valeur) {
        if (!Number.isFinite(valeur)) {
            return 0;
        }

        return Math.min(1, Math.max(0, valeur));
    }

    logInfo(...args) {
        if (this.debugOrientation) {
            console.info(...args);
        }
    }

    rafraichirMatricesEnfants(meshes = []) {
        meshes.forEach((mesh) => {
            if (mesh && typeof mesh.computeWorldMatrix === "function") {
                mesh.computeWorldMatrix(true);
            }
        });
    }
}