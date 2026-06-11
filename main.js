import { chemins } from "./Configuration/chemins.js";
import { constantesCamera } from "./Configuration/constantesCamera.js";
import { constantesApparence } from "./Configuration/constantesApparence.js";
import { constantesInterface } from "./Configuration/constantesInterface.js";
import { etatApplication } from "./Etat/etatApplication.js";

import { FabriqueMoteurBabylon } from "./Infrastructure/babylon/FabriqueMoteurBabylon.js";
import { FabriqueScene3D } from "./Infrastructure/babylon/FabriqueScene3D.js";
import { FabriqueSceneGUI } from "./Infrastructure/babylon/FabriqueSceneGUI.js";
import { ChargeurModeleBabylon } from "./Infrastructure/babylon/ChargeurModeleBabylon.js";
import { ServiceSceneBabylon } from "./Infrastructure/babylon/ServiceSceneBabylon.js";
import { ServiceCameraBabylon } from "./Infrastructure/babylon/ServiceCameraBabylon.js";
import { ServiceCadrageCameraBabylon } from "./Infrastructure/babylon/ServiceCadrageCameraBabylon.js";
import { ServiceNormalisationModeleBabylon } from "./Infrastructure/babylon/ServiceNormalisationModeleBabylon.js";
import { ServiceOrientationModeleBabylon } from "./Infrastructure/babylon/ServiceOrientationModeleBabylon.js";
import { ServiceMateriauxBabylon } from "./Infrastructure/babylon/ServiceMateriauxBabylon.js";
import { ServiceLumiereBabylon } from "./Infrastructure/babylon/ServiceLumiereBabylon.js";
import { BoucleRenduBabylon } from "./Infrastructure/babylon/BoucleRenduBabylon.js";

import { ChargeurInterfaceGUI } from "./Infrastructure/gui/ChargeurInterfaceGUI.js";
import { RechercheControleGUI } from "./Infrastructure/gui/RechercheControleGUI.js";
import { ServiceDimensionsGUI } from "./Infrastructure/gui/ServiceDimensionsGUI.js";
import { ServiceAnimationGUI } from "./Infrastructure/gui/ServiceAnimationGUI.js";
import { ServiceDropdownGUI } from "./Infrastructure/gui/ServiceDropdownGUI.js";
import { ServiceStyleInterfaceGUI } from "./Infrastructure/gui/ServiceStyleInterfaceGUI.js";
import { ServiceStyleBoutonsGUI } from "./Infrastructure/gui/ServiceStyleBoutonsGUI.js";
import { ServiceTexteGUI } from "./Infrastructure/gui/ServiceTexteGUI.js";
import { ServiceBlocagePointeurGUI } from "./Infrastructure/gui/ServiceBlocagePointeurGUI.js";
import { ServiceListeModelesGUI } from "./Infrastructure/gui/ServiceListeModelesGUI.js";

import { ServicePolicesNavigateur } from "./Infrastructure/accessibilite/ServicePolicesNavigateur.js";
import { ServiceAccessibiliteNavigateur } from "./Infrastructure/accessibilite/ServiceAccessibiliteNavigateur.js";
import { ServiceMesureTexteNavigateur } from "./Infrastructure/accessibilite/ServiceMesureTexteNavigateur.js";

import { PostTraitApparence } from "./Infrastructure/postTraitements/PostTraitApparence.js";
import { PostTraitNettete } from "./Infrastructure/postTraitements/PostTraitNettete.js";
import { PostTraitContProfNorm } from "./Infrastructure/postTraitements/PostTraitContProfNorm.js";
import { PostTraitContoursCouleur } from "./Infrastructure/postTraitements/PostTraitementContoursCouleur.js";

import { StockageProfilLocal } from "./Infrastructure/stockage/StockageProfilLocal.js";

import { BasculerMenuUC } from "./UseCases/animIntUseCases/BasculerMenuUC.js";
import { BasculerSectionUC } from "./UseCases/animIntUseCases/BasculerSectionUC.js";
import { FermerSectionsUC } from "./UseCases/animIntUseCases/FermerSectionsUC.js";

