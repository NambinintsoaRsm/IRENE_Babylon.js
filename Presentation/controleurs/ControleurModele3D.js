import { obtenirThemeInterface } from "../../Configuration/constantesInterface.js";

/**
 * Branche la liste dynamique des modèles 3D et orchestre le chargement.
 */
export class ControleurModele3D {
    constructor({
        etatApplication,
        listerModelesUC,
        changerModeleActifUC,
        chargerModeleUC,
        supprimerModeleActuelUC = null,
        normaliserModeleUC = null,
        choisirVueEntropieUC = null,
        serviceListeModelesGUI,
        serviceSceneBabylon,
        chargeurModeleBabylon,
        serviceOrientationModeleBabylon = null,
        serviceNormalisationModeleBabylon,
        serviceCadrageCameraBabylon,
        serviceMateriauxBabylon,
        serviceCameraBabylon = null,
        serviceEntropieVueBabylon = null,
        serviceSaillanceVueBabylon = null,
        constantesCamera = null
    }) {
        this.etatApplication = etatApplication;
        this.listerModelesUC = listerModelesUC;
        this.changerModeleActifUC = changerModeleActifUC;
        this.chargerModeleUC = chargerModeleUC;
        this.supprimerModeleActuelUC = supprimerModeleActuelUC;
        this.normaliserModeleUC = normaliserModeleUC;
        this.choisirVueEntropieUC = choisirVueEntropieUC;
        this.serviceListeModelesGUI = serviceListeModelesGUI;
        this.serviceSceneBabylon = serviceSceneBabylon;
        this.chargeurModeleBabylon = chargeurModeleBabylon;
        this.serviceOrientationModeleBabylon = serviceOrientationModeleBabylon;
        this.serviceNormalisationModeleBabylon = serviceNormalisationModeleBabylon;
        this.serviceCadrageCameraBabylon = serviceCadrageCameraBabylon;
        this.serviceMateriauxBabylon = serviceMateriauxBabylon;
        this.serviceCameraBabylon = serviceCameraBabylon;

        // Entropie volontairement désactivée pour le moment.
        this.serviceEntropieVueBabylon = null;
        this.serviceSaillanceVueBabylon = serviceSaillanceVueBabylon;

        this.constantesCamera = constantesCamera;
        this.indicateurChargement = null;
        this.indicateurChargementCarte = null;
        this.indicateurChargementTexte = null;
        this.canvasMesureChargement = null;
        this.contexteMesureChargement = null;
        this.jetonIndicateurChargement = 0;
        this.indicateurChargementActif = false;
        this.policeIndicateurPersonnaliseePrete = false;

        // Masque utilisé pour cacher le modèle à la caméra visible pendant le
        // chargement, sans le cacher à la caméra hors écran utilisée pour la
        // saillance. La GUI reste visible, seul l'objet est masqué.
        this.masqueModeleEnChargement = 0x10000000;
        this.etatMasquageModeleEnChargement = null;

        // Chaque chargement de modèle reçoit un jeton unique. Si l'utilisateur
        // clique rapidement sur plusieurs modèles, seuls le dernier chargement
        // et son calcul de saillance ont le droit de modifier l'état ou la caméra.
        this.jetonChangementModele = 0;
        this.idModeleDemande = null;

        // Une vue de saillance est mémorisée par modèle pendant la session.
        // Ainsi, si l'utilisateur tourne manuellement l'objet puis reclique sur
        // le même modèle, on revient à la vue de saillance maximale, pas à la
        // dernière rotation manuelle.
        this.vuesSaillanceParModele = new Map();
    }

    async afficherListeModeles(conteneurListe, { forcerDetection = false } = {}) {
        if (!conteneurListe) {
            return;
        }

        if (typeof this.listerModelesUC.actualiserDepuisDossier === "function") {
            try {
                await this.listerModelesUC.actualiserDepuisDossier({
                    forcer: forcerDetection
                });
            } catch (erreur) {
                console.warn("[Modèles 3D] Détection automatique impossible. Catalogue actuel conservé.", erreur);
            }
        }

        const modeles = this.listerModelesUC.executer();

        this.serviceListeModelesGUI.afficherModeles({
            conteneurListe,
            modeles,
            etatApplication: this.etatApplication,
            callbackSelection: async (modele) => {
                // Le dernier bouton cliqué est marqué immédiatement. Un ancien
                // chargement terminé en retard ne peut donc plus reprendre la
                // surbrillance du modèle sélectionné ensuite.
                this.idModeleDemande = modele.id;
                this.serviceListeModelesGUI.marquerModeleActif({
                    conteneurListe,
                    idModeleActif: modele.id,
                    etatApplication: this.etatApplication
                });

                await this.changerModele(modele.id);

                if (this.idModeleDemande === modele.id) {
                    this.serviceListeModelesGUI.marquerModeleActif({
                        conteneurListe,
                        idModeleActif: modele.id,
                        etatApplication: this.etatApplication
                    });
                }
            }
        });
    }

