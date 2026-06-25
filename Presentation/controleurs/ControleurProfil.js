/**
 * Branche les actions liées au profil local.
 *
 * La sauvegarde est locale au navigateur. Elle conserve les réglages sous forme
 * de JSON dans localStorage, puis les recharge au démarrage suivant.
 */
export class ControleurProfil {
    constructor({
                    etatApplication,
                    chargerProfilLocalUC,
                    sauvegarderProfilLocalUC,
                    appliquerProfilUC,
                    reinitialiserProfilUC,
                    serviceStyleInterfaceGUI,
                    serviceTexteGUI,
                    serviceCameraBabylon,
                    serviceSceneBabylon = null,
                    serviceLumiereBabylon = null,
                    controleurLumiere = null,
                    serviceMateriauxBabylon = null,
                    serviceControlesSpeciauxGUI = null,
                    postTraitApparence = null,
                    postTraitNettete = null,
                    postTraitContProfNorm = null,
                    postTraitContoursCouleur = null,
                    postTraitMiseLumiereNormales = null,
                    postTraitMiseLumiereCouleurs = null
                }) {
        this.etatApplication = etatApplication;

        this.chargerProfilLocalUC = chargerProfilLocalUC;
        this.sauvegarderProfilLocalUC = sauvegarderProfilLocalUC;
        this.appliquerProfilUC = appliquerProfilUC;
        this.reinitialiserProfilUC = reinitialiserProfilUC;

        this.serviceStyleInterfaceGUI = serviceStyleInterfaceGUI;
        this.serviceTexteGUI = serviceTexteGUI;
        this.serviceCameraBabylon = serviceCameraBabylon;
        this.serviceSceneBabylon = serviceSceneBabylon;
        this.serviceLumiereBabylon = serviceLumiereBabylon;
        this.controleurLumiere = controleurLumiere;
        this.serviceMateriauxBabylon = serviceMateriauxBabylon;
        this.serviceControlesSpeciauxGUI = serviceControlesSpeciauxGUI;

        this.postTraitApparence = postTraitApparence;
        this.postTraitNettete = postTraitNettete;
        this.postTraitContProfNorm = postTraitContProfNorm;
        this.postTraitContoursCouleur = postTraitContoursCouleur;
        this.postTraitMiseLumiereNormales = postTraitMiseLumiereNormales;
        this.postTraitMiseLumiereCouleurs = postTraitMiseLumiereCouleurs;

        this.sauvegardeAutomatiqueInstallee = false;
    }

    chargerProfilAuDemarrage() {
        const profil = this.chargerProfilLocalUC.executer();

        if (!profil) {
            return null;
        }

        this.appliquerProfilUC.executer(profil);
        this.appliquerEffetsVisuels();
        this.mettreAJourInterfaceDepuisEtat();

        console.info("[Sauvegarde] Réglages locaux restaurés.", profil.dateSauvegarde ?? "date inconnue");

        return profil;
    }


    sauvegarderMaintenant() {
        try {
            const profil = this.sauvegarderProfilLocalUC.executer();
            console.info("[Sauvegarde] Réglages locaux sauvegardés.");
            return profil;
        } catch (erreur) {
            console.warn("[Sauvegarde] Impossible de sauvegarder les réglages locaux.", erreur);
            return null;
        }
    }

