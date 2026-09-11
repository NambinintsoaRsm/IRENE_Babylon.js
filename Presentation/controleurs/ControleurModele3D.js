/**
 * @file Orchestration de la liste, du chargement et de la vue initiale des modèles 3D.
 *
 * Rôle : détecter/sélectionner un modèle, nettoyer l'ancien rendu, charger les meshes,
 * corriger leur orientation, les normaliser, cadrer la caméra puis lancer la saillance.
 *
 * Utilisation : les chargements sont asynchrones et reçoivent un jeton. Seul le dernier
 * chargement demandé peut modifier l'état et la caméra, ce qui évite les courses lorsque
 * l'utilisateur change rapidement de modèle.
 *
 * Contrainte UX : les étapes lourdes cèdent périodiquement la main au navigateur afin
 * que l'interface reste utilisable pendant le chargement et l'analyse de saillance.
 */
/**
 * Branche la liste dynamique des modèles 3D et orchestre le chargement.
 */
export class ControleurModele3D {
    constructor({
        etatApplication,
        listerModelesUC,
        changerModeleActifUC,
        chargerModeleUC,
        serviceListeModelesGUI,
        serviceSceneBabylon,
        chargeurModeleBabylon,
        serviceOrientationModeleBabylon = null,
        serviceNormalisationModeleBabylon,
        serviceCadrageCameraBabylon,
        serviceMateriauxBabylon,
        serviceCameraBabylon = null,
        serviceSaillanceVueBabylon = null,
        constantesCamera = null
    }) {
        this.etatApplication = etatApplication;
        this.listerModelesUC = listerModelesUC;
        this.changerModeleActifUC = changerModeleActifUC;
        this.chargerModeleUC = chargerModeleUC;
        this.serviceListeModelesGUI = serviceListeModelesGUI;
        this.serviceSceneBabylon = serviceSceneBabylon;
        this.chargeurModeleBabylon = chargeurModeleBabylon;
        this.serviceOrientationModeleBabylon = serviceOrientationModeleBabylon;
        this.serviceNormalisationModeleBabylon = serviceNormalisationModeleBabylon;
        this.serviceCadrageCameraBabylon = serviceCadrageCameraBabylon;
        this.serviceMateriauxBabylon = serviceMateriauxBabylon;
        this.serviceCameraBabylon = serviceCameraBabylon;

        this.serviceSaillanceVueBabylon = serviceSaillanceVueBabylon;

        this.constantesCamera = constantesCamera;
        this.indicateurChargement = null;
        this.indicateurChargementCarte = null;
        this.indicateurChargementTexte = null;
        this.indicateurChargementEstDOM = false;

        // Même mécanisme que dans le backup validé : le modèle chargé est placé
        // temporairement sur un calque invisible pour la caméra principale. La
        // caméra hors écran de saillance inclut explicitement ce calque afin de
        // calculer la vue de départ avant que l'objet n'apparaisse à l'écran.
        this.masqueModeleEnChargement = 0x10000000;
        this.etatMasquageModeleEnChargement = null;

        // Chaque chargement de modèle reçoit un jeton unique. Si l'utilisateur
        // clique rapidement sur plusieurs modèles, seuls le dernier chargement
        // et son calcul de saillance ont le droit de modifier l'état ou la caméra.
        this.jetonChangementModele = 0;

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
                await this.changerModele(modele.id);

                this.serviceListeModelesGUI.marquerModeleActif({
                    conteneurListe,
                    idModeleActif: modele.id,
                    etatApplication: this.etatApplication
                });
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

    /**
     * Charge un modèle et prépare sa vue initiale sans bloquer durablement la GUI.
     *
     * @param {string} idModele Identifiant métier du modèle à charger.
     * @returns {Promise<Object|null>} État du modèle après chargement, ou null si la demande est devenue obsolète.
     */
    async changerModele(idModele) {
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

        this.afficherChargement("Chargement du modèle...");
        // Laisse le navigateur peindre le message et traiter les clics GUI avant
        // de commencer le travail de chargement/parsing du modèle.
        await this.cederAuNavigateur();

        try {
            const { modeleSelectionne } = this.changerModeleActifUC.executer(idModele);

            this.serviceSceneBabylon.supprimerModeleActuel(this.etatApplication.modele3d);
            this.chargerModeleUC.executer(modeleSelectionne);
            await this.cederAuNavigateur();

            const resultatChargement = await this.chargeurModeleBabylon.charger(
                this.etatApplication.scenes.scene3D,
                modeleSelectionne
            );

            if (!this.estChargementModeleCourant(jeton, idModele)) {
                this.detruireResultatChargementAbandonne(resultatChargement);
                return this.etatApplication.modele3d;
            }

            // ImportMeshAsync peut terminer par une phase de parsing importante.
            // On rend immédiatement la main au navigateur avant les traitements
            // orientation / normalisation / saillance.
            await this.cederAuNavigateur();

            this.etatApplication.modele3d.terminerChargement({
                modele: modeleSelectionne,
                meshActuel: resultatChargement.meshActuel,
                meshesImportes: resultatChargement.meshesImportes
            });

            const meshes = this.etatApplication.modele3d.meshesImportes;

            // Comportement du backup : tant que la vue de départ n'a pas été
            // déterminée, le modèle reste invisible pour la caméra utilisateur.
            // La caméra d'analyse hors écran continue, elle, à voir ces meshes.
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

            await this.cederAuNavigateur();
            await this.attendreModelePretPourSaillance(meshes, { jeton, idModele });

            if (!this.estChargementModeleCourant(jeton, idModele)) {
                return this.etatApplication.modele3d;
            }

            // La vue de départ devient la vue optimale par saillance GMM.
            // Le calcul se fait avec une caméra d'analyse hors écran : l'utilisateur
            // ne voit pas le parcours, seulement le label de chargement.
            this.afficherChargement("Recherche de la meilleure vue...");
            await this.cederAuNavigateur();
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
                // On restaure d'abord le layerMask du modèle. Le label n'est retiré
                // qu'ensuite afin de ne jamais laisser un écran vide si la restauration
                // devait rencontrer un problème inattendu.
                this.restaurerModelePourCameraVisible();
                this.masquerChargement();
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

    /**
     * Masque temporairement les meshes pour la caméra visible sans les retirer
     * de la scène. Le rendu hors écran de saillance ajoute ce même layerMask.
     *
     * @param {BABYLON.AbstractMesh[]} meshes Meshes du modèle en cours de chargement.
     */
    masquerModelePourCameraVisible(meshes = []) {
        // Nettoie un éventuel masquage précédent avant d'enregistrer le nouvel état.
        this.restaurerModelePourCameraVisible();

        const camera = this.etatApplication?.camera?.cameraBabylon ?? null;
        const masque = this.masqueModeleEnChargement;
        const meshesValides = Array.isArray(meshes)
            ? meshes.filter((mesh) => mesh && !mesh.isDisposed?.())
            : [];

        const etatsMeshes = meshesValides.map((mesh) => ({
            mesh,
            layerMask: mesh.layerMask
        }));

        const etatCamera = camera
            ? {
                camera,
                layerMask: camera.layerMask
            }
            : null;

        // L'état de restauration est mémorisé AVANT toute mutation. Ainsi, même si
        // une affectation Babylon échoue, le finally pourra toujours revenir à l'état
        // visible précédent.
        this.etatMasquageModeleEnChargement = {
            masque,
            etatsMeshes,
            etatCamera
        };

        try {
            meshesValides.forEach((mesh) => {
                // layerMask est une propriété publique Babylon. Il est pris en compte
                // directement au rendu : aucun appel à une API privée de dirty-state
                // n'est nécessaire.
                mesh.layerMask = masque;
            });

            if (camera) {
                const layerMaskCourant = Number.isFinite(camera.layerMask)
                    ? camera.layerMask
                    : 0x0FFFFFFF;
                camera.layerMask = layerMaskCourant & ~masque;
            }
        } catch (erreur) {
            // Le masquage doit être transactionnel : en cas d'erreur, on restaure
            // immédiatement le modèle au lieu de le laisser sur le calque invisible.
            this.restaurerModelePourCameraVisible();
            throw erreur;
        }
    }

    /**
     * Restaure les layerMask présents avant le calcul de la vue de départ.
     */
    restaurerModelePourCameraVisible() {
        const etat = this.etatMasquageModeleEnChargement;

        if (!etat) {
            return;
        }

        // On détache l'état tout de suite : une seconde restauration déclenchée par
        // un finally ne doit jamais réappliquer une ancienne transaction.
        this.etatMasquageModeleEnChargement = null;

        etat.etatsMeshes?.forEach(({ mesh, layerMask }) => {
            if (!mesh || mesh.isDisposed?.()) return;

            try {
                mesh.layerMask = layerMask;
            } catch (erreur) {
                console.warn("[Modèles 3D] Impossible de restaurer le layerMask d'un mesh.", erreur);
            }
        });

        if (etat.etatCamera?.camera && !etat.etatCamera.camera.isDisposed?.()) {
            try {
                etat.etatCamera.camera.layerMask = etat.etatCamera.layerMask;
            } catch (erreur) {
                console.warn("[Modèles 3D] Impossible de restaurer le layerMask de la caméra.", erreur);
            }
        }
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

    cederAuNavigateur() {
        // scheduler.yield() est conçu pour les traitements coopératifs quand il
        // est disponible. Le fallback setTimeout(0) fonctionne sur Firefox/Safari.
        if (globalThis.scheduler?.yield) {
            return globalThis.scheduler.yield();
        }

        return new Promise((resolve) => setTimeout(resolve, 0));
    }

    accueilEstOuvert() {
        return this.etatApplication?.interface?.accueilOuvert === true;
    }

    afficherChargement(message = "Chargement...") {
        // OpenDyslexic est correctement chargée dans le reste de l'interface,
        // mais le TextBlock Babylon GUI utilisé ici reste instable avec cette
        // police dans certains navigateurs : le rectangle est rendu alors que
        // les glyphes du canvas disparaissent. Le message de chargement est donc
        // volontairement rendu en HTML/CSS. Le navigateur gère directement la
        // police web et bascule automatiquement sur Arial tant qu'elle n'est pas
        // prête, sans produire de rectangle vide.
        if (typeof document === "undefined" || !document.body) {
            return;
        }

        if (
            this.indicateurChargementEstDOM
            && this.indicateurChargement
            && this.indicateurChargement.isConnected
        ) {
            const accueilOuvert = this.accueilEstOuvert();
            this.indicateurChargement.dataset.annaChargementActif = "true";
            this.indicateurChargement.dataset.annaMessageChargement = String(message);
            this.indicateurChargement.dataset.annaZIndexNormal =
                this.indicateurChargement.dataset.annaZIndexNormal || "9000";

            // Le chargement continue normalement derrière la fenêtre d'accueil.
            // On ne modifie ni display ni visibility : fermer l'accueil révèle
            // instantanément l'état exact déjà présent en arrière-plan.
            this.indicateurChargement.style.display = "flex";
            this.indicateurChargement.style.visibility = "visible";
            this.indicateurChargement.style.opacity = "0.96";
            this.indicateurChargement.style.pointerEvents = "none";
            this.indicateurChargement.style.zIndex = accueilOuvert ? "-1" : "9000";
            this.indicateurChargement.setAttribute(
                "aria-hidden",
                accueilOuvert ? "true" : "false"
            );

            if (this.indicateurChargementTexte) {
                this.indicateurChargementTexte.textContent = String(message);
                this.appliquerPoliceChargement(this.indicateurChargementTexte);
            }

            this.appliquerCouleursChargement();
            return;
        }

        const overlay = document.createElement("div");
        overlay.id = "anna-indicateur-chargement-modele";
        overlay.dataset.annaChargementActif = "true";
        overlay.dataset.annaMessageChargement = String(message);
        overlay.setAttribute("role", "status");
        overlay.setAttribute("aria-live", "polite");
        overlay.setAttribute("aria-atomic", "true");
        const accueilOuvert = this.accueilEstOuvert();
        overlay.dataset.annaZIndexNormal = "9000";
        overlay.setAttribute("aria-hidden", accueilOuvert ? "true" : "false");

        Object.assign(overlay.style, {
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(360px, 70vw)",
            minHeight: "64px",
            boxSizing: "border-box",
            padding: "0.65rem 1rem",
            display: "flex",
            visibility: "visible",
            alignItems: "center",
            justifyContent: "center",
            borderStyle: "solid",
            borderWidth: "2px",
            borderRadius: "6px",
            pointerEvents: "none",
            opacity: "0.96",
            zIndex: accueilOuvert ? "-1" : "9000",
            textAlign: "center"
        });

        const texte = document.createElement("span");
        texte.id = "anna-indicateur-chargement-modele-texte";
        texte.textContent = String(message);
        Object.assign(texte.style, {
            display: "block",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            fontSize: "20px",
            lineHeight: "1.3",
            textAlign: "center",
            whiteSpace: "normal",
            overflowWrap: "break-word",
            fontSynthesis: "none"
        });

        overlay.appendChild(texte);
        document.body.appendChild(overlay);

        this.indicateurChargement = overlay;
        this.indicateurChargementCarte = overlay;
        this.indicateurChargementTexte = texte;
        this.indicateurChargementEstDOM = true;

        this.appliquerPoliceChargement(texte);
        this.appliquerCouleursChargement();
    }

    appliquerPoliceChargement(texte) {
        if (!texte) return;

        const parametres = this.etatApplication?.interface?.parametres ?? {};
        const police = String(parametres.police || "Luciole")
            .replace(/["']/g, "")
            .trim() || "Arial";
        const poids = parametres.gras === true ? "700" : "400";

        // DOM/CSS gère correctement les polices web. Si OpenDyslexic n'est pas
        // encore disponible au premier frame, Arial reste visible puis le
        // navigateur remplace automatiquement la police dès son chargement.
        texte.style.fontFamily = `"${police}", Arial, sans-serif`;
        texte.style.fontWeight = poids;
        texte.style.fontStyle = "normal";
        texte.style.fontSize = "20px";
        texte.style.lineHeight = "1.3";

        if (typeof document !== "undefined" && document.fonts?.load) {
            document.fonts
                .load(`normal ${poids} 20px "${police}"`)
                .catch(() => {
                    // Le fallback Arial reste lisible même si la police web
                    // demandée n'est pas disponible.
                });
        }
    }

    appliquerCouleursChargement() {
        const theme = String(
            this.etatApplication?.interface?.parametres?.theme ?? ""
        );
        const sombre = theme === "noir"
            || theme === "gris-fonce"
            || theme === "sombre";
        const fond = sombre ? "#222222" : "#ffffff";
        const texte = sombre ? "#ffffff" : "#000000";

        if (this.indicateurChargementEstDOM && this.indicateurChargement) {
            this.indicateurChargement.style.backgroundColor = fond;
            this.indicateurChargement.style.borderColor = texte;
            this.indicateurChargement.style.color = texte;
        }

        if (this.indicateurChargementTexte) {
            this.indicateurChargementTexte.style.color = texte;
        }
    }

    masquerChargement() {
        if (
            this.indicateurChargementEstDOM
            && this.indicateurChargement
        ) {
            this.indicateurChargement.dataset.annaChargementActif = "false";
            this.indicateurChargement.style.display = "none";
            this.indicateurChargement.style.visibility = "hidden";
            this.indicateurChargement.setAttribute("aria-hidden", "true");
        }
    }

}
