import { FONCTIONS_GRADIENT_COULEUR_PERCEPTUEL_GLSL } from "./FonctionsGradientCouleurPerceptuel.js";

/**
 * Déclare le shader utilisé pour afficher les contours liés aux différences de couleur.
 *
 * Le calcul est réalisé dans l'espace perceptuel OKLab, sur huit orientations,
 * puis filtré par un chaînage bilatéral. Pour alléger le rendu, le shader ne
 * calcule qu'un seul masque : l'épaisseur choisit seulement le rayon utilisé.
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
        uniform float colorSampleRadiusMin;
        uniform float colorSampleRadiusMax;
        uniform float colorThicknessSliderMin;
        uniform float colorThicknessSliderMax;
        uniform float colorMaskPower;
        uniform float colorAntiFlickerEnabled;
        uniform float colorAntiFlickerSnapUv;
        uniform float colorAntiFlickerCenterThreshold;
        uniform float colorAntiFlickerNeighborThreshold;
        uniform float colorAntiFlickerMinNeighbors;
        uniform float colorAntiFlickerNeighborRadius;
        uniform float colorAntiFlickerHardMask;
        uniform vec3 colorEdgeColor;

        vec3 getColorPerceptual(vec2 uv) {
            return texture2D(textureSampler, clamp(uv, vec2(0.001), vec2(0.999))).rgb;
        }

        ${FONCTIONS_GRADIENT_COULEUR_PERCEPTUEL_GLSL}

        vec2 stabiliserUvAnalyseCouleur(vec2 uv) {
            if (colorAntiFlickerEnabled > 0.5 && colorAntiFlickerSnapUv > 0.5) {
                vec2 taille = max(screenSize, vec2(1.0));
                return clamp((floor(uv * taille) + vec2(0.5)) / taille, vec2(0.001), vec2(0.999));
            }

            return clamp(uv, vec2(0.001), vec2(0.999));
        }

        float calculerMasqueCouleurPourUv(vec2 uv, float rayonEchantillonnage) {
            return masqueChaineCouleurPerceptuelle(
                uv,
                1.0 / max(screenSize, vec2(1.0)),
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
        }

        float appliquerAntiClignotementCouleur(vec2 uv, float rayonEchantillonnage, float masqueCentre) {
            if (colorAntiFlickerEnabled < 0.5) {
                return masqueCentre;
            }

            vec2 texel = vec2(1.0 / screenSize.x, 1.0 / screenSize.y);
            float rayonVoisin = max(0.5, colorAntiFlickerNeighborRadius);
            float seuilCentre = clamp(colorAntiFlickerCenterThreshold, 0.0, 1.0);
            float seuilVoisin = clamp(colorAntiFlickerNeighborThreshold, 0.0, 1.0);
            float voisinsMin = clamp(colorAntiFlickerMinNeighbors, 0.0, 4.0);

            float voisinage = 0.0;
            voisinage += step(seuilVoisin, calculerMasqueCouleurPourUv(uv + texel * vec2( rayonVoisin, 0.0), rayonEchantillonnage));
            voisinage += step(seuilVoisin, calculerMasqueCouleurPourUv(uv + texel * vec2(-rayonVoisin, 0.0), rayonEchantillonnage));
            voisinage += step(seuilVoisin, calculerMasqueCouleurPourUv(uv + texel * vec2(0.0,  rayonVoisin), rayonEchantillonnage));
            voisinage += step(seuilVoisin, calculerMasqueCouleurPourUv(uv + texel * vec2(0.0, -rayonVoisin), rayonEchantillonnage));

            // Deux garde-fous complémentaires :
            // - les traits vraiment forts restent acceptés ;
            // - les pixels moyens doivent appartenir à un petit voisinage stable.
            float centreTresFort = step(min(0.98, seuilCentre * 1.35), masqueCentre);
            float voisinageStable = step(voisinsMin, voisinage);
            float garde = max(centreTresFort, voisinageStable);

            if (colorAntiFlickerHardMask > 0.5) {
                return garde;
            }

            float centreStable = smoothstep(seuilCentre * 0.82, seuilCentre, masqueCentre);
            return masqueCentre * max(garde, centreStable * voisinageStable);
        }

        void main(void) {
            vec4 couleurOriginale = texture2D(textureSampler, vUV);

            if (colorLowThreshold > 9999.0 || colorHighThreshold > 9999.0) {
                gl_FragColor = couleurOriginale;
                return;
            }

            float sliderMin = colorThicknessSliderMin;
            float sliderMax = max(sliderMin + 0.001, colorThicknessSliderMax);
            float progressionEpaisseur = clamp(
                (edgeWidth - sliderMin) / (sliderMax - sliderMin),
                0.0,
                1.0
            );

            // Un seul calcul de masque : plus léger que l'ancienne fusion
            // masqueFin + masqueLarge. La taille 1 est déjà épaissie dans la
            // configuration, et la taille 2 utilise seulement un rayon un peu supérieur.
            float rayonEchantillonnage = mix(
                colorSampleRadiusMin,
                max(colorSampleRadiusMin, colorSampleRadiusMax),
                progressionEpaisseur
            );
            vec2 uvAnalyse = stabiliserUvAnalyseCouleur(vUV);
            float masqueContour = calculerMasqueCouleurPourUv(uvAnalyse, rayonEchantillonnage);
            masqueContour = appliquerAntiClignotementCouleur(uvAnalyse, rayonEchantillonnage, masqueContour);

            gl_FragColor = vec4(
                mix(couleurOriginale.rgb, colorEdgeColor, clamp(masqueContour, 0.0, 1.0)),
                couleurOriginale.a
            );
        }
    `;

    shaderContoursCouleurCree = true;

    return NOM_SHADER_CONTOURS_COULEUR;
}
