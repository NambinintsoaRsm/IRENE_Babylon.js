import { FONCTIONS_GRADIENT_COULEUR_PERCEPTUEL_GLSL } from "./FonctionsGradientCouleurPerceptuel.js";

/**
 * Canny perceptuel pour les contours couleur.
 *
 * Pipeline scène principale :
 * - copie de la scène couleur pour la composition ;
 * - rendu couleur de base du matériau, sans éclairage ;
 * - gradient couleur OKLab légèrement lissé sur cette couleur de base ;
 * - suppression des non-maxima ;
 * - double seuil ;
 * - hystérésis ;
 * - validation du contraste moyen des deux côtés ;
 * - fermeture directionnelle de petites coupures ;
 * - nettoyage des fragments courts ;
 * - nettoyage de voisinage ;
 * - composition + épaisseur finale.
 */
export const SHADER_CANNY_COULEUR_COPIE_SCENE = "saotraCannyCouleurCopieScenePixelShader";
export const SHADER_CANNY_COULEUR_GRADIENT = "saotraCannyCouleurGradientPixelShader";
export const SHADER_CANNY_COULEUR_NMS = "saotraCannyCouleurNmsPixelShader";
export const SHADER_CANNY_COULEUR_SEUILS = "saotraCannyCouleurSeuilsPixelShader";
export const SHADER_CANNY_COULEUR_HYSTERESIS = "saotraCannyCouleurHysteresisPixelShader";
export const SHADER_CANNY_COULEUR_VALIDATION = "saotraCannyCouleurValidationPixelShader";
export const SHADER_CANNY_COULEUR_FERMETURE = "saotraCannyCouleurFermeturePixelShader";
export const SHADER_CANNY_COULEUR_NETTOYAGE_LONGUEUR = "saotraCannyCouleurNettoyageLongueurPixelShader";
export const SHADER_CANNY_COULEUR_NETTOYAGE_VOISINAGE = "saotraCannyCouleurNettoyageVoisinagePixelShader";
export const SHADER_CANNY_COULEUR_COMPOSITION = "saotraCannyCouleurCompositionPixelShader";

let shadersCouleurCannyCrees = false;