    brancherBoutonsModelesExistants(boutons = []) {
        const modeles = this.listerModelesUC.executer();

        boutons.forEach(({ bouton, idModele }) => {
            if (!bouton) {
                return;
            }

            bouton.onPointerClickObservable.clear();
            bouton.onPointerClickObservable.add(async () => {
                const modele = modeles.find((m) => m.id === idModele);

                if (!modele) {
                    return;
                }

                await this.changerModele(idModele);
            });
        });
    }

    async changerModele(idModele) {
        this.idModeleDemande = idModele;

        const idActuel = this.etatApplication?.modele3d?.modeleActuel?.id
            ?? this.etatApplication?.modele3d?.modeleSelectionne?.id
            ?? null;

        // Recliquer sur le modèle déjà chargé sert de retour à la vue de départ
        // calculée par saillance. On ne garde pas la rotation manuelle comme
        // nouvelle vue de départ.
        if (idActuel === idModele && this.appliquerVueSaillanceMemoireModele(idModele)) {
            return this.etatApplication.modele3d;
        }

        const jeton = ++this.jetonChangementModele;

        await this.afficherChargement("Chargement du modèle...", { jeton });
        // On laisse au moins une image à Babylon pour afficher le label avant
        // de lancer le chargement et les traitements synchrones du modèle.
        await this.attendreRenduIndicateurChargement();

        try {
            const { modeleSelectionne } = this.changerModeleActifUC.executer(idModele);

            this.serviceSceneBabylon.supprimerModeleActuel(this.etatApplication.modele3d);
            this.chargerModeleUC.executer(modeleSelectionne);

            const resultatChargement = await this.chargeurModeleBabylon.charger(
                this.etatApplication.scenes.scene3D,
                modeleSelectionne
            );

            if (!this.estChargementModeleCourant(jeton, idModele)) {
                this.detruireResultatChargementAbandonne(resultatChargement);
                return this.etatApplication.modele3d;
            }

            this.etatApplication.modele3d.terminerChargement({
                modele: modeleSelectionne,
                meshActuel: resultatChargement.meshActuel,
                meshesImportes: resultatChargement.meshesImportes
            });

            const meshes = this.etatApplication.modele3d.meshesImportes;

            // Tant que le label de chargement est affiché, le modèle ne doit pas
            // être visible dans la caméra principale. On le masque uniquement
            // pour la caméra utilisateur ; la caméra d'analyse de saillance peut
            // encore le rendre hors écran.
            this.masquerModelePourCameraVisible(meshes);

            this.serviceMateriauxBabylon.corrigerMateriaux(meshes);

            if (this.serviceOrientationModeleBabylon) {
                this.serviceOrientationModeleBabylon.corrigerOrientation(meshes);
            }

            this.serviceNormalisationModeleBabylon.normaliser(
                meshes,
                this.constantesCamera?.tailleModeleNormalise ?? 2
            );

            this.appliquerVueInitialeModele(meshes);
            this.appliquerTextureSauvegardeeSurModele(meshes);

            await this.attendreModelePretPourSaillance(meshes, { jeton, idModele });

            if (!this.estChargementModeleCourant(jeton, idModele)) {
                return this.etatApplication.modele3d;
            }

            // La vue de départ devient la vue optimale par saillance GMM.
            // Le calcul se fait avec une caméra d'analyse hors écran : l'utilisateur
            // ne voit pas le parcours, seulement le label de chargement.
            await this.afficherChargement("Recherche de la meilleure vue...", { jeton });
            await this.attendreRenduIndicateurChargement();
            await this.appliquerVueSaillanceInitiale(meshes, { jeton, idModele });

            return this.etatApplication.modele3d;
        } catch (erreur) {
            if (this.estChargementModeleCourant(jeton, idModele)) {
                this.etatApplication.modele3d.signalerErreurChargement(erreur);
                throw erreur;
            }

            console.warn("[Modèles 3D] Ancien chargement abandonné pendant une nouvelle sélection.", erreur);
            return this.etatApplication.modele3d;
        } finally {
            if (this.estJetonChargementCourant(jeton)) {
                // Le modèle est restauré avant de retirer le label. Le retrait du
                // label est placé dans un finally dédié : même si l'attente d'une
                // image échoue, la carte de chargement ne peut pas rester bloquée.
                try {
                    this.restaurerModelePourCameraVisible();
                    await this.attendreRenduIndicateurChargement();
                    await this.attendreRenduIndicateurChargement();
                } finally {
                    this.masquerChargement({ jeton });
                }
            }
        }
    }

