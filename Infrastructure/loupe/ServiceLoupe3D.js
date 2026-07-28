import { PostTraitApparence } from "../postTraitements/PostTraitApparence.js";
import { PostTraitNettete } from "../postTraitements/PostTraitNettete.js";
import { PostTraitContProfNorm } from "../postTraitements/PostTraitContProfNorm.js";
import { PostTraitContoursCouleur } from "../postTraitements/PostTraitementContoursCouleur.js";
import { PostTraitMiseLumiereNormales } from "../postTraitements/PostTraitMiseLumiereNormales.js";
import { PostTraitMiseLumiereCouleurs } from "../postTraitements/PostTraitMiseLumiereCouleurs.js";
import { constantesContours } from "../../Configuration/constantesContours.js";
import { FONCTIONS_GRADIENT_COULEUR_PERCEPTUEL_GLSL } from "../shaders/FonctionsGradientCouleurPerceptuel.js";

/**
 * Loupe 3D accessible basée sur une vraie caméra secondaire.
 *
 * Principe :
 * - une caméra secondaire suit la caméra principale ;
 * - elle vise le point sous le pointeur mais ne se rapproche pas physiquement du modèle ;
 * - le zoom vient du FOV de cette caméra secondaire, ce qui évite qu'elle rentre dans l'objet ;
 * - le rendu de cette caméra est envoyé dans une RenderTargetTexture légère ;
 * - la texture est affichée uniquement dans un cercle par un post-process final de la caméra principale ;
 * - les post-traitements actifs sont dupliqués sur la caméra secondaire quand c'est possible.
 */
export class ServiceLoupe3D {
    constructor({
        diametre = 450,
        diametreMin = 180,
        diametreMax = 520,
        zoom = 6,
        zoomMin = 1.5,
        zoomMax = 7,
        bordure = 1.25,
        nettete = 0.6,
        inverserY = true,
        antiFlou = 0.9,
        adoucissementBordure = 1.4,
        opaciteLoupe = 1,
        flou = 0.0,

        // Taille du rendu de la caméra secondaire.
        // 512 reste volontairement léger : on rend déjà la scène une deuxième fois.
        tailleTextureLoupe = 512,
        tailleTextureLoupeMin = 256,
        tailleTextureLoupeMax = 768,
        lissageCible = 0.35,
        dupliquerPostTraitements = true
    } = {}) {
        this.diametre = diametre;
        this.diametreMin = diametreMin;
        this.diametreMax = diametreMax;
        this.zoom = zoom;
        this.zoomMin = zoomMin;
        this.zoomMax = zoomMax;
        this.bordure = bordure;
        this.nettete = nettete;
        // inverserY sert à convertir la position écran/souris vers les UV du post-process.
        // La texture rendue par la caméra secondaire, elle, arrive déjà dans le bon sens
        // dans notre chaîne : il ne faut donc pas la retourner une seconde fois.
        this.inverserY = inverserY;
        this.inverserYTextureLoupe = false;
        this.antiFlou = antiFlou;
        this.adoucissementBordure = adoucissementBordure;
        this.opaciteLoupe = opaciteLoupe;
        this.flou = flou;
        this.tailleTextureLoupe = Math.round(this.borner(tailleTextureLoupe, tailleTextureLoupeMin, tailleTextureLoupeMax));
        this.tailleTextureLoupeMin = tailleTextureLoupeMin;
        this.tailleTextureLoupeMax = tailleTextureLoupeMax;
        this.lissageCible = this.borner(lissageCible, 0, 1);
        this.dupliquerPostTraitements = Boolean(dupliquerPostTraitements);

        this.etatApplication = null;
        this.scene = null;
        this.camera = null;
        this.canvas = null;
        this.advancedTexture = null;
        this.serviceCameraBabylon = null;

        this.postProcess = null;
        this.cameraLoupe = null;
        this.textureLoupe = null;
        this.textureNormalesLoupe = null;
        this.materiauNormalesLoupe = null;
        this.materiauxSauvegardesNormalesLoupe = null;
        this.normalTextureLoupeSetMaterialSupporte = false;
        this.postTraitementsLoupe = null;
        this.signaturePostTraitementsLoupe = null;
        this.refsPostTraitementsLoupe = null;
        this.depthRendererLoupe = null;
        this.depthMapLoupe = null;
        this.dernierControlePostTraitements = 0;
        this.dernierControleRenderList = 0;
        this.cibleLoupeLisse = null;
        this.cibleLoupeFrame = null;
        this.dernierFrameCameraLoupe = null;
        this.observateurAvantRenduScene = null;

        // Optimisation retenue : rendu continu, mais limité à la renderList du modèle
        // et aux post-traitements officiels de la caméra loupe. L'ancienne stratégie
        // qui attendait une position stable provoquait un retard visuel désagréable.
        this.delaiStabiliteRenduMs = 0;
        this.intervalleRenduStableMs = 0;
        this.seuilMouvementRenduPx = 0;
        this.dernierMouvementPointeurMs = 0;
        this.dernierRenduLoupeMs = 0;
        this.dernierePositionRendueLoupe = null;
        this.renduLoupeSale = true;
        this.renduLoupeManuelEnCours = false;

        this.bouton = null;
        this.texteBouton = null;
        this.actif = false;
        this.pointeurDansCanvas = false;
        this.positionPointeur = null;
        this.cursorAvantLoupe = "";
        this.rafId = null;
        this.derniereRecreation = 0;

        this._onPointerMove = this.surDeplacementPointeur.bind(this);
        this._onPointerLeave = this.surSortiePointeur.bind(this);
        this._onPointerEnter = this.surEntreePointeur.bind(this);
        this._onWheel = this.bloquerEvenementNavigation.bind(this);
        this._onPointerDown = this.bloquerEvenementNavigation.bind(this);
        this._onKeyDown = this.surToucheClavier.bind(this);
        this._avantRenduTextureLoupe = () => this.preparerRenduTextureLoupe();
        this._avantRenduTextureNormalesLoupe = () => this.preparerRenduTextureNormalesLoupe();
        this._apresRenduTextureNormalesLoupe = () => this.terminerRenduTextureNormalesLoupe();
    }

    installer({
        etatApplication,
        scene,
        camera,
        canvas,
        advancedTexture,
        serviceCameraBabylon = null
    } = {}) {
        if (!etatApplication || !scene || !camera || !canvas || !advancedTexture) {
            console.warn("[Loupe 3D] Installation impossible : dépendances manquantes.");
            return null;
        }

        this.etatApplication = etatApplication;
        this.scene = scene;
        this.camera = camera;
        this.canvas = canvas;
        this.advancedTexture = advancedTexture;
        this.serviceCameraBabylon = serviceCameraBabylon;

        this.enregistrerShaderSiNecessaire();
        this.creerBoutonLoupe();
        this.brancherEvenementsCanvas();

        etatApplication.services = {
            ...(etatApplication.services ?? {}),
            loupe3D: this
        };

        return this;
    }

