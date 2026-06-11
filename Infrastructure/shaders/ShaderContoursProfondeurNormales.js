/**
 * Déclare le shader utilisé pour afficher les contours liés à la structure du modèle 3D.
 *
 * Ce shader permet de détecter deux types de contours :
 * - les contours de silhouette, basés sur les différences de profondeur ;
 * - les contours de relief, basés sur les différences de normales.
 *
 * Il sert à mieux faire ressortir la forme générale de l’objet
 * et certains détails géométriques importants.
 *
 * Les seuils, couleurs et activations ne sont pas définis ici.
 * Ils seront envoyés par le post-traitement des contours.
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
        uniform float edgeWidth;

        uniform float useDepth;
        uniform float useNormal;

        uniform float depthThreshold;
        uniform float normalThreshold;

        uniform vec3 depthColor;
        uniform vec3 normalColor;

        float getDepth(vec2 uv) {
            return texture2D(depthSampler, uv).r;
        }

        vec3 getNormal(vec2 uv) {
            vec3 n = texture2D(normalSampler, uv).rgb;
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

        void main(void) {
            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y) * max(edgeWidth, 1.0);

            vec3 originalColor = texture2D(textureSampler, vUV).rgb;

            float depthEdge = 0.0;
            float normalEdge = 0.0;

            if (useDepth > 0.5) {
                depthEdge = sobelDepth(texel);
            }

            if (useNormal > 0.5) {
                normalEdge = normalGradient(texel);
            }

            vec3 finalEdgeColor = vec3(0.0);
            float activeEdges = 0.0;

            if (useDepth > 0.5 && depthEdge > depthThreshold) {
                finalEdgeColor += depthColor;
                activeEdges += 1.0;
            }

            if (useNormal > 0.5 && normalEdge > normalThreshold) {
                finalEdgeColor += normalColor;
                activeEdges += 1.0;
            }

            if (activeEdges > 0.0) {
                finalEdgeColor = finalEdgeColor / activeEdges;
                gl_FragColor = vec4(finalEdgeColor, 1.0);
            } else {
                gl_FragColor = vec4(originalColor, 1.0);
            }
        }
    `;

    shaderContoursProfondeurNormalesCree = true;

    return NOM_SHADER_CONTOURS_PROFONDEUR_NORMALES;
}