export function creerShadersContoursCouleurCannySiNecessaire() {
    if (shadersCouleurCannyCrees) {
        return obtenirNomsShadersCouleurCanny();
    }

    BABYLON.Effect.ShadersStore[SHADER_CANNY_COULEUR_COPIE_SCENE] = `
        precision highp float;
        varying vec2 vUV;
        uniform sampler2D textureSampler;

        void main(void) {
            gl_FragColor = texture2D(textureSampler, vUV);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_COULEUR_GRADIENT] = `
        precision highp float;
        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform sampler2D couleurBaseSampler;
        uniform vec2 screenSize;
        uniform float colorLightnessWeight;
        uniform float colorChromaWeight;
        uniform float sampleRadius;
        uniform float smoothingEnabled;
        uniform float smoothingRadius;

        vec3 getColorPerceptual(vec2 uv) {
            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            vec2 uvClamped = clamp(uv, vec2(0.001), vec2(0.999));

            if (smoothingEnabled < 0.5) {
                return texture2D(couleurBaseSampler, uvClamped).rgb;
            }

            vec2 d = texel * max(0.0, smoothingRadius);
            vec3 centre = texture2D(couleurBaseSampler, uvClamped).rgb;
            vec3 axe =
                texture2D(couleurBaseSampler, clamp(uvClamped + vec2( d.x, 0.0), vec2(0.001), vec2(0.999))).rgb +
                texture2D(couleurBaseSampler, clamp(uvClamped + vec2(-d.x, 0.0), vec2(0.001), vec2(0.999))).rgb +
                texture2D(couleurBaseSampler, clamp(uvClamped + vec2(0.0,  d.y), vec2(0.001), vec2(0.999))).rgb +
                texture2D(couleurBaseSampler, clamp(uvClamped + vec2(0.0, -d.y), vec2(0.001), vec2(0.999))).rgb;
            vec3 diag =
                texture2D(couleurBaseSampler, clamp(uvClamped + vec2( d.x,  d.y), vec2(0.001), vec2(0.999))).rgb +
                texture2D(couleurBaseSampler, clamp(uvClamped + vec2(-d.x,  d.y), vec2(0.001), vec2(0.999))).rgb +
                texture2D(couleurBaseSampler, clamp(uvClamped + vec2( d.x, -d.y), vec2(0.001), vec2(0.999))).rgb +
                texture2D(couleurBaseSampler, clamp(uvClamped + vec2(-d.x, -d.y), vec2(0.001), vec2(0.999))).rgb;

            return centre * 0.36 + axe * 0.12 + diag * 0.04;
        }

        ${FONCTIONS_GRADIENT_COULEUR_PERCEPTUEL_GLSL}

        void main(void) {
            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            float rayon = max(0.65, sampleRadius);

            float direction = directionDominanteCouleurPerceptuelle(
                vUV,
                texel,
                rayon,
                colorLightnessWeight,
                colorChromaWeight
            );

            float force = reponseDirectionCouleurPerceptuelle(
                vUV,
                texel,
                direction,
                rayon,
                colorLightnessWeight,
                colorChromaWeight
            );

            // R = force, G = direction quantifiée / 7.
            gl_FragColor = vec4(clamp(force, 0.0, 1.0), direction / 7.0, 0.0, 1.0);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_COULEUR_NMS] = `
        precision highp float;
        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform vec2 screenSize;
        uniform float toleranceNonMaximum;

        vec2 directionDepuisCode(float codeNormalise) {
            float direction = floor(codeNormalise * 7.0 + 0.5);
            if (direction < 0.5) return vec2( 1.00000000,  0.00000000);
            if (direction < 1.5) return vec2( 0.92387953,  0.38268343);
            if (direction < 2.5) return vec2( 0.70710678,  0.70710678);
            if (direction < 3.5) return vec2( 0.38268343,  0.92387953);
            if (direction < 4.5) return vec2( 0.00000000,  1.00000000);
            if (direction < 5.5) return vec2(-0.38268343,  0.92387953);
            if (direction < 6.5) return vec2(-0.70710678,  0.70710678);
            return vec2(-0.92387953,  0.38268343);
        }

        void main(void) {
            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            vec4 centre = texture2D(textureSampler, vUV);
            float force = centre.r;
            vec2 direction = directionDepuisCode(centre.g);

            float avant = texture2D(textureSampler, clamp(vUV + texel * direction, 0.0, 1.0)).r;
            float apres = texture2D(textureSampler, clamp(vUV - texel * direction, 0.0, 1.0)).r;
            float voisinMax = max(avant, apres);
            float garde = step(voisinMax * toleranceNonMaximum, force + 0.00001);

            gl_FragColor = vec4(force * garde, centre.g, 0.0, 1.0);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_COULEUR_SEUILS] = `
        precision highp float;
        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform float seuilFaible;
        uniform float seuilFort;

        void main(void) {
            vec4 data = texture2D(textureSampler, vUV);
            float force = data.r;
            float fort = step(seuilFort, force);
            float faible = step(seuilFaible, force);

            // R = accepté fort, G = candidat faible, B = direction / 7.
            gl_FragColor = vec4(fort, faible, data.g, 1.0);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_COULEUR_HYSTERESIS] = `
        precision highp float;
        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform vec2 screenSize;
        uniform float utiliserDiagonales;

        float acceptedAt(vec2 uv) {
            return texture2D(textureSampler, clamp(uv, 0.0, 1.0)).r;
        }

        void main(void) {
            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            vec4 data = texture2D(textureSampler, vUV);

            float accepte = data.r;
            float faible = data.g;
            float voisinAccepte = 0.0;

            voisinAccepte = max(voisinAccepte, acceptedAt(vUV + texel * vec2( 1.0,  0.0)));
            voisinAccepte = max(voisinAccepte, acceptedAt(vUV + texel * vec2(-1.0,  0.0)));
            voisinAccepte = max(voisinAccepte, acceptedAt(vUV + texel * vec2( 0.0,  1.0)));
            voisinAccepte = max(voisinAccepte, acceptedAt(vUV + texel * vec2( 0.0, -1.0)));

            if (utiliserDiagonales > 0.5) {
                voisinAccepte = max(voisinAccepte, acceptedAt(vUV + texel * vec2( 1.0,  1.0)));
                voisinAccepte = max(voisinAccepte, acceptedAt(vUV + texel * vec2(-1.0,  1.0)));
                voisinAccepte = max(voisinAccepte, acceptedAt(vUV + texel * vec2( 1.0, -1.0)));
                voisinAccepte = max(voisinAccepte, acceptedAt(vUV + texel * vec2(-1.0, -1.0)));
            }

            float nouveauAccepte = max(accepte, faible * step(0.5, voisinAccepte));
            gl_FragColor = vec4(nouveauAccepte, faible, data.b, 1.0);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_COULEUR_VALIDATION] = `
        precision highp float;
        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform sampler2D couleurBaseSampler;
        uniform vec2 screenSize;
        uniform float validationContrasteActif;
        uniform float distanceDeuxCotesMin;
        uniform float rayonDeuxCotes;
        uniform float decalageTangent;
        uniform float validationMultiEchelleActif;
        uniform float rayonValidationLarge;
        uniform float ratioValidationMin;
        uniform float colorLightnessWeight;
        uniform float colorChromaWeight;

        vec2 directionDepuisCode(float codeNormalise) {
            float direction = floor(codeNormalise * 7.0 + 0.5);
            if (direction < 0.5) return vec2( 1.00000000,  0.00000000);
            if (direction < 1.5) return vec2( 0.92387953,  0.38268343);
            if (direction < 2.5) return vec2( 0.70710678,  0.70710678);
            if (direction < 3.5) return vec2( 0.38268343,  0.92387953);
            if (direction < 4.5) return vec2( 0.00000000,  1.00000000);
            if (direction < 5.5) return vec2(-0.38268343,  0.92387953);
            if (direction < 6.5) return vec2(-0.70710678,  0.70710678);
            return vec2(-0.92387953,  0.38268343);
        }

        vec3 getColorPerceptual(vec2 uv) {
            return texture2D(couleurBaseSampler, clamp(uv, vec2(0.001), vec2(0.999))).rgb;
        }

        ${FONCTIONS_GRADIENT_COULEUR_PERCEPTUEL_GLSL}

        vec3 moyenneCote(vec2 uv, vec2 texel, vec2 normale, vec2 tangente, float signe, float rayon) {
            vec2 base = uv + normale * texel * rayon * signe;
            vec2 dt = tangente * texel * max(0.0, decalageTangent);

            vec3 c0 = lireOklabPerceptuel(base);
            vec3 c1 = lireOklabPerceptuel(base + dt);
            vec3 c2 = lireOklabPerceptuel(base - dt);

            return c0 * 0.50 + (c1 + c2) * 0.25;
        }

        float contrasteDeuxCotes(vec2 uv, vec2 texel, vec2 normale, float rayon) {
            vec2 tangente = vec2(-normale.y, normale.x);
            vec3 coteA = moyenneCote(uv, texel, normale, tangente, -1.0, rayon);
            vec3 coteB = moyenneCote(uv, texel, normale, tangente,  1.0, rayon);

            return distanceOklabPondereePerceptuelle(
                coteA,
                coteB,
                colorLightnessWeight,
                colorChromaWeight
            );
        }

        void main(void) {
            vec4 masque = texture2D(textureSampler, vUV);
            float accepte = masque.r;

            if (accepte < 0.5) {
                gl_FragColor = vec4(0.0, 0.0, masque.b, 1.0);
                return;
            }

            if (validationContrasteActif < 0.5 && validationMultiEchelleActif < 0.5) {
                gl_FragColor = vec4(accepte, accepte, masque.b, 1.0);
                return;
            }

            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            vec2 normale = directionDepuisCode(masque.b);

            float contrasteLocal = contrasteDeuxCotes(
                vUV,
                texel,
                normale,
                max(1.0, rayonDeuxCotes)
            );

            float garde = 1.0;

            if (validationContrasteActif > 0.5) {
                garde *= smoothstep(distanceDeuxCotesMin * 0.85, distanceDeuxCotesMin, contrasteLocal);
            }

            if (validationMultiEchelleActif > 0.5) {
                float contrasteLarge = contrasteDeuxCotes(
                    vUV,
                    texel,
                    normale,
                    max(rayonDeuxCotes + 0.5, rayonValidationLarge)
                );
                float ratio = contrasteLarge / max(contrasteLocal, 0.0001);
                float gardeRatio = smoothstep(ratioValidationMin * 0.80, ratioValidationMin, ratio);
                float gardeForce = smoothstep(distanceDeuxCotesMin * 0.55, distanceDeuxCotesMin * 0.85, contrasteLarge);
                garde *= gardeRatio * gardeForce;
            }

            float finalMask = accepte * step(0.5, garde);
            gl_FragColor = vec4(finalMask, finalMask, masque.b, 1.0);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_COULEUR_FERMETURE] = `
        precision highp float;
        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform vec2 screenSize;
        uniform float fermetureActif;
        uniform float seuilMasque;
        uniform float rayonPont;
        uniform float utiliserDiagonales;
        uniform float exigerDirectionLocale;

        float maskAt(vec2 uv) {
            return step(seuilMasque, texture2D(textureSampler, clamp(uv, 0.0, 1.0)).r);
        }

        vec2 directionDepuisCode(float codeNormalise) {
            float direction = floor(codeNormalise * 7.0 + 0.5);
            if (direction < 0.5) return vec2( 1.00000000,  0.00000000);
            if (direction < 1.5) return vec2( 0.92387953,  0.38268343);
            if (direction < 2.5) return vec2( 0.70710678,  0.70710678);
            if (direction < 3.5) return vec2( 0.38268343,  0.92387953);
            if (direction < 4.5) return vec2( 0.00000000,  1.00000000);
            if (direction < 5.5) return vec2(-0.38268343,  0.92387953);
            if (direction < 6.5) return vec2(-0.70710678,  0.70710678);
            return vec2(-0.92387953,  0.38268343);
        }

        float scorePontDirection(vec2 uv, vec2 texel, vec2 direction) {
            vec2 dir = normalize(direction);

            float p1 = maskAt(uv + texel * dir);
            float n1 = maskAt(uv - texel * dir);

            // Cas principal : le pixel courant est un trou d'un pixel entre deux segments.
            float score = p1 * n1;

            // Cas plus souple : trou de deux pixels ou petite irrégularité diagonale.
            if (rayonPont > 1.5) {
                float p2 = maskAt(uv + texel * dir * 2.0);
                float n2 = maskAt(uv - texel * dir * 2.0);

                // On exige toujours une présence de part et d'autre, mais on tolère
                // que l'un des deux côtés commence au deuxième pixel.
                score = max(score, p1 * n2);
                score = max(score, p2 * n1);
                score = max(score, p2 * n2);
            }

            return score;
        }

        float scorePontAutour(vec2 uv, vec2 texel, float directionLocale) {
            float score = 0.0;

            // Axes principaux.
            score = max(score, scorePontDirection(uv, texel, vec2(1.0, 0.0)));
            score = max(score, scorePontDirection(uv, texel, vec2(0.0, 1.0)));

            if (utiliserDiagonales > 0.5) {
                score = max(score, scorePontDirection(uv, texel, normalize(vec2(1.0, 1.0))));
                score = max(score, scorePontDirection(uv, texel, normalize(vec2(1.0, -1.0))));
            }

            if (exigerDirectionLocale > 0.5) {
                vec2 direction = directionDepuisCode(directionLocale);
                float scoreLocal = scorePontDirection(uv, texel, direction);
                vec2 tangente = vec2(-direction.y, direction.x);
                scoreLocal = max(scoreLocal, scorePontDirection(uv, texel, tangente));

                // La direction issue du gradient est parfois instable sur les surfaces
                // texturées ; on conserve une petite tolérance avec le meilleur axe.
                score = max(scoreLocal, score * 0.35);
            }

            return score;
        }

        void main(void) {
            vec4 data = texture2D(textureSampler, vUV);
            float centre = step(seuilMasque, data.r);

            if (fermetureActif < 0.5 || centre > 0.5) {
                gl_FragColor = vec4(centre, centre, data.b, 1.0);
                return;
            }

            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            float pont = scorePontAutour(vUV, texel, data.b);
            float garde = step(0.5, pont);

            gl_FragColor = vec4(garde, garde, data.b, 1.0);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_COULEUR_NETTOYAGE_LONGUEUR] = `
        precision highp float;
        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform vec2 screenSize;
        uniform float nettoyageActif;
        uniform float longueurMin;
        uniform float rayonMax;
        uniform float trousMax;
        uniform float exigerDeuxCotes;
        uniform float testerDiagonales;
        uniform float seuilMasque;

        float lireMasque(vec2 uv) {
            return texture2D(textureSampler, clamp(uv, 0.0, 1.0)).r;
        }

        float estContour(vec2 uv) {
            return step(seuilMasque, lireMasque(uv));
        }

        float longueurDansUnSens(vec2 uv, vec2 texel, vec2 direction) {
            float longueur = 0.0;
            float trous = 0.0;

            for (int i = 1; i <= 12; i += 1) {
                float fi = float(i);
                if (fi > rayonMax) {
                    break;
                }

                float v = estContour(uv + direction * texel * fi);
                if (v > 0.5) {
                    longueur += 1.0;
                } else {
                    trous += 1.0;
                    if (trous > trousMax) {
                        break;
                    }
                }
            }

            return longueur;
        }

        float longueurTraitDirection(vec2 uv, vec2 texel, vec2 direction) {
            float centre = estContour(uv);
            if (centre < 0.5) {
                return 0.0;
            }

            float longueurPlus = longueurDansUnSens(uv, texel, direction);
            float longueurMoins = longueurDansUnSens(uv, texel, -direction);
            float longueurTotale = 1.0 + longueurPlus + longueurMoins;

            if (exigerDeuxCotes > 0.5) {
                float deuxCotes = step(2.0, longueurPlus) * step(2.0, longueurMoins);
                longueurTotale *= deuxCotes;
            }

            return longueurTotale;
        }

        float longueurMaxTrait(vec2 uv, vec2 texel) {
            float h = longueurTraitDirection(uv, texel, vec2(1.0, 0.0));
            float v = longueurTraitDirection(uv, texel, vec2(0.0, 1.0));
            float meilleure = max(h, v);

            if (testerDiagonales > 0.5) {
                float d1 = longueurTraitDirection(uv, texel, normalize(vec2(1.0, 1.0)));
                float d2 = longueurTraitDirection(uv, texel, normalize(vec2(1.0, -1.0)));
                meilleure = max(meilleure, max(d1, d2));
            }

            return meilleure;
        }

        void main(void) {
            vec4 data = texture2D(textureSampler, vUV);
            float centre = data.r;

            if (nettoyageActif < 0.5) {
                gl_FragColor = vec4(centre, centre, data.b, 1.0);
                return;
            }

            if (centre < seuilMasque) {
                gl_FragColor = vec4(0.0, 0.0, data.b, 1.0);
                return;
            }

            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            float longueur = longueurMaxTrait(vUV, texel);
            float garde = step(longueurMin, longueur);

            gl_FragColor = vec4(garde, garde, data.b, 1.0);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_COULEUR_NETTOYAGE_VOISINAGE] = `
        precision highp float;
        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform vec2 screenSize;
        uniform float nettoyageActif;
        uniform float voisinsMin;
        uniform float utiliserDiagonales;

        float maskAt(vec2 uv) {
            return step(0.5, texture2D(textureSampler, clamp(uv, 0.0, 1.0)).r);
        }

        void main(void) {
            vec4 data = texture2D(textureSampler, vUV);
            float centre = step(0.5, data.r);

            if (nettoyageActif < 0.5 || centre < 0.5) {
                gl_FragColor = vec4(centre, centre, data.b, 1.0);
                return;
            }

            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            float voisins = 0.0;
            voisins += maskAt(vUV + texel * vec2( 1.0,  0.0));
            voisins += maskAt(vUV + texel * vec2(-1.0,  0.0));
            voisins += maskAt(vUV + texel * vec2( 0.0,  1.0));
            voisins += maskAt(vUV + texel * vec2( 0.0, -1.0));

            if (utiliserDiagonales > 0.5) {
                voisins += maskAt(vUV + texel * vec2( 1.0,  1.0));
                voisins += maskAt(vUV + texel * vec2(-1.0,  1.0));
                voisins += maskAt(vUV + texel * vec2( 1.0, -1.0));
                voisins += maskAt(vUV + texel * vec2(-1.0, -1.0));
            }

            float garde = step(voisinsMin, voisins);
            gl_FragColor = vec4(garde, garde, data.b, 1.0);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_COULEUR_COMPOSITION] = `
        precision highp float;
        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform sampler2D sceneColorSampler;
        uniform vec2 screenSize;
        uniform float edgeWidth;
        uniform vec3 colorEdgeColor;

        float maskAt(vec2 uv) {
            return texture2D(textureSampler, clamp(uv, 0.0, 1.0)).r;
        }

        float poidsRayon(float rayon, float largeur) {
            if (rayon <= 1.0) {
                return 1.0;
            }
            return smoothstep(rayon - 1.0, rayon, largeur);
        }

        float masqueEpais(vec2 texel, float largeur) {
            float largeurBornee = clamp(largeur, 1.0, 2.5);
            float masque = maskAt(vUV);
            float poids2 = poidsRayon(2.0, largeurBornee);

            masque = max(masque, maskAt(vUV + texel * vec2( 1.0,  0.0)) * poids2);
            masque = max(masque, maskAt(vUV + texel * vec2(-1.0,  0.0)) * poids2);
            masque = max(masque, maskAt(vUV + texel * vec2( 0.0,  1.0)) * poids2);
            masque = max(masque, maskAt(vUV + texel * vec2( 0.0, -1.0)) * poids2);

            if (largeurBornee > 1.6) {
                float poidsDiag = poids2 * 0.70;
                masque = max(masque, maskAt(vUV + texel * vec2( 1.0,  1.0)) * poidsDiag);
                masque = max(masque, maskAt(vUV + texel * vec2(-1.0,  1.0)) * poidsDiag);
                masque = max(masque, maskAt(vUV + texel * vec2( 1.0, -1.0)) * poidsDiag);
                masque = max(masque, maskAt(vUV + texel * vec2(-1.0, -1.0)) * poidsDiag);
            }

            return smoothstep(0.20, 0.85, clamp(masque, 0.0, 1.0));
        }

        void main(void) {
            vec4 original = texture2D(sceneColorSampler, vUV);
            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            float masque = masqueEpais(texel, edgeWidth);

            gl_FragColor = vec4(
                mix(original.rgb, colorEdgeColor, clamp(masque, 0.0, 1.0)),
                original.a
            );
        }
    `;

    shadersCouleurCannyCrees = true;
    return obtenirNomsShadersCouleurCanny();
}

function obtenirNomsShadersCouleurCanny() {
    return Object.freeze({
        copieScene: SHADER_CANNY_COULEUR_COPIE_SCENE,
        gradient: SHADER_CANNY_COULEUR_GRADIENT,
        nms: SHADER_CANNY_COULEUR_NMS,
        seuils: SHADER_CANNY_COULEUR_SEUILS,
        hysteresis: SHADER_CANNY_COULEUR_HYSTERESIS,
        validation: SHADER_CANNY_COULEUR_VALIDATION,
        fermeture: SHADER_CANNY_COULEUR_FERMETURE,
        nettoyageLongueur: SHADER_CANNY_COULEUR_NETTOYAGE_LONGUEUR,
        nettoyageVoisinage: SHADER_CANNY_COULEUR_NETTOYAGE_VOISINAGE,
        composition: SHADER_CANNY_COULEUR_COMPOSITION
    });
}
