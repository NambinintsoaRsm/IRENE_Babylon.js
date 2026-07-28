/**
 * Shaders du vrai Canny appliqué au contour Relief.
 *
 * Pipeline :
 * - copie de la couleur de scène ;
 * - gradient des normales ;
 * - suppression des non-maxima ;
 * - double seuil fort/faible ;
 * - hystérésis itérative ;
 * - composition finale avec silhouette + relief.
 *
 * La loupe n'utilise pas encore ce pipeline.
 */

export const SHADER_CANNY_COPIE_SCENE = "saotraCannyCopieScenePixelShader";
export const SHADER_CANNY_GRADIENT_RELIEF = "saotraCannyGradientReliefPixelShader";
export const SHADER_CANNY_NMS_RELIEF = "saotraCannyNmsReliefPixelShader";
export const SHADER_CANNY_SEUILS_RELIEF = "saotraCannySeuilsReliefPixelShader";
export const SHADER_CANNY_HYSTERESIS_RELIEF = "saotraCannyHysteresisReliefPixelShader";
export const SHADER_CANNY_NETTOYAGE_LONGUEUR_RELIEF = "saotraCannyNettoyageLongueurReliefPixelShader";
export const SHADER_CANNY_COMPOSITION_RELIEF = "saotraCannyCompositionReliefPixelShader";

let shadersReliefCannyCrees = false;