    estJetonChargementCourant(jeton) {
        return jeton === this.jetonChangementModele;
    }

    estChargementModeleCourant(jeton, idModele) {
        if (!this.estJetonChargementCourant(jeton)) {
            return false;
        }

        const etatModele = this.etatApplication?.modele3d;
        const idSelectionne = etatModele?.modeleSelectionne?.id ?? null;
        const idActuel = etatModele?.modeleActuel?.id ?? null;

        return idSelectionne === idModele || idActuel === idModele;
    }

    masquerModelePourCameraVisible(meshes = []) {
        this.restaurerModelePourCameraVisible();

        const camera = this.etatApplication?.camera?.cameraBabylon ?? null;
        const masque = this.masqueModeleEnChargement;
        const etatsMeshes = [];

        const meshesValides = Array.isArray(meshes)
            ? meshes.filter((mesh) => mesh && !mesh.isDisposed?.())
            : [];

        meshesValides.forEach((mesh) => {
            etatsMeshes.push({
                mesh,
                layerMask: mesh.layerMask
            });

            // Le mesh passe sur un calque réservé au chargement. La caméra
            // principale ne le voit plus, mais la caméra d'analyse l'ajoute
            // explicitement à son layerMask.
            mesh.layerMask = masque;
            mesh._markSubMeshesAsDirty?.();
        });

        const etatCamera = camera
            ? {
                camera,
                layerMask: camera.layerMask
            }
            : null;

        if (camera) {
            const layerMaskCourant = Number.isFinite(camera.layerMask)
                ? camera.layerMask
                : 0x0FFFFFFF;
            camera.layerMask = layerMaskCourant & ~masque;
        }

        this.etatMasquageModeleEnChargement = {
            masque,
            etatsMeshes,
            etatCamera
        };
    }

    restaurerModelePourCameraVisible() {
        const etat = this.etatMasquageModeleEnChargement;

        if (!etat) {
            return;
        }

        etat.etatsMeshes?.forEach(({ mesh, layerMask }) => {
            if (!mesh || mesh.isDisposed?.()) return;
            mesh.layerMask = layerMask;
            mesh._markSubMeshesAsDirty?.();
        });

        if (etat.etatCamera?.camera && !etat.etatCamera.camera.isDisposed?.()) {
            etat.etatCamera.camera.layerMask = etat.etatCamera.layerMask;
        }

        this.etatMasquageModeleEnChargement = null;
    }

    detruireResultatChargementAbandonne(resultatChargement) {
        const meshes = [
            ...(Array.isArray(resultatChargement?.meshesImportes) ? resultatChargement.meshesImportes : []),
            resultatChargement?.meshActuel
        ].filter(Boolean);

        const dejaDetruits = new Set();

        meshes.forEach((mesh) => {
            if (!mesh || dejaDetruits.has(mesh)) return;
            dejaDetruits.add(mesh);

            try {
                mesh.dispose?.(false, true);
            } catch (erreur) {
                console.warn("[Modèles 3D] Mesh abandonné non supprimé proprement.", erreur);
            }
        });
    }

    async attendreModelePretPourSaillance(meshes, { jeton, idModele }) {
        const scene = this.etatApplication.scenes?.scene3D;

        if (!scene || !this.estChargementModeleCourant(jeton, idModele)) {
            return;
        }

        try {
            if (typeof scene.whenReadyAsync === "function") {
                await scene.whenReadyAsync();
            } else if (typeof scene.executeWhenReady === "function") {
                await new Promise((resolve) => scene.executeWhenReady(resolve));
            }
        } catch (erreur) {
            console.warn("[Saillance] Attente scene prête ignorée.", erreur);
        }

        if (!this.estChargementModeleCourant(jeton, idModele)) {
            return;
        }

        this.mettreAJourMatricesMeshes(meshes);

        // On attend plusieurs frames après normalisation/orientation/textures.
        // Cela évite de calculer la saillance sur une vue encore incomplète,
        // surtout quand l'utilisateur enchaîne plusieurs modèles.
        for (let i = 0; i < 5; i++) {
            await this.attendreFrameScene(scene);

            if (!this.estChargementModeleCourant(jeton, idModele)) {
                return;
            }
        }
    }