import { ChangerPoliceUC } from "./UseCases/interfaceUseCases/ChangerPoliceUC.js";
import { ChangerTaillePoliceUC } from "./UseCases/interfaceUseCases/ChangerTaillePoliceUC.js";
import { ChangerThemeInterfaceUC } from "./UseCases/interfaceUseCases/ChangerThemeInterfaceUC.js";
import { ChangerPositionMenuUC } from "./UseCases/interfaceUseCases/ChangerPositionMenuUC.js";
import { ChangerBordureMenuUC } from "./UseCases/interfaceUseCases/ChangerBordureMenuUC.js";
import { ChangerBordureBoutonUC } from "./UseCases/interfaceUseCases/ChangerBordureBoutonUC.js";
import { ChangerGrasUC } from "./UseCases/interfaceUseCases/ChangerGrasUC.js";
import { ReinitialiserInterfaceUC } from "./UseCases/interfaceUseCases/ReinitialiserInterfaceUC.js";

import { ChangerContrasteUC } from "./UseCases/apparenceUseCases/ChangerContrasteUC.js";
import { ChangerLuminositeUC } from "./UseCases/apparenceUseCases/ChangerLuminositeUC.js";
import { ChangerSaturationUC } from "./UseCases/apparenceUseCases/ChangerSaturationUC.js";
import { ChangerNetteteUC } from "./UseCases/apparenceUseCases/ChangerNetteteUC.js";
import { ChangerTextureUC } from "./UseCases/apparenceUseCases/ChangerTextureUC.js";
import { ReinitialiserApparenceUC } from "./UseCases/apparenceUseCases/ReinitialiserApparenceUC.js";

import { ActiverSilhouetteUC } from "./UseCases/contoursUseCases/ActiverSilhouetteUC.js";
import { ActiverReliefUC } from "./UseCases/contoursUseCases/ActiverReliefUC.js";
import { ActiverContourCouleurUC } from "./UseCases/contoursUseCases/ActiverContourCouleurUC.js";
import { ChangerEpaisseurContourUC } from "./UseCases/contoursUseCases/ChangerEpaisseurContourUC.js";
import { ChangerCouleurContourUC } from "./UseCases/contoursUseCases/ChangerCouleurContourUC.js";
import { DesactiverContoursUC } from "./UseCases/contoursUseCases/DesactiverContoursUC.js";
import { ReinitialiserContoursUC } from "./UseCases/contoursUseCases/ReinitialiserContoursUC.js";

import { ChangerVitesseCameraUC } from "./UseCases/cameraUseCases/ChangerVitesseCameraUC.js";
import { ReinitialiserCameraUC } from "./UseCases/cameraUseCases/ReinitialiserCameraUC.js";
import { BloquerCameraUC } from "./UseCases/cameraUseCases/BloquerCameraUC.js";
import { DebloquerCameraUC } from "./UseCases/cameraUseCases/DebloquerCameraUC.js";

import { ListerModelesUC } from "./UseCases/modele3dUseCases/ListerModelesUC.js";
import { ChangerModeleActifUC } from "./UseCases/modele3dUseCases/ChangerModeleActifUC.js";
import { ChargerModeleUC } from "./UseCases/modele3dUseCases/ChargerModeleUC.js";
import { SupprimerModeleActuelUC } from "./UseCases/modele3dUseCases/SupprimerModeleActuelUC.js";
import { NormaliserModeleUC } from "./UseCases/modele3dUseCases/NormaliserModeleUC.js";
import { ChoisirVueEntropieUC } from "./UseCases/modele3dUseCases/ChoisirVueEntropieUC.js";

import { ChargerProfilLocalUC } from "./UseCases/profilUseCases/ChargerProfilLocalUC.js";
import { SauvegarderProfilLocalUC } from "./UseCases/profilUseCases/SauvegarderProfilLocalUC.js";
import { AppliquerProfilUC } from "./UseCases/profilUseCases/AppliquerProfilUC.js";
import { ReinitialiserProfilUC } from "./UseCases/profilUseCases/ReinitialiserProfilUC.js";

import { ControleurAnimationInterface } from "./Presentation/controleurs/ControleurAnimationInterface.js";
import { ControleurInterface } from "./Presentation/controleurs/ControleurInterface.js";
import { ControleurApparence } from "./Presentation/controleurs/ControleurApparence.js";
import { ControleurContours } from "./Presentation/controleurs/ControleurContours.js";
import { ControleurCamera } from "./Presentation/controleurs/ControleurCamera.js";
import { ControleurModele3D } from "./Presentation/controleurs/ControleurModele3D.js";
import { ControleurProfil } from "./Presentation/controleurs/ControleurProfil.js";
import { ControleurLumiere } from "./Presentation/controleurs/ControleurLumiere.js";

