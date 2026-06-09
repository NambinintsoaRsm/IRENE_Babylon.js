/**
 * Déclare le shader utilisé pour afficher les contours liés aux différences de couleur.
 *
 * Ce shader analyse l’image rendue et détecte les variations fortes de couleur
 * afin de mettre en évidence certaines limites visibles sur l’objet.
 *
 * Il est séparé du shader profondeur/normales car il travaille directement
 * à partir de l’image couleur finale.
 *
 * Le seuil de détection et la couleur du contour ne sont pas définis ici.
 * Ils seront envoyés par le post-traitement correspondant.
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
            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);

            float colorEdge = sobelColor(texel);

            if (colorEdge > colorThreshold) {
                gl_FragColor = vec4(colorEdgeColor, 1.0);
            } else {
                discard;
            }
        }
    `;

    shaderContoursCouleurCree = true;

    return NOM_SHADER_CONTOURS_COULEUR;
}