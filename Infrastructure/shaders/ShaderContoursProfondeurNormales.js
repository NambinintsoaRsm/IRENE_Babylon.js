/**
 * Déclare le shader utilisé pour afficher les contours liés à la structure du modèle 3D.
 *
 * Ce shader permet de détecter deux types de contours :
 * - les contours de silhouette, basés sur les différences de profondeur ;
 * - les contours de relief, basés sur les différences de normales.
 *
 * Version Canny Dirigé (Anti-bruit) :
 * - Gradient directionnel corrigé (signé) ;
 * - Suppression stricte des non-maxima (épaisseur 1px avant dilatation) ;
 * - Hystérésis dirigée : cherche l'ancrage uniquement le long de la ligne de contour ;
 * - Verrou de longueur : supprime les points forts isolés (bruit géométrique).
 */

export const NOM_SHADER_CONTOURS_PROFONDEUR_NORMALES = "depthNormalContourPixelShader";

let shaderContoursProfondeurNormalesCree = false;

export function creerShaderContoursProfondeurNormalesSiNecessaire() {
    if (shaderContoursProfondeurNormalesCree) {
        return NOM_SHADER_CONTOURS_PROFONDEUR_NORMALES;
    }

    BABYLON.Effect.ShadersStore[NOM_SHADER_CONTOURS_PROFONDEUR_NORMALES] = `
        precision highp float;

        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform sampler2D depthSampler;
        uniform sampler2D normalSampler;

        uniform vec2 screenSize;
        uniform float depthEdgeWidth;
        uniform float normalEdgeWidth;

        uniform float useDepth;
        uniform float useNormal;

        uniform float depthThreshold;
        uniform float normalThreshold;
        uniform float normalChainLength;

        uniform vec3 depthColor;
        uniform vec3 normalColor;

        float getDepth(vec2 uv) {
            return texture2D(depthSampler, clamp(uv, 0.0, 1.0)).r;
        }

        vec3 getNormal(vec2 uv) {
            vec3 n = texture2D(normalSampler, clamp(uv, 0.0, 1.0)).rgb;
            n = n * 2.0 - 1.0;

            float longueur = length(n);
            if (longueur < 0.0001) {
                return vec3(0.0, 0.0, 1.0);
            }

            return n / longueur;
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

        /*
         * Gradient de normales corrigé.
         * La direction est désormais signée pour tracer des vecteurs corrects.
         */
        vec3 gradientNormalInfo(vec2 uv, vec2 texel) {
            vec3 nL = getNormal(uv + texel * vec2(-1.0,  0.0));
            vec3 nR = getNormal(uv + texel * vec2( 1.0,  0.0));
            vec3 nD = getNormal(uv + texel * vec2( 0.0, -1.0));
            vec3 nU = getNormal(uv + texel * vec2( 0.0,  1.0));

            vec3 gxVec = nR - nL;
            vec3 gyVec = nU - nD;

            float force = sqrt(dot(gxVec, gxVec) + dot(gyVec, gyVec));

            // Direction 2D signée (différence brute sur les axes pour éviter le bug du quadrant positif)
            vec2 direction = vec2(nR.x - nL.x, nU.y - nD.y);
            
            if (length(direction) < 0.0001) {
                direction = vec2(1.0, 0.0);
            } else {
                direction = normalize(direction);
            }

            return vec3(force, direction);
        }

        float forceGradientNormal(vec2 uv, vec2 texel) {
            return gradientNormalInfo(uv, texel).x;
        }

        /*
         * Pseudo-Canny Dirigé.
         * Remplace les dizaines d'appels de l'ancienne version par un parcours unique
         * strictement le long de la géométrie de l'objet.
         */
        float cannyNormalAt(vec2 uv, vec2 texel) {
            vec3 info = gradientNormalInfo(uv, texel);
            float forceCentre = info.x;

            float seuilFort = normalThreshold;
            float seuilFaible = normalThreshold * 0.45; // Hystérésis : tolère les pixels 55% plus faibles

            // EXIT RAPIDE : C'est du vide complet
            if (forceCentre < seuilFaible) {
                return 0.0;
            }

            vec2 directionGradient = info.yz;
            
            // La vraie ligne de contour est toujours perpendiculaire au gradient de normale
            vec2 directionLigne = vec2(-directionGradient.y, directionGradient.x);

            // 1. SUPPRESSION STRICTE DES NON-MAXIMA
            // Si on est pas le pixel le plus fort de la pente (à 5% près), on est supprimé.
            float avant = forceGradientNormal(uv + texel * directionGradient, texel);
            float apres = forceGradientNormal(uv - texel * directionGradient, texel);
            if (forceCentre < max(avant, apres) * 0.95) {
                return 0.0;
            }

            // 2. ÉCHANTILLONNAGE LE LONG DE LA LIGNE (Hystérésis Dirigée)
            float p1 = forceGradientNormal(uv + texel * directionLigne * 1.0, texel);
            float p2 = forceGradientNormal(uv + texel * directionLigne * 2.0, texel);
            float p3 = forceGradientNormal(uv + texel * directionLigne * 3.0, texel);
            float p4 = forceGradientNormal(uv + texel * directionLigne * 4.0, texel);

            float n1 = forceGradientNormal(uv - texel * directionLigne * 1.0, texel);
            float n2 = forceGradientNormal(uv - texel * directionLigne * 2.0, texel);
            float n3 = forceGradientNormal(uv - texel * directionLigne * 3.0, texel);
            float n4 = forceGradientNormal(uv - texel * directionLigne * 4.0, texel);

            // Binarisation avec multiplication pour arrêter la chaîne au premier "trou" majeur
            float vP1 = step(seuilFaible, p1);
            float vP2 = vP1 * step(seuilFaible, p2);
            float vP3 = vP2 * step(seuilFaible, p3);
            float vP4 = vP3 * step(seuilFaible, p4);

            float vN1 = step(seuilFaible, n1);
            float vN2 = vN1 * step(seuilFaible, n2);
            float vN3 = vN2 * step(seuilFaible, n3);
            float vN4 = vN3 * step(seuilFaible, n4);

            float longueurChaine = 1.0 + vP1 + vP2 + vP3 + vP4 + vN1 + vN2 + vN3 + vN4;

            // VERROU 1 : Anti-bruit
            // Même un pixel extrêmement "fort" est détruit s'il est isolé ou mesure moins de 4 pixels.
            if (longueurChaine < 3.5) {
                return 0.0;
            }

            // VERROU 2 : Hystérésis (Vérification de l'ancrage)
            // La ligne valide que l'on vient de trouver possède-t-elle au moins un pixel "Fort" ?
            float forceMaxDeLaLigne = forceCentre;
            forceMaxDeLaLigne = max(forceMaxDeLaLigne, p1 * vP1);
            forceMaxDeLaLigne = max(forceMaxDeLaLigne, p2 * vP2);
            forceMaxDeLaLigne = max(forceMaxDeLaLigne, p3 * vP3);
            forceMaxDeLaLigne = max(forceMaxDeLaLigne, p4 * vP4);

            forceMaxDeLaLigne = max(forceMaxDeLaLigne, n1 * vN1);
            forceMaxDeLaLigne = max(forceMaxDeLaLigne, n2 * vN2);
            forceMaxDeLaLigne = max(forceMaxDeLaLigne, n3 * vN3);
            forceMaxDeLaLigne = max(forceMaxDeLaLigne, n4 * vN4);

            if (forceMaxDeLaLigne < seuilFort) {
                return 0.0; // Amas géométrique faible, on supprime.
            }

            return smoothstep(seuilFaible, seuilFort, forceCentre);
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

        float contourNormalProgressif(vec2 texelBase, float largeur) {
            float largeurBornee = clamp(largeur, 1.0, 3.0);
            float masque = cannyNormalAt(vUV, texelBase);

            if (largeurBornee >= 1.5) {
                float poids = poidsRayon(2.0, largeurBornee);

                masque = max(masque, cannyNormalAt(vUV + texelBase * vec2( 1.0,  0.0), texelBase) * poids);
                masque = max(masque, cannyNormalAt(vUV + texelBase * vec2(-1.0,  0.0), texelBase) * poids);
                masque = max(masque, cannyNormalAt(vUV + texelBase * vec2( 0.0,  1.0), texelBase) * poids);
                masque = max(masque, cannyNormalAt(vUV + texelBase * vec2( 0.0, -1.0), texelBase) * poids);
            }

            return smoothstep(0.18, 0.68, clamp(masque, 0.0, 1.0));
        }

        void main(void) {
            vec2 texelBase = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            vec3 originalColor = texture2D(textureSampler, vUV).rgb;

            float depthMask = 0.0;
            float normalMask = 0.0;

            if (useDepth > 0.5) {
                depthMask = contourDepthProgressif(texelBase, depthEdgeWidth);
            }

            if (useNormal > 0.5) {
                normalMask = contourNormalProgressif(texelBase, normalEdgeWidth);
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

    shaderContoursProfondeurNormalesCree = true;

    return NOM_SHADER_CONTOURS_PROFONDEUR_NORMALES;
}