const NOMS_GUI = Object.freeze({
    menu: {
        rect: "MainMenuRect",
        stackPrincipal: "MainStaPan",
        flecheRect: "FlecheMenuRect",
        flecheBtn: "FlecheMenuBtn",
        flecheTxt: "FlecheMenuBtnTxt"
    },

    accordions: {
        configurations: { bouton: "ConfBtn", rect: "ConfOptnRect", fleche: "ConfDropBtnTxt", hauteur: 160 },
        reglages: { bouton: "RegBtn", rect: "RegOptnRect", fleche: "RegBtnDropTxt", hauteur: 600 }
    },

    panneaux: {
        police: { bouton: "PolBtn", panneau: "PoliRect", retour: "PoliRetourBtn" },
        menu: { bouton: "MenuBtn", panneau: "MenuRect", retour: "MenuRetourBtn" },
        contours: { bouton: "ContBtn", panneau: "ContoRect", retour: "ContRetourBtn" },
        texture: { bouton: "TextuBtn", panneau: "TextuRect", retour: "TxtuRetourBtn" },
        lumiere: { bouton: "LumBtn", panneau: "LumRect", retour: "LumRetourBtn" },
        modeles: { bouton: "Mod3DBtn", panneau: "ModelRect", retour: "ModelRetourBtn" }
    },

    police: {
        boutonDropdown: "PlcDropBtn",
        texteSelection: "PlcDropBtnTxt",
        liste: "PlcTyPoScrollV",
        options: [
            { bouton: "FntFmBtn0", valeur: "Liberation" },
            { bouton: "FntFmBtn1", valeur: "Luciole" },
            { bouton: "FntFmBtn2", valeur: "Tiresias" },
            { bouton: "FntFmBtn3", valeur: "Arial" }
        ],
        grasBtn: "PoliGrasBtn",
        tailleSlider: "BdSzMenuSlider",
        tailleValeurTxt: "PoliTailleValTxt",
        reinitialiserBtn: "PoliReintBtn"
    },

    menuReglages: {
        gaucheBtn: "GaucheBtn",
        droiteBtn: "DroitBtn",
        blancBtn: "BlancBtn",
        noirBtn: "NoirBtn",
        grisClairBtn: "GrisBtn",
        grisFonceBtn: "GrisFoncBtn",
        bordureBoutonSlider: "BdTaiBoutonSli",
        bordureBoutonValeurTxt: "BdTaiBouValTxt",
        bordureMenuSlider: "BdTaiMenuSli",
        bordureMenuValeurTxt: "BdTaiMenValTxt",
        reinitialiserBtn: "MenuReintBtn"
    },

    apparence: {
        netteteSlider: "NetteteSlider",
        netteteValeurTxt: "RegNetValTxt",
        contrasteSlider: "ContrasteSlider",
        contrasteValeurTxt: "RegConValTxt",
        luminositeSlider: "LuminositeSlider",
        luminositeValeurTxt: "RegLumValTxt",
        saturationSlider: "SaturationSlider",
        saturationValeurTxt: "RegLumSatTxt",
        themeSceneSlider: "ThmSlider",
        themeSceneValeurTxt: "RegThmValTxt",
        reinitialiserBtn: "RegReintBtn"
    },

    contours: {
        silhouetteBtn: "ContDBtn",
        reliefBtn: "ContNBtn",
        couleurBtn: "ContCBtn",
        epaisseurSlider: "ContEpaiSlider",
        epaisseurValeurTxt: "ContEpaiValTxt",
        couleurs: ["ContBtn1", "ContBtn2", "ContBtn3", "ContBtn4", "ContBtn5", "ContBtn6", "ContBtn7", "ContBtn8"]
    },

    texture: {
        originaleBtn: "TxtuBtn0",
        damierBtn: "TxtuBtn1",
        rayuresBtn: "TxtuBtn2"
    },

    camera: {
        zoomReinitBtn: "ZoomReintBtn",
        reinitZoomBtn: "ReintZoomsBtn",
        reinitPositionBtn: "ReintPosBtn"
    },

    modeles: {
        conteneurListe: "MdlScrollStkPnl",
        objet1Btn: "MdlBtn0",
        objet2Btn: "MdlBtn1"
    }
});

