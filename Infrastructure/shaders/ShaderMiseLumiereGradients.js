/**
 * Shaders expérimentaux de mise en lumière locale des zones de fort gradient.
 *
 * Version légère avec continuité locale :
 * - on reste sur un niveau 1 amélioré, sans Canny complet ;
 * - on filtre les points isolés ;
 * - on favorise les pixels qui appartiennent à une petite continuité locale ;
 * - on ne trace pas de ligne colorée : on augmente seulement la luminance locale.
 */

export const NOM_SHADER_MISE_LUMIERE_NORMALES = "miseLumiereNormalesPixelShader";
export const NOM_SHADER_MISE_LUMIERE_COULEURS = "miseLumiereCouleursPixelShader";

let shaderNormalesCree = false;
let shaderCouleursCree = false;

export function creerShaderMiseLumiereNormalesSiNecessaire() {
    if (shaderNormalesCree) {
        return NOM_SHADER_MISE_LUMIERE_NORMALES;
    }

    BABYLON.Effect.ShadersStore[NOM_SHADER_MISE_LUMIERE_NORMALES] = `
        precision highp float;

        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform sampler2D normalSampler;

        uniform vec2 screenSize;
        uniform float edgeWidth;
        uniform float normalThreshold;
        uniform float intensity;
        uniform float minNeighborSupport;

        vec3 getNormal(vec2 uv) {
            vec3 n = texture2D(normalSampler, clamp(uv, 0.0, 1.0)).rgb;
            n = n * 2.0 - 1.0;
            return normalize(n);
        }

        float normalGradientAt(vec2 uv, vec2 texel) {
            vec3 nCenter = getNormal(uv);
            vec3 nRight = getNormal(uv + texel * vec2( 1.0,  0.0));
            vec3 nLeft  = getNormal(uv + texel * vec2(-1.0,  0.0));
            vec3 nUp    = getNormal(uv + texel * vec2( 0.0,  1.0));
            vec3 nDown  = getNormal(uv + texel * vec2( 0.0, -1.0));

            float e1 = length(nCenter - nRight);
            float e2 = length(nCenter - nLeft);
            float e3 = length(nCenter - nUp);
            float e4 = length(nCenter - nDown);

            return max(max(e1, e2), max(e3, e4));
        }

        float strongNormalAt(vec2 uv, vec2 texel) {
            float g = normalGradientAt(uv, texel);
            return smoothstep(normalThreshold * 0.75, normalThreshold * 1.25, g);
        }

        float continuousNormalAt(vec2 uv, vec2 texel) {
            float c  = strongNormalAt(uv, texel);
            float l  = strongNormalAt(uv + texel * vec2(-1.0,  0.0), texel);
            float r  = strongNormalAt(uv + texel * vec2( 1.0,  0.0), texel);
            float u  = strongNormalAt(uv + texel * vec2( 0.0,  1.0), texel);
            float d  = strongNormalAt(uv + texel * vec2( 0.0, -1.0), texel);
            float ul = strongNormalAt(uv + texel * vec2(-1.0,  1.0), texel);
            float ur = strongNormalAt(uv + texel * vec2( 1.0,  1.0), texel);
            float dl = strongNormalAt(uv + texel * vec2(-1.0, -1.0), texel);
            float dr = strongNormalAt(uv + texel * vec2( 1.0, -1.0), texel);

            float support = l + r + u + d + ul + ur + dl + dr;

            // Continuité locale : on favorise les pixels qui ont des voisins dans une même direction.
            // Si le pixel central est faible mais situé entre deux voisins forts, on garde une lumière légère
            // pour combler les petites coupures visuelles.
            float pairContinuity = max(
                max(min(l, r), min(u, d)),
                max(min(ul, dr), min(ur, dl))
            );

            float supportOk = smoothstep(minNeighborSupport - 0.5, minNeighborSupport + 0.5, support);
            float centerLine = c * max(supportOk, pairContinuity);
            float gapBridge = pairContinuity * 0.45;

            return clamp(max(centerLine, gapBridge), 0.0, 1.0);
        }

        float crestMask(vec2 texelBase, float largeur) {
            float largeurBornee = clamp(largeur, 1.0, 3.0);
            float masque = continuousNormalAt(vUV, texelBase);

            // Lissage local léger : donne plus de continuité sans dessiner un vrai trait coloré.
            float poidsVoisins1 = mix(0.28, 0.62, smoothstep(1.0, 2.0, largeurBornee));
            float poidsVoisins2 = 0.25 * smoothstep(2.0, 3.0, largeurBornee);

            float voisins1 = 0.0;
            voisins1 = max(voisins1, strongNormalAt(vUV + texelBase * vec2( 1.0,  0.0), texelBase));
            voisins1 = max(voisins1, strongNormalAt(vUV + texelBase * vec2(-1.0,  0.0), texelBase));
            voisins1 = max(voisins1, strongNormalAt(vUV + texelBase * vec2( 0.0,  1.0), texelBase));
            voisins1 = max(voisins1, strongNormalAt(vUV + texelBase * vec2( 0.0, -1.0), texelBase));
            voisins1 = max(voisins1, strongNormalAt(vUV + texelBase * vec2( 1.0,  1.0), texelBase) * 0.75);
            voisins1 = max(voisins1, strongNormalAt(vUV + texelBase * vec2(-1.0,  1.0), texelBase) * 0.75);
            voisins1 = max(voisins1, strongNormalAt(vUV + texelBase * vec2( 1.0, -1.0), texelBase) * 0.75);
            voisins1 = max(voisins1, strongNormalAt(vUV + texelBase * vec2(-1.0, -1.0), texelBase) * 0.75);

            float voisins2 = 0.0;
            voisins2 = max(voisins2, strongNormalAt(vUV + texelBase * vec2( 2.0,  0.0), texelBase));
            voisins2 = max(voisins2, strongNormalAt(vUV + texelBase * vec2(-2.0,  0.0), texelBase));
            voisins2 = max(voisins2, strongNormalAt(vUV + texelBase * vec2( 0.0,  2.0), texelBase));
            voisins2 = max(voisins2, strongNormalAt(vUV + texelBase * vec2( 0.0, -2.0), texelBase));

            masque = max(masque, voisins1 * poidsVoisins1);
            masque = max(masque, voisins2 * poidsVoisins2);

            return clamp(masque, 0.0, 1.0);
        }

        vec3 renforcerLuminanceLocale(vec3 couleur, float masque) {
            // Renforcement multiplicatif : on conserve la teinte globale, on éclaircit localement.
            float facteur = 1.0 + intensity * masque;
            return clamp(couleur * facteur, 0.0, 1.0);
        }

        void main(void) {
            vec4 original = texture2D(textureSampler, vUV);
            vec2 texelBase = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            float masque = crestMask(texelBase, edgeWidth);

            gl_FragColor = vec4(
                renforcerLuminanceLocale(original.rgb, masque),
                original.a
            );
        }
    `;

    shaderNormalesCree = true;

    return NOM_SHADER_MISE_LUMIERE_NORMALES;
}