    enregistrerShaderSiNecessaire() {
        if (!globalThis.BABYLON?.Effect?.ShadersStore) return;

        const cle = "SaotraLoupe3DPostProcessFragmentShader";
        if (BABYLON.Effect.ShadersStore[cle]) return;

        BABYLON.Effect.ShadersStore[cle] = `
            precision highp float;

            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform sampler2D loupeSampler;
            uniform sampler2D loupeDepthSampler;

            uniform vec2 screenSize;
            uniform vec2 loupeTextureSize;
            uniform vec2 loupeDepthTextureSize;
            uniform vec2 centreLoupe;
            uniform float rayonPixels;
            uniform float bordurePixels;
            uniform float actif;
            uniform float visible;
            uniform float netteteLoupe;
            uniform float antiFlouLoupe;
            uniform float adoucissementBordurePixels;
            uniform float opaciteLoupe;
            uniform float flouLoupe;
            uniform float inverserYLoupe;
            uniform float textureLoupeDisponible;

            // Effets locaux recalculés dans la texture de la caméra loupe.
            // Cela évite de mélanger les contours/highlights de la caméra principale,
            // qui apparaissaient en miniature dans la loupe.
            uniform float useDepthContour;
            uniform float useReliefContour;
            uniform float useColorContour;
            uniform float useHighlight;
            uniform float contourWidth;
            uniform float highlightWidth;
            uniform float depthThreshold;
            uniform float reliefThreshold;
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
            uniform vec3 contourColor;
            uniform float time;
            uniform float blinkInterval;
            uniform float blinkMinFactor;
            uniform float luminanceDelta;
            uniform float sensLuminance;

            vec4 echantillonTextureLoupe(vec2 uvLocal) {
                vec2 uv = clamp(uvLocal, vec2(0.001), vec2(0.999));

                if (inverserYLoupe > 0.5) {
                    uv.y = 1.0 - uv.y;
                }

                vec4 lisse = texture2D(loupeSampler, uv);

                vec2 taille = max(loupeTextureSize, vec2(1.0));
                vec2 uvPixelNet = (floor(uv * taille) + vec2(0.5)) / taille;
                vec4 net = texture2D(loupeSampler, clamp(uvPixelNet, vec2(0.001), vec2(0.999)));

                return mix(lisse, net, clamp(antiFlouLoupe, 0.0, 1.0));
            }

            float lireProfondeur(vec2 uvLocal) {
                vec2 uv = clamp(uvLocal, vec2(0.001), vec2(0.999));

                if (inverserYLoupe > 0.5) {
                    uv.y = 1.0 - uv.y;
                }

                return texture2D(loupeDepthSampler, uv).r;
            }

            float luminance(vec3 color) {
                return dot(color, vec3(0.299, 0.587, 0.114));
            }

            float sobelLuminanceLoupe(vec2 uv, vec2 texel) {
                float l00 = luminance(echantillonTextureLoupe(uv + texel * vec2(-1.0, -1.0)).rgb);
                float l10 = luminance(echantillonTextureLoupe(uv + texel * vec2( 0.0, -1.0)).rgb);
                float l20 = luminance(echantillonTextureLoupe(uv + texel * vec2( 1.0, -1.0)).rgb);

                float l01 = luminance(echantillonTextureLoupe(uv + texel * vec2(-1.0,  0.0)).rgb);
                float l21 = luminance(echantillonTextureLoupe(uv + texel * vec2( 1.0,  0.0)).rgb);

                float l02 = luminance(echantillonTextureLoupe(uv + texel * vec2(-1.0,  1.0)).rgb);
                float l12 = luminance(echantillonTextureLoupe(uv + texel * vec2( 0.0,  1.0)).rgb);
                float l22 = luminance(echantillonTextureLoupe(uv + texel * vec2( 1.0,  1.0)).rgb);

                float gx =
                    -1.0 * l00 + 1.0 * l20 +
                    -2.0 * l01 + 2.0 * l21 +
                    -1.0 * l02 + 1.0 * l22;

                float gy =
                    -1.0 * l00 - 2.0 * l10 - 1.0 * l20 +
                     1.0 * l02 + 2.0 * l12 + 1.0 * l22;

                return sqrt(gx * gx + gy * gy);
            }

            float sobelProfondeur(vec2 uv, vec2 texel) {
                float d00 = lireProfondeur(uv + texel * vec2(-1.0, -1.0));
                float d10 = lireProfondeur(uv + texel * vec2( 0.0, -1.0));
                float d20 = lireProfondeur(uv + texel * vec2( 1.0, -1.0));

                float d01 = lireProfondeur(uv + texel * vec2(-1.0,  0.0));
                float d21 = lireProfondeur(uv + texel * vec2( 1.0,  0.0));

                float d02 = lireProfondeur(uv + texel * vec2(-1.0,  1.0));
                float d12 = lireProfondeur(uv + texel * vec2( 0.0,  1.0));
                float d22 = lireProfondeur(uv + texel * vec2( 1.0,  1.0));

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
                if (rayon <= 1.0) return 1.0;
                return smoothstep(rayon - 1.0, rayon, largeur);
            }

            // Secours utilisé uniquement pour le relief local quand les post-traitements
            // de la caméra secondaire ne sont pas dupliqués.
            float masqueProgressifLuminance(vec2 uv, vec2 texelBase, float largeur, float seuil) {
                float largeurBornee = clamp(largeur, 1.0, 6.0);
                float masque = 0.0;

                float e1 = sobelLuminanceLoupe(uv, texelBase * 1.0);
                float e2 = sobelLuminanceLoupe(uv, texelBase * 2.0);
                float e3 = sobelLuminanceLoupe(uv, texelBase * 3.0);

                masque = max(masque, smoothstep(seuil * 0.85, seuil * 1.30, e1));
                masque = max(masque, smoothstep(seuil * 0.85, seuil * 1.30, e2) * poidsRayon(2.0, largeurBornee));
                masque = max(masque, smoothstep(seuil * 0.85, seuil * 1.30, e3) * poidsRayon(3.0, largeurBornee));

                return clamp(masque, 0.0, 1.0);
            }

            vec3 getColorPerceptual(vec2 uv) {
                return echantillonTextureLoupe(uv).rgb;
            }

            ${FONCTIONS_GRADIENT_COULEUR_PERCEPTUEL_GLSL}

            float masqueChaineCouleurLoupe(vec2 uv, vec2 texelBase, float rayonEchantillonnage) {
                return masqueChaineCouleurPerceptuelle(
                    uv,
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
            }

            float masqueCouleurPerceptuelLoupe(vec2 uv, vec2 texelBase, float largeur) {
                float sliderMax = max(colorThicknessSliderMin + 0.001, colorThicknessSliderMax);
                float progressionEpaisseur = clamp(
                    (largeur - colorThicknessSliderMin) / (sliderMax - colorThicknessSliderMin),
                    0.0,
                    1.0
                );

                float rayonEchantillonnage = mix(
                    colorSampleRadiusMin,
                    max(colorSampleRadiusMin, colorSampleRadiusMax),
                    progressionEpaisseur
                );

                return masqueChaineCouleurLoupe(uv, texelBase, rayonEchantillonnage);
            }

            float masqueProgressifProfondeur(vec2 uv, vec2 texelDepth, float largeur, float seuil) {
                float largeurBornee = clamp(largeur, 1.0, 6.0);
                float masque = 0.0;

                float e1 = sobelProfondeur(uv, texelDepth * 1.0);
                float e2 = sobelProfondeur(uv, texelDepth * 2.0);
                float e3 = sobelProfondeur(uv, texelDepth * 3.0);

                masque = max(masque, smoothstep(seuil * 0.80, seuil * 1.40, e1));
                masque = max(masque, smoothstep(seuil * 0.80, seuil * 1.40, e2) * poidsRayon(2.0, largeurBornee));
                masque = max(masque, smoothstep(seuil * 0.80, seuil * 1.40, e3) * poidsRayon(3.0, largeurBornee));

                return clamp(masque, 0.0, 1.0);
            }

            vec3 modifierLuminance(vec3 couleur, float masque) {
                float intervalle = max(0.1, blinkInterval);
                float phase = mod(time, intervalle) / intervalle;
                float clignotement = mix(blinkMinFactor, 1.0, 0.5 + 0.5 * cos(phase * 6.28318530718));
                float delta = luminanceDelta * sensLuminance * clignotement * masque;
                return clamp(couleur + vec3(delta), 0.0, 1.0);
            }

            vec4 couleurLoupeCamera(vec2 uvLocal) {
                vec2 uv = clamp(uvLocal, vec2(0.001), vec2(0.999));
                vec4 centre = echantillonTextureLoupe(uv);

                if (netteteLoupe <= 0.001) {
                    return centre;
                }

                vec2 pixelSize = 1.0 / max(loupeTextureSize, vec2(1.0));
                float rayonFlou = clamp(flouLoupe, 0.0, 1.0) * 1.75;
                vec2 decalageFlou = pixelSize * max(rayonFlou, 1.0);

                vec4 gauche = echantillonTextureLoupe(uv + vec2(-decalageFlou.x, 0.0));
                vec4 droite = echantillonTextureLoupe(uv + vec2( decalageFlou.x, 0.0));
                vec4 haut = echantillonTextureLoupe(uv + vec2(0.0, -decalageFlou.y));
                vec4 bas = echantillonTextureLoupe(uv + vec2(0.0,  decalageFlou.y));

                vec4 flouLocal = (gauche + droite + haut + bas) * 0.25;
                vec4 base = mix(centre, flouLocal, clamp(flouLoupe, 0.0, 1.0) * 0.65);
                vec4 renforce = base + (base - flouLocal) * netteteLoupe;

                return vec4(clamp(renforce.rgb, 0.0, 1.0), centre.a);
            }

            void main(void) {
                vec4 couleurBase = texture2D(textureSampler, vUV);

                if (actif < 0.5 || visible < 0.5 || textureLoupeDisponible < 0.5 || rayonPixels <= 1.0) {
                    gl_FragColor = couleurBase;
                    return;
                }

                vec2 deltaPixels = (vUV - centreLoupe) * screenSize;
                float distancePixels = length(deltaPixels);
                float rayon = rayonPixels;
                float largeurBordure = max(1.0, bordurePixels);

                if (distancePixels > rayon + largeurBordure + 2.0) {
                    gl_FragColor = couleurBase;
                    return;
                }

                vec2 uvLocal = vec2(0.5) + (deltaPixels / max(rayon * 2.0, 1.0));
                vec2 texelCouleur = 1.0 / max(loupeTextureSize, vec2(1.0));
                vec2 texelDepth = 1.0 / max(loupeDepthTextureSize, vec2(1.0));
                vec4 couleurZoom = couleurLoupeCamera(uvLocal);

                float masqueDepth = useDepthContour > 0.5
                    ? masqueProgressifProfondeur(uvLocal, texelDepth, contourWidth, depthThreshold)
                    : 0.0;
                float masqueRelief = useReliefContour > 0.5
                    ? masqueProgressifLuminance(uvLocal, texelCouleur, contourWidth, reliefThreshold)
                    : 0.0;
                float masqueCouleur = useColorContour > 0.5
                    ? masqueCouleurPerceptuelLoupe(uvLocal, texelCouleur, contourWidth)
                    : 0.0;

                float masqueContour = clamp(max(max(masqueDepth, masqueRelief), masqueCouleur), 0.0, 1.0);
                float masqueHighlight = useHighlight > 0.5
                    ? max(
                        masqueProgressifProfondeur(uvLocal, texelDepth, highlightWidth, depthThreshold),
                        max(
                            masqueProgressifLuminance(uvLocal, texelCouleur, highlightWidth, reliefThreshold),
                            masqueCouleurPerceptuelLoupe(uvLocal, texelCouleur, min(highlightWidth, 2.0))
                        )
                    )
                    : 0.0;

                if (masqueHighlight > 0.001) {
                    couleurZoom.rgb = modifierLuminance(couleurZoom.rgb, masqueHighlight);
                }

                if (masqueContour > 0.001) {
                    couleurZoom.rgb = mix(couleurZoom.rgb, contourColor, masqueContour);
                }

                float adoucissement = max(0.05, adoucissementBordurePixels);
                float masqueInterieur = smoothstep(rayon + adoucissement, rayon - adoucissement, distancePixels);

                // Remplacement complet à l'intérieur de la loupe.
                // On ne mélange plus avec textureSampler, sinon les contours/highlights
                // de la caméra principale restent visibles en miniature.
                vec4 couleur = mix(couleurBase, couleurZoom, masqueInterieur);

                float anneauExterieur = smoothstep(rayon + largeurBordure + adoucissement, rayon + largeurBordure - adoucissement, distancePixels);
                float anneauInterieur = smoothstep(rayon + adoucissement, rayon - adoucissement, distancePixels);
                float masqueBordure = clamp(anneauExterieur - anneauInterieur, 0.0, 1.0);

                vec3 couleurBordure = vec3(1.0, 1.0, 0.96);
                vec3 ombreBordure = vec3(0.02, 0.02, 0.02);
                float bordInterne = smoothstep(rayon + 0.8, rayon - 0.8, distancePixels);

                couleur.rgb = mix(couleur.rgb, ombreBordure, masqueBordure * 0.35);
                couleur.rgb = mix(couleur.rgb, couleurBordure, masqueBordure * 0.55 * (1.0 - bordInterne));

                gl_FragColor = couleur;
            }
        `;
    }


    enregistrerShaderNormalesLoupeSiNecessaire() {
        if (!globalThis.BABYLON?.Effect?.ShadersStore) return;

        if (!BABYLON.Effect.ShadersStore.SaotraLoupeNormalVertexShader) {
            BABYLON.Effect.ShadersStore.SaotraLoupeNormalVertexShader = `
                precision highp float;

                attribute vec3 position;
                attribute vec3 normal;

                uniform mat4 worldViewProjection;
                uniform mat4 world;

                varying vec3 vNormalW;

                void main(void) {
                    vNormalW = normalize((world * vec4(normal, 0.0)).xyz);
                    gl_Position = worldViewProjection * vec4(position, 1.0);
                }
            `;
        }

        if (!BABYLON.Effect.ShadersStore.SaotraLoupeNormalFragmentShader) {
            BABYLON.Effect.ShadersStore.SaotraLoupeNormalFragmentShader = `
                precision highp float;

                varying vec3 vNormalW;

                void main(void) {
                    vec3 n = normalize(vNormalW) * 0.5 + 0.5;
                    gl_FragColor = vec4(n, 1.0);
                }
            `;
        }
    }

    creerMateriauNormalesLoupeSiNecessaire() {
        if (this.materiauNormalesLoupe || !this.scene) return this.materiauNormalesLoupe;

        this.enregistrerShaderNormalesLoupeSiNecessaire();

        this.materiauNormalesLoupe = new BABYLON.ShaderMaterial(
            "SaotraLoupeNormalMaterial",
            this.scene,
            {
                vertex: "SaotraLoupeNormal",
                fragment: "SaotraLoupeNormal"
            },
            {
                attributes: ["position", "normal"],
                uniforms: ["world", "worldViewProjection"]
            }
        );

        this.materiauNormalesLoupe.backFaceCulling = false;
        this.materiauNormalesLoupe.disableDepthWrite = false;
        this.materiauNormalesLoupe.metadata = {
            ...(this.materiauNormalesLoupe.metadata ?? {}),
            estLoupe3D: true
        };

        return this.materiauNormalesLoupe;
    }