function obtenir(controles, nom) {
    return nom ? controles[nom] ?? null : null;
}

function collecterNomsGUI(objet, resultat = []) {
    if (!objet) return resultat;
    if (typeof objet === "string") {
        resultat.push(objet);
        return resultat;
    }
    if (Array.isArray(objet)) {
        objet.forEach((element) => collecterNomsGUI(element, resultat));
        return resultat;
    }
    if (typeof objet === "object") {
        Object.values(objet).forEach((valeur) => collecterNomsGUI(valeur, resultat));
    }
    return resultat;
}

function recupererTousLesControles(advancedTexture) {
    const recherche = new RechercheControleGUI(advancedTexture);
    const controles = {};

    collecterNomsGUI(NOMS_GUI).forEach((nom) => {
        controles[nom] = recherche.obtenir(nom, false);
    });

    [
        "PlcDropBtnIcoTxt", "PlcDropBtnDropTxt", "PlcScrollVStkPnl",
        "PoliGrasBtnTxt",

        // Contrôles internes du panneau Lumière.
        // Ils ne sont pas dans NOMS_GUI, donc sans cette liste le contrôleur
        // reçoit null et rien ne se branche : dropdown, intensité, choix Haut/Bas/Tournante.
        "LumDropBtn", "LumDropBtnGrid", "LumDropBtnTxt", "LumDropBtnIcoTxt",
        "LumTypScroll", "LumTypScroStaPa",
        "LumTypBtn0", "LumTypBtn0Txt",
        "LumTypBtn1", "LumTypBtn1Txt",
        "LumTypBtn2", "LumTypBtn2Txt",
        "LumIntSlider", "LumIntValTxt", "LumIntTxt",
        "LumTempSlider", "LumTempValTxt", "LumTempTxt",
        "LumReintBtn", "LumReintBtnTxt",

        "ZoomBtn", "ZoomBtnDropTxt", "ZoomReintBtn"
    ].forEach((nom) => {
        controles[nom] = recherche.obtenir(nom, false);
    });

    return controles;
}

function majTexteValeur(textBlock, valeur, decimals = 1) {
    if (!textBlock) return;
    textBlock.text = Number(valeur).toFixed(decimals);
}

function reglerSlider(slider, { min, max, step, value }) {
    if (!slider) return;
    slider.minimum = min;
    slider.maximum = max;
    slider.step = step;
    slider.value = value;
}

