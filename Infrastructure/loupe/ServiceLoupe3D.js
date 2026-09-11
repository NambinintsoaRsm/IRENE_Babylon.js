/**
 * @file Loupe 3D rendue par une caméra Babylon secondaire.
 *
 * Rôle : produire un agrandissement géométriquement cohérent autour du pointeur,
 * synchroniser la caméra secondaire et reproduire les post-traitements V1 utiles.
 *
 * Utilisation : le contrôleur/bouton Loupe appelle basculer(), puis ce service gère
 * les événements pointeur et le RenderTargetTexture pendant toute l'activation.
 *
 * Contrainte : la loupe n'est pas un zoom 2D du canvas. Elle doit conserver une
 * caméra distincte afin d'éviter la pixellisation et les traversées du modèle.
 */
import { PostTraitApparence } from "../postTraitements/PostTraitApparence.js";
import { PostTraitNettete } from "../postTraitements/PostTraitNettete.js";
import { PostTraitSilhouette } from "../postTraitements/PostTraitSilhouette.js";

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
        this.postTraitementsLoupe = null;
        this.signaturePostTraitementsLoupe = null;
        this.refsPostTraitementsLoupe = null;
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

        const cle = "ANNALoupe3DPostProcessFragmentShader";
        if (BABYLON.Effect.ShadersStore[cle]) return;

        // V1 : ce shader ne calcule aucun contour. Il compose uniquement le
        // rendu de la caméra loupe. La silhouette est produite par le même
        // PostTraitSilhouette que sur la caméra principale.
        BABYLON.Effect.ShadersStore[cle] = `
            precision highp float;

            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform sampler2D loupeSampler;

            uniform vec2 screenSize;
            uniform vec2 loupeTextureSize;
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

            vec4 echantillonTextureLoupe(vec2 uv) {
                vec2 uvCorrige = uv;
                if (inverserYLoupe > 0.5) uvCorrige.y = 1.0 - uvCorrige.y;
                return texture2D(loupeSampler, clamp(uvCorrige, vec2(0.001), vec2(0.999)));
            }

            vec4 couleurLoupeCamera(vec2 uvLocal) {
                vec2 uv = clamp(uvLocal, vec2(0.001), vec2(0.999));
                vec4 centre = echantillonTextureLoupe(uv);

                if (netteteLoupe <= 0.001) return centre;

                vec2 pixelSize = 1.0 / max(loupeTextureSize, vec2(1.0));
                float rayonFlou = clamp(flouLoupe, 0.0, 1.0) * 1.75;
                vec2 decalageFlou = pixelSize * max(rayonFlou, 1.0);

                vec4 gauche = echantillonTextureLoupe(uv + vec2(-decalageFlou.x, 0.0));
                vec4 droite = echantillonTextureLoupe(uv + vec2( decalageFlou.x, 0.0));
                vec4 haut = echantillonTextureLoupe(uv + vec2(0.0, -decalageFlou.y));
                vec4 bas = echantillonTextureLoupe(uv + vec2(0.0,  decalageFlou.y));
                vec4 flouLocal = (gauche + droite + haut + bas) * 0.25;
                vec4 base = mix(centre, flouLocal, clamp(flouLoupe, 0.0, 1.0) * 0.65);
                float forceNettete = netteteLoupe * max(0.0, antiFlouLoupe);
                vec4 renforce = base + (base - flouLocal) * forceNettete;
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
                vec4 couleurZoom = couleurLoupeCamera(uvLocal);
                float adoucissement = max(0.05, adoucissementBordurePixels);
                float masqueInterieur = smoothstep(rayon + adoucissement, rayon - adoucissement, distancePixels);
                masqueInterieur *= clamp(opaciteLoupe, 0.0, 1.0);
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

    actualiserMetadataRenduLoupe() {
        if (!this.cameraLoupe) return;

        const taille = this.textureLoupe?.getSize?.() ?? null;
        this.cameraLoupe.metadata = {
            ...(this.cameraLoupe.metadata ?? {}),
            estLoupe3D: true,
            annaLoupe3D: {
                renderSize: {
                    largeur: Math.max(1, Number(taille?.width ?? this.tailleTextureLoupe) || 1),
                    hauteur: Math.max(1, Number(taille?.height ?? this.tailleTextureLoupe) || 1)
                }
            }
        };
    }

    creerCameraLoupeSiNecessaire() {
        if (this.cameraLoupe || !this.scene || !this.camera) return this.cameraLoupe;

        this.cameraLoupe = new BABYLON.TargetCamera(
            "ANNALoupeCameraSecondaire",
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

    creerTextureLoupeSiNecessaire() {
        if (this.textureLoupe || !this.scene) return this.textureLoupe;

        this.creerCameraLoupeSiNecessaire();

        const taille = Math.round(this.borner(
            this.tailleTextureLoupe,
            this.tailleTextureLoupeMin,
            this.tailleTextureLoupeMax
        ));

        this.textureLoupe = new BABYLON.RenderTargetTexture(
            "ANNALoupeCameraTexture",
            taille,
            this.scene,
            false
        );

        this.textureLoupe.activeCamera = this.cameraLoupe;
        this.textureLoupe.refreshRate = 1;
        this.textureLoupe.ignoreCameraViewport = true;
        // La texture caméra embarque les post-traitements officiels de la caméra loupe.
        // Le post-process final se contente ensuite d'afficher cette texture dans le cercle.
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
            "ANNALoupe3DPostProcess",
            "ANNALoupe3DPostProcess",
            [
                "screenSize", "loupeTextureSize", "centreLoupe", "rayonPixels",
                "bordurePixels", "actif", "visible", "netteteLoupe", "antiFlouLoupe",
                "adoucissementBordurePixels", "opaciteLoupe", "flouLoupe",
                "inverserYLoupe", "textureLoupeDisponible"
            ],
            ["loupeSampler"],
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

        if (this.textureLoupe) effect.setTexture("loupeSampler", this.textureLoupe);
        effect.setFloat2("screenSize", taille.largeur, taille.hauteur);
        effect.setFloat2("loupeTextureSize", tailleTexture.largeur, tailleTexture.hauteur);
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

    /**
     * Active la caméra secondaire, le rendu de loupe et ses événements pointeur.
     *
     * @returns {boolean} true si la loupe est active à la fin de l'opération.
     */
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

    /**
     * Désactive la loupe et restitue la navigation de la caméra principale.
     *
     * Cette méthode doit nettoyer les observateurs temporaires afin d'éviter
     * l'accumulation d'écouteurs après plusieurs activations.
     */
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
        this.actualiserMetadataRenduLoupe();

        if (!this.dupliquerPostTraitements || !this.actif || !this.cameraLoupe) return;

        // La caméra secondaire réutilise la même chaîne active : apparence,
        // netteté et silhouette.
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
        if (mesh.metadata?.estLoupe3D || mesh.name?.startsWith?.("ANNALoupe")) return false;
        if (mesh.isPickable === false) return false;
        if (typeof mesh.isEnabled === "function" && !mesh.isEnabled()) return false;
        if (mesh.isVisible === false) return false;

        const masqueCamera = this.camera?.layerMask ?? 0xFFFFFFFF;
        const masqueMesh = mesh.layerMask ?? 0xFFFFFFFF;

        return (masqueCamera & masqueMesh) !== 0;
    }

    mettreAJourRenderListLoupe(force = false) {
        if (!this.scene || !this.textureLoupe) return;

        const maintenant = performance.now?.() ?? Date.now();
        if (!force && maintenant - this.dernierControleRenderList < 500) return;

        this.dernierControleRenderList = maintenant;
        const masqueCamera = this.cameraLoupe?.layerMask ?? this.camera?.layerMask ?? 0xFFFFFFFF;
        const liste = this.scene.meshes.filter((mesh) => {
            if (!mesh) return false;
            if (mesh.metadata?.estLoupe3D || mesh.name?.startsWith?.("ANNALoupe")) return false;
            if (typeof mesh.isEnabled === "function" && !mesh.isEnabled()) return false;
            if (mesh.isVisible === false) return false;
            return ((mesh.layerMask ?? 0xFFFFFFFF) & masqueCamera) !== 0;
        });

        this.textureLoupe.renderList = liste;
        this.actualiserMetadataRenduLoupe();
    }

    synchroniserPostTraitementsLoupe(force = false) {
        if (!this.dupliquerPostTraitements || !this.actif || !this.cameraLoupe || !this.scene) return;

        const maintenant = performance.now?.() ?? Date.now();
        if (!force && maintenant - this.dernierControlePostTraitements < 180) return;
        this.dernierControlePostTraitements = maintenant;

        const etat = this.etatApplication ?? {};
        const contours = etat.contours ?? {};
        const apparence = etat.apparence ?? {};
        this.scene.metadata = { ...(this.scene.metadata ?? {}), annaEtatApplication: etat };

        const etatDesire = this.decrirePostTraitementsLoupeDesires({ apparence, contours });
        const signature = this.creerSignaturePostTraitementsLoupe(etatDesire);
        const refs = this.creerRefsPostTraitementsLoupe({ apparence, contours });
        const memesRefs = this.refsPostTraitementsLoupe
            && this.refsPostTraitementsLoupe.apparence === refs.apparence
            && this.refsPostTraitementsLoupe.contours === refs.contours
            && this.refsPostTraitementsLoupe.postApparence === refs.postApparence
            && this.refsPostTraitementsLoupe.postNettete === refs.postNettete
            && this.refsPostTraitementsLoupe.postSilhouette === refs.postSilhouette;

        if (!force && signature === this.signaturePostTraitementsLoupe && memesRefs && this.postTraitementsLoupeEnEtat(etatDesire)) {
            this.assurerTextureLoupeUtilisePostProcess();
            return;
        }

        this.supprimerPostTraitementsLoupe();
        this.signaturePostTraitementsLoupe = signature;
        this.refsPostTraitementsLoupe = refs;
        const nouveaux = {};

        try {
            this.assurerTextureLoupeUtilisePostProcess();
            if (etatDesire.apparence) nouveaux.apparence = new PostTraitApparence().creer(this.cameraLoupe, apparence.parametres);
            if (etatDesire.nettete) nouveaux.nettete = new PostTraitNettete().creer(this.cameraLoupe, apparence.parametres);
            if (etatDesire.silhouette) {
                nouveaux.silhouette = new PostTraitSilhouette().creer(this.scene, this.cameraLoupe, contours.parametres);
            }
        } catch (erreur) {
            console.warn("[Loupe 3D] Certains post-traitements V1 n'ont pas pu être dupliqués.", erreur);
        }

        this.postTraitementsLoupe = nouveaux;
        this.assurerPostTraitementsLoupeDansCamera();
    }

    decrirePostTraitementsLoupeDesires({ apparence, contours }) {
        return {
            apparence: Boolean(apparence?.postTraitementApparence && apparence?.parametres),
            nettete: Boolean(apparence?.postTraitementNettete && apparence?.parametres),
            silhouette: Boolean(contours?.postTraitementSilhouette && contours?.parametres?.actif)
        };
    }

    creerSignaturePostTraitementsLoupe(etatDesire) {
        return [etatDesire.apparence, etatDesire.nettete, etatDesire.silhouette, this.zoom, this.tailleTextureLoupe]
            .map((valeur) => String(valeur)).join("|");
    }

    creerRefsPostTraitementsLoupe({ apparence, contours }) {
        return {
            apparence: apparence?.parametres ?? null,
            contours: contours?.parametres ?? null,
            postApparence: this.extrairePostProcess(apparence?.postTraitementApparence) ?? null,
            postNettete: this.extrairePostProcess(apparence?.postTraitementNettete) ?? null,
            postSilhouette: this.extrairePostProcess(contours?.postTraitementSilhouette) ?? null
        };
    }

    postTraitementsLoupeEnEtat(etatDesire = null) {
        if (!this.cameraLoupe || !this.textureLoupe) return false;
        this.assurerTextureLoupeUtilisePostProcess();

        const etat = etatDesire ?? this.decrirePostTraitementsLoupeDesires({
            apparence: this.etatApplication?.apparence ?? {},
            contours: this.etatApplication?.contours ?? {}
        });
        const attendus = [[etat.apparence, "apparence"], [etat.nettete, "nettete"], [etat.silhouette, "silhouette"]];
        if (!attendus.some(([actif]) => actif)) return true;
        if (!this.postTraitementsLoupe) return false;
        const chaineCamera = Array.isArray(this.cameraLoupe._postProcesses) ? this.cameraLoupe._postProcesses : [];

        for (const [actif, nom] of attendus) {
            if (!actif) continue;
            const postProcess = this.extrairePostProcess(this.postTraitementsLoupe[nom]);
            if (!this.estPostProcessUtilisable(postProcess) || !chaineCamera.includes(postProcess)) return false;
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
            try { this.textureLoupe.onBeforeRenderObservable?.removeCallback?.(this._avantRenduTextureLoupe); } catch (_) {}
            const liste = this.scene?.customRenderTargets;
            const index = Array.isArray(liste) ? liste.indexOf(this.textureLoupe) : -1;
            if (index >= 0) liste.splice(index, 1);
            try { this.textureLoupe.dispose?.(); } catch (_) {}
        }
        this.textureLoupe = null;

        if (this.cameraLoupe) {
            try { this.cameraLoupe.dispose?.(); } catch (_) {}
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
