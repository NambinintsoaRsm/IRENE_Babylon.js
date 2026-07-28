import { FONCTIONS_GRADIENT_COULEUR_PERCEPTUEL_GLSL } from "./FonctionsGradientCouleurPerceptuel.js";

/**
 * Shaders de mise en lumière locale des zones de fort gradient.
 *
 * Cette version garde une détection légère des crêtes puis élargit le masque
 * de luminance sans ajouter de filtrage anti-sparkles coûteux.
 */

export const NOM_SHADER_MISE_LUMIERE_NORMALES = "miseLumiereNormalesPixelShader";
export const NOM_SHADER_MISE_LUMIERE_COULEURS = "miseLumiereCouleursPixelShader";

let shaderNormalesCree = false;
let shaderCouleursCree = false;

const FONCTIONS_HIGHLIGHT_COMMUNES = `
        const float PI2 = 6.28318530718;

        vec3 rgbToHsl(vec3 c) {
            float maxC = max(c.r, max(c.g, c.b));
            float minC = min(c.r, min(c.g, c.b));
            float h = 0.0;
            float s = 0.0;
            float l = (maxC + minC) * 0.5;

            if (maxC != minC) {
                float d = maxC - minC;
                s = l > 0.5
                    ? d / max(2.0 - maxC - minC, 0.00001)
                    : d / max(maxC + minC, 0.00001);

                if (maxC == c.r) {
                    h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
                } else if (maxC == c.g) {
                    h = (c.b - c.r) / d + 2.0;
                } else {
                    h = (c.r - c.g) / d + 4.0;
                }

                h /= 6.0;
            }

            return vec3(h, s, l);
        }

        float hueToRgb(float p, float q, float t) {
            if (t < 0.0) t += 1.0;
            if (t > 1.0) t -= 1.0;

            if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
            if (t < 1.0 / 2.0) return q;
            if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;

            return p;
        }

        vec3 hslToRgb(vec3 hsl) {
            float h = hsl.x;
            float s = hsl.y;
            float l = hsl.z;

            if (s == 0.0) {
                return vec3(l);
            }

            float q = l < 0.5
                ? l * (1.0 + s)
                : l + s - l * s;
            float p = 2.0 * l - q;

            return vec3(
                hueToRgb(p, q, h + 1.0 / 3.0),
                hueToRgb(p, q, h),
                hueToRgb(p, q, h - 1.0 / 3.0)
            );
        }

        float calculerClignotement(float temps, float intervalle, float facteurMinimal) {
            float periode = max(intervalle, 0.1);
            float minimum = clamp(facteurMinimal, 0.0, 1.0);
            float oscillation = 0.5 + 0.5 * sin((temps / periode) * PI2);

            return mix(minimum, 1.0, oscillation);
        }

        vec3 modifierLuminositeLocaleHsl(
            vec3 couleur,
            float masque,
            float deltaLuminosite,
            float facteurClignotement,
            float facteurIntensite,
            float minLightness,
            float maxLightness
        ) {
            float influence = clamp(pow(clamp(masque, 0.0, 1.0), 0.72) * facteurClignotement, 0.0, 1.0);

            if (influence <= 0.001) {
                return couleur;
            }

            vec3 hsl = rgbToHsl(couleur);
            float variation = deltaLuminosite * facteurIntensite;
            float lightnessOriginale = hsl.z;
            float lightnessModifiee = clamp(lightnessOriginale + variation, minLightness, maxLightness);

            hsl.z = mix(lightnessOriginale, lightnessModifiee, influence);

            return hslToRgb(hsl);
        }
`;

