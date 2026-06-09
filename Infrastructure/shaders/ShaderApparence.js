/**
 * Déclare le shader utilisé pour modifier l’apparence globale du rendu 3D.
 *
 * Ce shader agit sur l’image finale affichée à l’écran.
 * Il permet de modifier le contraste, la luminosité et la saturation
 * sans changer directement le modèle 3D ni ses matériaux.
 *
 * Les valeurs appliquées ne sont pas définies ici.
 * Elles seront envoyées par le post-traitement d’apparence.
 */

export const NOM_SHADER_APPARENCE = "appearancePixelShader";

let shaderApparenceCree = false;

export function creerShaderApparenceSiNecessaire() {
    if (shaderApparenceCree) {
        return NOM_SHADER_APPARENCE;
    }

    BABYLON.Effect.ShadersStore[NOM_SHADER_APPARENCE] = `
        precision highp float;

        varying vec2 vUV;

        uniform sampler2D textureSampler;

        uniform float contrast;
        uniform float brightness;
        uniform float saturation;

        float luminance(vec3 color) {
            return dot(color, vec3(0.299, 0.587, 0.114));
        }

        void main(void) {
            vec4 baseColor = texture2D(textureSampler, vUV);
            vec3 color = baseColor.rgb;

            color += brightness;
            color = (color - 0.5) * contrast + 0.5;

            float gray = luminance(color);
            color = mix(vec3(gray), color, saturation);

            color = clamp(color, 0.0, 1.0);

            gl_FragColor = vec4(color, baseColor.a);
        }
    `;

    shaderApparenceCree = true;

    return NOM_SHADER_APPARENCE;
}