    creerTextureNormalesLoupeSiNecessaire() {
        if (this.textureNormalesLoupe || !this.scene || !this.cameraLoupe) return this.textureNormalesLoupe;

        const taille = Math.round(this.borner(
            this.tailleTextureLoupe,
            this.tailleTextureLoupeMin,
            this.tailleTextureLoupeMax
        ));

        const materiau = this.creerMateriauNormalesLoupeSiNecessaire();

        this.textureNormalesLoupe = new BABYLON.RenderTargetTexture(
            "SaotraLoupeNormalTexture",
            taille,
            this.scene,
            false
        );

        this.textureNormalesLoupe.activeCamera = this.cameraLoupe;
        this.textureNormalesLoupe.refreshRate = 1;
        this.textureNormalesLoupe.ignoreCameraViewport = true;
        this.textureNormalesLoupe.useCameraPostProcesses = false;
        this.textureNormalesLoupe.renderParticles = false;
        this.textureNormalesLoupe.renderSprites = false;
        this.textureNormalesLoupe.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        this.textureNormalesLoupe.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        this.textureNormalesLoupe.updateSamplingMode?.(BABYLON.Texture.BILINEAR_SAMPLINGMODE);
        this.textureNormalesLoupe.metadata = {
            ...(this.textureNormalesLoupe.metadata ?? {}),
            estTextureLoupe3D: true,
            estTextureNormalesLoupe3D: true
        };

        this.normalTextureLoupeSetMaterialSupporte = typeof this.textureNormalesLoupe.setMaterialForRendering === "function";

        if (!this.normalTextureLoupeSetMaterialSupporte) {
            this.textureNormalesLoupe.onBeforeRenderObservable?.add?.(this._avantRenduTextureNormalesLoupe);
            this.textureNormalesLoupe.onAfterRenderObservable?.add?.(this._apresRenduTextureNormalesLoupe);
        }

        // La texture des normales suit la caméra loupe en continu. Elle reste dans
        // customRenderTargets, mais sa renderList est limitée au modèle courant.
        this.ajouterRenderTargetLoupeAuRenduAutomatique(this.textureNormalesLoupe, { premier: true });

        this.mettreAJourRenderListLoupe(true);

        if (this.normalTextureLoupeSetMaterialSupporte && materiau) {
            this.appliquerMateriauNormalesLoupeSurRenderTarget();
        }

        this.actualiserMetadataRenduLoupe();
        return this.textureNormalesLoupe;
    }

    appliquerMateriauNormalesLoupeSurRenderTarget() {
        if (!this.textureNormalesLoupe || !this.materiauNormalesLoupe) return;
        if (typeof this.textureNormalesLoupe.setMaterialForRendering !== "function") return;

        try {
            const liste = Array.isArray(this.textureNormalesLoupe.renderList)
                ? this.textureNormalesLoupe.renderList
                : [];
            this.textureNormalesLoupe.setMaterialForRendering(liste, this.materiauNormalesLoupe);
        } catch (_) {
            try {
                const liste = Array.isArray(this.textureNormalesLoupe.renderList)
                    ? this.textureNormalesLoupe.renderList
                    : [];
                liste.forEach((mesh) => this.textureNormalesLoupe.setMaterialForRendering(mesh, this.materiauNormalesLoupe));
            } catch (_) {
                this.normalTextureLoupeSetMaterialSupporte = false;
            }
        }
    }

    preparerRenduTextureNormalesLoupe() {
        this.mettreAJourCameraLoupe();

        if (this.normalTextureLoupeSetMaterialSupporte) {
            return;
        }

        const materiau = this.creerMateriauNormalesLoupeSiNecessaire();
        if (!materiau || !Array.isArray(this.textureNormalesLoupe?.renderList)) return;

        this.materiauxSauvegardesNormalesLoupe = [];

        for (const mesh of this.textureNormalesLoupe.renderList) {
            if (!mesh || mesh.metadata?.estLoupe3D || mesh.name?.startsWith?.("SaotraLoupe")) continue;
            if (!(mesh instanceof BABYLON.AbstractMesh)) continue;
            if (!mesh.material) continue;

            this.materiauxSauvegardesNormalesLoupe.push([mesh, mesh.material]);
            mesh.material = materiau;
        }
    }

    terminerRenduTextureNormalesLoupe() {
        const sauvegardes = this.materiauxSauvegardesNormalesLoupe;
        this.materiauxSauvegardesNormalesLoupe = null;

        if (!Array.isArray(sauvegardes)) return;

        for (const [mesh, materiau] of sauvegardes) {
            if (mesh && materiau) {
                mesh.material = materiau;
            }
        }
    }

    actualiserMetadataRenduLoupe() {
        if (!this.cameraLoupe) return;

        const tailleCouleur = this.textureLoupe?.getSize?.() ?? null;
        const tailleNormales = this.textureNormalesLoupe?.getSize?.() ?? null;
        const tailleDepth = this.depthMapLoupe?.getSize?.() ?? tailleCouleur;

        this.cameraLoupe.metadata = {
            ...(this.cameraLoupe.metadata ?? {}),
            estLoupe3D: true,
            saotraLoupe3D: {
                depthTexture: this.depthMapLoupe ?? null,
                normalTexture: this.textureNormalesLoupe ?? null,
                renderSize: {
                    largeur: Math.max(1, Number(tailleCouleur?.width ?? tailleNormales?.width ?? this.tailleTextureLoupe) || 1),
                    hauteur: Math.max(1, Number(tailleCouleur?.height ?? tailleNormales?.height ?? this.tailleTextureLoupe) || 1)
                },
                depthSize: {
                    largeur: Math.max(1, Number(tailleDepth?.width ?? this.tailleTextureLoupe) || 1),
                    hauteur: Math.max(1, Number(tailleDepth?.height ?? this.tailleTextureLoupe) || 1)
                },
                normalSize: {
                    largeur: Math.max(1, Number(tailleNormales?.width ?? this.tailleTextureLoupe) || 1),
                    hauteur: Math.max(1, Number(tailleNormales?.height ?? this.tailleTextureLoupe) || 1)
                }
            }
        };
    }

    creerCameraLoupeSiNecessaire() {
        if (this.cameraLoupe || !this.scene || !this.camera) return this.cameraLoupe;

        this.cameraLoupe = new BABYLON.TargetCamera(
            "SaotraLoupeCameraSecondaire",
            this.camera.position?.clone?.() ?? BABYLON.Vector3.Zero(),
            this.scene
        );

        this.cameraLoupe.minZ = this.lireNombre(this.camera.minZ, null, 0.05);
        this.cameraLoupe.maxZ = this.lireNombre(this.camera.maxZ, null, 1000);
        this.cameraLoupe.fov = this.borner(
            this.lireNombre(this.camera.fov, null, 0.8) / Math.max(this.zoom, 1.01),
            0.05,
            Math.PI / 2
        );
        this.cameraLoupe.fovMode = this.camera.fovMode ?? BABYLON.Camera.FOVMODE_VERTICAL_FIXED;
        this.cameraLoupe.layerMask = this.camera.layerMask ?? 0x0FFFFFFF;
        this.cameraLoupe.inputs?.clear?.();
        this.cameraLoupe.metadata = {
            ...(this.cameraLoupe.metadata ?? {}),
            estLoupe3D: true
        };

        return this.cameraLoupe;
    }

    creerDepthRendererLoupeSiNecessaire() {
        if (!this.scene || !this.cameraLoupe) return null;

        try {
            this.depthRendererLoupe = this.scene.enableDepthRenderer(this.cameraLoupe);
            this.depthMapLoupe = this.depthRendererLoupe?.getDepthMap?.() ?? null;
            this.actualiserMetadataRenduLoupe();
        } catch (erreur) {
            console.warn("[Loupe 3D] DepthRenderer indisponible pour la caméra loupe.", erreur);
            this.depthRendererLoupe = null;
            this.depthMapLoupe = null;
        }

        return this.depthRendererLoupe;
    }

    creerTextureLoupeSiNecessaire() {
        if (this.textureLoupe || !this.scene) return this.textureLoupe;

        this.creerCameraLoupeSiNecessaire();
        this.creerTextureNormalesLoupeSiNecessaire();

        const taille = Math.round(this.borner(
            this.tailleTextureLoupe,
            this.tailleTextureLoupeMin,
            this.tailleTextureLoupeMax
        ));

        this.textureLoupe = new BABYLON.RenderTargetTexture(
            "SaotraLoupeCameraTexture",
            taille,
            this.scene,
            false
        );

        this.textureLoupe.activeCamera = this.cameraLoupe;
        this.textureLoupe.refreshRate = 1;
        this.textureLoupe.ignoreCameraViewport = true;
        // La texture caméra embarque les post-traitements officiels de la caméra loupe.
        // Les contours/highlights sont donc calculés à l'échelle du rendu zoomé,
        // puis le post-process final se contente d'afficher cette texture dans le cercle.
        this.textureLoupe.useCameraPostProcesses = true;
        this.textureLoupe.renderParticles = false;
        this.textureLoupe.renderSprites = false;
        this.textureLoupe.updateSamplingMode?.(BABYLON.Texture.BILINEAR_SAMPLINGMODE);
        this.textureLoupe.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        this.textureLoupe.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        this.textureLoupe.metadata = {
            ...(this.textureLoupe.metadata ?? {}),
            estTextureLoupe3D: true
        };

        this.creerDepthRendererLoupeSiNecessaire();
        this.actualiserMetadataRenduLoupe();

        this.textureLoupe.onBeforeRenderObservable?.add?.(this._avantRenduTextureLoupe);

        this.ajouterRenderTargetLoupeAuRenduAutomatique(this.textureLoupe);

        this.mettreAJourRenderListLoupe(true);
        return this.textureLoupe;
    }

    creerPostProcess() {
        if (!this.camera || !this.scene) return null;

        this.supprimerPostProcess();
        this.enregistrerShaderSiNecessaire();
        this.creerTextureLoupeSiNecessaire();
        this.synchroniserPostTraitementsLoupe(true);

        const moteur = this.scene.getEngine?.() ?? null;

        this.postProcess = new BABYLON.PostProcess(
            "SaotraLoupe3DPostProcess",
            "SaotraLoupe3DPostProcess",
            [
                "screenSize",
                "loupeTextureSize",
                "loupeDepthTextureSize",
                "centreLoupe",
                "rayonPixels",
                "bordurePixels",
                "actif",
                "visible",
                "netteteLoupe",
                "antiFlouLoupe",
                "adoucissementBordurePixels",
                "opaciteLoupe",
                "flouLoupe",
                "inverserYLoupe",
                "textureLoupeDisponible",
                "useDepthContour",
                "useReliefContour",
                "useColorContour",
                "useHighlight",
                "contourWidth",
                "highlightWidth",
                "depthThreshold",
                "reliefThreshold",
                "colorLowThreshold",
                "colorHighThreshold",
                "colorThresholdSmoothLow",
                "colorThresholdSmoothHigh",
                "colorLightnessWeight",
                "colorChromaWeight",
                "colorChainRadius",
                "colorMinSupport",
                "colorMinSupportPerSide",
                "colorMaxGaps",
                "colorVeryStrongFactor",
                "colorVeryStrongSupportReduction",
                "colorVeryStrongSideReduction",
                "colorNoiseValidationEnabled",
                "colorNoiseValidationRadius",
                "colorNoiseValidationMinRatio",
                "colorContinuityEnabled",
                "colorContinuityBridgeThreshold",
                "colorContinuityMinSupport",
                "colorContinuityMinSupportPerSide",
                "colorContinuityMaxGaps",
                "colorSampleRadiusMin",
                "colorSampleRadiusMax",
                "colorThicknessSliderMin",
                "colorThicknessSliderMax",
                "colorMaskPower",
                "contourColor",
                "time",
                "blinkInterval",
                "blinkMinFactor",
                "luminanceDelta",
                "sensLuminance"
            ],
            ["loupeSampler", "loupeDepthSampler"],
            1.0,
            this.camera,
            BABYLON.Texture.BILINEAR_SAMPLINGMODE,
            moteur,
            false
        );

        this.postProcess.onApply = (effect) => this.appliquerUniforms(effect);
        this.derniereRecreation = performance.now?.() ?? Date.now();

        return this.postProcess;
    }

