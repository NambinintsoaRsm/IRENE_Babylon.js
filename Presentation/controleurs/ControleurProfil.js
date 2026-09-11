/**
 * @file Orchestration du chargement et des sauvegardes du profil utilisateur.
 *
 * Rôle : restaurer le profil au démarrage, déclencher la sauvegarde locale, réappliquer
 * les effets visuels et afficher la confirmation de sauvegarde manuelle.
 *
 * Utilisation : la sauvegarde automatique est silencieuse ; le bouton Enregistrer
 * appelle la même source de vérité avec afficherConfirmation=true.
 *
 * Contrainte : SauveRect/SauveText sont purement informatifs et ne doivent jamais
 * intercepter les clics de la GUI.
 */
import { constantesSauvegarde } from "../../Configuration/constantesSauvegarde.js";
import { PositionMenu } from "../../Domain/interface/PositionMenu.js";

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
                    controleurContours = null,
                    controleurInterface = null,
                    serviceMateriauxBabylon = null,
                    serviceControlesSpeciauxGUI = null,
                    postTraitApparence = null,
                    postTraitNettete = null
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
        this.controleurContours = controleurContours;
        this.controleurInterface = controleurInterface;
        this.serviceMateriauxBabylon = serviceMateriauxBabylon;
        this.serviceControlesSpeciauxGUI = serviceControlesSpeciauxGUI;

        this.postTraitApparence = postTraitApparence;
        this.postTraitNettete = postTraitNettete;

        this.sauvegardeAutomatiqueInstallee = false;
        this.timerConfirmationSauvegarde = null;
        this.frameConfirmationSauvegarde = null;
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


    /**
     * Force l'écriture immédiate du profil courant dans le stockage local.
     *
     * @param {Object} options
     * @param {boolean} [options.afficherConfirmation=false] Affiche SauveRect uniquement pour une sauvegarde explicitement demandée par l'utilisateur.
     * @returns {Object|null} Profil sauvegardé, ou null si l'écriture échoue.
     */
    sauvegarderMaintenant({ afficherConfirmation = false } = {}) {
        try {
            const profil = this.sauvegarderProfilLocalUC.executer();
            console.info("[Sauvegarde] Réglages locaux sauvegardés.");

            if (afficherConfirmation) {
                this.afficherConfirmationSauvegarde({ succes: true });
            }

            return profil;
        } catch (erreur) {
            console.warn("[Sauvegarde] Impossible de sauvegarder les réglages locaux.", erreur);

            if (afficherConfirmation) {
                this.afficherConfirmationSauvegarde({ succes: false });
            }

            return null;
        }
    }

    obtenirControleGUI(nom) {
        return this.etatApplication?.gui?.controles?.[nom]
            ?? this.etatApplication?.gui?.advancedTexture?.getControlByName?.(nom)
            ?? null;
    }

    configurerConfirmationSauvegarde() {
        const rectangle = this.obtenirControleGUI("SauveRect");
        const texte = this.obtenirControleGUI("SauveText");
        const configuration = constantesSauvegarde.confirmation;

        if (rectangle) {
            rectangle.isHitTestVisible = false;
            rectangle.isPointerBlocker = false;
            rectangle._markAsDirty?.();
        }

        if (texte) {
            texte.width = configuration.largeurTexte;
            texte.height = configuration.hauteurTexte;
            texte.isHitTestVisible = false;
            texte.isPointerBlocker = false;
            texte.textWrapping = BABYLON.GUI.TextWrapping?.WordWrap ?? true;
            texte.metadata = texte.metadata || {};
            texte.metadata.texteDynamique = true;
            texte._markAsDirty?.();
        }

        this.mettreAJourPositionConfirmationSauvegarde();
    }

    mettreAJourPositionConfirmationSauvegarde() {
        const rectangle = this.obtenirControleGUI("SauveRect");
        if (!rectangle) return;

        const menu = this.obtenirControleGUI("MainMenuRect");
        const positionMenu = this.etatApplication?.interface?.parametres?.positionMenu;
        const largeurMenuPourcentage = this.lirePourcentage(menu?.width, 20);
        const margeSupplementaire = Number(
            constantesSauvegarde.confirmation.margeHorizontaleSupplementairePourcentage
        ) || 0;
        const decalage = largeurMenuPourcentage / 2 + margeSupplementaire;
        const estAGauche = positionMenu === PositionMenu.GAUCHE || positionMenu === "gauche";

        rectangle.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        rectangle.left = `${estAGauche ? decalage : -decalage}%`;
        rectangle._markAsDirty?.();
        this.etatApplication?.gui?.advancedTexture?.markAsDirty?.();
    }

    lirePourcentage(valeur, valeurParDefaut = 0) {
        if (typeof valeur === "string") {
            const nombre = Number.parseFloat(valeur);
            return Number.isFinite(nombre) ? nombre : valeurParDefaut;
        }

        const nombre = Number(valeur);
        return Number.isFinite(nombre) ? nombre : valeurParDefaut;
    }

    afficherConfirmationSauvegarde({ succes = true } = {}) {
        const rectangle = this.obtenirControleGUI("SauveRect");
        const texte = this.obtenirControleGUI("SauveText");
        if (!rectangle || !texte) return;

        const configuration = constantesSauvegarde.confirmation;

        if (this.timerConfirmationSauvegarde) {
            clearTimeout(this.timerConfirmationSauvegarde);
            this.timerConfirmationSauvegarde = null;
        }

        if (this.frameConfirmationSauvegarde && typeof cancelAnimationFrame === "function") {
            cancelAnimationFrame(this.frameConfirmationSauvegarde);
            this.frameConfirmationSauvegarde = null;
        }

        texte.text = succes ? configuration.texteSucces : configuration.texteErreur;
        texte.metadata = texte.metadata || {};
        texte.metadata.texteDynamique = true;
        texte.metadata.responsiveTexteOriginal = texte.text;
        delete texte.metadata.dernierTexteAutoFit;

        this.serviceTexteGUI?.appliquerSurTextBlock?.(
            texte,
            this.etatApplication?.interface?.parametres
        );

        this.mettreAJourPositionConfirmationSauvegarde();

        rectangle.isVisible = true;
        rectangle.notRenderable = false;
        rectangle.alpha = 1;
        rectangle.isHitTestVisible = false;
        rectangle.isPointerBlocker = false;
        rectangle._markAsDirty?.();
        texte._markAsDirty?.();
        this.etatApplication?.gui?.advancedTexture?.markAsDirty?.();

        const suivrePosition = () => {
            if (rectangle.isVisible !== true) {
                this.frameConfirmationSauvegarde = null;
                return;
            }

            this.mettreAJourPositionConfirmationSauvegarde();

            if (typeof requestAnimationFrame === "function") {
                this.frameConfirmationSauvegarde = requestAnimationFrame(suivrePosition);
            }
        };

        if (typeof requestAnimationFrame === "function") {
            this.frameConfirmationSauvegarde = requestAnimationFrame(suivrePosition);
        }

        this.timerConfirmationSauvegarde = setTimeout(() => {
            this.masquerConfirmationSauvegarde();
        }, Math.max(0, Number(configuration.dureeAffichageMs) || 0));
    }

    masquerConfirmationSauvegarde() {
        const rectangle = this.obtenirControleGUI("SauveRect");

        if (this.timerConfirmationSauvegarde) {
            clearTimeout(this.timerConfirmationSauvegarde);
            this.timerConfirmationSauvegarde = null;
        }

        if (this.frameConfirmationSauvegarde && typeof cancelAnimationFrame === "function") {
            cancelAnimationFrame(this.frameConfirmationSauvegarde);
            this.frameConfirmationSauvegarde = null;
        }

        if (rectangle) {
            rectangle.isVisible = false;
            rectangle.alpha = 0;
            rectangle.isHitTestVisible = false;
            rectangle.isPointerBlocker = false;
            rectangle._markAsDirty?.();
        }

        this.etatApplication?.gui?.advancedTexture?.markAsDirty?.();
    }

    /**
     * Installe les sauvegardes de sécurité liées au cycle de vie de la page.
     *
     * Cette sauvegarde reste silencieuse : elle protège les réglages si l'utilisateur
     * quitte la page sans cliquer sur Enregistrer, mais n'affiche pas SauveRect.
     */
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

    /**
     * Relie le bouton Enregistrer à la même persistance que la sauvegarde automatique.
     * La différence est uniquement UX : la sauvegarde manuelle affiche une confirmation.
     *
     * @param {BABYLON.GUI.Button|null} bouton Contrôle EnrBtn.
     */
    brancherSauvegarde(bouton) {
        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            this.sauvegarderMaintenant({ afficherConfirmation: true });
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

    appliquerEffetsVisuels({ appliquerCamera = true } = {}) {
        this.serviceStyleInterfaceGUI.appliquerTheme(this.etatApplication);
        this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);

        if (appliquerCamera && this.etatApplication.camera.cameraBabylon) {
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

        // Le contrôleur Contours est l'unique point d'entrée de la V1.
        // Cette séparation garde la réintégration de nouveaux pipelines simple en V2.
        this.controleurContours?.appliquerDepuisEtat?.();
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

    restaurerReglagesApparenceDepuisProfil(profil) {
        const source = profil?.apparence;
        const courant = this.etatApplication.apparence?.parametres;

        if (!source || !courant?.copierAvec) {
            return;
        }

        const valeurs = {};
        ["nettete", "contraste", "luminosite", "saturation"].forEach((nom) => {
            const valeur = Number(source[nom]);
            if (Number.isFinite(valeur)) valeurs[nom] = valeur;
        });

        if (Object.keys(valeurs).length === 0) {
            return;
        }

        // Les choix manuels sauvegardés doivent reprendre la priorité sur les
        // valeurs automatiques appliquées au moment où le mode Accessibilité est
        // réactivé au démarrage. Le mode reste actif pour le reste de l'interface.
        this.etatApplication.apparence.parametres = courant.copierAvec(valeurs);

        const sauvegardeAvantAccessibilite = this.etatApplication.accessibilite?.sauvegardeAvantActivation;
        if (sauvegardeAvantAccessibilite) {
            sauvegardeAvantAccessibilite.apparence = {
                ...(sauvegardeAvantAccessibilite.apparence ?? {}),
                ...valeurs
            };
        }

        this.postTraitApparence?.appliquer?.(this.etatApplication);
        this.postTraitNettete?.appliquer?.(this.etatApplication);
        this.mettreAJourInterfaceDepuisEtat();

        // Deuxième synchronisation après disposition : Babylon peut reconstruire
        // le Grid Réglages lorsqu'il devient visible pour la première fois.
        const resynchroniser = () => this.mettreAJourInterfaceDepuisEtat();
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => requestAnimationFrame(resynchroniser));
        }
        setTimeout(resynchroniser, 120);
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
            this.controleurInterface?.synchroniserDropdownPoliceDepuisEtat?.();
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

            if (this.serviceSceneBabylon && c.ConfThmValTxt) {
                const resultat = this.serviceSceneBabylon.appliquerFondSceneDepuisPourcentage(
                    this.etatApplication.scenes.scene3D,
                    apparence.fondScene ?? 0
                );
                this.reglerTexte(c.ConfThmValTxt, resultat?.libelle ?? "Clair");
            }
        }

        if (contours) {
            this.reglerSlider(c.ContEpaiSlider, contours.epaisseur);
            this.reglerTexte(c.ContEpaiValTxt, String(Math.round(contours.epaisseur ?? 1)));
            this.controleurContours?.mettreAJourInterfaceDepuisEtat?.();
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
        textBlock.metadata.responsiveTexteOriginal = textBlock.text;
        delete textBlock.metadata.dernierTexteAutoFit;
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
