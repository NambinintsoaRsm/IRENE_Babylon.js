/**
 * @file Enregistrement du shader GLSL utilisé par PostTraitSilhouette.
 *
 * Rôle : déclarer une seule fois le shader de détection des ruptures de profondeur
 * dans BABYLON.Effect.ShadersStore.
 *
 * Utilisation : PostTraitSilhouette appelle creerShaderSilhouetteSiNecessaire()
 * avant de créer le PostProcess. Ce fichier ne doit contenir aucune logique GUI.
 */
let shaderSilhouetteCree = false;
const NOM_SHADER_SILHOUETTE = "annaSilhouettePixelShader";

/**
 * Shader V1 : contour de silhouette calculé uniquement depuis la profondeur.
 */
export function creerShaderSilhouetteSiNecessaire() {
    if (shaderSilhouetteCree) {
        return NOM_SHADER_SILHOUETTE;
    }

    BABYLON.Effect.ShadersStore[NOM_SHADER_SILHOUETTE] = `
        precision highp float;

        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform sampler2D depthSampler;

        uniform vec2 screenSize;
        uniform float edgeWidth;
        uniform float actif;
        uniform float depthThreshold;
        uniform vec3 contourColor;

        float getDepth(vec2 uv) {
            return texture2D(depthSampler, clamp(uv, 0.0, 1.0)).r;
        }

        float sobelDepth(vec2 uv, vec2 texel) {
            float d00 = getDepth(uv + texel * vec2(-1.0, -1.0));
            float d10 = getDepth(uv + texel * vec2( 0.0, -1.0));
            float d20 = getDepth(uv + texel * vec2( 1.0, -1.0));

            float d01 = getDepth(uv + texel * vec2(-1.0,  0.0));
            float d21 = getDepth(uv + texel * vec2( 1.0,  0.0));

            float d02 = getDepth(uv + texel * vec2(-1.0,  1.0));
            float d12 = getDepth(uv + texel * vec2( 0.0,  1.0));
            float d22 = getDepth(uv + texel * vec2( 1.0,  1.0));

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

        float masqueSilhouette(vec2 texelBase, float largeur) {
            float largeurBornee = clamp(largeur, 1.0, 3.0);
            float masque = 0.0;

            float e1 = sobelDepth(vUV, texelBase);
            float e2 = sobelDepth(vUV, texelBase * 2.0);
            float e3 = sobelDepth(vUV, texelBase * 3.0);

            masque = max(masque, step(depthThreshold, e1));
            masque = max(masque, step(depthThreshold, e2) * poidsRayon(2.0, largeurBornee));
            masque = max(masque, step(depthThreshold, e3) * poidsRayon(3.0, largeurBornee));

            return clamp(masque, 0.0, 1.0);
        }

        void main(void) {
            vec4 couleurOriginale = texture2D(textureSampler, vUV);

            if (actif < 0.5) {
                gl_FragColor = couleurOriginale;
                return;
            }

            vec2 taille = max(screenSize, vec2(1.0));
            vec2 texelBase = vec2(1.0 / taille.x, 1.0 / taille.y);
            float masque = masqueSilhouette(texelBase, edgeWidth);

            gl_FragColor = vec4(
                mix(couleurOriginale.rgb, contourColor, masque),
                couleurOriginale.a
            );
        }
    `;

    shaderSilhouetteCree = true;
    return NOM_SHADER_SILHOUETTE;
}