    appliquerUniforms(effect) {
        const taille = this.obtenirTailleRendu();
        const centre = this.calculerCentreUV();
        const rayon = this.calculerRayonPixels(taille);
        const bordure = this.calculerBordurePixels(taille);
        const tailleTexture = this.obtenirTailleTextureLoupe();
        const tailleDepth = this.obtenirTailleDepthLoupe();

        if (this.textureLoupe) {
            effect.setTexture("loupeSampler", this.textureLoupe);
        }

        if (this.depthMapLoupe) {
            effect.setTexture("loupeDepthSampler", this.depthMapLoupe);
        } else if (this.textureLoupe) {
            // Secours : évite une texture non liée si Babylon ne fournit pas de depth map.
            effect.setTexture("loupeDepthSampler", this.textureLoupe);
        }

        // Quand la caméra secondaire possède ses propres post-traitements, on ne
        // recalcule pas une deuxième fois contours/highlight dans le shader final :
        // sinon on obtient des effets bruités ou différents de la scène principale.
        const etatEffets = this.dupliquerPostTraitements
            ? this.obtenirEtatEffetsLoupeDesactives()
            : this.obtenirEtatEffetsLoupeLocale();

        effect.setFloat2("screenSize", taille.largeur, taille.hauteur);
        effect.setFloat2("loupeTextureSize", tailleTexture.largeur, tailleTexture.hauteur);
        effect.setFloat2("loupeDepthTextureSize", tailleDepth.largeur, tailleDepth.hauteur);
        effect.setFloat2("centreLoupe", centre.x, centre.y);
        effect.setFloat("rayonPixels", rayon);
        effect.setFloat("bordurePixels", bordure);
        effect.setFloat("actif", this.actif ? 1.0 : 0.0);
        effect.setFloat("visible", this.pointeurDansCanvas ? 1.0 : 0.0);
        effect.setFloat("netteteLoupe", this.nettete);
        effect.setFloat("antiFlouLoupe", this.antiFlou);
        effect.setFloat("adoucissementBordurePixels", this.calculerAdoucissementBordurePixels(taille));
        effect.setFloat("opaciteLoupe", this.opaciteLoupe);
        effect.setFloat("flouLoupe", this.flou);
        effect.setFloat("inverserYLoupe", this.inverserYTextureLoupe ? 1.0 : 0.0);
        effect.setFloat("textureLoupeDisponible", this.textureLoupe ? 1.0 : 0.0);
        effect.setFloat("useDepthContour", etatEffets.useDepthContour ? 1.0 : 0.0);
        effect.setFloat("useReliefContour", etatEffets.useReliefContour ? 1.0 : 0.0);
        effect.setFloat("useColorContour", etatEffets.useColorContour ? 1.0 : 0.0);
        effect.setFloat("useHighlight", etatEffets.useHighlight ? 1.0 : 0.0);
        effect.setFloat("contourWidth", etatEffets.contourWidth);
        effect.setFloat("highlightWidth", etatEffets.highlightWidth);
        effect.setFloat("depthThreshold", etatEffets.depthThreshold);
        effect.setFloat("reliefThreshold", etatEffets.reliefThreshold);
        effect.setFloat("colorLowThreshold", etatEffets.colorLowThreshold);
        effect.setFloat("colorHighThreshold", etatEffets.colorHighThreshold);
        effect.setFloat("colorThresholdSmoothLow", etatEffets.colorThresholdSmoothLow);
        effect.setFloat("colorThresholdSmoothHigh", etatEffets.colorThresholdSmoothHigh);
        effect.setFloat("colorLightnessWeight", etatEffets.colorLightnessWeight);
        effect.setFloat("colorChromaWeight", etatEffets.colorChromaWeight);
        effect.setFloat("colorChainRadius", etatEffets.colorChainRadius);
        effect.setFloat("colorMinSupport", etatEffets.colorMinSupport);
        effect.setFloat("colorMinSupportPerSide", etatEffets.colorMinSupportPerSide);
        effect.setFloat("colorMaxGaps", etatEffets.colorMaxGaps);
        effect.setFloat("colorVeryStrongFactor", etatEffets.colorVeryStrongFactor);
        effect.setFloat("colorVeryStrongSupportReduction", etatEffets.colorVeryStrongSupportReduction);
        effect.setFloat("colorVeryStrongSideReduction", etatEffets.colorVeryStrongSideReduction);
        effect.setFloat("colorNoiseValidationEnabled", etatEffets.colorNoiseValidationEnabled);
        effect.setFloat("colorNoiseValidationRadius", etatEffets.colorNoiseValidationRadius);
        effect.setFloat("colorNoiseValidationMinRatio", etatEffets.colorNoiseValidationMinRatio);
        effect.setFloat("colorContinuityEnabled", etatEffets.colorContinuityEnabled);
        effect.setFloat("colorContinuityBridgeThreshold", etatEffets.colorContinuityBridgeThreshold);
        effect.setFloat("colorContinuityMinSupport", etatEffets.colorContinuityMinSupport);
        effect.setFloat("colorContinuityMinSupportPerSide", etatEffets.colorContinuityMinSupportPerSide);
        effect.setFloat("colorContinuityMaxGaps", etatEffets.colorContinuityMaxGaps);
        effect.setFloat("colorSampleRadiusMin", etatEffets.colorSampleRadiusMin);
        effect.setFloat("colorSampleRadiusMax", etatEffets.colorSampleRadiusMax);
        effect.setFloat("colorThicknessSliderMin", etatEffets.colorThicknessSliderMin);
        effect.setFloat("colorThicknessSliderMax", etatEffets.colorThicknessSliderMax);
        effect.setFloat("colorMaskPower", etatEffets.colorMaskPower);
        effect.setFloat3("contourColor", etatEffets.contourColor.r, etatEffets.contourColor.g, etatEffets.contourColor.b);
        effect.setFloat("time", etatEffets.time);
        effect.setFloat("blinkInterval", etatEffets.blinkInterval);
        effect.setFloat("blinkMinFactor", etatEffets.blinkMinFactor);
        effect.setFloat("luminanceDelta", etatEffets.luminanceDelta);
        effect.setFloat("sensLuminance", etatEffets.sensLuminance);
    }

    brancherEvenementsCanvas() {
        if (!this.canvas) return;

        this.canvas.addEventListener("pointerenter", this._onPointerEnter, { passive: true });
        this.canvas.addEventListener("pointermove", this._onPointerMove, { passive: true });
        this.canvas.addEventListener("pointerleave", this._onPointerLeave, { passive: true });
    }

    creerBoutonLoupe() {
        if (!this.advancedTexture || !globalThis.BABYLON?.GUI) return null;

        const boutonExistant = this.advancedTexture.getControlByName?.("LoupeBtn") ?? null;
        const bouton = boutonExistant ?? BABYLON.GUI.Button.CreateSimpleButton("LoupeBtn", "🔍");

        bouton.name = "LoupeBtn";
        bouton.isPointerBlocker = true;

        // Si le bouton existe déjà dans guiTexture.json, on conserve sa taille,
        // sa position, son alignement et son radius. On ajoute seulement l'icône.
        if (!boutonExistant) {
            bouton.width = "64px";
            bouton.height = "64px";
            bouton.cornerRadius = 32;
            bouton.thickness = 2;
            bouton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            bouton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
            bouton.top = "-80px";
            bouton.left = "-18px";
            bouton.zIndex = 10000;
        }

        bouton.metadata = {
            ...(bouton.metadata ?? {}),
            estBoutonLoupe3D: true,
            texteOriginal: "🔍",
            nePasModifierTailleTexte: true,
            nePasAccessibilite: true
        };

        const texte = bouton.textBlock ?? this.trouverPremierTextBlock(bouton);
        if (texte) {
            texte.name = texte.name || "LoupeBtnTxt";
            texte.metadata = {
                ...(texte.metadata ?? {}),
                texteDynamique: true,
                texteOriginal: "🔍",
                nePasAutoFit: true,
                nePasModifierTailleTexte: true,
                nePasAccessibilite: true,
                iconeLoupe: true
            };
            texte.text = "🔍";
            texte.fontWeight = "700";
            texte.fontSize = "62%";
            texte.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            texte.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        }

        bouton.onPointerClickObservable?.clear?.();
        bouton.onPointerClickObservable?.add?.(() => {
            this.basculer();
        });

        bouton.onPointerUpObservable?.clear?.();

        if (!boutonExistant) {
            this.advancedTexture.addControl(bouton);
        }

        this.bouton = bouton;
        this.texteBouton = texte;

        if (this.etatApplication?.gui?.controles) {
            this.etatApplication.gui.controles.LoupeBtn = bouton;
            if (texte) this.etatApplication.gui.controles.LoupeBtnTxt = texte;
        }

        this.appliquerStyleBouton();
        this.advancedTexture.markAsDirty?.();

        return bouton;
    }

    activer() {
        if (this.actif) return true;

        this.actif = true;
        this.positionPointeur = this.positionPointeur ?? this.positionCentreCanvas();
        this.pointeurDansCanvas = true;
        this.cibleLoupeLisse = null;
        this.cibleLoupeFrame = null;
        this.dernierFrameCameraLoupe = null;
        this.dernierMouvementPointeurMs = performance.now?.() ?? Date.now();
        this.dernierRenduLoupeMs = 0;
        this.dernierePositionRendueLoupe = null;
        this.renduLoupeSale = true;

        this.creerCameraLoupeSiNecessaire();
        this.creerTextureLoupeSiNecessaire();
        this.creerPostProcess();
        this.desactiverNavigationCamera();
        this.brancherBlocageNavigation();
        this.demarrerSurveillancePostProcess();

        if (this.canvas) {
            this.cursorAvantLoupe = this.canvas.style.cursor || "";
            this.canvas.style.cursor = "zoom-in";
        }

        window.addEventListener("keydown", this._onKeyDown, { passive: true });
        this.appliquerStyleBouton();

        return true;
    }

