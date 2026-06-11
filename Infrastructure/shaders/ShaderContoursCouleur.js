/**
 * Déclare le shader utilisé pour afficher les contours liés aux différences de couleur.
 *
 * Ce shader ne doit jamais rendre l'écran transparent.
 * Quand aucun contour n'est détecté, il renvoie simplement la couleur d'origine.
 */

export const NOM_SHADER_CONTOURS_COULEUR = "colorOnlyContourPixelShader";

let shaderContoursCouleurCree = false;

export function creerShaderContoursCouleurSiNecessaire() {
    if (shaderContoursCouleurCree) {
        return NOM_SHADER_CONTOURS_COULEUR;
    }

    BABYLON.Effect.ShadersStore[NOM_SHADER_CONTOURS_COULEUR] = `
        precision highp float;

        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform vec2 screenSize;
        uniform float edgeWidth;
        uniform float colorThreshold;
        uniform vec3 colorEdgeColor;

        float luminance(vec3 color) {
            return dot(color, vec3(0.299, 0.587, 0.114));
        }

        float sobelColor(vec2 texel) {
            float l00 = luminance(texture2D(textureSampler, vUV + texel * vec2(-1.0, -1.0)).rgb);
            float l10 = luminance(texture2D(textureSampler, vUV + texel * vec2( 0.0, -1.0)).rgb);
            float l20 = luminance(texture2D(textureSampler, vUV + texel * vec2( 1.0, -1.0)).rgb);

            float l01 = luminance(texture2D(textureSampler, vUV + texel * vec2(-1.0,  0.0)).rgb);
            float l21 = luminance(texture2D(textureSampler, vUV + texel * vec2( 1.0,  0.0)).rgb);

            float l02 = luminance(texture2D(textureSampler, vUV + texel * vec2(-1.0,  1.0)).rgb);
            float l12 = luminance(texture2D(textureSampler, vUV + texel * vec2( 0.0,  1.0)).rgb);
            float l22 = luminance(texture2D(textureSampler, vUV + texel * vec2( 1.0,  1.0)).rgb);

            float gx =
                -1.0 * l00 + 1.0 * l20 +
                -2.0 * l01 + 2.0 * l21 +
                -1.0 * l02 + 1.0 * l22;

            float gy =
                -1.0 * l00 - 2.0 * l10 - 1.0 * l20 +
                 1.0 * l02 + 2.0 * l12 + 1.0 * l22;

            return sqrt(gx * gx + gy * gy);
        }

        void main(void) {
            vec4 couleurOriginale = texture2D(textureSampler, vUV);

            if (colorThreshold > 9999.0) {
                gl_FragColor = couleurOriginale;
                return;
            }

            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y) * max(edgeWidth, 1.0);
            float colorEdge = sobelColor(texel);

            if (colorEdge > colorThreshold) {
                gl_FragColor = vec4(colorEdgeColor, 1.0);
            } else {
                gl_FragColor = couleurOriginale;
            }
        }
    `;

    shaderContoursCouleurCree = true;

    return NOM_SHADER_CONTOURS_COULEUR;
}