async function main() {
    const canvas = document.getElementById("renderCanvas");
    if (!canvas) throw new Error("Canvas renderCanvas introuvable.");

    etatApplication.canvas = canvas;

    const fabriqueMoteur = new FabriqueMoteurBabylon();
    const fabriqueScene3D = new FabriqueScene3D();
    const fabriqueSceneGUI = new FabriqueSceneGUI();

    const serviceCameraBabylon = new ServiceCameraBabylon();
    const serviceSceneBabylon = new ServiceSceneBabylon();
    const chargeurModeleBabylon = new ChargeurModeleBabylon();
    const serviceOrientationModeleBabylon = new ServiceOrientationModeleBabylon();
    const serviceNormalisationModeleBabylon = new ServiceNormalisationModeleBabylon();
    const serviceCadrageCameraBabylon = new ServiceCadrageCameraBabylon();
    const serviceMateriauxBabylon = new ServiceMateriauxBabylon();
    const serviceLumiereBabylon = new ServiceLumiereBabylon();
    const serviceEntropieVueBabylon = null;
    const boucleRenduBabylon = new BoucleRenduBabylon();

    etatApplication.moteur = fabriqueMoteur.creer(canvas);
    etatApplication.scenes.scene3D = fabriqueScene3D.creer(etatApplication.moteur);

    etatApplication.camera.cameraBabylon = serviceCameraBabylon.creerCamera(
        etatApplication.scenes.scene3D,
        canvas,
        etatApplication.camera.parametres
    );

    serviceCameraBabylon.memoriserPositionInitiale(etatApplication);

    // GUI séparée de la scène 3D : les post-traitements 3D ne touchent plus les menus.
    etatApplication.scenes.sceneGUI = fabriqueSceneGUI.creerScene(etatApplication.moteur);
    etatApplication.gui.advancedTexture = fabriqueSceneGUI.creerTexture(etatApplication.scenes.sceneGUI);

    const chargeurInterfaceGUI = new ChargeurInterfaceGUI();
    const serviceDimensionsGUI = new ServiceDimensionsGUI();
    const serviceAnimationGUI = new ServiceAnimationGUI(serviceDimensionsGUI, etatApplication.scenes.sceneGUI);
    const serviceDropdownGUI = new ServiceDropdownGUI();
    const serviceStyleInterfaceGUI = new ServiceStyleInterfaceGUI();
    const serviceStyleBoutonsGUI = new ServiceStyleBoutonsGUI();
    const serviceTexteGUI = new ServiceTexteGUI();
    const serviceBlocagePointeurGUI = new ServiceBlocagePointeurGUI();
    const serviceListeModelesGUI = new ServiceListeModelesGUI();

    const servicePolicesNavigateur = new ServicePolicesNavigateur();
    const serviceAccessibiliteNavigateur = new ServiceAccessibiliteNavigateur();
    const serviceMesureTexteNavigateur = new ServiceMesureTexteNavigateur();

    await servicePolicesNavigateur.chargerPolices(constantesInterface.policesDisponibles);
    await chargeurInterfaceGUI.chargerDepuisJson(etatApplication.gui.advancedTexture, chemins.gui.fichier);

    etatApplication.gui.controles = recupererTousLesControles(etatApplication.gui.advancedTexture);

    etatApplication.accessibilite = {
        preferencesNavigateur: serviceAccessibiliteNavigateur.lirePreferences(),
        serviceMesureTexteNavigateur
    };

    const postTraitApparence = new PostTraitApparence();
    const postTraitNettete = new PostTraitNettete();
    const postTraitContProfNorm = new PostTraitContProfNorm();
    const postTraitContoursCouleur = new PostTraitContoursCouleur();
    const stockageProfilLocal = new StockageProfilLocal();

    const basculerMenuUC = new BasculerMenuUC(etatApplication);
    const basculerSectionUC = new BasculerSectionUC(etatApplication);
    const fermerSectionsUC = new FermerSectionsUC(etatApplication);

    const changerPoliceUC = new ChangerPoliceUC(etatApplication);
    const changerTaillePoliceUC = new ChangerTaillePoliceUC(etatApplication);
    const changerThemeInterfaceUC = new ChangerThemeInterfaceUC(etatApplication);
    const changerPositionMenuUC = new ChangerPositionMenuUC(etatApplication);
    const changerBordureMenuUC = new ChangerBordureMenuUC(etatApplication);
    const changerBordureBoutonUC = new ChangerBordureBoutonUC(etatApplication);
    const changerGrasUC = new ChangerGrasUC(etatApplication);
    const reinitialiserInterfaceUC = new ReinitialiserInterfaceUC(etatApplication);

    const changerContrasteUC = new ChangerContrasteUC(etatApplication);
    const changerLuminositeUC = new ChangerLuminositeUC(etatApplication);
    const changerSaturationUC = new ChangerSaturationUC(etatApplication);
    const changerNetteteUC = new ChangerNetteteUC(etatApplication);
    const changerTextureUC = new ChangerTextureUC(etatApplication);
    const reinitialiserApparenceUC = new ReinitialiserApparenceUC(etatApplication);

    const activerSilhouetteUC = new ActiverSilhouetteUC(etatApplication);
    const activerReliefUC = new ActiverReliefUC(etatApplication);
    const activerContourCouleurUC = new ActiverContourCouleurUC(etatApplication);
    const changerEpaisseurContourUC = new ChangerEpaisseurContourUC(etatApplication);
    const changerCouleurContourUC = new ChangerCouleurContourUC(etatApplication);
    const desactiverContoursUC = new DesactiverContoursUC(etatApplication);
    const reinitialiserContoursUC = new ReinitialiserContoursUC(etatApplication);

    const changerVitesseCameraUC = new ChangerVitesseCameraUC(etatApplication);
    const reinitialiserCameraUC = new ReinitialiserCameraUC(etatApplication);
    const bloquerCameraUC = new BloquerCameraUC(etatApplication);
    const debloquerCameraUC = new DebloquerCameraUC(etatApplication);

    const listerModelesUC = new ListerModelesUC(etatApplication);
    const changerModeleActifUC = new ChangerModeleActifUC(etatApplication);
    const chargerModeleUC = new ChargerModeleUC(etatApplication);
    const supprimerModeleActuelUC = new SupprimerModeleActuelUC(etatApplication);
    const normaliserModeleUC = new NormaliserModeleUC(etatApplication);
    const choisirVueEntropieUC = new ChoisirVueEntropieUC(etatApplication);

    const chargerProfilLocalUC = new ChargerProfilLocalUC(etatApplication, stockageProfilLocal);
    const sauvegarderProfilLocalUC = new SauvegarderProfilLocalUC(etatApplication, stockageProfilLocal);
    const appliquerProfilUC = new AppliquerProfilUC(etatApplication);
    const reinitialiserProfilUC = new ReinitialiserProfilUC(etatApplication);

    const controleurAnimationInterface = new ControleurAnimationInterface({
        etatApplication,
        basculerMenuUC,
        basculerSectionUC,
        fermerSectionsUC,
        serviceAnimationGUI,
        serviceDimensionsGUI,
        serviceBlocagePointeurGUI,
        bloquerCameraUC,
        debloquerCameraUC,
        serviceCameraBabylon
    });

    const controleurInterface = new ControleurInterface({
        etatApplication,
        changerPoliceUC,
        changerTaillePoliceUC,
        changerThemeInterfaceUC,
        changerPositionMenuUC,
        changerBordureMenuUC,
        changerBordureBoutonUC,
        changerGrasUC,
        reinitialiserInterfaceUC,
        serviceTexteGUI,
        serviceStyleInterfaceGUI,
        serviceStyleBoutonsGUI,
        serviceDropdownGUI,
        servicePolicesNavigateur
    });

    const controleurApparence = new ControleurApparence({
        etatApplication,
        changerContrasteUC,
        changerLuminositeUC,
        changerSaturationUC,
        changerNetteteUC,
        changerTextureUC,
        reinitialiserApparenceUC,
        postTraitApparence,
        postTraitNettete,
        serviceMateriauxBabylon,
        serviceSceneBabylon
    });

    const controleurContours = new ControleurContours({
        etatApplication,
        activerSilhouetteUC,
        activerReliefUC,
        activerContourCouleurUC,
        changerEpaisseurContourUC,
        changerCouleurContourUC,
        desactiverContoursUC,
        reinitialiserContoursUC,
        postTraitContProfNorm,
        postTraitContoursCouleur
    });

    const controleurCamera = new ControleurCamera({
        etatApplication,
        changerVitesseCameraUC,
        reinitialiserCameraUC,
        serviceCameraBabylon
    });

    const controleurModele3D = new ControleurModele3D({
        etatApplication,
        listerModelesUC,
        changerModeleActifUC,
        chargerModeleUC,
        supprimerModeleActuelUC,
        normaliserModeleUC,
        choisirVueEntropieUC,
        serviceListeModelesGUI,
        serviceSceneBabylon,
        chargeurModeleBabylon,
        serviceOrientationModeleBabylon,
        serviceNormalisationModeleBabylon,
        serviceCadrageCameraBabylon,
        serviceMateriauxBabylon,
        serviceCameraBabylon,
        serviceEntropieVueBabylon,
        constantesCamera
    });

    const controleurProfil = new ControleurProfil({
        etatApplication,
        chargerProfilLocalUC,
        sauvegarderProfilLocalUC,
        appliquerProfilUC,
        reinitialiserProfilUC,
        serviceStyleInterfaceGUI,
        serviceTexteGUI,
        serviceCameraBabylon,
        postTraitApparence,
        postTraitNettete,
        postTraitContProfNorm,
        postTraitContoursCouleur
    });

    const controleurLumiere = new ControleurLumiere({
        etatApplication,
        serviceLumiereBabylon
    });

    brancherAnimationInterface(controleurAnimationInterface);
    controleurInterface.brancherDepuisNomsGUI(NOMS_GUI, serviceAnimationGUI);
    brancherApparence(controleurApparence);
    brancherContours(controleurContours);
    controleurCamera.brancherDepuisNomsGUI(NOMS_GUI.camera);
    controleurLumiere.brancherDepuisNomsGUI();
    brancherModele3D(controleurModele3D);

    controleurProfil.chargerProfilAuDemarrage();
    serviceStyleInterfaceGUI.appliquerTheme(etatApplication);
    serviceTexteGUI.appliquerParametresTexte(etatApplication);

    // On ne crée pas les post-traitements au démarrage :
    // ils seront créés seulement quand une valeur quitte son état neutre.

    boucleRenduBabylon.lancer(
        etatApplication.moteur,
        etatApplication.scenes.scene3D,
        etatApplication.scenes.sceneGUI,
        etatApplication.scenes.sceneContoursCouleur,
        () => etatApplication.contours.parametres.actif
    );
    boucleRenduBabylon.gererRedimensionnement(etatApplication.moteur);

    await chargerModeleInitial(controleurModele3D);
}