    desactiver() {
        if (!this.actif) return false;

        this.actif = false;
        this.pointeurDansCanvas = false;
        this.cibleLoupeLisse = null;
        this.cibleLoupeFrame = null;
        this.dernierFrameCameraLoupe = null;

        this.supprimerPostProcess();
        this.supprimerRenduCameraLoupe();
        this.retablirNavigationCamera();
        this.debrancherBlocageNavigation();
        this.arreterSurveillancePostProcess();

        if (this.canvas) {
            this.canvas.style.cursor = this.cursorAvantLoupe || "";
        }

        window.removeEventListener("keydown", this._onKeyDown);
        this.appliquerStyleBouton();

        return false;
    }

    basculer() {
        return this.actif ? this.desactiver() : this.activer();
    }

    surEntreePointeur(evenement) {
        this.pointeurDansCanvas = true;
        this.mettreAJourPositionDepuisEvenement(evenement);
    }

    surDeplacementPointeur(evenement) {
        this.pointeurDansCanvas = true;
        this.mettreAJourPositionDepuisEvenement(evenement);
    }

    surSortiePointeur() {
        this.pointeurDansCanvas = false;
    }

    mettreAJourPositionDepuisEvenement(evenement) {
        const nouvellePosition = {
            clientX: evenement.clientX,
            clientY: evenement.clientY
        };

        const distance = this.distancePositionsPointeur(this.positionPointeur, nouvellePosition);
        const maintenant = performance.now?.() ?? Date.now();

        if (!this.positionPointeur || distance > this.seuilMouvementRenduPx) {
            this.dernierMouvementPointeurMs = maintenant;
        }

        this.positionPointeur = nouvellePosition;
        this.renduLoupeSale = true;
    }

    surToucheClavier(evenement) {
        if (evenement.key === "Escape" && this.actif) {
            this.desactiver();
        }
    }

    bloquerEvenementNavigation(evenement) {
        if (!this.actif) return;

        evenement.preventDefault?.();
        evenement.stopPropagation?.();
    }

    brancherBlocageNavigation() {
        if (!this.canvas) return;

        this.canvas.addEventListener("wheel", this._onWheel, { passive: false, capture: true });
    }

    debrancherBlocageNavigation() {
        if (!this.canvas) return;

        this.canvas.removeEventListener("wheel", this._onWheel, { capture: true });
    }

    desactiverNavigationCamera() {
        if (!this.camera) return;

        try {
            this.camera.detachControl(this.canvas);
        } catch (_) {
            try {
                this.camera.detachControl();
            } catch (_) {
                // rien à faire
            }
        }
    }

    retablirNavigationCamera() {
        if (!this.camera || !this.canvas) return;

        try {
            this.camera.attachControl(this.canvas, true);
        } catch (_) {
            // on évite de casser l'application si Babylon refuse le ré-attachement
        }

        this.serviceCameraBabylon?.desactiverDeplacementClicDroit?.(this.camera, this.canvas);
    }

    demarrerSurveillancePostProcess() {
        if (!this.scene) return;
        if (this.observateurAvantRenduScene) return;

        this.observateurAvantRenduScene = this.scene.onBeforeRenderObservable.add(() => {
            if (!this.actif) return;

            // La caméra et les render targets suivent le pointeur à chaque frame.
            // Les textures sont rendues automatiquement par Babylon, avec une
            // renderList réduite au modèle pour rester plus léger.
            this.mettreAJourCameraLoupe();
            this.mettreAJourRenderListLoupe();
            this.synchroniserRenderListDepthLoupe();
            this.synchroniserPostTraitementsLoupe();
            this.actualiserMetadataRenduLoupe();
            this.assurerPostProcessEnDernier();
        });
    }