    mettreAJourMatricesMeshes(meshes = []) {
        if (!Array.isArray(meshes)) return;

        meshes.forEach((mesh) => {
            if (!mesh || mesh.isDisposed?.()) return;

            try {
                mesh.computeWorldMatrix?.(true);
                mesh.refreshBoundingInfo?.();
            } catch (erreur) {
                console.warn("[Saillance] Bounding info non rafraîchie pour un mesh.", erreur);
            }
        });
    }

    attendreFrameScene(scene) {
        return new Promise((resolve) => {
            let termine = false;

            const terminer = () => {
                if (termine) return;
                termine = true;
                resolve();
            };

            if (scene?.onAfterRenderObservable?.addOnce) {
                scene.onAfterRenderObservable.addOnce(() => {
                    requestAnimationFrame(terminer);
                });

                // Sécurité si la boucle de rendu ne déclenche pas assez vite.
                setTimeout(terminer, 120);
                return;
            }

            requestAnimationFrame(terminer);
        });
    }

    appliquerVueInitialeModele(meshes) {
        const camera = this.etatApplication.camera.cameraBabylon;

        if (!camera) {
            return;
        }

        let resultat = null;

        // On utilise volontairement la même logique que le bouton Réinitialiser :
        // centre du modèle + alpha/beta de départ + radius selon taille du modèle.
        if (this.serviceCameraBabylon?.reinitialiserPositionDepuisMeshes) {
            resultat = this.serviceCameraBabylon.reinitialiserPositionDepuisMeshes(camera, meshes, {
                alpha: this.constantesCamera?.alphaInitial ?? Math.PI / 2,
                beta: this.constantesCamera?.betaInitial ?? Math.PI / 2.5,
                facteurCadrage: this.constantesCamera?.facteurCadrage ?? 3.0
            });
        }

        if (!resultat) {
            const cadrage = this.serviceCadrageCameraBabylon.cadrer(
                camera,
                meshes,
                this.etatApplication.camera.parametres,
                this.constantesCamera?.facteurCadrage ?? 3.0
            );

            resultat = {
                cible: cadrage.cible,
                rayon: cadrage.rayon,
                alpha: camera.alpha,
                beta: camera.beta,
                distanceMin: camera.lowerRadiusLimit,
                distanceMax: camera.upperRadiusLimit
            };
        }

        this.etatApplication.camera.parametres = this.etatApplication.camera.parametres.copierAvec({
            alpha: resultat.alpha,
            beta: resultat.beta,
            rayon: resultat.rayon,
            cible: resultat.cible,
            distanceMin: resultat.distanceMin,
            distanceMax: resultat.distanceMax
        });

        if (this.serviceCameraBabylon?.memoriserVueCouranteModele) {
            this.serviceCameraBabylon.memoriserVueCouranteModele(this.etatApplication);
        }
    }


    async appliquerVueSaillanceInitiale(meshes, { jeton = this.jetonChangementModele, idModele = null } = {}) {
        const scene = this.etatApplication.scenes?.scene3D;
        const camera = this.etatApplication.camera?.cameraBabylon;

        if (!scene || !camera) {
            return null;
        }

        // Si ce modèle a déjà une vue de saillance calculée dans la session,
        // on l'utilise immédiatement. Cela rend le comportement stable quand on
        // sélectionne plusieurs fois le même modèle après l'avoir tourné à la main.
        if (idModele && this.appliquerVueSaillanceMemoireModele(idModele)) {
            return {
                ...this.vuesSaillanceParModele.get(idModele),
                depuisMemoire: true
            };
        }

        if (!this.serviceSaillanceVueBabylon?.placerCameraSurVueSaillanceMaximale) {
            return null;
        }

        const estAnalyseToujoursValide = () => {
            return idModele
                ? this.estChargementModeleCourant(jeton, idModele)
                : this.estJetonChargementCourant(jeton);
        };

        try {
            const resultat = await this.serviceSaillanceVueBabylon.placerCameraSurVueSaillanceMaximale({
                scene,
                camera,
                meshes,
                conserverRayonCourant: false,
                texteResultat: null,
                exporterCsv: false,
                masquerParcoursAnalyse: true,
                estAnalyseValide: estAnalyseToujoursValide
            });

            if (!resultat || !estAnalyseToujoursValide()) {
                return null;
            }

            this.enregistrerVueSaillanceModele(idModele, resultat, camera);
            this.synchroniserEtatCameraDepuisCameraVisible(resultat);
            this.memoriserVueDepartCamera();

            console.info("[Saillance] Vue initiale GMM appliquée au chargement du modèle.", {
                score: resultat.scoreGlobal,
                alphaDegres: resultat.alphaDegres,
                betaDegres: resultat.betaDegres
            });

            return resultat;
        } catch (erreur) {
            console.warn("[Saillance] Impossible d'appliquer la vue initiale GMM. Vue initiale classique conservée.", erreur);
            return null;
        }
    }