function brancherAnimationInterface(controleur) {
    const c = etatApplication.gui.controles;

    controleur.brancherMenu({
        boutonFleche: obtenir(c, NOMS_GUI.menu.flecheBtn),
        menuRect: obtenir(c, NOMS_GUI.menu.rect),
        flecheRect: obtenir(c, NOMS_GUI.menu.flecheRect),
        flecheText: obtenir(c, NOMS_GUI.menu.flecheTxt)
    });

    controleur.brancherAccordeonsPrincipaux(Object.values(NOMS_GUI.accordions).map((item) => ({
        bouton: obtenir(c, item.bouton),
        rect: obtenir(c, item.rect),
        fleche: obtenir(c, item.fleche),
        hauteur: item.hauteur
    })));

    controleur.brancherPanneauxSecondaires(Object.values(NOMS_GUI.panneaux).map((item) => ({
        bouton: obtenir(c, item.bouton),
        panneau: obtenir(c, item.panneau),
        retour: obtenir(c, item.retour)
    })));

    controleur.brancherBlocageInterface([
        obtenir(c, NOMS_GUI.menu.rect),
        obtenir(c, NOMS_GUI.menu.flecheRect),
        ...Object.values(NOMS_GUI.accordions).map((item) => obtenir(c, item.rect)),
        ...Object.values(NOMS_GUI.panneaux).map((item) => obtenir(c, item.panneau))
    ]);
}