export function creerShadersReliefCannySiNecessaire() {
    if (shadersReliefCannyCrees) {
        return obtenirNomsShadersReliefCanny();
    }

    BABYLON.Effect.ShadersStore[SHADER_CANNY_COPIE_SCENE] = `
        precision highp float;
        varying vec2 vUV;
        uniform sampler2D textureSampler;

        void main(void) {
            gl_FragColor = texture2D(textureSampler, vUV);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_GRADIENT_RELIEF] = `
        precision highp float;
        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform sampler2D normalSampler;
        uniform vec2 screenSize;

        uniform float prefiltrageActif;
        uniform float rayonPrefiltrage;
        uniform float poidsCentrePrefiltrage;
        uniform float seuilConservationAretes;
        uniform float multiEchelleActif;
        uniform float rayonEchelleMoyenne;
        uniform float poidsEchelleMoyenne;

        vec3 getNormal(vec2 uv) {
            vec3 n = texture2D(normalSampler, clamp(uv, 0.0, 1.0)).rgb;
            n = n * 2.0 - 1.0;
            float l = length(n);
            if (l < 0.0001) {
                return vec3(0.0, 0.0, 1.0);
            }
            return n / l;
        }

        float poidsVoisinNormale(vec3 centre, vec3 voisin) {
            // dot proche de 1 : même orientation => on peut lisser.
            // dot plus bas : vraie cassure de relief => on évite de la gommer.
            float similarite = dot(centre, voisin);
            return smoothstep(seuilConservationAretes, 1.0, similarite);
        }

        vec3 normalPrefiltree(vec2 uv, vec2 texel) {
            vec3 centre = getNormal(uv);

            if (prefiltrageActif < 0.5) {
                return centre;
            }

            vec2 pas = texel * max(1.0, rayonPrefiltrage);

            vec3 nGauche = getNormal(uv + pas * vec2(-1.0,  0.0));
            vec3 nDroite = getNormal(uv + pas * vec2( 1.0,  0.0));
            vec3 nBas = getNormal(uv + pas * vec2( 0.0, -1.0));
            vec3 nHaut = getNormal(uv + pas * vec2( 0.0,  1.0));

            float poidsCentre = max(1.0, poidsCentrePrefiltrage);
            float wGauche = poidsVoisinNormale(centre, nGauche);
            float wDroite = poidsVoisinNormale(centre, nDroite);
            float wBas = poidsVoisinNormale(centre, nBas);
            float wHaut = poidsVoisinNormale(centre, nHaut);

            vec3 somme = centre * poidsCentre;
            somme += nGauche * wGauche;
            somme += nDroite * wDroite;
            somme += nBas * wBas;
            somme += nHaut * wHaut;

            float poidsTotal = poidsCentre + wGauche + wDroite + wBas + wHaut;
            vec3 filtree = somme / max(0.0001, poidsTotal);

            float l = length(filtree);
            if (l < 0.0001) {
                return centre;
            }

            return filtree / l;
        }

        vec2 quantifierDirection(vec2 gradient, vec3 gxVec, vec3 gyVec) {
            float ax = abs(gradient.x);
            float ay = abs(gradient.y);

            // tan(67.5°) ~= 2.4142. Cela donne 4 familles stables.
            if (ax > ay * 2.4142) {
                return vec2(1.0, 0.0);
            }

            if (ay > ax * 2.4142) {
                return vec2(0.0, 1.0);
            }

            // Le signe est estimé par la corrélation entre les variations X et Y.
            if (dot(gxVec, gyVec) >= 0.0) {
                return normalize(vec2(1.0, 1.0));
            }

            return normalize(vec2(1.0, -1.0));
        }

        void main(void) {
            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);

            vec3 nL = normalPrefiltree(vUV + texel * vec2(-1.0,  0.0), texel);
            vec3 nR = normalPrefiltree(vUV + texel * vec2( 1.0,  0.0), texel);
            vec3 nD = normalPrefiltree(vUV + texel * vec2( 0.0, -1.0), texel);
            vec3 nU = normalPrefiltree(vUV + texel * vec2( 0.0,  1.0), texel);

            vec3 gxVecLocal = nR - nL;
            vec3 gyVecLocal = nU - nD;

            float gxLocal = length(gxVecLocal);
            float gyLocal = length(gyVecLocal);
            float forceLocale = sqrt(gxLocal * gxLocal + gyLocal * gyLocal);

            vec3 gxVec = gxVecLocal;
            vec3 gyVec = gyVecLocal;
            float gx = gxLocal;
            float gy = gyLocal;
            float force = forceLocale;

            if (multiEchelleActif > 0.5 && poidsEchelleMoyenne > 0.001) {
                float rayonMoyen = max(1.5, rayonEchelleMoyenne);

                // Deuxième échelle volontairement plus simple : on ne relance pas le
                // préfiltrage complet pour rester léger. Le grand rayon suffit déjà
                // à moins réagir aux micro-normales d'un seul pixel.
                vec3 nL2 = getNormal(vUV + texel * vec2(-rayonMoyen,  0.0));
                vec3 nR2 = getNormal(vUV + texel * vec2( rayonMoyen,  0.0));
                vec3 nD2 = getNormal(vUV + texel * vec2( 0.0, -rayonMoyen));
                vec3 nU2 = getNormal(vUV + texel * vec2( 0.0,  rayonMoyen));

                vec3 gxVecMoyen = nR2 - nL2;
                vec3 gyVecMoyen = nU2 - nD2;

                float gxMoyen = length(gxVecMoyen);
                float gyMoyen = length(gyVecMoyen);
                float forceMoyenne = sqrt(gxMoyen * gxMoyen + gyMoyen * gyMoyen) * poidsEchelleMoyenne;

                float utiliserMoyenne = step(force, forceMoyenne);

                force = max(force, forceMoyenne);
                gxVec = mix(gxVec, gxVecMoyen, utiliserMoyenne);
                gyVec = mix(gyVec, gyVecMoyen, utiliserMoyenne);
                gx = mix(gx, gxMoyen, utiliserMoyenne);
                gy = mix(gy, gyMoyen, utiliserMoyenne);
            }

            vec2 direction = quantifierDirection(vec2(gx, gy), gxVec, gyVec);

            float directionCode = 0.0;
            if (abs(direction.y) > abs(direction.x) * 2.0) {
                directionCode = 1.0;
            } else if (abs(direction.x) > abs(direction.y) * 2.0) {
                directionCode = 0.0;
            } else if (direction.x * direction.y > 0.0) {
                directionCode = 2.0;
            } else {
                directionCode = 3.0;
            }

            // R = force du gradient, G = direction quantifiée / 3.
            gl_FragColor = vec4(clamp(force, 0.0, 1.0), directionCode / 3.0, 0.0, 1.0);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_NMS_RELIEF] = `
        precision highp float;
        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform vec2 screenSize;
        uniform float toleranceNonMaximum;

        vec2 directionDepuisCode(float codeNormalise) {
            float code = floor(codeNormalise * 3.0 + 0.5);

            if (code < 0.5) {
                return vec2(1.0, 0.0);
            }
            if (code < 1.5) {
                return vec2(0.0, 1.0);
            }
            if (code < 2.5) {
                return normalize(vec2(1.0, 1.0));
            }
            return normalize(vec2(1.0, -1.0));
        }

        void main(void) {
            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            vec4 centre = texture2D(textureSampler, vUV);
            float force = centre.r;
            vec2 direction = directionDepuisCode(centre.g);

            float avant = texture2D(textureSampler, vUV + texel * direction).r;
            float apres = texture2D(textureSampler, vUV - texel * direction).r;
            float voisinMax = max(avant, apres);

            // NMS tolérante : si le centre est très proche du maximum local, on le garde.
            float garde = step(voisinMax * toleranceNonMaximum, force + 0.00001);

            gl_FragColor = vec4(force * garde, centre.g, 0.0, 1.0);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_SEUILS_RELIEF] = `
        precision highp float;
        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform float seuilFaible;
        uniform float seuilFort;

        void main(void) {
            float force = texture2D(textureSampler, vUV).r;

            float fort = step(seuilFort, force);
            float faible = step(seuilFaible, force);

            // R = accepté fort au départ, G = candidat faible pouvant être propagé.
            gl_FragColor = vec4(fort, faible, 0.0, 1.0);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_HYSTERESIS_RELIEF] = `
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

            // On conserve le masque faible dans G pour les itérations suivantes.
            gl_FragColor = vec4(nouveauAccepte, faible, 0.0, 1.0);
        }
    `;


    BABYLON.Effect.ShadersStore[SHADER_CANNY_NETTOYAGE_LONGUEUR_RELIEF] = `
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
                // Le pixel ne doit pas être seulement une extrémité isolée.
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
            float centre = lireMasque(vUV);

            if (nettoyageActif < 0.5) {
                gl_FragColor = vec4(centre, centre, 0.0, 1.0);
                return;
            }

            if (centre < seuilMasque) {
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                return;
            }

            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            float longueur = longueurMaxTrait(vUV, texel);
            float garde = step(longueurMin, longueur);

            gl_FragColor = vec4(garde, garde, 0.0, 1.0);
        }
    `;

    BABYLON.Effect.ShadersStore[SHADER_CANNY_COMPOSITION_RELIEF] = `
        precision highp float;
        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform sampler2D sceneColorSampler;
        uniform sampler2D depthSampler;

        uniform vec2 screenSize;
        uniform float depthEdgeWidth;
        uniform float normalEdgeWidth;
        uniform float useDepth;
        uniform float useNormal;
        uniform float depthThreshold;
        uniform vec3 depthColor;
        uniform vec3 normalColor;

        float getDepth(vec2 uv) {
            return texture2D(depthSampler, clamp(uv, 0.0, 1.0)).r;
        }

        float sobelDepth(vec2 texel) {
            float d00 = getDepth(vUV + texel * vec2(-1.0, -1.0));
            float d10 = getDepth(vUV + texel * vec2( 0.0, -1.0));
            float d20 = getDepth(vUV + texel * vec2( 1.0, -1.0));

            float d01 = getDepth(vUV + texel * vec2(-1.0,  0.0));
            float d21 = getDepth(vUV + texel * vec2( 1.0,  0.0));

            float d02 = getDepth(vUV + texel * vec2(-1.0,  1.0));
            float d12 = getDepth(vUV + texel * vec2( 0.0,  1.0));
            float d22 = getDepth(vUV + texel * vec2( 1.0,  1.0));

            float gx =
                -1.0 * d00 + 1.0 * d20 +
                -2.0 * d01 + 2.0 * d21 +
                -1.0 * d02 + 1.0 * d22;

            float gy =
                -1.0 * d00 - 2.0 * d10 - 1.0 * d20 +
                 1.0 * d02 + 2.0 * d12 + 1.0 * d22;

            return sqrt(gx * gx + gy * gy);
        }

        float poidsRayon(float rayon, float largeur) {
            if (rayon <= 1.0) {
                return 1.0;
            }
            return smoothstep(rayon - 1.0, rayon, largeur);
        }

        float contourDepthProgressif(vec2 texelBase, float largeur) {
            float largeurBornee = clamp(largeur, 1.0, 3.0);
            float masque = 0.0;

            float e1 = sobelDepth(texelBase * 1.0);
            float e2 = sobelDepth(texelBase * 2.0);
            float e3 = sobelDepth(texelBase * 3.0);

            masque = max(masque, step(depthThreshold, e1));
            masque = max(masque, step(depthThreshold, e2) * poidsRayon(2.0, largeurBornee));
            masque = max(masque, step(depthThreshold, e3) * poidsRayon(3.0, largeurBornee));

            return clamp(masque, 0.0, 1.0);
        }

        float reliefMaskAt(vec2 uv) {
            return texture2D(textureSampler, clamp(uv, 0.0, 1.0)).r;
        }

        float contourReliefDepuisMasque(vec2 texelBase, float largeur) {
            float largeurBornee = clamp(largeur, 1.0, 3.0);
            float masque = reliefMaskAt(vUV);

            if (largeurBornee >= 1.5) {
                float poids = poidsRayon(2.0, largeurBornee);
                masque = max(masque, reliefMaskAt(vUV + texelBase * vec2( 1.0,  0.0)) * poids);
                masque = max(masque, reliefMaskAt(vUV + texelBase * vec2(-1.0,  0.0)) * poids);
                masque = max(masque, reliefMaskAt(vUV + texelBase * vec2( 0.0,  1.0)) * poids);
                masque = max(masque, reliefMaskAt(vUV + texelBase * vec2( 0.0, -1.0)) * poids);
            }

            return smoothstep(0.20, 0.85, clamp(masque, 0.0, 1.0));
        }

        void main(void) {
            vec2 texelBase = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            vec3 originalColor = texture2D(sceneColorSampler, vUV).rgb;

            float depthMask = 0.0;
            float normalMask = 0.0;

            if (useDepth > 0.5) {
                depthMask = contourDepthProgressif(texelBase, depthEdgeWidth);
            }

            if (useNormal > 0.5) {
                normalMask = contourReliefDepuisMasque(texelBase, normalEdgeWidth);
            }

            float poidsTotal = depthMask + normalMask;

            if (poidsTotal > 0.001) {
                vec3 couleurContour = vec3(0.0);
                couleurContour += depthColor * depthMask;
                couleurContour += normalColor * normalMask;
                couleurContour = couleurContour / poidsTotal;

                float intensite = clamp(poidsTotal, 0.0, 1.0);
                gl_FragColor = vec4(mix(originalColor, couleurContour, intensite), 1.0);
            } else {
                gl_FragColor = vec4(originalColor, 1.0);
            }
        }
    `;

    shadersReliefCannyCrees = true;
    return obtenirNomsShadersReliefCanny();
}

function obtenirNomsShadersReliefCanny() {
    return Object.freeze({
        copieScene: SHADER_CANNY_COPIE_SCENE,
        gradient: SHADER_CANNY_GRADIENT_RELIEF,
        nms: SHADER_CANNY_NMS_RELIEF,
        seuils: SHADER_CANNY_SEUILS_RELIEF,
        hysteresis: SHADER_CANNY_HYSTERESIS_RELIEF,
        nettoyageLongueur: SHADER_CANNY_NETTOYAGE_LONGUEUR_RELIEF,
        composition: SHADER_CANNY_COMPOSITION_RELIEF
    });
}