    enregistrerVueSaillanceModele(idModele, resultat, camera) {
        if (!idModele || !camera || !resultat) return;

        const cible = camera.target?.clone?.() ?? resultat.cible?.clone?.() ?? null;

        this.vuesSaillanceParModele.set(idModele, {
            alpha: camera.alpha,
            beta: camera.beta,
            rayon: camera.radius,
            cible,
            distanceMin: camera.lowerRadiusLimit,
            distanceMax: camera.upperRadiusLimit,
            scoreGlobal: resultat.scoreGlobal,
            alphaDegres: resultat.alphaDegres,
            betaDegres: resultat.betaDegres
        });
    }

    appliquerVueSaillanceMemoireModele(idModele) {
        if (!idModele || !this.vuesSaillanceParModele?.has(idModele)) return false;

        const vue = this.vuesSaillanceParModele.get(idModele);
        const camera = this.etatApplication.camera?.cameraBabylon;

        if (!vue || !camera) return false;

        camera.alpha = vue.alpha;
        camera.beta = vue.beta;
        camera.radius = vue.rayon;

        if (vue.cible?.clone && typeof camera.setTarget === "function") {
            camera.setTarget(vue.cible.clone());
        }

        if (Number.isFinite(vue.distanceMin)) {
            camera.lowerRadiusLimit = vue.distanceMin;
        }

        if (Number.isFinite(vue.distanceMax)) {
            camera.upperRadiusLimit = vue.distanceMax;
        }

        this.synchroniserEtatCameraDepuisCameraVisible(vue);
        this.memoriserVueDepartCamera();
        this.etatApplication.scenes?.scene3D?.render?.();

        console.info("[Saillance] Retour à la vue de saillance mémorisée du modèle.", {
            idModele,
            score: vue.scoreGlobal,
            alphaDegres: vue.alphaDegres,
            betaDegres: vue.betaDegres
        });

        return true;
    }

    synchroniserEtatCameraDepuisCameraVisible(resultat = null) {
        const camera = this.etatApplication.camera?.cameraBabylon;
        const parametres = this.etatApplication.camera?.parametres;

        if (!camera || !parametres?.copierAvec) return;

        this.etatApplication.camera.parametres = parametres.copierAvec({
            alpha: camera.alpha,
            beta: camera.beta,
            rayon: camera.radius,
            cible: camera.target?.clone?.() ?? resultat?.cible,
            distanceMin: camera.lowerRadiusLimit,
            distanceMax: camera.upperRadiusLimit
        });
    }

    memoriserVueDepartCamera() {
        if (this.serviceCameraBabylon?.memoriserVueCouranteModele) {
            this.serviceCameraBabylon.memoriserVueCouranteModele(this.etatApplication);
        }

        if (this.serviceCameraBabylon?.memoriserPositionInitiale) {
            this.serviceCameraBabylon.memoriserPositionInitiale(this.etatApplication);
        }
    }


    appliquerTextureSauvegardeeSurModele(meshes) {
        const textureActive = this.etatApplication.apparence?.parametres?.textureActive;
        const tailleMotif = this.etatApplication.apparence?.parametres?.textureMotifTaille ?? 0;

        if (!this.serviceMateriauxBabylon || !textureActive || textureActive === "originale") {
            return;
        }

        this.serviceMateriauxBabylon.appliquerTextureProcedurale(
            meshes,
            textureActive,
            { decalageMotif: tailleMotif }
        );
    }

    async afficherChargement(message = "Chargement...", { jeton = this.jetonChangementModele } = {}) {
        const advancedTexture = this.etatApplication?.gui?.advancedTexture;

        if (!advancedTexture) {
            return;
        }

        this.jetonIndicateurChargement = jeton;
        this.indicateurChargementActif = true;
        this.policeIndicateurPersonnaliseePrete = false;

        if (!this.indicateurChargement || this.indicateurChargement.isDisposed?.()) {
            this.nettoyerIndicateursChargementOrphelins();
            this.creerIndicateurChargement(advancedTexture, message);
        } else {
            this.reafficherIndicateurChargement(message);
        }

        // Le premier rendu utilise volontairement Arial. Le texte est donc
        // visible immédiatement, même si OpenDyslexic n'est pas encore chargé.
        this.ajusterIndicateurChargement(message, {
            utiliserPolicePersonnalisee: false
        });
        this.appliquerCouleursChargement();
        await this.attendreRenduIndicateurChargement();

        // Le chargement de la police personnalisée continue sans bloquer le
        // chargement du modèle. Arial reste visible pendant ce court délai.
        this.attendrePoliceIndicateurChargement(message, jeton)
            .then((policePrete) => {
                if (!this.estIndicateurChargementActif(jeton)) {
                    return;
                }

                this.policeIndicateurPersonnaliseePrete = policePrete;
                this.ajusterIndicateurChargement(message, {
                    utiliserPolicePersonnalisee: policePrete
                });
                this.appliquerCouleursChargement();
            })
            .catch(() => {
                // Arial est déjà affichée : aucune action supplémentaire.
            });
    }