    arreterSurveillancePostProcess() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        if (this.observateurAvantRenduScene && this.scene?.onBeforeRenderObservable?.remove) {
            this.scene.onBeforeRenderObservable.remove(this.observateurAvantRenduScene);
        }
        this.observateurAvantRenduScene = null;
    }

    assurerPostProcessEnDernier() {
        if (!this.camera || !this.postProcess) return;

        const postProcesses = this.camera._postProcesses;
        if (!Array.isArray(postProcesses)) return;

        const indexLoupe = postProcesses.indexOf(this.postProcess);

        if (indexLoupe < 0) {
            const maintenant = performance.now?.() ?? Date.now();
            if (maintenant - this.derniereRecreation >= 300) {
                this.creerPostProcess();
            }
            return;
        }

        let dernierIndexValide = -1;
        for (let i = postProcesses.length - 1; i >= 0; i--) {
            if (postProcesses[i]) {
                dernierIndexValide = i;
                break;
            }
        }

        if (dernierIndexValide < 0 || postProcesses[dernierIndexValide] === this.postProcess) {
            return;
        }

        postProcesses.splice(indexLoupe, 1);
        postProcesses.push(this.postProcess);
    }

    ajouterRenderTargetLoupeAuRenduAutomatique(texture, { premier = false } = {}) {
        if (!texture || !Array.isArray(this.scene?.customRenderTargets)) return;

        const liste = this.scene.customRenderTargets;
        const index = liste.indexOf(texture);

        if (index >= 0) {
            liste.splice(index, 1);
        }

        if (premier) {
            liste.unshift(texture);
        } else {
            liste.push(texture);
        }
    }

    retirerRenderTargetLoupeDuRenduAutomatique(texture) {
        if (!texture || !Array.isArray(this.scene?.customRenderTargets)) return;

        const index = this.scene.customRenderTargets.indexOf(texture);
        if (index >= 0) {
            this.scene.customRenderTargets.splice(index, 1);
        }
    }

    rendreLoupeSiStable({ forcer = false } = {}) {
        // Conservé pour compatibilité avec les anciens appels, mais le rendu de
        // la loupe est maintenant continu. Cela évite le retard perceptible des
        // contours quand le pointeur bouge.
        if (!this.actif || !this.textureLoupe || !this.cameraLoupe) {
            return false;
        }

        this.mettreAJourCameraLoupe();
        this.mettreAJourRenderListLoupe();
        this.synchroniserRenderListDepthLoupe();
        this.actualiserMetadataRenduLoupe();
        this.renduLoupeSale = false;
        return true;
    }

    distancePositionsPointeur(a, b) {
        if (!a || !b) return Number.POSITIVE_INFINITY;

        const dx = Number(a.clientX ?? 0) - Number(b.clientX ?? 0);
        const dy = Number(a.clientY ?? 0) - Number(b.clientY ?? 0);

        return Math.sqrt(dx * dx + dy * dy);
    }

    preparerRenduTextureLoupe() {
        this.mettreAJourCameraLoupe();
        this.creerTextureNormalesLoupeSiNecessaire();
        this.creerDepthRendererLoupeSiNecessaire();
        this.synchroniserRenderListDepthLoupe();
        this.actualiserMetadataRenduLoupe();

        if (!this.dupliquerPostTraitements || !this.actif || !this.cameraLoupe) {
            return;
        }

        // La RenderTargetTexture est rendue avant la caméra principale.
        // On vérifie juste avant son rendu que la caméra secondaire possède
        // encore sa propre chaîne de contours / highlight. Si Babylon ou un
        // contrôleur a recréé la chaîne principale entre-temps, les références
        // conservées peuvent devenir obsolètes et l'effet réapparaît en taille
        // écran dans la loupe.
        if (!this.postTraitementsLoupeEnEtat()) {
            this.synchroniserPostTraitementsLoupe(true);
        }
    }

    mettreAJourCameraLoupe() {
        if (!this.cameraLoupe || !this.camera || !this.scene) return;

        const frame = this.obtenirIdentifiantFrameLoupe();

        if (this.dernierFrameCameraLoupe === frame && this.cibleLoupeFrame?.clone) {
            this.appliquerCameraLoupeDepuisCible(this.cibleLoupeFrame);
            return;
        }

        const cibleBrute = this.calculerCibleLoupe();
        const cible = this.lisserCibleLoupe(cibleBrute).clone();

        this.dernierFrameCameraLoupe = frame;
        this.cibleLoupeFrame = cible;
        this.appliquerCameraLoupeDepuisCible(cible);
    }

    appliquerCameraLoupeDepuisCible(cible) {
        if (!this.cameraLoupe || !this.camera || !cible) return;

        if (this.camera.position?.copyFrom) {
            this.cameraLoupe.position.copyFrom(this.camera.position);
        }

        if (this.camera.upVector?.copyFrom && this.cameraLoupe.upVector?.copyFrom) {
            this.cameraLoupe.upVector.copyFrom(this.camera.upVector);
        }

        this.cameraLoupe.minZ = this.lireNombre(this.camera.minZ, null, 0.05);
        this.cameraLoupe.maxZ = this.lireNombre(this.camera.maxZ, null, 1000);
        this.cameraLoupe.fovMode = this.camera.fovMode ?? this.cameraLoupe.fovMode;
        this.cameraLoupe.fov = this.borner(
            this.lireNombre(this.camera.fov, null, this.cameraLoupe.fov) / Math.max(this.zoom, 1.01),
            0.05,
            Math.PI / 2
        );
        this.cameraLoupe.layerMask = this.camera.layerMask ?? this.cameraLoupe.layerMask;
        this.cameraLoupe.setTarget(cible);
    }

    obtenirIdentifiantFrameLoupe() {
        const frame = Number(this.scene?.getFrameId?.());
        if (Number.isFinite(frame)) return frame;

        const temps = typeof performance !== "undefined" && typeof performance.now === "function"
            ? performance.now()
            : Date.now();
        return Math.floor(temps / 16.67);
    }

    calculerCibleLoupe() {
        const position = this.positionPointeur ?? this.positionCentreCanvas();
        const rect = this.canvas?.getBoundingClientRect?.();

        if (rect && rect.width > 0 && rect.height > 0 && this.scene?.pick) {
            const x = this.borner(position.clientX - rect.left, 0, rect.width);
            const y = this.borner(position.clientY - rect.top, 0, rect.height);

            try {
                const pick = this.scene.pick(
                    x,
                    y,
                    (mesh) => this.estMeshValidePourLoupe(mesh),
                    false,
                    this.camera
                );

                if (pick?.hit && pick.pickedPoint) {
                    return pick.pickedPoint.clone();
                }
            } catch (_) {
                // En cas d'échec du picking, on utilise la cible caméra.
            }
        }

        if (this.cibleLoupeLisse) {
            return this.cibleLoupeLisse.clone();
        }

        if (this.camera?.target?.clone) {
            return this.camera.target.clone();
        }

        const rayon = this.camera?.getForwardRay?.();
        if (rayon?.origin && rayon?.direction) {
            return rayon.origin.add(rayon.direction.scale(5));
        }

        return BABYLON.Vector3.Zero();
    }

    lisserCibleLoupe(cible) {
        if (!cible?.clone) return BABYLON.Vector3.Zero();

        if (!this.cibleLoupeLisse) {
            this.cibleLoupeLisse = cible.clone();
            return this.cibleLoupeLisse;
        }

        const alpha = this.borner(this.lissageCible, 0, 1);
        this.cibleLoupeLisse = BABYLON.Vector3.Lerp(this.cibleLoupeLisse, cible, alpha);
        return this.cibleLoupeLisse;
    }

    estMeshValidePourLoupe(mesh) {
        if (!mesh) return false;
        if (mesh.metadata?.estLoupe3D || mesh.name?.startsWith?.("SaotraLoupe")) return false;
        if (mesh.isPickable === false) return false;
        if (typeof mesh.isEnabled === "function" && !mesh.isEnabled()) return false;
        if (mesh.isVisible === false) return false;

        const masqueCamera = this.camera?.layerMask ?? 0xFFFFFFFF;
        const masqueMesh = mesh.layerMask ?? 0xFFFFFFFF;

        return (masqueCamera & masqueMesh) !== 0;
    }

    mettreAJourRenderListLoupe(force = false) {
        if (!this.scene || (!this.textureLoupe && !this.textureNormalesLoupe)) return;

        const maintenant = performance.now?.() ?? Date.now();
        if (!force && maintenant - this.dernierControleRenderList < 500) return;

        this.dernierControleRenderList = maintenant;
        const masqueCamera = this.cameraLoupe?.layerMask ?? this.camera?.layerMask ?? 0xFFFFFFFF;

        const liste = this.scene.meshes.filter((mesh) => {
            if (!mesh) return false;
            if (mesh.metadata?.estLoupe3D || mesh.name?.startsWith?.("SaotraLoupe")) return false;
            if (typeof mesh.isEnabled === "function" && !mesh.isEnabled()) return false;
            if (mesh.isVisible === false) return false;
            return ((mesh.layerMask ?? 0xFFFFFFFF) & masqueCamera) !== 0;
        });

        if (this.textureLoupe) {
            this.textureLoupe.renderList = liste;
        }

        if (this.textureNormalesLoupe) {
            this.textureNormalesLoupe.renderList = liste;
            if (this.normalTextureLoupeSetMaterialSupporte) {
                this.appliquerMateriauNormalesLoupeSurRenderTarget();
            }
        }

        this.actualiserMetadataRenduLoupe();
    }

    synchroniserRenderListDepthLoupe() {
        if (!this.depthMapLoupe || !this.textureLoupe) return;

        try {
            if (Array.isArray(this.textureLoupe.renderList)) {
                this.depthMapLoupe.renderList = this.textureLoupe.renderList;
            }
            this.depthMapLoupe.activeCamera = this.cameraLoupe;
            this.depthMapLoupe.refreshRate = 1;
            this.actualiserMetadataRenduLoupe();
        } catch (_) {
            // Selon la version de Babylon, certaines propriétés de la depth map
            // peuvent être en lecture seule. Dans ce cas, on laisse Babylon gérer.
        }
    }

    synchroniserPostTraitementsLoupe(force = false) {
        if (!this.dupliquerPostTraitements || !this.actif || !this.cameraLoupe || !this.scene) return;

        const maintenant = performance.now?.() ?? Date.now();
        if (!force && maintenant - this.dernierControlePostTraitements < 180) return;

        this.dernierControlePostTraitements = maintenant;

        const etat = this.etatApplication ?? {};
        const contours = etat.contours ?? {};
        const apparence = etat.apparence ?? {};

        this.scene.metadata = {
            ...(this.scene.metadata ?? {}),
            saotraEtatApplication: etat
        };

        const etatDesire = this.decrirePostTraitementsLoupeDesires({ apparence, contours });
        const signature = this.creerSignaturePostTraitementsLoupe(etatDesire);
        const refs = this.creerRefsPostTraitementsLoupe({ apparence, contours });

        const memesRefs = this.refsPostTraitementsLoupe
            && this.refsPostTraitementsLoupe.apparence === refs.apparence
            && this.refsPostTraitementsLoupe.contours === refs.contours
            && this.refsPostTraitementsLoupe.miseLumiere === refs.miseLumiere
            && this.refsPostTraitementsLoupe.postApparence === refs.postApparence
            && this.refsPostTraitementsLoupe.postNettete === refs.postNettete
            && this.refsPostTraitementsLoupe.postContoursPN === refs.postContoursPN
            && this.refsPostTraitementsLoupe.postContoursCouleur === refs.postContoursCouleur
            && this.refsPostTraitementsLoupe.postMiseLumiereNormales === refs.postMiseLumiereNormales
            && this.refsPostTraitementsLoupe.postMiseLumiereCouleurs === refs.postMiseLumiereCouleurs;

        const chaineValide = this.postTraitementsLoupeEnEtat(etatDesire);

        if (!force && signature === this.signaturePostTraitementsLoupe && memesRefs && chaineValide) {
            this.assurerTextureLoupeUtilisePostProcess();
            return;
        }

        this.supprimerPostTraitementsLoupe();
        this.signaturePostTraitementsLoupe = signature;
        this.refsPostTraitementsLoupe = refs;

        const nouveaux = {};

        try {
            this.assurerTextureLoupeUtilisePostProcess();

            if (etatDesire.apparence) {
                nouveaux.apparence = new PostTraitApparence().creer(this.cameraLoupe, apparence.parametres);
            }

            if (etatDesire.nettete) {
                nouveaux.nettete = new PostTraitNettete().creer(this.cameraLoupe, apparence.parametres);
            }

            if (etatDesire.contoursProfondeurNormales) {
                nouveaux.contoursProfondeurNormales = new PostTraitContProfNorm().creer(
                    this.scene,
                    this.cameraLoupe,
                    contours.parametres
                );
            }

            if (etatDesire.contoursCouleur) {
                nouveaux.contoursCouleur = new PostTraitContoursCouleur().creer(
                    this.scene,
                    this.cameraLoupe,
                    contours.parametres
                );
            }

            if (etatDesire.miseLumiereNormales) {
                nouveaux.miseLumiereNormales = new PostTraitMiseLumiereNormales().creer(
                    this.scene,
                    this.cameraLoupe,
                    contours.parametresMiseLumiere
                );
            }

            if (etatDesire.miseLumiereCouleurs) {
                nouveaux.miseLumiereCouleurs = new PostTraitMiseLumiereCouleurs().creer(
                    this.scene,
                    this.cameraLoupe,
                    contours.parametresMiseLumiere
                );
            }
        } catch (erreur) {
            console.warn("[Loupe 3D] Certains post-traitements n'ont pas pu être dupliqués sur la caméra loupe.", erreur);
        }

        this.postTraitementsLoupe = nouveaux;
        this.assurerPostTraitementsLoupeDansCamera();
    }

    decrirePostTraitementsLoupeDesires({ apparence, contours }) {
        return {
            apparence: Boolean(apparence?.postTraitementApparence && apparence?.parametres),
            nettete: Boolean(apparence?.postTraitementNettete && apparence?.parametres),
            contoursProfondeurNormales: Boolean(contours?.postTraitementContoursProfondeurNormales && contours?.parametres),
            contoursCouleur: Boolean(contours?.postTraitementContoursCouleur && contours?.parametres),
            miseLumiereNormales: Boolean(contours?.postTraitMiseLumiereNormales?.postProcess && contours?.parametresMiseLumiere),
            miseLumiereCouleurs: Boolean(contours?.postTraitMiseLumiereCouleurs && contours?.parametresMiseLumiere)
        };
    }

    creerSignaturePostTraitementsLoupe(etatDesire) {
        return [
            etatDesire.apparence,
            etatDesire.nettete,
            etatDesire.contoursProfondeurNormales,
            etatDesire.contoursCouleur,
            etatDesire.miseLumiereNormales,
            etatDesire.miseLumiereCouleurs,
            this.zoom,
            this.tailleTextureLoupe
        ].map((valeur) => String(valeur)).join("|");
    }

    creerRefsPostTraitementsLoupe({ apparence, contours }) {
        return {
            apparence: apparence?.parametres ?? null,
            contours: contours?.parametres ?? null,
            miseLumiere: contours?.parametresMiseLumiere ?? null,
            postApparence: this.extrairePostProcess(apparence?.postTraitementApparence) ?? null,
            postNettete: this.extrairePostProcess(apparence?.postTraitementNettete) ?? null,
            postContoursPN: this.extrairePostProcess(contours?.postTraitementContoursProfondeurNormales) ?? null,
            postContoursCouleur: this.extrairePostProcess(contours?.postTraitementContoursCouleur) ?? null,
            postMiseLumiereNormales: this.extrairePostProcess(contours?.postTraitMiseLumiereNormales) ?? null,
            postMiseLumiereCouleurs: this.extrairePostProcess(contours?.postTraitMiseLumiereCouleurs) ?? null
        };
    }

    postTraitementsLoupeEnEtat(etatDesire = null) {
        if (!this.cameraLoupe || !this.textureLoupe) return false;

        this.assurerTextureLoupeUtilisePostProcess();

        const etat = etatDesire ?? this.decrirePostTraitementsLoupeDesires({
            apparence: this.etatApplication?.apparence ?? {},
            contours: this.etatApplication?.contours ?? {}
        });

        const attendus = [
            [etat.apparence, "apparence"],
            [etat.nettete, "nettete"],
            [etat.contoursProfondeurNormales, "contoursProfondeurNormales"],
            [etat.contoursCouleur, "contoursCouleur"],
            [etat.miseLumiereNormales, "miseLumiereNormales"],
            [etat.miseLumiereCouleurs, "miseLumiereCouleurs"]
        ];

        const auMoinsUnPostTraitement = attendus.some(([actif]) => actif);
        if (!auMoinsUnPostTraitement) return true;

        if (!this.postTraitementsLoupe) return false;

        const chaineCamera = Array.isArray(this.cameraLoupe._postProcesses)
            ? this.cameraLoupe._postProcesses
            : [];

        for (const [actif, nom] of attendus) {
            if (!actif) continue;

            const postProcess = this.extrairePostProcess(this.postTraitementsLoupe[nom]);
            if (!this.estPostProcessUtilisable(postProcess)) {
                return false;
            }

            if (!chaineCamera.includes(postProcess)) {
                return false;
            }
        }

        return true;
    }

    assurerTextureLoupeUtilisePostProcess() {
        if (!this.textureLoupe) return;

        if (this.textureLoupe.useCameraPostProcesses !== true) {
            this.textureLoupe.useCameraPostProcesses = true;
        }

        if (this.textureLoupe.activeCamera !== this.cameraLoupe) {
            this.textureLoupe.activeCamera = this.cameraLoupe;
        }
    }

    assurerPostTraitementsLoupeDansCamera() {
        if (!this.cameraLoupe || !this.postTraitementsLoupe) return;

        const chaineCamera = Array.isArray(this.cameraLoupe._postProcesses)
            ? this.cameraLoupe._postProcesses
            : null;

        if (!chaineCamera) return;

        for (const valeur of Object.values(this.postTraitementsLoupe)) {
            const postProcess = this.extrairePostProcess(valeur);
            if (this.estPostProcessUtilisable(postProcess) && !chaineCamera.includes(postProcess)) {
                chaineCamera.push(postProcess);
            }
        }
    }

    extrairePostProcess(valeur) {
        if (!valeur) return null;
        if (valeur.postProcess) return valeur.postProcess;
        return valeur;
    }

    estPostProcessUtilisable(postProcess) {
        if (!postProcess) return false;
        if (postProcess._isDisposed === true) return false;
        if (postProcess.isDisposed === true) return false;
        if (typeof postProcess.isDisposed === "function" && postProcess.isDisposed()) return false;
        return true;
    }

    supprimerPostTraitementsLoupe() {
        const objets = this.postTraitementsLoupe ?? {};

        for (const valeur of Object.values(objets)) {
            if (!valeur) continue;

            try {
                if (valeur.postProcess?.dispose) valeur.postProcess.dispose();
                else if (valeur.dispose) valeur.dispose();
            } catch (_) {
                // rien à faire
            }

            try {
                if (valeur.depthRenderer?.dispose) valeur.depthRenderer.dispose();
            } catch (_) {
                // rien à faire
            }
        }

        this.postTraitementsLoupe = null;
        this.signaturePostTraitementsLoupe = null;
        this.refsPostTraitementsLoupe = null;
    }

    supprimerPostProcess() {
        if (this.postProcess?.dispose) {
            try {
                this.postProcess.dispose();
            } catch (_) {
                // rien à faire
            }
        }

        this.postProcess = null;
    }

    supprimerRenduCameraLoupe() {
        this.supprimerPostTraitementsLoupe();

        if (this.textureLoupe) {
            try {
                this.textureLoupe.onBeforeRenderObservable?.removeCallback?.(this._avantRenduTextureLoupe);
            } catch (_) {
                // rien à faire
            }

            const liste = this.scene?.customRenderTargets;
            const index = Array.isArray(liste) ? liste.indexOf(this.textureLoupe) : -1;
            if (index >= 0) liste.splice(index, 1);

            try {
                this.textureLoupe.dispose?.();
            } catch (_) {
                // rien à faire
            }
        }

        this.textureLoupe = null;

        if (this.textureNormalesLoupe) {
            try {
                this.textureNormalesLoupe.onBeforeRenderObservable?.removeCallback?.(this._avantRenduTextureNormalesLoupe);
                this.textureNormalesLoupe.onAfterRenderObservable?.removeCallback?.(this._apresRenduTextureNormalesLoupe);
            } catch (_) {
                // rien à faire
            }

            const listeNormales = this.scene?.customRenderTargets;
            const indexNormales = Array.isArray(listeNormales) ? listeNormales.indexOf(this.textureNormalesLoupe) : -1;
            if (indexNormales >= 0) listeNormales.splice(indexNormales, 1);

            try {
                this.textureNormalesLoupe.dispose?.();
            } catch (_) {
                // rien à faire
            }
        }

        this.textureNormalesLoupe = null;
        this.materiauxSauvegardesNormalesLoupe = null;
        this.normalTextureLoupeSetMaterialSupporte = false;

        if (this.materiauNormalesLoupe) {
            try {
                this.materiauNormalesLoupe.dispose?.();
            } catch (_) {
                // rien à faire
            }
        }
        this.materiauNormalesLoupe = null;

        if (this.depthRendererLoupe) {
            try {
                this.depthRendererLoupe.dispose?.();
            } catch (_) {
                // rien à faire
            }
        }

        this.depthRendererLoupe = null;
        this.depthMapLoupe = null;

        if (this.cameraLoupe) {
            try {
                this.cameraLoupe.dispose?.();
            } catch (_) {
                // rien à faire
            }
        }

        this.cameraLoupe = null;
    }

    calculerCentreUV() {
        const rect = this.canvas?.getBoundingClientRect?.();
        const position = this.positionPointeur ?? this.positionCentreCanvas();

        if (!rect || rect.width <= 0 || rect.height <= 0) {
            return { x: 0.5, y: 0.5 };
        }

        const x = this.borner((position.clientX - rect.left) / rect.width, 0, 1);
        const yCss = this.borner((position.clientY - rect.top) / rect.height, 0, 1);
        const y = this.inverserY ? 1 - yCss : yCss;

        return { x, y };
    }

    calculerRayonPixels(taille = null) {
        const rect = this.canvas?.getBoundingClientRect?.();
        const t = taille ?? this.obtenirTailleRendu();

        if (!rect || rect.width <= 0 || rect.height <= 0) {
            return this.diametre / 2;
        }

        const echelleX = t.largeur / rect.width;
        const echelleY = t.hauteur / rect.height;
        const echelle = Math.max(0.1, Math.min(echelleX, echelleY));

        return (this.diametre / 2) * echelle;
    }

    calculerBordurePixels(taille = null) {
        const rect = this.canvas?.getBoundingClientRect?.();
        const t = taille ?? this.obtenirTailleRendu();

        if (!rect || rect.width <= 0 || rect.height <= 0) {
            return this.bordure;
        }

        const echelleX = t.largeur / rect.width;
        const echelleY = t.hauteur / rect.height;
        const echelle = Math.max(0.1, Math.min(echelleX, echelleY));

        return this.bordure * echelle;
    }

    calculerAdoucissementBordurePixels(taille = null) {
        const rect = this.canvas?.getBoundingClientRect?.();
        const t = taille ?? this.obtenirTailleRendu();

        if (!rect || rect.width <= 0 || rect.height <= 0) {
            return this.adoucissementBordure;
        }

        const echelleX = t.largeur / rect.width;
        const echelleY = t.hauteur / rect.height;
        const echelle = Math.max(0.1, Math.min(echelleX, echelleY));

        return this.adoucissementBordure * echelle;
    }

    obtenirTailleRendu() {
        const moteur = this.scene?.getEngine?.();
        const largeur = moteur?.getRenderWidth?.() ?? this.canvas?.width ?? 1;
        const hauteur = moteur?.getRenderHeight?.() ?? this.canvas?.height ?? 1;

        return {
            largeur: Math.max(1, largeur),
            hauteur: Math.max(1, hauteur)
        };
    }

    obtenirTailleTextureLoupe() {
        const largeur = this.textureLoupe?.getSize?.().width ?? this.tailleTextureLoupe;
        const hauteur = this.textureLoupe?.getSize?.().height ?? this.tailleTextureLoupe;

        return {
            largeur: Math.max(1, largeur),
            hauteur: Math.max(1, hauteur)
        };
    }

    obtenirTailleDepthLoupe() {
        const taille = this.depthMapLoupe?.getSize?.() ?? this.textureLoupe?.getSize?.() ?? null;
        const largeur = taille?.width ?? this.tailleTextureLoupe;
        const hauteur = taille?.height ?? this.tailleTextureLoupe;

        return {
            largeur: Math.max(1, largeur),
            hauteur: Math.max(1, hauteur)
        };
    }

    positionCentreCanvas() {
        const rect = this.canvas?.getBoundingClientRect?.();
        if (!rect) {
            return {
                clientX: window.innerWidth / 2,
                clientY: window.innerHeight / 2
            };
        }

        return {
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2
        };
    }

    obtenirConfigurationCouleurPerceptuelleLoupe() {
        const source = constantesContours.contourCouleurPerceptuel ?? {};
        const metrique = source.metrique ?? {};
        const seuils = source.seuils ?? {};
        const chainage = source.chainage ?? {};
        const bordTresFort = chainage.bordTresFort ?? {};
        const epaisseur = source.epaisseur ?? {};
        const rendu = source.rendu ?? {};
        const bruit = source.bruit ?? {};
        const continuite = source.continuite ?? {};
        const loupe = source.loupe ?? {};

        const multiplicateurSeuils = this.borner(
            this.lireNombre(loupe.multiplicateurSeuils, null, 1.0),
            0.25,
            4.0
        );
        const multiplicateurRayon = this.borner(
            this.lireNombre(loupe.multiplicateurRayonChaine, null, 1.0),
            0.5,
            2.0
        );
        const seuilFaible = Math.max(
            0.000001,
            this.lireNombre(seuils.faible, null, 0.045) * multiplicateurSeuils
        );
        const seuilFort = Math.max(
            seuilFaible * 1.01,
            this.lireNombre(seuils.fort, null, 0.085) * multiplicateurSeuils
        );
        const rayonMin = this.lireNombre(chainage.rayonMin, null, 1);
        const rayonMax = Math.max(rayonMin, this.lireNombre(chainage.rayonMax, null, 6));
        const rayonRecherche = this.borner(
            this.lireNombre(chainage.rayonRecherche, null, 3) * multiplicateurRayon,
            rayonMin,
            rayonMax
        );
        const nombreEchantillons = 1 + 2 * Math.round(rayonRecherche);
        const echantillonsParCote = Math.round(rayonRecherche);
        const sliderGlobal = constantesContours.epaisseurSlider ?? {};
        const sliderMin = this.lireNombre(
            epaisseur.sliderMin,
            null,
            this.lireNombre(sliderGlobal.min, null, 1)
        );
        const sliderMax = Math.max(
            sliderMin + 0.001,
            this.lireNombre(
                epaisseur.sliderMax,
                null,
                this.lireNombre(sliderGlobal.max, null, 2)
            )
        );
        const rayonEchantillonnageMin = this.borner(
            this.lireNombre(epaisseur.rayonTaille1 ?? epaisseur.rayonEchantillonnageMin, null, 1.25),
            0.5,
            3.0
        );

        return {
            colorLowThreshold: seuilFaible,
            colorHighThreshold: seuilFort,
            colorThresholdSmoothLow: this.borner(
                this.lireNombre(seuils.lissageBas, null, 0.82),
                0.05,
                0.99
            ),
            colorThresholdSmoothHigh: Math.max(
                1.001,
                this.lireNombre(seuils.lissageHaut, null, 1.18)
            ),
            colorLightnessWeight: Math.max(
                0,
                this.lireNombre(metrique.poidsLuminance, null, 0.35)
            ),
            colorChromaWeight: Math.max(
                0,
                this.lireNombre(metrique.poidsChromatique, null, 1.10)
            ),
            colorChainRadius: rayonRecherche,
            colorMinSupport: this.borner(
                this.lireNombre(chainage.supportsMin, null, 6),
                1,
                nombreEchantillons
            ),
            colorMinSupportPerSide: this.borner(
                this.lireNombre(chainage.supportsMinParCote, null, 2),
                0,
                echantillonsParCote
            ),
            colorMaxGaps: this.borner(
                this.lireNombre(chainage.trousMax, null, 1),
                0,
                nombreEchantillons - 1
            ),
            colorVeryStrongFactor: Math.max(
                1.01,
                this.lireNombre(bordTresFort.multiplicateurSeuil, null, 1.55)
            ),
            colorVeryStrongSupportReduction: this.borner(
                this.lireNombre(bordTresFort.reductionSupports, null, 1.0),
                0,
                nombreEchantillons - 1
            ),
            colorVeryStrongSideReduction: this.borner(
                this.lireNombre(bordTresFort.reductionSupportsParCote, null, 0.5),
                0,
                echantillonsParCote
            ),
            colorNoiseValidationEnabled: bruit.validationMultiEchelle === false ? 0 : 1,
            colorNoiseValidationRadius: this.borner(
                this.lireNombre(bruit.rayonValidation, null, 2.35),
                1.05,
                4.0
            ),
            colorNoiseValidationMinRatio: this.borner(
                this.lireNombre(bruit.forceValidationMin, null, 0.52),
                0.05,
                0.98
            ),
            colorContinuityEnabled: continuite.fermeturePetitsTrous === false ? 0 : 1,
            colorContinuityBridgeThreshold: this.borner(
                this.lireNombre(continuite.forceMinPont, null, 0.030),
                0.001,
                seuilFaible
            ),
            colorContinuityMinSupport: this.borner(
                this.lireNombre(continuite.supportsMinPont, null, 4),
                1,
                nombreEchantillons
            ),
            colorContinuityMinSupportPerSide: this.borner(
                this.lireNombre(continuite.supportsMinParCotePont, null, 1),
                0,
                echantillonsParCote
            ),
            colorContinuityMaxGaps: this.borner(
                this.lireNombre(continuite.trousMaxPont, null, 2),
                0,
                nombreEchantillons - 1
            ),
            colorSampleRadiusMin: rayonEchantillonnageMin,
            colorSampleRadiusMax: this.borner(
                this.lireNombre(epaisseur.rayonTaille2 ?? epaisseur.rayonEchantillonnageMax, null, 1.80),
                rayonEchantillonnageMin,
                4.0
            ),
            colorThicknessSliderMin: sliderMin,
            colorThicknessSliderMax: sliderMax,
            colorMaskPower: this.borner(
                this.lireNombre(rendu.puissanceMasque, null, 0.72),
                0.05,
                4.0
            )
        };
    }

    obtenirEtatEffetsLoupeDesactives() {
        const configCouleur = this.obtenirConfigurationCouleurPerceptuelleLoupe();

        return {
            useDepthContour: false,
            useReliefContour: false,
            useColorContour: false,
            useHighlight: false,
            contourWidth: 1,
            highlightWidth: 1,
            depthThreshold: 1,
            reliefThreshold: 1,
            ...configCouleur,
            colorLowThreshold: 10000,
            colorHighThreshold: 10000,
            contourColor: { r: 0, g: 0, b: 0 },
            time: this.lireTempsSecondes(),
            blinkInterval: 3,
            blinkMinFactor: 0.45,
            luminanceDelta: 0,
            sensLuminance: 1
        };
    }

    obtenirEtatEffetsLoupeLocale() {
        const contours = this.etatApplication?.contours ?? {};
        const parametresContours = contours.parametres ?? {};
        const parametresMiseLumiere = contours.parametresMiseLumiere ?? {};

        const contourActif = Boolean(parametresContours.actif);
        const useDepthContour = contourActif && this.estTypeContourActif(parametresContours, "silhouette");
        const useReliefContour = contourActif && this.estTypeContourActif(parametresContours, "relief");
        const useColorContour = contourActif && this.estTypeContourActif(parametresContours, "couleur");

        const couleurContour = this.couleurHexaVersRgb01(parametresContours.couleur ?? "#000000");
        const epaisseur = this.borner(Number(parametresContours.epaisseur), 1, 3);
        const highlightWidth = this.borner(Number(parametresMiseLumiere.largeur), 1, 10);
        const blinkInterval = this.borner(
            Number(parametresMiseLumiere.frequenceClignotement ?? parametresMiseLumiere.intervalleClignotement),
            1,
            4
        );
        const luminanceDelta = this.borner(Number(parametresMiseLumiere.luminanceDelta), 0.02, 0.20);
        const sensLuminance = Number(parametresMiseLumiere.sensLuminance) === -1 ? -1 : 1;
        const configCouleur = this.obtenirConfigurationCouleurPerceptuelleLoupe();

        return {
            useDepthContour,
            useReliefContour,
            useColorContour,
            useHighlight: Boolean(contours.miseLumiereNormalesActif || contours.miseLumiereCouleursActif),
            contourWidth: epaisseur,
            highlightWidth,
            // Seuils locaux adaptés à la texture de la loupe.
            // Profondeur : valeur plus haute que le post-process écran car le depth RTT est normalisé autrement selon les modèles.
            depthThreshold: 0.0009,
            reliefThreshold: 0.18,
            ...configCouleur,
            contourColor: couleurContour,
            time: this.lireTempsSecondes(),
            blinkInterval,
            blinkMinFactor: 0.45,
            luminanceDelta,
            sensLuminance
        };
    }

    estTypeContourActif(parametresContours, typeContour) {
        if (!parametresContours) return false;

        if (typeof parametresContours.estActif === "function") {
            return Boolean(parametresContours.estActif(typeContour));
        }

        if (Array.isArray(parametresContours.typesActifs)) {
            return parametresContours.typesActifs.includes(typeContour);
        }

        return parametresContours.typeActif === typeContour;
    }

    couleurHexaVersRgb01(couleur) {
        const texte = String(couleur ?? "#000000").trim();
        const hexa = texte.startsWith("#") ? texte.slice(1) : texte;
        const complet = hexa.length === 3
            ? hexa.split("").map((c) => c + c).join("")
            : hexa.padEnd(6, "0").slice(0, 6);

        const nombre = Number.parseInt(complet, 16);
        if (!Number.isFinite(nombre)) {
            return { r: 0, g: 0, b: 0 };
        }

        return {
            r: ((nombre >> 16) & 255) / 255,
            g: ((nombre >> 8) & 255) / 255,
            b: (nombre & 255) / 255
        };
    }

    lireTempsSecondes() {
        if (typeof performance !== "undefined" && typeof performance.now === "function") {
            return performance.now() / 1000;
        }

        return Date.now() / 1000;
    }

    appliquerStyleBouton() {
        if (!this.bouton) return;

        const themeActif = this.etatApplication?.interface?.parametres?.theme;
        const sombre = themeActif === "noir" || themeActif === "gris-fonce";

        this.bouton.metadata = {
            ...(this.bouton.metadata ?? {}),
            estOptionActive: this.actif,
            estLoupeActive: this.actif
        };

        this.bouton.background = this.actif
            ? (sombre ? "#FFFFFFFF" : "#111111FF")
            : (sombre ? "#000000CC" : "#FFFFFFFF");

        this.bouton.color = this.actif
            ? (sombre ? "#FFFFFFFF" : "#111111FF")
            : (sombre ? "#FFFFFFFF" : "#111111FF");

        this.bouton.alpha = 0.96;
        this.bouton.thickness = this.actif ? 3 : 2;

        const couleurTexte = this.actif
            ? (sombre ? "#111111FF" : "#FFFFFFFF")
            : (sombre ? "#FFFFFFFF" : "#111111FF");

        if (this.texteBouton) {
            this.texteBouton.metadata = {
                ...(this.texteBouton.metadata ?? {}),
                texteDynamique: true,
                texteOriginal: this.actif ? "✕" : "🔍",
                nePasAutoFit: true,
                nePasModifierTailleTexte: true,
                nePasAccessibilite: true,
                iconeLoupe: true
            };
            this.texteBouton.text = this.actif ? "✕" : "🔍";
            this.texteBouton.color = couleurTexte;
            this.texteBouton.fontSize = this.actif ? "58%" : "62%";
            this.texteBouton.fontWeight = "700";
            this.texteBouton._markAsDirty?.();
        }

        this.bouton._markAsDirty?.();
        this.advancedTexture?.markAsDirty?.();
    }

    reglerZoom(zoom) {
        const valeur = Number(zoom);
        if (!Number.isFinite(valeur)) return this.zoom;

        this.zoom = this.borner(valeur, this.zoomMin, this.zoomMax);
        return this.zoom;
    }

    reglerDiametre(diametre) {
        const valeur = Number(diametre);
        if (!Number.isFinite(valeur)) return this.diametre;

        this.diametre = Math.round(this.borner(valeur, this.diametreMin, this.diametreMax));
        return this.diametre;
    }

    reglerNettete(nettete) {
        const valeur = Number(nettete);
        if (!Number.isFinite(valeur)) return this.nettete;

        this.nettete = this.borner(valeur, 0, 2.5);
        return this.nettete;
    }

    reglerAntiFlou(antiFlou) {
        const valeur = Number(antiFlou);
        if (!Number.isFinite(valeur)) return this.antiFlou;

        this.antiFlou = this.borner(valeur, 0, 1);
        return this.antiFlou;
    }

    reglerFlou(flou) {
        const valeur = Number(flou);
        if (!Number.isFinite(valeur)) return this.flou;

        this.flou = this.borner(valeur, 0, 1);
        return this.flou;
    }

    reglerAdoucissementBordure(adoucissement) {
        const valeur = Number(adoucissement);
        if (!Number.isFinite(valeur)) return this.adoucissementBordure;

        this.adoucissementBordure = this.borner(valeur, 0.05, 4);
        return this.adoucissementBordure;
    }

    reglerOpaciteLoupe(opacite) {
        const valeur = Number(opacite);
        if (!Number.isFinite(valeur)) return this.opaciteLoupe;

        this.opaciteLoupe = this.borner(valeur, 0.65, 1);
        return this.opaciteLoupe;
    }

    reglerBordure(bordure) {
        const valeur = Number(bordure);
        if (!Number.isFinite(valeur)) return this.bordure;

        this.bordure = this.borner(valeur, 0, 10);
        return this.bordure;
    }

    reglerTailleTextureLoupe(taille) {
        const valeur = Number(taille);
        if (!Number.isFinite(valeur)) return this.tailleTextureLoupe;

        this.tailleTextureLoupe = Math.round(this.borner(valeur, this.tailleTextureLoupeMin, this.tailleTextureLoupeMax));

        if (this.actif) {
            this.supprimerRenduCameraLoupe();
            this.creerCameraLoupeSiNecessaire();
            this.creerTextureLoupeSiNecessaire();
            this.synchroniserPostTraitementsLoupe(true);
        }

        return this.tailleTextureLoupe;
    }

    reglerInversionY(actif) {
        this.inverserY = Boolean(actif);
        return this.inverserY;
    }

    trouverPremierTextBlock(controle) {
        if (!controle) return null;
        if (controle instanceof BABYLON.GUI.TextBlock) return controle;

        const enfants = controle.children ?? [];
        for (const enfant of enfants) {
            const resultat = this.trouverPremierTextBlock(enfant);
            if (resultat) return resultat;
        }

        return null;
    }

    lireNombre(valeurPrincipale, valeurSecours, defaut) {
        const principale = Number(valeurPrincipale);
        if (Number.isFinite(principale)) return principale;

        const secours = Number(valeurSecours);
        if (Number.isFinite(secours)) return secours;

        return defaut;
    }

    borner(valeur, min, max) {
        const nombre = Number(valeur);
        if (!Number.isFinite(nombre)) return min;
        return Math.max(min, Math.min(max, nombre));
    }

    etat() {
        return {
            actif: this.actif,
            diametre: this.diametre,
            zoom: this.zoom,
            nettete: this.nettete,
            antiFlou: this.antiFlou,
            flou: this.flou,
            adoucissementBordure: this.adoucissementBordure,
            opaciteLoupe: this.opaciteLoupe,
            bordure: this.bordure,
            inverserY: this.inverserY,
            inverserYTextureLoupe: this.inverserYTextureLoupe,
            tailleTextureLoupe: this.tailleTextureLoupe,
            cameraSecondaire: Boolean(this.cameraLoupe),
            textureLoupe: Boolean(this.textureLoupe),
            depthRendererLoupe: Boolean(this.depthRendererLoupe),
            postProcess: Boolean(this.postProcess),
            effetsLocauxLoupe: !this.dupliquerPostTraitements,
            postTraitementsLoupe: Boolean(this.postTraitementsLoupe)
        };
    }
}
