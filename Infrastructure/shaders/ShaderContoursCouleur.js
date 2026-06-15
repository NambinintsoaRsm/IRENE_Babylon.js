/**
 * Déclare le shader utilisé pour afficher les contours liés aux différences de couleur.
 *
 * Ce shader ne doit jamais rendre l'écran transparent.
 * Quand aucun contour n'est détecté, il renvoie simplement la couleur d'origine.
 *
 * Correction progressive de l'épaisseur :
 * l'épaisseur dilate réellement le contour sur plusieurs rayons autour du pixel.
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

        vec3 getColor(vec2 uv) {
            return texture2D(textureSampler, clamp(uv, 0.0, 1.0)).rgb;
        }

        float sobelColor(vec2 texel) {
            float l00 = luminance(getColor(vUV + texel * vec2(-1.0, -1.0)));
            float l10 = luminance(getColor(vUV + texel * vec2( 0.0, -1.0)));
            float l20 = luminance(getColor(vUV + texel * vec2( 1.0, -1.0)));

            float l01 = luminance(getColor(vUV + texel * vec2(-1.0,  0.0)));
            float l21 = luminance(getColor(vUV + texel * vec2( 1.0,  0.0)));

            float l02 = luminance(getColor(vUV + texel * vec2(-1.0,  1.0)));
            float l12 = luminance(getColor(vUV + texel * vec2( 0.0,  1.0)));
            float l22 = luminance(getColor(vUV + texel * vec2( 1.0,  1.0)));

            float gx =
                -1.0 * l00 + 1.0 * l20 +
                -2.0 * l01 + 2.0 * l21 +
                -1.0 * l02 + 1.0 * l22;

            float gy =
                -1.0 * l00 - 2.0 * l10 - 1.0 * l20 +
                 1.0 * l02 + 2.0 * l12 + 1.0 * l22;

            return sqrt(gx * gx + gy * gy);
        }

        float poidsRayon(float rayon, float largeur) {
            if (rayon <= 1.0) {
                return 1.0;
            }

            return smoothstep(rayon - 1.0, rayon, largeur);
        }

        float contourCouleurProgressif(vec2 texelBase, float largeur) {
            float largeurBornee = clamp(largeur, 1.0, 3.0);
            float masque = 0.0;

            float e1 = sobelColor(texelBase * 1.0);
            float e2 = sobelColor(texelBase * 2.0);
            float e3 = sobelColor(texelBase * 3.0);

            masque = max(masque, step(colorThreshold, e1));
            masque = max(masque, step(colorThreshold, e2) * poidsRayon(2.0, largeurBornee));
            masque = max(masque, step(colorThreshold, e3) * poidsRayon(3.0, largeurBornee));

            return clamp(masque, 0.0, 1.0);
        }

        void main(void) {
            vec4 couleurOriginale = texture2D(textureSampler, vUV);

            if (colorThreshold > 9999.0) {
                gl_FragColor = couleurOriginale;
                return;
            }

            vec2 texelBase = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            float masqueContour = contourCouleurProgressif(texelBase, edgeWidth);

            if (masqueContour > 0.001) {
                gl_FragColor = vec4(
                    mix(couleurOriginale.rgb, colorEdgeColor, masqueContour),
                    couleurOriginale.a
                );
            } else {
                gl_FragColor = couleurOriginale;
            }
        }
    `;

    shaderContoursCouleurCree = true;

    return NOM_SHADER_CONTOURS_COULEUR;
}
