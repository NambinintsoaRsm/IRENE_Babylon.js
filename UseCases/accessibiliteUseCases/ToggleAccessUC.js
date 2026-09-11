/**
 * @file Cas d'utilisation d'activation/désactivation du mode Accessibilité.
 *
 * Rôle : appliquer un profil temporaire à partir des préférences navigateur tout en
 * conservant une copie des réglages normaux pour pouvoir les restaurer exactement.
 *
 * Utilisation : ControleurAccess appelle executer(); l'état persistant du profil est
 * sauvegardé après la transition sans confondre réglages temporaires et préférences.
 */
import { access } from "../../Configuration/accessibilite.js";
import { constantesApparence } from "../../Configuration/constantesApparence.js";
import { ParametresInterface } from "../../Domain/interface/ParametresInterface.js";
import { ParametresApparence } from "../../Domain/apparence/ParametresApparence.js";

export class ToggleAccessUC {
    constructor({
        etatApplication,
        accessNav,
        serviceStyleInterfaceGUI,
        serviceTexteGUI,
        serviceSceneBabylon,
        serviceLumiereBabylon,
        postTraitApparence,
        postTraitNettete,
        sauvegarderProfilLocalUC = null
    }) {
        this.etatApplication = etatApplication;
        this.accessNav = accessNav;
        this.serviceStyleInterfaceGUI = serviceStyleInterfaceGUI;
        this.serviceTexteGUI = serviceTexteGUI;
        this.serviceSceneBabylon = serviceSceneBabylon;
        this.serviceLumiereBabylon = serviceLumiereBabylon;
        this.postTraitApparence = postTraitApparence;
        this.postTraitNettete = postTraitNettete;
        this.sauvegarderProfilLocalUC = sauvegarderProfilLocalUC;
    }

    /**
     * Bascule le mode Accessibilité tout en préservant les réglages standard.
     *
     * @returns {Object} État résultant et informations utiles à la synchronisation GUI.
     */
    executer(options = {}) {
        const resultat = this.etatApplication.accessibilite?.actif
            ? this.desactiver(options)
            : this.activer(options);

        if (options.sauvegarderProfil !== false) {
            this.sauvegarderEtatAccessibilite();
        }

        return resultat;
    }

    activer({ sauvegarderProfil = false } = {}) {
        const preferences = this.accessNav.lire();

        this.etatApplication.accessibilite = this.etatApplication.accessibilite || {};

        if (!this.etatApplication.accessibilite.sauvegardeAvantActivation) {
            this.etatApplication.accessibilite.sauvegardeAvantActivation = this.creerSauvegarde();
        }

        this.etatApplication.accessibilite.preferencesNavigateur = preferences;
        this.etatApplication.accessibilite.actif = true;

        this.appliquerPreferences(preferences);
        this.forcerRafraichissementTexte();

        const resultat = { actif: true, preferences };

        return resultat;
    }

    desactiver({ sauvegarderProfil = false } = {}) {
        const sauvegarde = this.etatApplication.accessibilite?.sauvegardeAvantActivation;
        const preferences = this.etatApplication.accessibilite?.preferencesNavigateur ?? null;

        this.etatApplication.accessibilite = this.etatApplication.accessibilite || {};

        // On désactive AVANT de restaurer.
        // Sinon ServiceTexteGUI voit encore accessibilite.actif === true et réapplique
        // la taille 1rem navigateur au lieu de revenir aux tailles du guiTexture.json.
        this.etatApplication.accessibilite.actif = false;
        this.etatApplication.accessibilite.preferencesNavigateur = null;

        this.nettoyerTracesAccessibiliteTexte();
        this.etatApplication?.services?.texteResponsive?.reinitialiserBasesAutoFit?.();

        if (sauvegarde) {
            this.restaurerSauvegarde(sauvegarde);
        } else {
            this.appliquerModeStandard();
        }

        this.etatApplication.accessibilite.sauvegardeAvantActivation = null;
        this.forcerRafraichissementTexte();

        const resultat = {
            actif: false,
            preferences
        };

        return resultat;
    }

    creerSauvegarde() {
        const scene = this.etatApplication.scenes.scene3D;
        const camera = this.etatApplication.camera.cameraBabylon;

        return {
            interface: this.serialiserParametres(this.etatApplication.interface.parametres),
            apparence: this.serialiserParametres(this.etatApplication.apparence.parametres),
            animation: {
                dureeMenuLateral: this.etatApplication.animation.parametres.dureeMenuLateral,
                dureePanneauDeroulant: this.etatApplication.animation.parametres.dureePanneauDeroulant
            },
            camera: camera ? {
                wheelPrecision: camera.wheelPrecision,
                angularSensibilityX: camera.angularSensibilityX,
                angularSensibilityY: camera.angularSensibilityY
            } : null,
            lumiere: this.serviceLumiereBabylon ? {
                facteurVitesseRotation: this.serviceLumiereBabylon.facteurVitesseRotation ?? 1
            } : null,
            fondScene: scene?.clearColor
                ? {
                    r: scene.clearColor.r,
                    g: scene.clearColor.g,
                    b: scene.clearColor.b,
                    a: scene.clearColor.a
                }
                : null
        };
    }