    installerSauvegardeAutomatique() {
        if (this.sauvegardeAutomatiqueInstallee || typeof window === "undefined") {
            return;
        }

        const sauvegarder = () => this.sauvegarderMaintenant();

        window.addEventListener("pagehide", sauvegarder);
        window.addEventListener("beforeunload", sauvegarder);

        if (typeof document !== "undefined") {
            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "hidden") {
                    sauvegarder();
                }
            });
        }

        this.sauvegardeAutomatiqueInstallee = true;
    }

    brancherSauvegarde(bouton) {
        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.add(() => {
            this.sauvegarderProfilLocalUC.executer();
        });
    }

    brancherReinitialisation(bouton) {
        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.add(() => {
            this.reinitialiserProfilUC.executer();
            this.appliquerEffetsVisuels();
            this.mettreAJourInterfaceDepuisEtat();
        });
    }

    appliquerEffetsVisuels() {
        this.serviceStyleInterfaceGUI.appliquerTheme(this.etatApplication);
        this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);

        if (this.etatApplication.camera.cameraBabylon) {
            this.serviceCameraBabylon.appliquerParametres(
                this.etatApplication.camera.cameraBabylon,
                this.etatApplication.camera.parametres
            );
        }

        this.appliquerFondSceneSauvegarde();
        this.appliquerLumiereSauvegardee();
        this.appliquerTextureSauvegardee();

        if (this.postTraitApparence) {
            this.postTraitApparence.appliquer(this.etatApplication);
        }

        if (this.postTraitNettete) {
            this.postTraitNettete.appliquer(this.etatApplication);
        }

        if (this.postTraitContProfNorm) {
            this.postTraitContProfNorm.appliquer(this.etatApplication);
        }

        if (this.postTraitContoursCouleur) {
            this.postTraitContoursCouleur.appliquer(this.etatApplication);
        }

        if (this.etatApplication.contours?.miseLumiereNormalesActif && this.postTraitMiseLumiereNormales) {
            this.postTraitMiseLumiereNormales.appliquer(this.etatApplication);
        }

        if (this.etatApplication.contours?.miseLumiereCouleursActif && this.postTraitMiseLumiereCouleurs) {
            this.postTraitMiseLumiereCouleurs.appliquer(this.etatApplication);
        }
    }

    appliquerFondSceneSauvegarde() {
        const valeur = this.etatApplication.apparence?.parametres?.fondScene;

        if (!this.serviceSceneBabylon || !Number.isFinite(valeur)) {
            return;
        }

        this.serviceSceneBabylon.appliquerFondSceneDepuisPourcentage(
            this.etatApplication.scenes.scene3D,
            valeur
        );
    }

    appliquerLumiereSauvegardee() {
        const parametres = this.etatApplication.lumiere?.parametres;

        if (!this.serviceLumiereBabylon || !parametres) {
            return;
        }

        this.serviceLumiereBabylon.appliquerParametresSauvegarde(
            this.etatApplication.scenes.scene3D,
            parametres
        );

        this.controleurLumiere?.appliquerDepuisSauvegarde?.(parametres);
    }

    appliquerTextureSauvegardee() {
        const textureActive = this.etatApplication.apparence?.parametres?.textureActive;
        const tailleMotif = this.etatApplication.apparence?.parametres?.textureMotifTaille ?? 0;
        const meshes = this.etatApplication.modele3d?.meshesImportes ?? [];

        if (!this.serviceMateriauxBabylon || !textureActive || textureActive === "originale" || meshes.length === 0) {
            return;
        }

        this.serviceMateriauxBabylon.appliquerTextureProcedurale(
            meshes,
            textureActive,
            { decalageMotif: tailleMotif }
        );
    }

    mettreAJourInterfaceDepuisEtat() {
        const c = this.etatApplication.gui?.controles ?? {};
        const interfaceUtilisateur = this.etatApplication.interface?.parametres;
        const apparence = this.etatApplication.apparence?.parametres;
        const contours = this.etatApplication.contours?.parametres;
        const lumiere = this.etatApplication.lumiere?.parametres;

        if (interfaceUtilisateur) {
            this.reglerSlider(c.BdSzMenuSlider, interfaceUtilisateur.taillePolice);
            this.reglerSlider(c.BdTaiBoutonSli, interfaceUtilisateur.tailleBorduresBoutons);
            this.reglerSlider(c.BdTaiMenuSli, interfaceUtilisateur.tailleBorduresMenu);
            this.reglerTexte(c.PlcDropBtnTxt, this.libellePolice(interfaceUtilisateur.police));
        }

        if (apparence) {
            this.reglerSlider(c.NetteteSlider, apparence.nettete);
            this.reglerSlider(c.ContrasteSlider, apparence.contraste);
            this.reglerSlider(c.LuminositeSlider, apparence.luminosite);
            this.reglerSlider(c.SaturationSlider, apparence.saturation);
            this.reglerSlider(c.ThmSlider, apparence.fondScene ?? 0);

            this.reglerTextePourcentage(c.RegNetValTxt, apparence.nettete, 100);
            this.reglerTextePourcentage(c.RegConValTxt, apparence.contraste, 100);
            this.reglerTextePourcentage(c.RegLumValTxt, apparence.luminosite, 100, true);
            this.reglerTextePourcentage(c.RegLumSatTxt, apparence.saturation, 100);

            if (this.serviceSceneBabylon && c.RegThmValTxt) {
                const resultat = this.serviceSceneBabylon.appliquerFondSceneDepuisPourcentage(
                    this.etatApplication.scenes.scene3D,
                    apparence.fondScene ?? 0
                );
                this.reglerTexte(c.RegThmValTxt, resultat?.libelle ?? "Clair");
            }
        }

        if (contours) {
            this.reglerSlider(c.ContEpaiSlider, contours.epaisseur);
            this.reglerTexte(c.ContEpaiValTxt, String(Math.round(contours.epaisseur ?? 1)));
        }

        if (lumiere) {
            this.reglerSlider(c.LumIntSlider, lumiere.intensite ?? 1.2);
            this.reglerSlider(c.LumTempSlider, lumiere.temperature ?? 50);
            this.reglerTexte(c.LumDropBtnTxt, this.libelleLumiere(lumiere.typeActif));
            this.serviceControlesSpeciauxGUI?.reappliquerSliderTemperatureApresRendu?.(this.etatApplication);
        }

        this.etatApplication.gui?.advancedTexture?.markAsDirty?.();
    }

    reglerSlider(slider, valeur) {
        if (!slider || !Number.isFinite(Number(valeur))) {
            return;
        }

        slider.value = Number(valeur);
        slider._markAsDirty?.();
    }

    reglerTexte(textBlock, valeur) {
        if (!textBlock) {
            return;
        }

        textBlock.metadata = textBlock.metadata || {};
        textBlock.metadata.texteDynamique = true;
        textBlock.text = String(valeur);
        textBlock._markAsDirty?.();
    }

    reglerTextePourcentage(textBlock, valeur, facteur = 100, afficherSigne = false) {
        if (!textBlock || !Number.isFinite(Number(valeur))) {
            return;
        }

        const pourcentage = Math.round(Number(valeur) * facteur);
        this.reglerTexte(textBlock, afficherSigne && pourcentage > 0 ? `+${pourcentage}%` : `${pourcentage}%`);
    }

    libellePolice(police) {
        if (police === "OpenDyslexic") return "OpenDys";
        return police || "OpenDys";
    }

    libelleLumiere(type) {
        if (type === "haut") return "Haut";
        if (type === "bas") return "Bas";
        if (type === "tournante") return "Tournante";
        return "Principale";
    }
}
