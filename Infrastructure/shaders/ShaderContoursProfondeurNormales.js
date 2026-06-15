/**
 * Déclare le shader utilisé pour afficher les contours liés à la structure du modèle 3D.
 *
 * Ce shader permet de détecter deux types de contours :
 * - les contours de silhouette, basés sur les différences de profondeur ;
 * - les contours de relief, basés sur les différences de normales.
 *
 * Correction progressive de l'épaisseur :
 * l'épaisseur ne change plus seulement la distance d'échantillonnage Sobel.
 * Le shader dilate réellement le contour sur plusieurs rayons autour du pixel.
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

        uniform vec3 depthColor;
        uniform vec3 normalColor;

        float getDepth(vec2 uv) {
            return texture2D(depthSampler, clamp(uv, 0.0, 1.0)).r;
        }

        vec3 getNormal(vec2 uv) {
            vec3 n = texture2D(normalSampler, clamp(uv, 0.0, 1.0)).rgb;
            n = n * 2.0 - 1.0;
            return normalize(n);
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

        float normalGradient(vec2 texel) {
            vec3 nCenter = getNormal(vUV);

            vec3 nRight = getNormal(vUV + texel * vec2(1.0, 0.0));
            vec3 nLeft  = getNormal(vUV + texel * vec2(-1.0, 0.0));
            vec3 nUp    = getNormal(vUV + texel * vec2(0.0, 1.0));
            vec3 nDown  = getNormal(vUV + texel * vec2(0.0, -1.0));

            float e1 = length(nCenter - nRight);
            float e2 = length(nCenter - nLeft);
            float e3 = length(nCenter - nUp);
            float e4 = length(nCenter - nDown);

            return max(max(e1, e2), max(e3, e4));
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
            float masque = 0.0;

            float e1 = normalGradient(texelBase * 1.0);
            float e2 = normalGradient(texelBase * 2.0);
            float e3 = normalGradient(texelBase * 3.0);

            masque = max(masque, step(normalThreshold, e1));
            masque = max(masque, step(normalThreshold, e2) * poidsRayon(2.0, largeurBornee));
            masque = max(masque, step(normalThreshold, e3) * poidsRayon(3.0, largeurBornee));

            return clamp(masque, 0.0, 1.0);
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