    serialiserParametres(parametres) {
        return parametres && typeof parametres === "object"
            ? { ...parametres }
            : parametres;
    }

    appliquerPreferences(preferences) {
        const profilContraste = this.obtenirProfilContraste(preferences);
        const profilCouleur = this.obtenirProfilCouleur(preferences);
        const tailleTexteNavigateurPx = this.calculerTailleTexteNavigateurPx(preferences);

        this.appliquerMouvement(preferences);
        this.appliquerInterface({ profilContraste, profilCouleur, preferences });
        this.appliquerApparence({ profilContraste });
        this.appliquerFondScene({ profilContraste, profilCouleur });
        this.appliquerTailleTexteNavigateur(tailleTexteNavigateurPx);
        this.synchroniserGUIDepuisEtat();
    }

    obtenirProfilContraste(preferences) {
        return access.contraste[preferences?.contraste ?? "normal"] ?? access.contraste.normal;
    }

    obtenirProfilCouleur(preferences) {
        return preferences?.schemaCouleur === "dark"
            ? access.themes.dark
            : access.themes.light;
    }

    calculerTailleTexteNavigateurPx(preferences) {
        const remPx = Number(preferences?.remPx ?? access.rem.basePx);

        if (!Number.isFinite(remPx) || remPx <= 0) {
            return access.rem.basePx;
        }

        // Ici on applique directement la taille proposée par le navigateur, sans plafond.
        // Exemple : 1rem = 16px => textes à 16px ; 1rem = 52px => textes à 52px.
        return Math.round(remPx);
    }

    appliquerTailleTexteNavigateur(taillePx) {
        if (!this.serviceTexteGUI?.appliquerTailleNavigateurPx) return;

        this.serviceTexteGUI.appliquerTailleNavigateurPx(
            this.etatApplication,
            taillePx
        );
    }

    appliquerMouvement(preferences) {
        const animation = this.etatApplication.animation.parametres;
        const camera = this.etatApplication.camera.cameraBabylon;

        if (!preferences?.reductionMouvement) return;

        animation.dureeMenuLateral = access.animationDefaut.dureeMenuLateral * access.mouvement.facteurDuree;
        animation.dureePanneauDeroulant = access.animationDefaut.dureePanneauDeroulant * access.mouvement.facteurDuree;

        if (this.serviceLumiereBabylon) {
            this.serviceLumiereBabylon.facteurVitesseRotation = access.mouvement.facteurVitesseLumiere;
        }

        if (camera) {
            camera.wheelPrecision = access.cameraDefaut.wheelPrecision * access.mouvement.facteurSensibiliteCamera;
            camera.angularSensibilityX = access.cameraDefaut.sensibiliteRotation * access.mouvement.facteurSensibiliteCamera;
            camera.angularSensibilityY = access.cameraDefaut.sensibiliteRotation * access.mouvement.facteurSensibiliteCamera;
        }
    }