const SHADER_NORMALES = `
        precision highp float;

        varying vec2 vUV;

        uniform sampler2D textureSampler;
        uniform sampler2D normalSampler;

        uniform vec2 screenSize;
        uniform float edgeWidth;
        uniform float normalThreshold;
        uniform float normalChainLength;
        uniform float intensity;
        uniform float minNeighborSupport;
        uniform float time;
        uniform float blinkInterval;
        uniform float blinkMinFactor;
        uniform float luminanceDelta;
        uniform float minLightness;
        uniform float maxLightness;

        ${FONCTIONS_HIGHLIGHT_COMMUNES}

        vec3 getNormal(vec2 uv) {
            vec3 n = texture2D(normalSampler, clamp(uv, vec2(0.001), vec2(0.999))).rgb;
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
            return smoothstep(normalThreshold * 0.75, normalThreshold * 1.30, g);
        }

        float strongNormalDilatationAt(vec2 uv, vec2 texel) {
            // La dilatation ne doit pas grossir les micro-traits instables.
            // On garde la détection normale pour le centre, mais les pixels
            // ajoutés autour du relief doivent être plus sûrs. Cela réduit
            // les petites « paillettes » visibles pendant la rotation sans
            // relancer un chaînage coûteux pour chaque voisin.
            float g = normalGradientAt(uv, texel);
            return smoothstep(normalThreshold * 1.08, normalThreshold * 1.68, g);
        }

        float chainedNormalAt(vec2 uv, vec2 texel) {
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
            float paire = max(
                max(min(l, r), min(u, d)),
                max(min(ul, dr), min(ur, dl))
            );

            // La longueur de chaîne demandée est transformée en seuil local.
            // On garde une logique de continuité, sans parcourir de longues chaînes
            // dans le shader fragment.
            float longueur = clamp(normalChainLength, 3.0, 8.0);
            float seuilSupport = clamp(1.5 + (longueur - 3.0) * 0.30, 1.5, 3.2);
            seuilSupport = max(seuilSupport, minNeighborSupport - 0.5);

            float supportOk = smoothstep(seuilSupport - 0.35, seuilSupport + 0.75, support);
            float continuite = max(paire, supportOk);

            return c * continuite;
        }

        float voisinsForts(vec2 uv, vec2 texel, float distance) {
            // Version légère : on ne fait pas de chaînage complet ici.
            // En revanche, la dilatation utilise un seuil plus strict que
            // le centre pour ne pas agrandir les micro-traits instables.
            float v = 0.0;
            v = max(v, strongNormalDilatationAt(uv + texel * vec2( distance,  0.0), texel));
            v = max(v, strongNormalDilatationAt(uv + texel * vec2(-distance,  0.0), texel));
            v = max(v, strongNormalDilatationAt(uv + texel * vec2( 0.0,  distance), texel));
            v = max(v, strongNormalDilatationAt(uv + texel * vec2( 0.0, -distance), texel));
            v = max(v, strongNormalDilatationAt(uv + texel * vec2( distance,  distance), texel) * 0.70);
            v = max(v, strongNormalDilatationAt(uv + texel * vec2(-distance,  distance), texel) * 0.70);
            v = max(v, strongNormalDilatationAt(uv + texel * vec2( distance, -distance), texel) * 0.70);
            v = max(v, strongNormalDilatationAt(uv + texel * vec2(-distance, -distance), texel) * 0.70);
            return v;
        }

        float crestMask(vec2 texelBase, float largeur) {
            float largeurBornee = floor(clamp(largeur, 1.0, 10.0));
            float masque = chainedNormalAt(vUV, texelBase);

            if (largeurBornee >= 2.0) {
                masque = max(masque, voisinsForts(vUV, texelBase, 1.0) * 0.96);
            }
            if (largeurBornee >= 4.0) {
                masque = max(masque, voisinsForts(vUV, texelBase, 2.0) * 0.84);
            }
            if (largeurBornee >= 6.0) {
                masque = max(masque, voisinsForts(vUV, texelBase, 3.0) * 0.70);
            }
            if (largeurBornee >= 8.0) {
                masque = max(masque, voisinsForts(vUV, texelBase, 4.0) * 0.56);
            }
            if (largeurBornee >= 10.0) {
                masque = max(masque, voisinsForts(vUV, texelBase, 5.0) * 0.44);
            }

            return smoothstep(0.12, 0.46, clamp(masque, 0.0, 1.0));
        }

        void main(void) {
            vec4 original = texture2D(textureSampler, vUV);
            vec2 texelBase = 1.0 / max(screenSize, vec2(1.0));
            float masque = crestMask(texelBase, edgeWidth);
            float clignotement = calculerClignotement(time, blinkInterval, blinkMinFactor);

            gl_FragColor = vec4(
                modifierLuminositeLocaleHsl(original.rgb, masque, luminanceDelta, clignotement, intensity, minLightness, maxLightness),
                original.a
            );
        }
`;