    creerIndicateurChargement(advancedTexture, message) {
        const overlay = new BABYLON.GUI.Rectangle("IndicateurChargementModele");
        overlay.width = "420px";
        overlay.height = "72px";
        overlay.thickness = 2;
        overlay.cornerRadius = 6;
        overlay.alpha = 1;
        overlay.zIndex = 100000;
        overlay.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        overlay.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        overlay.isPointerBlocker = false;
        overlay.metadata = {
            ...(overlay.metadata ?? {}),
            overlayChargementModele: true,
            nePasAutoFit: true
        };

        const carte = new BABYLON.GUI.Rectangle("IndicateurChargementModeleCarte");
        carte.width = "100%";
        carte.height = "100%";
        carte.cornerRadius = 6;
        carte.thickness = 0;
        carte.alpha = 1;
        carte.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        carte.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        carte.isPointerBlocker = false;
        carte.metadata = {
            ...(carte.metadata ?? {}),
            nePasAutoFit: true
        };

        const texte = new BABYLON.GUI.TextBlock("IndicateurChargementModeleTexte");
        texte.text = String(message);
        texte.width = "94%";
        texte.height = "100%";
        texte.fontSize = "20px";
        texte.fontFamily = "Arial, sans-serif";
        texte.fontWeight = "700";
        texte.textWrapping = false;
        texte.resizeToFit = false;
        texte.clipContent = false;
        texte.alpha = 1;
        texte.isVisible = true;
        texte.isEnabled = true;
        texte.notRenderable = false;
        texte.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        texte.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        texte.metadata = {
            ...(texte.metadata ?? {}),
            texteDynamique: true,
            nePasAutoFit: true,
            nePasModifierTailleTexte: true,
            nePasAccessibilite: true
        };

        carte.addControl(texte);
        overlay.addControl(carte);
        advancedTexture.addControl(overlay);

        this.indicateurChargement = overlay;
        this.indicateurChargementCarte = carte;
        this.indicateurChargementTexte = texte;
    }

    reafficherIndicateurChargement(message) {
        const controles = [
            this.indicateurChargement,
            this.indicateurChargementCarte,
            this.indicateurChargementTexte
        ];

        controles.forEach((controle) => {
            if (!controle) return;
            controle.alpha = 1;
            controle.isVisible = true;
            controle.isEnabled = true;
            controle.notRenderable = false;
            controle.isPointerBlocker = false;
            controle._markAsDirty?.();
        });

        if (this.indicateurChargementTexte) {
            this.indicateurChargementTexte.text = String(message);
            this.indicateurChargementTexte.fontFamily = "Arial, sans-serif";
        }

        this.etatApplication?.gui?.advancedTexture?.markAsDirty?.();
    }

    estIndicateurChargementActif(jeton = this.jetonIndicateurChargement) {
        return this.indicateurChargementActif === true
            && jeton === this.jetonIndicateurChargement
            && Boolean(this.indicateurChargement)
            && !this.indicateurChargement.isDisposed?.();
    }

