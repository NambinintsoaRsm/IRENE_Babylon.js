/**
 * Loupe 3D accessible en PostProcess écran.
 *
 * Pourquoi ce choix :
 * - pas de copie CSS/canvas agrandie, donc moins de flou lié au navigateur ;
 * - pas de deuxième caméra, donc pas d'effet miniature ni de caméra qui rentre dans l'objet ;
 * - la loupe est appliquée sur l'image finale de la caméra 3D, donc les contours,
 *   la mise en lumière, la netteté, le contraste et les textures restent visibles.
 */
export class ServiceLoupe3D {
    constructor({
        diametre = 450,
        diametreMin = 180,
        diametreMax = 520,
        zoom = 2.5,
        zoomMin = 1.5,
        zoomMax = 5,
        bordure = 1.25,
        nettete = 1.5,
        inverserY = true,
        antiFlou = 0.9,
        adoucissementBordure = 1.4,
        opaciteLoupe = 0.98,

        // 0 = aucun flou ajouté ; 1 = léger adoucissement.
        // Le réglage existe surtout pour comparer le rendu, mais la valeur
        // par défaut reste nette.
        flou = 0.0
    } = {}) {
        this.diametre = diametre;
        this.diametreMin = diametreMin;
        this.diametreMax = diametreMax;
        this.zoom = zoom;
        this.zoomMin = zoomMin;
        this.zoomMax = zoomMax;
        this.bordure = bordure;
        this.nettete = nettete;
        this.inverserY = inverserY;
        this.antiFlou = antiFlou;
        this.adoucissementBordure = adoucissementBordure;
        this.opaciteLoupe = opaciteLoupe;
        this.flou = flou;

        this.etatApplication = null;
        this.scene = null;
        this.camera = null;
        this.canvas = null;
        this.advancedTexture = null;
        this.serviceCameraBabylon = null;

        this.postProcess = null;
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

            uniform vec2 screenSize;
            uniform vec2 centreLoupe;
            uniform float rayonPixels;
            uniform float zoomLoupe;
            uniform float bordurePixels;
            uniform float actif;
            uniform float visible;
            uniform float netteteLoupe;
            uniform float antiFlouLoupe;
            uniform float adoucissementBordurePixels;
            uniform float opaciteLoupe;
            uniform float flouLoupe;

            vec4 echantillonLoupe(vec2 uvZoom) {
                vec2 uv = clamp(uvZoom, vec2(0.001), vec2(0.999));

                // Échantillonnage lissé classique.
                vec4 lisse = texture2D(textureSampler, uv);

                // Échantillonnage au centre du pixel source.
                // Cela réduit l'interpolation bilinéaire responsable d'une partie du flou.
                vec2 taille = max(screenSize, vec2(1.0));
                vec2 uvPixelNet = (floor(uv * taille) + vec2(0.5)) / taille;
                vec4 net = texture2D(textureSampler, clamp(uvPixelNet, vec2(0.001), vec2(0.999)));

                return mix(lisse, net, clamp(antiFlouLoupe, 0.0, 1.0));
            }

            vec4 couleurLoupe(vec2 uvZoom, vec2 pixelSize) {
                vec2 uv = clamp(uvZoom, vec2(0.001), vec2(0.999));
                vec4 centre = echantillonLoupe(uv);

                if (netteteLoupe <= 0.001) {
                    return centre;
                }

                float rayonFlou = clamp(flouLoupe, 0.0, 1.0) * 1.75;
                vec2 decalageFlou = pixelSize * max(rayonFlou, 1.0);

                vec4 gauche = echantillonLoupe(uv + vec2(-decalageFlou.x, 0.0));
                vec4 droite = echantillonLoupe(uv + vec2( decalageFlou.x, 0.0));
                vec4 haut = echantillonLoupe(uv + vec2(0.0, -decalageFlou.y));
                vec4 bas = echantillonLoupe(uv + vec2(0.0,  decalageFlou.y));

                vec4 flouLocal = (gauche + droite + haut + bas) * 0.25;
                vec4 base = mix(centre, flouLocal, clamp(flouLoupe, 0.0, 1.0) * 0.65);
                vec4 renforce = base + (base - flouLocal) * netteteLoupe;

                return vec4(clamp(renforce.rgb, 0.0, 1.0), centre.a);
            }

            void main(void) {
                vec4 couleurBase = texture2D(textureSampler, vUV);

                if (actif < 0.5 || visible < 0.5 || rayonPixels <= 1.0 || zoomLoupe <= 1.01) {
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

                vec2 uvZoom = centreLoupe + (vUV - centreLoupe) / zoomLoupe;
                vec2 pixelSize = 1.0 / max(screenSize, vec2(1.0));
                vec4 couleurZoom = couleurLoupe(uvZoom, pixelSize);

                float adoucissement = max(0.05, adoucissementBordurePixels);
                float masqueInterieur = smoothstep(rayon + adoucissement, rayon - adoucissement, distancePixels);
                vec4 couleur = mix(couleurBase, couleurZoom, masqueInterieur * clamp(opaciteLoupe, 0.0, 1.0));

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

    creerPostProcess() {
        if (!this.camera || !this.scene) return null;

        this.supprimerPostProcess();
        this.enregistrerShaderSiNecessaire();

        const moteur = this.scene.getEngine?.() ?? null;

        this.postProcess = new BABYLON.PostProcess(
            "SaotraLoupe3DPostProcess",
            "SaotraLoupe3DPostProcess",
            [
                "screenSize",
                "centreLoupe",
                "rayonPixels",
                "zoomLoupe",
                "bordurePixels",
                "actif",
                "visible",
                "netteteLoupe",
                "antiFlouLoupe",
                "adoucissementBordurePixels",
                "opaciteLoupe",
                "flouLoupe"
            ],
            null,
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

        effect.setFloat2("screenSize", taille.largeur, taille.hauteur);
        effect.setFloat2("centreLoupe", centre.x, centre.y);
        effect.setFloat("rayonPixels", rayon);
        effect.setFloat("zoomLoupe", this.zoom);
        effect.setFloat("bordurePixels", bordure);
        effect.setFloat("actif", this.actif ? 1.0 : 0.0);
        effect.setFloat("visible", this.pointeurDansCanvas ? 1.0 : 0.0);
        effect.setFloat("netteteLoupe", this.nettete);
        effect.setFloat("antiFlouLoupe", this.antiFlou);
        effect.setFloat("adoucissementBordurePixels", this.calculerAdoucissementBordurePixels(taille));
        effect.setFloat("opaciteLoupe", this.opaciteLoupe);
        effect.setFloat("flouLoupe", this.flou);
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
        bouton.width = "64px";
        bouton.height = "64px";
        bouton.cornerRadius = 30;
        bouton.thickness = 2;
        bouton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        bouton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        bouton.top = "-80px";
        bouton.left = "-18px";
        bouton.zIndex = 10000;
        bouton.isPointerBlocker = true;

        bouton.metadata = {
            ...(bouton.metadata ?? {}),
            estBoutonLoupe3D: true,
            texteOriginal: "🔍"
        };

        const texte = bouton.textBlock ?? this.trouverPremierTextBlock(bouton);
        if (texte) {
            texte.name = texte.name || "LoupeBtnTxt";
            texte.metadata = {
                ...(texte.metadata ?? {}),
                texteDynamique: true,
                texteOriginal: "🔍"
            };
            texte.text = "🔍";
            texte.fontSize = "30px";
            texte.fontWeight = "700";
            texte.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            texte.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        }

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            // Important : ne pas utiliser ce mécanisme interne Babylon ici.
            // Selon les versions de Babylon GUI, ce champ peut être un booléen
            // et non une fonction, ce qui provoque une erreur au clic.
            // Le bouton reçoit déjà correctement le clic, donc un simple toggle suffit.
            this.basculer();
        });

        // On vide aussi pointerUp pour éviter un double déclenchement
        // qui pourrait désactiver puis réactiver la loupe dans le même clic.
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

        this.supprimerPostProcess();
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
        this.positionPointeur = {
            clientX: evenement.clientX,
            clientY: evenement.clientY
        };
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

        // La navigation caméra est déjà coupée par detachControl().
        // On bloque seulement la molette pour éviter un zoom caméra résiduel.
        // Ne pas bloquer pointerdown : sinon Babylon GUI ne reçoit plus le clic
        // sur le bouton ✕ de la loupe.
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
        if (this.rafId !== null) return;

        const boucle = () => {
            if (!this.actif) {
                this.rafId = null;
                return;
            }

            this.assurerPostProcessEnDernier();
            this.rafId = requestAnimationFrame(boucle);
        };

        this.rafId = requestAnimationFrame(boucle);
    }

    arreterSurveillancePostProcess() {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    assurerPostProcessEnDernier() {
        if (!this.camera || !this.postProcess) return;

        const postProcesses = (this.camera._postProcesses ?? []).filter(Boolean);
        const dernier = postProcesses[postProcesses.length - 1] ?? null;

        if (dernier === this.postProcess) return;

        const maintenant = performance.now?.() ?? Date.now();
        if (maintenant - this.derniereRecreation < 300) return;

        // Si un autre effet a été ajouté après la loupe, on recrée la loupe
        // pour qu'elle reste le dernier post-process et agrandisse bien le rendu final.
        this.creerPostProcess();
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
            this.texteBouton.text = this.actif ? "✕" : "🔍";
            this.texteBouton.color = couleurTexte;
            this.texteBouton.fontSize = this.actif ? "28px" : "30px";
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

        this.nettete = this.borner(valeur, 0, 1.2);
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

    borner(valeur, min, max) {
        return Math.max(min, Math.min(max, valeur));
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
            postProcess: Boolean(this.postProcess)
        };
    }
}