const SHADER_COULEURS = `
        precision highp float;

        varying vec2 vUV;
        uniform sampler2D textureSampler;

        uniform vec2 screenSize;
        uniform float edgeWidth;
        uniform float colorLowThreshold;
        uniform float colorHighThreshold;
        uniform float colorThresholdSmoothLow;
        uniform float colorThresholdSmoothHigh;
        uniform float colorLightnessWeight;
        uniform float colorChromaWeight;
        uniform float colorChainRadius;
        uniform float colorMinSupport;
        uniform float colorMinSupportPerSide;
        uniform float colorMaxGaps;
        uniform float colorVeryStrongFactor;
        uniform float colorVeryStrongSupportReduction;
        uniform float colorVeryStrongSideReduction;
        uniform float colorNoiseValidationEnabled;
        uniform float colorNoiseValidationRadius;
        uniform float colorNoiseValidationMinRatio;
        uniform float colorContinuityEnabled;
        uniform float colorContinuityBridgeThreshold;
        uniform float colorContinuityMinSupport;
        uniform float colorContinuityMinSupportPerSide;
        uniform float colorContinuityMaxGaps;
        uniform float colorSampleRadius;
        uniform float colorHighlightSampleMultiplier;
        uniform float colorMaskPower;
        uniform float intensity;
        uniform float time;
        uniform float blinkInterval;
        uniform float blinkMinFactor;
        uniform float luminanceDelta;
        uniform float minLightness;
        uniform float maxLightness;

        ${FONCTIONS_HIGHLIGHT_COMMUNES}

        vec3 getColorPerceptual(vec2 uv) {
            return texture2D(textureSampler, clamp(uv, vec2(0.001), vec2(0.999))).rgb;
        }

        ${FONCTIONS_GRADIENT_COULEUR_PERCEPTUEL_GLSL}

        void main(void) {
            vec4 original = texture2D(textureSampler, vUV);
            vec2 texelBase = 1.0 / max(screenSize, vec2(1.0));
            float progressionLargeur = clamp((edgeWidth - 1.0) / 9.0, 0.0, 1.0);
            float rayonEchantillonnage = colorSampleRadius * mix(
                1.0,
                max(1.0, colorHighlightSampleMultiplier),
                progressionLargeur
            );

            float masque = masqueChaineCouleurPerceptuelle(
                vUV,
                texelBase,
                rayonEchantillonnage,
                colorLowThreshold,
                colorHighThreshold,
                colorThresholdSmoothLow,
                colorThresholdSmoothHigh,
                colorLightnessWeight,
                colorChromaWeight,
                colorChainRadius,
                colorMinSupport,
                colorMinSupportPerSide,
                colorMaxGaps,
                colorVeryStrongFactor,
                colorVeryStrongSupportReduction,
                colorVeryStrongSideReduction,
                colorNoiseValidationEnabled,
                colorNoiseValidationRadius,
                colorNoiseValidationMinRatio,
                colorContinuityEnabled,
                colorContinuityBridgeThreshold,
                colorContinuityMinSupport,
                colorContinuityMinSupportPerSide,
                colorContinuityMaxGaps,
                colorMaskPower
            );
            float clignotement = calculerClignotement(time, blinkInterval, blinkMinFactor);

            gl_FragColor = vec4(
                modifierLuminositeLocaleHsl(original.rgb, masque, luminanceDelta, clignotement, intensity, minLightness, maxLightness),
                original.a
            );
        }
`;

export function creerShaderMiseLumiereNormalesSiNecessaire() {
    if (shaderNormalesCree) {
        return NOM_SHADER_MISE_LUMIERE_NORMALES;
    }

    BABYLON.Effect.ShadersStore[NOM_SHADER_MISE_LUMIERE_NORMALES] = SHADER_NORMALES;
    shaderNormalesCree = true;

    return NOM_SHADER_MISE_LUMIERE_NORMALES;
}

export function creerShaderMiseLumiereCouleursSiNecessaire() {
    if (shaderCouleursCree) {
        return NOM_SHADER_MISE_LUMIERE_COULEURS;
    }

    BABYLON.Effect.ShadersStore[NOM_SHADER_MISE_LUMIERE_COULEURS] = SHADER_COULEURS;
    shaderCouleursCree = true;

    return NOM_SHADER_MISE_LUMIERE_COULEURS;
}