    nomPoliceIndicateurChargement() {
        return String(
            this.etatApplication?.interface?.parametres?.police || "OpenDyslexic"
        ).replace(/["']/g, "").trim() || "Arial";
    }

    famillePoliceIndicateurChargement({ utiliserPolicePersonnalisee = false } = {}) {
        const famille = this.nomPoliceIndicateurChargement();

        if (!utiliserPolicePersonnalisee || famille.toLowerCase() === "arial") {
            return "Arial, sans-serif";
        }

        return `"${famille}", Arial, sans-serif`;
    }

    async attendrePoliceIndicateurChargement(message, jeton) {
        const famille = this.nomPoliceIndicateurChargement();

        if (famille.toLowerCase() === "arial") {
            return true;
        }

        if (typeof document === "undefined" || !document.fonts?.load) {
            return false;
        }

        const exemple = String(message || "Chargement du modèle...");
        const chargement = Promise.allSettled([
            document.fonts.load(`400 22px "${famille}"`, exemple),
            document.fonts.load(`700 22px "${famille}"`, exemple)
        ]);

        await Promise.race([
            chargement,
            new Promise((resolve) => setTimeout(resolve, 1200))
        ]);

        if (!this.estIndicateurChargementActif(jeton)) {
            return false;
        }

        try {
            return document.fonts.check(`700 22px "${famille}"`, exemple);
        } catch {
            return false;
        }
    }

    ajusterIndicateurChargement(
        message = "Chargement...",
        { utiliserPolicePersonnalisee = this.policeIndicateurPersonnaliseePrete } = {}
    ) {
        const overlay = this.indicateurChargement;
        const texte = this.indicateurChargementTexte;

        if (!overlay || !texte || overlay.isDisposed?.() || texte.isDisposed?.()) {
            return;
        }

        const engine = this.etatApplication?.scenes?.scene3D?.getEngine?.();
        const largeurRendu = Number(engine?.getRenderWidth?.())
            || Number(typeof window !== "undefined" ? window.innerWidth : 0)
            || 1024;

        const largeurCarte = Math.round(Math.min(600, Math.max(320, largeurRendu * 0.52)));
        const hauteurCarte = largeurCarte < 380 ? 82 : 76;
        const largeurDisponible = Math.max(230, largeurCarte * 0.88);

        overlay.width = `${largeurCarte}px`;
        overlay.height = `${hauteurCarte}px`;

        const accessibiliteActive = this.etatApplication?.accessibilite?.actif === true;
        const remPx = Number(this.etatApplication?.accessibilite?.preferencesNavigateur?.remPx);
        const tailleMax = accessibiliteActive && Number.isFinite(remPx)
            ? Math.min(30, Math.max(21, Math.round(remPx * 0.86)))
            : 23;
        const tailleMin = 15;
        const famille = this.famillePoliceIndicateurChargement({ utiliserPolicePersonnalisee });

        if (!this.canvasMesureChargement && typeof document !== "undefined") {
            this.canvasMesureChargement = document.createElement("canvas");
            this.contexteMesureChargement = this.canvasMesureChargement.getContext("2d");
        }

        let taille = tailleMax;
        const contexte = this.contexteMesureChargement;

        if (contexte) {
            for (; taille > tailleMin; taille -= 1) {
                contexte.font = `700 ${taille}px ${famille}`;
                if (contexte.measureText(String(message)).width <= largeurDisponible) {
                    break;
                }
            }
        }

        texte.text = String(message);
        texte.fontFamily = famille;
        texte.fontWeight = "700";
        texte.fontSize = `${Math.max(tailleMin, taille)}px`;
        texte.color = this.couleurTexteChargementContrastee();
        texte.alpha = 1;
        texte.isVisible = true;
        texte.isEnabled = true;
        texte.notRenderable = false;
        texte._markAsDirty?.();
        overlay._markAsDirty?.();
        this.etatApplication?.gui?.advancedTexture?.markAsDirty?.();
    }

    attendreRenduIndicateurChargement() {
        return new Promise((resolve) => {
            let termine = false;
            const terminer = () => {
                if (termine) return;
                termine = true;
                resolve();
            };

            if (typeof requestAnimationFrame === "function") {
                requestAnimationFrame(terminer);
                setTimeout(terminer, 100);
                return;
            }

            setTimeout(terminer, 0);
        });
    }

    couleurTexteChargementContrastee() {
        const themeActif = this.etatApplication?.interface?.parametres?.theme;
        const theme = obtenirThemeInterface(themeActif);
        const fond = theme?.fondPrincipal ?? "#2B2B2BFF";
        const texteTheme = theme?.textePrincipal ?? "#FFFFFFFF";

        return this.contrasteCouleursSuffisant(fond, texteTheme)
            ? texteTheme
            : (this.luminanceCouleur(fond) > 0.45 ? "#000000FF" : "#FFFFFFFF");
    }

    appliquerCouleursChargement() {
        const themeActif = this.etatApplication?.interface?.parametres?.theme;
        const theme = obtenirThemeInterface(themeActif);
        const fond = theme?.fondPrincipal ?? "#2B2B2BFF";
        const texte = this.couleurTexteChargementContrastee();
        const bordureTheme = theme?.bordure ?? texte;
        const bordure = this.contrasteCouleursSuffisant(fond, bordureTheme)
            ? bordureTheme
            : texte;

        if (this.indicateurChargement) {
            this.indicateurChargement.background = fond;
            this.indicateurChargement.color = bordure;
            this.indicateurChargement.alpha = 1;
        }

        if (this.indicateurChargementCarte) {
            this.indicateurChargementCarte.background = "#00000000";
            this.indicateurChargementCarte.color = "#00000000";
            this.indicateurChargementCarte.alpha = 1;
        }

        if (this.indicateurChargementTexte) {
            this.indicateurChargementTexte.color = texte;
            this.indicateurChargementTexte.alpha = 1;
            this.indicateurChargementTexte.isVisible = true;
            this.indicateurChargementTexte.isEnabled = true;
            this.indicateurChargementTexte.notRenderable = false;
            this.indicateurChargementTexte._markAsDirty?.();
        }

        this.indicateurChargement?._markAsDirty?.();
        this.etatApplication?.gui?.advancedTexture?.markAsDirty?.();
    }

    normaliserHexCouleur(couleur) {
        const texte = String(couleur || "").trim();
        const correspondance = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/i.exec(texte);
        return correspondance ? correspondance[1] : null;
    }

    luminanceCouleur(couleur) {
        const hex = this.normaliserHexCouleur(couleur);
        if (!hex) return 0;

        const composantes = [0, 2, 4].map((index) => {
            const valeur = parseInt(hex.slice(index, index + 2), 16) / 255;
            return valeur <= 0.03928
                ? valeur / 12.92
                : Math.pow((valeur + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * composantes[0]
            + 0.7152 * composantes[1]
            + 0.0722 * composantes[2];
    }

    contrasteCouleursSuffisant(fond, texte) {
        const l1 = this.luminanceCouleur(fond);
        const l2 = this.luminanceCouleur(texte);
        const clair = Math.max(l1, l2);
        const sombre = Math.min(l1, l2);
        return (clair + 0.05) / (sombre + 0.05) >= 4.5;
    }

    masquerChargement({ jeton = this.jetonIndicateurChargement, forcer = false } = {}) {
        if (!forcer && jeton !== this.jetonIndicateurChargement) {
            return;
        }

        this.indicateurChargementActif = false;
        this.policeIndicateurPersonnaliseePrete = false;

        const overlay = this.indicateurChargement;
        const carte = this.indicateurChargementCarte;
        const texte = this.indicateurChargementTexte;
        const advancedTexture = this.etatApplication?.gui?.advancedTexture;

        this.indicateurChargement = null;
        this.indicateurChargementCarte = null;
        this.indicateurChargementTexte = null;

        [texte, carte, overlay].forEach((controle) => {
            if (!controle) return;
            controle.alpha = 0;
            controle.isVisible = false;
            controle.isEnabled = false;
            controle.notRenderable = true;
            controle.isPointerBlocker = false;
            controle._markAsDirty?.();
        });

        this.retirerControleChargement(overlay, advancedTexture);
        advancedTexture?.markAsDirty?.();

        // Un second retrait par identité est effectué après le prochain rendu.
        // Il ne peut pas supprimer un nouvel indicateur créé entre-temps.
        const retirerEncore = () => {
            this.retirerControleChargement(overlay, advancedTexture);
            advancedTexture?.markAsDirty?.();
        };

        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(retirerEncore);
        }
        setTimeout(retirerEncore, 80);
    }

    retirerControleChargement(overlay, advancedTexture) {
        if (!overlay) return;

        try {
            overlay.parent?.removeControl?.(overlay);
        } catch (erreur) {
            console.warn("[Modèles 3D] Retrait du parent du label ignoré.", erreur);
        }

        try {
            advancedTexture?.rootContainer?.removeControl?.(overlay);
        } catch (erreur) {
            console.warn("[Modèles 3D] Retrait du root GUI du label ignoré.", erreur);
        }

        try {
            advancedTexture?.removeControl?.(overlay);
        } catch (erreur) {
            console.warn("[Modèles 3D] Retrait du label de chargement ignoré.", erreur);
        }

        try {
            if (!overlay.isDisposed?.()) {
                overlay.dispose?.();
            }
        } catch (erreur) {
            console.warn("[Modèles 3D] Destruction du label de chargement ignorée.", erreur);
        }
    }

    nettoyerIndicateursChargementOrphelins() {
        const advancedTexture = this.etatApplication?.gui?.advancedTexture;
        const racine = advancedTexture?.rootContainer;
        if (!racine) return;

        const noms = new Set([
            "IndicateurChargementModele",
            "IndicateurChargementModeleCarte",
            "IndicateurChargementModeleTexte"
        ]);

        const parcourir = (controle) => {
            const enfants = Array.isArray(controle?.children)
                ? [...controle.children]
                : [];

            enfants.forEach(parcourir);

            if (controle !== racine && noms.has(controle?.name)) {
                try {
                    controle.parent?.removeControl?.(controle);
                    controle.dispose?.();
                } catch (erreur) {
                    console.warn("[Modèles 3D] Nettoyage d'un ancien label ignoré.", erreur);
                }
            }
        };

        parcourir(racine);
        advancedTexture.markAsDirty?.();
    }
}