function brancherApparence(controleur) {
    const c = etatApplication.gui.controles;
    const n = NOMS_GUI.apparence;

    const nettete = obtenir(c, n.netteteSlider);
    reglerSlider(nettete, {
        min: constantesApparence.nettete.min,
        max: constantesApparence.nettete.max,
        step: 0.1,
        value: constantesApparence.nettete.defaut
    });

    majTextePourcentageApparence(obtenir(c, n.netteteValeurTxt), constantesApparence.nettete.defaut, 100);

    if (nettete) {
        nettete.onValueChangedObservable.clear();
        nettete.onValueChangedObservable.add((v) => {
            majTextePourcentageApparence(obtenir(c, n.netteteValeurTxt), v, 100);
            controleur.changerNetteteUC.executer(v);
            controleur.postTraitNettete.appliquer(etatApplication);
        });
    }

    const contraste = obtenir(c, n.contrasteSlider);
    reglerSlider(contraste, {
        min: constantesApparence.contraste.min,
        max: constantesApparence.contraste.max,
        step: 0.1,
        value: constantesApparence.contraste.defaut
    });

    majTextePourcentageApparence(obtenir(c, n.contrasteValeurTxt), constantesApparence.contraste.defaut, 100);

    if (contraste) {
        contraste.onValueChangedObservable.clear();
        contraste.onValueChangedObservable.add((v) => {
            majTextePourcentageApparence(obtenir(c, n.contrasteValeurTxt), v, 100);
            controleur.changerContrasteUC.executer(v);
            controleur.postTraitApparence.appliquer(etatApplication);
        });
    }

    const luminosite = obtenir(c, n.luminositeSlider);
    reglerSlider(luminosite, {
        min: constantesApparence.luminosite.min,
        max: constantesApparence.luminosite.max,
        step: 0.05,
        value: constantesApparence.luminosite.defaut
    });

    majTextePourcentageApparence(obtenir(c, n.luminositeValeurTxt), constantesApparence.luminosite.defaut, 100, true);

    if (luminosite) {
        luminosite.onValueChangedObservable.clear();
        luminosite.onValueChangedObservable.add((v) => {
            majTextePourcentageApparence(obtenir(c, n.luminositeValeurTxt), v, 100, true);
            controleur.changerLuminositeUC.executer(v);
            controleur.postTraitApparence.appliquer(etatApplication);
        });
    }

    const saturation = obtenir(c, n.saturationSlider);
    reglerSlider(saturation, {
        min: constantesApparence.saturation.min,
        max: constantesApparence.saturation.max,
        step: 0.1,
        value: constantesApparence.saturation.defaut
    });

    majTextePourcentageApparence(obtenir(c, n.saturationValeurTxt), constantesApparence.saturation.defaut, 100);

    if (saturation) {
        saturation.onValueChangedObservable.clear();
        saturation.onValueChangedObservable.add((v) => {
            majTextePourcentageApparence(obtenir(c, n.saturationValeurTxt), v, 100);
            controleur.changerSaturationUC.executer(v);
            controleur.postTraitApparence.appliquer(etatApplication);
        });
    }

    controleur.brancherSliderThemeScene({
        slider: obtenir(c, n.themeSceneSlider),
        texteValeur: obtenir(c, n.themeSceneValeurTxt)
    });

    const texture = NOMS_GUI.texture;

    if (texture) {
        const boutonOriginal = obtenir(c, texture.originaleBtn);
        const boutonDamier = obtenir(c, texture.damierBtn);
        const boutonRayures = obtenir(c, texture.rayuresBtn);

        if (boutonOriginal) controleur.brancherTexture({ bouton: boutonOriginal, typeTexture: "originale" });
        if (boutonDamier) controleur.brancherTexture({ bouton: boutonDamier, typeTexture: "damier" });
        if (boutonRayures) controleur.brancherTexture({ bouton: boutonRayures, typeTexture: "rayures" });
    }

    const reset = obtenir(c, n.reinitialiserBtn);
    if (reset) controleur.brancherReinitialisation(reset);
}