    appliquerInterface({ profilContraste, profilCouleur, preferences }) {
        const actuel = this.etatApplication.interface.parametres;

        this.etatApplication.interface.parametres = actuel.copierAvec({
            // On ne touche ni à la famille de police ni au réglage manuel de taille.
            // La taille navigateur est appliquée directement aux TextBlock après le thème.
            taillePolice: actuel.taillePolice,
            theme: profilCouleur.themeInterface,
            tailleBorduresMenu: preferences?.couleursForcees ? Math.max(profilContraste.bordureMenu, 4) : profilContraste.bordureMenu,
            tailleBorduresBoutons: preferences?.couleursForcees ? Math.max(profilContraste.bordureBouton, 4) : profilContraste.bordureBouton
        });

        this.serviceStyleInterfaceGUI.appliquerTheme(this.etatApplication);
        this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);
    }

    appliquerApparence({ profilContraste }) {
        const actuel = this.etatApplication.apparence.parametres;

        this.etatApplication.apparence.parametres = actuel.copierAvec({
            contraste: this.limiter(profilContraste.contraste, constantesApparence.contraste.min, constantesApparence.contraste.max),
            nettete: this.limiter(profilContraste.nettete, constantesApparence.nettete.min, constantesApparence.nettete.max),
            luminosite: this.limiter(profilContraste.luminosite, constantesApparence.luminosite.min, constantesApparence.luminosite.max),
            saturation: this.limiter(profilContraste.saturation, constantesApparence.saturation.min, constantesApparence.saturation.max)
        });

        this.postTraitApparence.appliquer(this.etatApplication);
        this.postTraitNettete.appliquer(this.etatApplication);
    }

    appliquerFondScene({ profilContraste, profilCouleur }) {
        const scene = this.etatApplication.scenes.scene3D;
        const valeur = profilContraste.fondScene ?? profilCouleur.fondScene ?? 0;
        this.serviceSceneBabylon.appliquerFondSceneDepuisPourcentage(scene, valeur);
    }

    restaurerSauvegarde(sauvegarde) {
        const camera = this.etatApplication.camera.cameraBabylon;
        const scene = this.etatApplication.scenes.scene3D;

        this.etatApplication.interface.parametres = sauvegarde.interface instanceof ParametresInterface
            ? sauvegarde.interface
            : new ParametresInterface(sauvegarde.interface ?? {});

        this.etatApplication.apparence.parametres = sauvegarde.apparence instanceof ParametresApparence
            ? sauvegarde.apparence
            : new ParametresApparence(sauvegarde.apparence ?? {});

        if (sauvegarde.animation) {
            this.etatApplication.animation.parametres.dureeMenuLateral = sauvegarde.animation.dureeMenuLateral;
            this.etatApplication.animation.parametres.dureePanneauDeroulant = sauvegarde.animation.dureePanneauDeroulant;
        }

        if (camera && sauvegarde.camera) {
            camera.wheelPrecision = sauvegarde.camera.wheelPrecision;
            camera.angularSensibilityX = sauvegarde.camera.angularSensibilityX;
            camera.angularSensibilityY = sauvegarde.camera.angularSensibilityY;
        }

        if (this.serviceLumiereBabylon && sauvegarde.lumiere) {
            this.serviceLumiereBabylon.facteurVitesseRotation = sauvegarde.lumiere.facteurVitesseRotation;
        }

        if (scene && sauvegarde.fondScene) {
            scene.clearColor = new BABYLON.Color4(
                sauvegarde.fondScene.r,
                sauvegarde.fondScene.g,
                sauvegarde.fondScene.b,
                sauvegarde.fondScene.a ?? 1
            );
        }

        this.appliquerModeStandard();
    }

    appliquerModeStandard() {
        this.nettoyerTracesAccessibiliteTexte();
        this.etatApplication?.services?.texteResponsive?.reinitialiserBasesAutoFit?.();
        this.serviceStyleInterfaceGUI.appliquerTheme(this.etatApplication);
        this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);
        this.postTraitApparence.appliquer(this.etatApplication);
        this.postTraitNettete.appliquer(this.etatApplication);
        this.synchroniserGUIDepuisEtat();
        this.relancerAutoFitTexte();
    }

    nettoyerTracesAccessibiliteTexte() {
        const advancedTexture = this.etatApplication?.gui?.advancedTexture;

        if (!advancedTexture?.getDescendants) {
            return;
        }

        advancedTexture.getDescendants().forEach((controle) => {
            if (!(controle instanceof BABYLON.GUI.TextBlock)) {
                return;
            }

            const metadata = controle.metadata ?? {};
            const tailleNormale = metadata.fontSizeAvantAccessibilite
                ?? metadata.fontSizeOriginal;

            if (tailleNormale !== undefined && metadata.tailleAccessibiliteNavigateurPx !== undefined) {
                controle.fontSize = tailleNormale;
            }

            delete metadata.tailleAccessibiliteNavigateurPx;
            delete metadata.fontSizeAvantAccessibilite;
            delete metadata.responsiveFontSizeBasePx;
            delete metadata.accessibiliteFontSizePx;
            delete metadata.facteurAccessibiliteTaille;
            delete metadata.roleAccessibilite;
            delete metadata.tailleMinAutoFitPx;
            delete metadata.facteurMinAutoFit;
            delete metadata.lignesMaxAutoFit;

            controle.metadata = metadata;
            controle._markAsDirty?.();
        });

        advancedTexture.markAsDirty?.();
    }

    relancerAutoFitTexte() {
        const service = this.etatApplication?.services?.texteResponsive;

        service?.planifierAjustement?.(20);
        setTimeout(() => service?.planifierAjustement?.(80), 40);
        setTimeout(() => service?.planifierAjustement?.(160), 120);
    }

    forcerRafraichissementTexte() {
        const serviceTexte = this.serviceTexteGUI;
        const serviceResponsive = this.etatApplication?.services?.texteResponsive;
        const serviceListeModeles = this.etatApplication?.services?.listeModelesGUI;
        const actif = this.etatApplication?.accessibilite?.actif === true;
        const preferences = this.etatApplication?.accessibilite?.preferencesNavigateur ?? this.accessNav?.lire?.() ?? null;
        const taillePx = actif ? this.calculerTailleTexteNavigateurPx(preferences) : null;

        const appliquer = () => {
            if (!actif) {
                serviceResponsive?.reinitialiserBasesAutoFit?.();
            }

            serviceListeModeles?.actualiserStylesBoutonsModeles?.(this.etatApplication);
            serviceTexte?.appliquerParametresTexte?.(this.etatApplication);

            if (actif && Number.isFinite(taillePx) && taillePx > 0) {
                // On force la taille accessibilité après l'auto-style des boutons,
                // sinon certains libellés, notamment les modèles, ne changent
                // qu'après un rechargement complet de la page.
                serviceTexte?.appliquerTailleNavigateurPx?.(this.etatApplication, taillePx);
            }

            this.etatApplication.gui?.advancedTexture?.markAsDirty?.();
        };

        appliquer();
        serviceResponsive?.ajuster?.();
        this.relancerAutoFitTexte();

        const appliquerPuisAjuster = () => {
            appliquer();
            serviceResponsive?.ajuster?.();
            this.relancerAutoFitTexte();
        };

        requestAnimationFrame(appliquerPuisAjuster);
        setTimeout(appliquerPuisAjuster, 60);
        setTimeout(appliquerPuisAjuster, 160);
        setTimeout(appliquerPuisAjuster, 320);
    }

    sauvegarderEtatAccessibilite() {
        try {
            this.sauvegarderProfilLocalUC?.executer?.();
        } catch (erreur) {
            console.warn("[Accessibilité] Impossible de sauvegarder l'état d'accessibilité.", erreur);
        }
    }

    synchroniserGUIDepuisEtat() {
        const c = this.etatApplication.gui?.controles ?? {};
        const apparence = this.etatApplication.apparence.parametres;
        const interf = this.etatApplication.interface.parametres;
        const fondScene = this.etatApplication.scenes.scene3D?.clearColor;

        this.reglerSliderEtTexte(c.NetteteSlider, c.RegNetValTxt, apparence.nettete, false);
        this.reglerSliderEtTexte(c.ContrasteSlider, c.RegConValTxt, apparence.contraste, false);
        this.reglerSliderEtTexte(c.LuminositeSlider, c.RegLumValTxt, apparence.luminosite, true);
        this.reglerSliderEtTexte(c.SaturationSlider, c.RegLumSatTxt, apparence.saturation, false);

        if (c.BdTaiMenuSli) c.BdTaiMenuSli.value = interf.tailleBorduresMenu;
        if (c.BdTaiMenValTxt) c.BdTaiMenValTxt.text = String(Math.round(interf.tailleBorduresMenu));
        if (c.BdTaiBoutonSli) c.BdTaiBoutonSli.value = interf.tailleBorduresBoutons;
        if (c.BdTaiBouValTxt) c.BdTaiBouValTxt.text = String(Math.round(interf.tailleBorduresBoutons));

        if (c.BdSzMenuSlider) {
            // Les bornes du slider sont pilotées par ControleurInterface :
            // minimum issu de la GUI, maximum calculé selon la police et les
            // contenants. Le mode Accessibilité ne doit jamais les écraser.
            c.BdSzMenuSlider.value = interf.taillePolice;
        }

        if (c.PoliTailleValTxt) {
            c.PoliTailleValTxt.text = interf.taillePolice > 0
                ? `+${Math.round(interf.taillePolice)}%`
                : `${Math.round(interf.taillePolice)}%`;
        }

        if (c.ThmSlider && fondScene) {
            const valeurFond = Math.round((1 - fondScene.r) * 100);
            c.ThmSlider.value = valeurFond;
            if (c.ConfThmValTxt) {
                c.ConfThmValTxt.text = valeurFond <= 33 ? "Clair" : valeurFond >= 67 ? "Sombre" : "Gris";
            }
        }

        this.etatApplication.gui.advancedTexture?.markAsDirty?.();
    }

    reglerSliderEtTexte(slider, texte, valeur, signe = false) {
        if (slider) slider.value = valeur;
        if (!texte) return;
        const pourcentage = Math.round(valeur * 100);
        texte.metadata = texte.metadata || {};
        texte.metadata.texteDynamique = true;
        texte.text = signe && pourcentage > 0 ? `+${pourcentage}%` : `${pourcentage}%`;
        texte.metadata.responsiveTexteOriginal = texte.text;
        delete texte.metadata.dernierTexteAutoFit;
        texte._markAsDirty?.();
    }

    limiter(valeur, min, max) {
        return Math.max(min, Math.min(max, Number(valeur)));
    }
}