export function creerShaderMiseLumiereCouleursSiNecessaire() {
    if (shaderCouleursCree) {
        return NOM_SHADER_MISE_LUMIERE_COULEURS;
    }

    BABYLON.Effect.ShadersStore[NOM_SHADER_MISE_LUMIERE_COULEURS] = `
        precision highp float;

        varying vec2 vUV;

        uniform sampler2D textureSampler;

        uniform vec2 screenSize;
        uniform float edgeWidth;
        uniform float colorThreshold;
        uniform float intensity;
        uniform float minNeighborSupport;

        vec3 getColor(vec2 uv) {
            return texture2D(textureSampler, clamp(uv, 0.0, 1.0)).rgb;
        }

        float colorGradientAt(vec2 uv, vec2 texel) {
            vec3 cRight = getColor(uv + texel * vec2( 1.0,  0.0));
            vec3 cLeft  = getColor(uv + texel * vec2(-1.0,  0.0));
            vec3 cUp    = getColor(uv + texel * vec2( 0.0,  1.0));
            vec3 cDown  = getColor(uv + texel * vec2( 0.0, -1.0));

            vec3 gx = cRight - cLeft;
            vec3 gy = cUp - cDown;

            return sqrt(dot(gx, gx) + dot(gy, gy));
        }

        float strongColorAt(vec2 uv, vec2 texel) {
            float g = colorGradientAt(uv, texel);
            return smoothstep(colorThreshold * 0.75, colorThreshold * 1.25, g);
        }

        float continuousColorAt(vec2 uv, vec2 texel) {
            float c  = strongColorAt(uv, texel);
            float l  = strongColorAt(uv + texel * vec2(-1.0,  0.0), texel);
            float r  = strongColorAt(uv + texel * vec2( 1.0,  0.0), texel);
            float u  = strongColorAt(uv + texel * vec2( 0.0,  1.0), texel);
            float d  = strongColorAt(uv + texel * vec2( 0.0, -1.0), texel);
            float ul = strongColorAt(uv + texel * vec2(-1.0,  1.0), texel);
            float ur = strongColorAt(uv + texel * vec2( 1.0,  1.0), texel);
            float dl = strongColorAt(uv + texel * vec2(-1.0, -1.0), texel);
            float dr = strongColorAt(uv + texel * vec2( 1.0, -1.0), texel);

            float support = l + r + u + d + ul + ur + dl + dr;
            float pairContinuity = max(
                max(min(l, r), min(u, d)),
                max(min(ul, dr), min(ur, dl))
            );

            float supportOk = smoothstep(minNeighborSupport - 0.5, minNeighborSupport + 0.5, support);
            float centerLine = c * max(supportOk, pairContinuity);
            float gapBridge = pairContinuity * 0.45;

            return clamp(max(centerLine, gapBridge), 0.0, 1.0);
        }

        float crestMask(vec2 texelBase, float largeur) {
            float largeurBornee = clamp(largeur, 1.0, 3.0);
            float masque = continuousColorAt(vUV, texelBase);

            float poidsVoisins1 = mix(0.28, 0.62, smoothstep(1.0, 2.0, largeurBornee));
            float poidsVoisins2 = 0.25 * smoothstep(2.0, 3.0, largeurBornee);

            float voisins1 = 0.0;
            voisins1 = max(voisins1, strongColorAt(vUV + texelBase * vec2( 1.0,  0.0), texelBase));
            voisins1 = max(voisins1, strongColorAt(vUV + texelBase * vec2(-1.0,  0.0), texelBase));
            voisins1 = max(voisins1, strongColorAt(vUV + texelBase * vec2( 0.0,  1.0), texelBase));
            voisins1 = max(voisins1, strongColorAt(vUV + texelBase * vec2( 0.0, -1.0), texelBase));
            voisins1 = max(voisins1, strongColorAt(vUV + texelBase * vec2( 1.0,  1.0), texelBase) * 0.75);
            voisins1 = max(voisins1, strongColorAt(vUV + texelBase * vec2(-1.0,  1.0), texelBase) * 0.75);
            voisins1 = max(voisins1, strongColorAt(vUV + texelBase * vec2( 1.0, -1.0), texelBase) * 0.75);
            voisins1 = max(voisins1, strongColorAt(vUV + texelBase * vec2(-1.0, -1.0), texelBase) * 0.75);

            float voisins2 = 0.0;
            voisins2 = max(voisins2, strongColorAt(vUV + texelBase * vec2( 2.0,  0.0), texelBase));
            voisins2 = max(voisins2, strongColorAt(vUV + texelBase * vec2(-2.0,  0.0), texelBase));
            voisins2 = max(voisins2, strongColorAt(vUV + texelBase * vec2( 0.0,  2.0), texelBase));
            voisins2 = max(voisins2, strongColorAt(vUV + texelBase * vec2( 0.0, -2.0), texelBase));

            masque = max(masque, voisins1 * poidsVoisins1);
            masque = max(masque, voisins2 * poidsVoisins2);

            return clamp(masque, 0.0, 1.0);
        }

        vec3 renforcerLuminanceLocale(vec3 couleur, float masque) {
            float facteur = 1.0 + intensity * masque;
            return clamp(couleur * facteur, 0.0, 1.0);
        }

        void main(void) {
            vec4 original = texture2D(textureSampler, vUV);
            vec2 texelBase = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            float masque = crestMask(texelBase, edgeWidth);

            gl_FragColor = vec4(
                renforcerLuminanceLocale(original.rgb, masque),
                original.a
            );
        }
    `;

    shaderCouleursCree = true;

    return NOM_SHADER_MISE_LUMIERE_COULEURS;
}