function majTextePourcentageApparence(textBlock, valeur, facteur = 100, afficherSigne = false) {
    if (!textBlock) return;

    const pourcentage = Math.round(valeur * facteur);

    if (afficherSigne && pourcentage > 0) {
        textBlock.text = `+${pourcentage}%`;
    } else {
        textBlock.text = `${pourcentage}%`;
    }
}

function brancherContours(controleur) {
    const c = etatApplication.gui.controles;
    const n = NOMS_GUI.contours;

    if (obtenir(c, n.silhouetteBtn)) controleur.brancherSilhouette(obtenir(c, n.silhouetteBtn));
    if (obtenir(c, n.reliefBtn)) controleur.brancherRelief(obtenir(c, n.reliefBtn));
    if (obtenir(c, n.couleurBtn)) controleur.brancherContourCouleur(obtenir(c, n.couleurBtn));

    controleur.brancherSliderEpaisseur({
        slider: obtenir(c, n.epaisseurSlider),
        texteValeur: obtenir(c, n.epaisseurValeurTxt)
    });

    n.couleurs.forEach((nom) => {
        const bouton = obtenir(c, nom);

        if (bouton) {
            bouton.metadata = bouton.metadata || {};
            bouton.metadata.couleurOriginale = bouton.background || "#000000FF";
            controleur.brancherCouleur({
                bouton,
                couleur: bouton.background || "#000000FF"
            });
        }
    });
}

function brancherModele3D(controleur) {
    const c = etatApplication.gui.controles;
    const conteneurListe = obtenir(c, NOMS_GUI.modeles.conteneurListe);

    if (conteneurListe) {
        controleur.afficherListeModeles(conteneurListe);
    }

    controleur.brancherBoutonsModelesExistants([
        { bouton: obtenir(c, NOMS_GUI.modeles.objet1Btn), idModele: "objet1" },
        { bouton: obtenir(c, NOMS_GUI.modeles.objet2Btn), idModele: "objet2" }
    ]);
}

async function chargerModeleInitial(controleurModele3D) {
    const premierModele = etatApplication.modele3d.modelesDisponibles[0];

    if (premierModele) {
        await controleurModele3D.changerModele(premierModele.id);
    }
}

main().catch((erreur) => {
    console.error("Erreur au démarrage de l'application Saotra :", erreur);
});
