/**
 * Shaders expérimentaux de mise en lumière locale des zones de fort gradient.
 *
 * Cette version ne dessine pas de contour.
 * Elle construit un masque local autour des gradients retenus, puis modifie
 * seulement la composante de luminosité HSL de la couleur originale.
 * L'animation de clignotement est pilotée par le temps et par un intervalle
 * réglable depuis l'interface.
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
    float influence = clamp(masque * facteurClignotement, 0.0, 1.0);

    // Si le pixel n'appartient pas à la zone de highlight,
    // on retourne exactement la couleur originale.
    if (influence <= 0.001) {
        return couleur;
    }

    vec3 hsl = rgbToHsl(couleur);

    float variation = deltaLuminosite * facteurIntensite;

    float lightnessOriginale = hsl.z;
    float lightnessModifiee = clamp(
        lightnessOriginale + variation,
        minLightness,
        maxLightness
    );

    // On mélange entre la couleur originale et la couleur modifiée
    // seulement selon l'influence du masque.
    hsl.z = mix(lightnessOriginale, lightnessModifiee, influence);

    return hslToRgb(hsl);
}
`;

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
        uniform float time;
        uniform float blinkInterval;
        uniform float blinkMinFactor;
        uniform float luminanceDelta;
        uniform float minLightness;
        uniform float maxLightness;

        ${FONCTIONS_HIGHLIGHT_COMMUNES}

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
            float pairContinuity = max(
                max(min(l, r), min(u, d)),
                max(min(ul, dr), min(ur, dl))
            );

            float supportOk = smoothstep(minNeighborSupport - 0.5, minNeighborSupport + 0.5, support);
            float centerLine = c * max(supportOk, pairContinuity);
            float gapBridge = pairContinuity * 0.45;

            return clamp(max(centerLine, gapBridge), 0.0, 1.0);
        }

        float voisinsNormales(vec2 texelBase, float distance) {
            float v = 0.0;
            v = max(v, strongNormalAt(vUV + texelBase * vec2( distance,  0.0), texelBase));
            v = max(v, strongNormalAt(vUV + texelBase * vec2(-distance,  0.0), texelBase));
            v = max(v, strongNormalAt(vUV + texelBase * vec2( 0.0,  distance), texelBase));
            v = max(v, strongNormalAt(vUV + texelBase * vec2( 0.0, -distance), texelBase));
            v = max(v, strongNormalAt(vUV + texelBase * vec2( distance,  distance), texelBase) * 0.72);
            v = max(v, strongNormalAt(vUV + texelBase * vec2(-distance,  distance), texelBase) * 0.72);
            v = max(v, strongNormalAt(vUV + texelBase * vec2( distance, -distance), texelBase) * 0.72);
            v = max(v, strongNormalAt(vUV + texelBase * vec2(-distance, -distance), texelBase) * 0.72);
            return v;
        }

        float crestMask(vec2 texelBase, float largeur) {
            // Version allégée : on ne calcule les voisins lointains que si
            // le slider de largeur les demande réellement.
            // Largeur 1 = crête locale seulement.
            // Largeur 2 à 8 = dilatation progressive du masque autour du gradient.
            float largeurBornee = floor(clamp(largeur, 1.0, 8.0));
            float masque = continuousNormalAt(vUV, texelBase);

            if (largeurBornee >= 2.0) {
                masque = max(masque, voisinsNormales(texelBase, 1.0) * 0.90);
            }
            if (largeurBornee >= 3.0) {
                masque = max(masque, voisinsNormales(texelBase, 2.0) * 0.82);
            }
            if (largeurBornee >= 4.0) {
                masque = max(masque, voisinsNormales(texelBase, 3.0) * 0.70);
            }
            if (largeurBornee >= 5.0) {
                masque = max(masque, voisinsNormales(texelBase, 4.0) * 0.62);
            }
            if (largeurBornee >= 6.0) {
                masque = max(masque, voisinsNormales(texelBase, 5.0) * 0.55);
            }
            if (largeurBornee >= 7.0) {
                masque = max(masque, voisinsNormales(texelBase, 6.0) * 0.48);
            }
            if (largeurBornee >= 8.0) {
                masque = max(masque, voisinsNormales(texelBase, 7.0) * 0.42);
            }

            return smoothstep(0.34, 0.60, clamp(masque, 0.0, 1.0));
        }

        void main(void) {
            vec4 original = texture2D(textureSampler, vUV);
            vec2 texelBase = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            float masque = crestMask(texelBase, edgeWidth);
            float clignotement = calculerClignotement(time, blinkInterval, blinkMinFactor);

            gl_FragColor = vec4(
                modifierLuminositeLocaleHsl(original.rgb, masque, luminanceDelta, clignotement, intensity, minLightness, maxLightness),
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
        uniform float time;
        uniform float blinkInterval;
        uniform float blinkMinFactor;
        uniform float luminanceDelta;
        uniform float minLightness;
        uniform float maxLightness;

        ${FONCTIONS_HIGHLIGHT_COMMUNES}

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

        float voisinsCouleurs(vec2 texelBase, float distance) {
            float v = 0.0;
            v = max(v, strongColorAt(vUV + texelBase * vec2( distance,  0.0), texelBase));
            v = max(v, strongColorAt(vUV + texelBase * vec2(-distance,  0.0), texelBase));
            v = max(v, strongColorAt(vUV + texelBase * vec2( 0.0,  distance), texelBase));
            v = max(v, strongColorAt(vUV + texelBase * vec2( 0.0, -distance), texelBase));
            v = max(v, strongColorAt(vUV + texelBase * vec2( distance,  distance), texelBase) * 0.72);
            v = max(v, strongColorAt(vUV + texelBase * vec2(-distance,  distance), texelBase) * 0.72);
            v = max(v, strongColorAt(vUV + texelBase * vec2( distance, -distance), texelBase) * 0.72);
            v = max(v, strongColorAt(vUV + texelBase * vec2(-distance, -distance), texelBase) * 0.72);
            return v;
        }

        float crestMask(vec2 texelBase, float largeur) {
            // Version allégée : on évite de calculer les voisins lointains
            // quand la largeur demandée est faible.
            float largeurBornee = floor(clamp(largeur, 1.0, 8.0));
            float masque = continuousColorAt(vUV, texelBase);

            if (largeurBornee >= 2.0) {
                masque = max(masque, voisinsCouleurs(texelBase, 1.0) * 0.90);
            }
            if (largeurBornee >= 3.0) {
                masque = max(masque, voisinsCouleurs(texelBase, 2.0) * 0.82);
            }
            if (largeurBornee >= 4.0) {
                masque = max(masque, voisinsCouleurs(texelBase, 3.0) * 0.70);
            }
            if (largeurBornee >= 5.0) {
                masque = max(masque, voisinsCouleurs(texelBase, 4.0) * 0.62);
            }
            if (largeurBornee >= 6.0) {
                masque = max(masque, voisinsCouleurs(texelBase, 5.0) * 0.55);
            }
            if (largeurBornee >= 7.0) {
                masque = max(masque, voisinsCouleurs(texelBase, 6.0) * 0.48);
            }
            if (largeurBornee >= 8.0) {
                masque = max(masque, voisinsCouleurs(texelBase, 7.0) * 0.42);
            }

            return smoothstep(0.34, 0.60, clamp(masque, 0.0, 1.0));
        }

        void main(void) {
            vec4 original = texture2D(textureSampler, vUV);
            vec2 texelBase = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            float masque = crestMask(texelBase, edgeWidth);
            float clignotement = calculerClignotement(time, blinkInterval, blinkMinFactor);

            gl_FragColor = vec4(
                modifierLuminositeLocaleHsl(original.rgb, masque, luminanceDelta, clignotement, intensity, minLightness, maxLightness),
                original.a
            );
        }
    `;

    shaderCouleursCree = true;

    return NOM_SHADER_MISE_LUMIERE_COULEURS;
}
