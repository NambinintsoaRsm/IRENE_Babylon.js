import { chemins } from "./Configuration/chemins.js";
import { constantesCamera } from "./Configuration/constantesCamera.js";
import { constantesApparence } from "./Configuration/constantesApparence.js";
import { constantesInterface } from "./Configuration/constantesInterface.js";
import { constantesContours } from "./Configuration/constantesContours.js";
import { configurationFormulaireAvis } from "./Configuration/formulaireAvis.js";
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
import { ServiceEntropieVueBabylon } from "./Infrastructure/babylon/ServiceEntropieVueBabylon.js";
import { ServiceSaillanceVueBabylon } from "./Infrastructure/babylon/ServiceSaillanceVueBabylon.js";
import { ServiceCouleurContourAdaptativeBabylon } from "./Infrastructure/babylon/ServiceCouleurContourAdaptativeBabylon.js";
import { BoucleRenduBabylon } from "./Infrastructure/babylon/BoucleRenduBabylon.js";

import { ChargeurInterfaceGUI } from "./Infrastructure/gui/ChargeurInterfaceGUI.js";
import { RechercheControleGUI } from "./Infrastructure/gui/RechercheControleGUI.js";
import { ServiceDimensionsGUI } from "./Infrastructure/gui/ServiceDimensionsGUI.js";
import { ServiceAnimationGUI } from "./Infrastructure/gui/ServiceAnimationGUI.js";
import { ServiceDropdownGUI } from "./Infrastructure/gui/ServiceDropdownGUI.js";
import { ServiceStyleInterfaceGUI } from "./Infrastructure/gui/ServiceStyleInterfaceGUI.js";
import { ServiceStyleBoutonsGUI } from "./Infrastructure/gui/ServiceStyleBoutonsGUI.js";
import { ServiceTexteGUI } from "./Infrastructure/gui/ServiceTexteGUI.js";
import { ServiceTexteResponsiveGUI } from "./Infrastructure/gui/ServiceTexteResponsiveGUI.js";
import { ServiceBlocagePointeurGUI } from "./Infrastructure/gui/ServiceBlocagePointeurGUI.js";
import { ServiceListeModelesGUI } from "./Infrastructure/gui/ServiceListeModelesGUI.js";
import { ServiceControlesSpeciauxGUI } from "./Infrastructure/gui/ServiceControlesSpeciauxGUI.js";

import { ServicePolicesNavigateur } from "./Infrastructure/accessibilite/ServicePolicesNavigateur.js";
import { AccessNav } from "./Infrastructure/accessibilite/AccessNav.js";

import { PostTraitApparence } from "./Infrastructure/postTraitements/PostTraitApparence.js";
import { PostTraitNettete } from "./Infrastructure/postTraitements/PostTraitNettete.js";
import { PostTraitContProfNorm } from "./Infrastructure/postTraitements/PostTraitContProfNorm.js";
import { PostTraitContoursCouleur } from "./Infrastructure/postTraitements/PostTraitementContoursCouleur.js";
import { PostTraitMiseLumiereNormales } from "./Infrastructure/postTraitements/PostTraitMiseLumiereNormales.js";
import { PostTraitMiseLumiereCouleurs } from "./Infrastructure/postTraitements/PostTraitMiseLumiereCouleurs.js";

import { StockageProfilLocal } from "./Infrastructure/stockage/StockageProfilLocal.js";
import { ServiceDetectionModeles3D } from "./Infrastructure/modele3d/ServiceDetectionModeles3D.js";
import { ServiceLoupe3D } from "./Infrastructure/loupe/ServiceLoupe3D.js";
import { ServiceFormulaireAvisHTML } from "./Infrastructure/web/ServiceFormulaireAvisHTML.js";

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
import { ChangerTailleMotifTextureUC } from "./UseCases/apparenceUseCases/ChangerTailleMotifTextureUC.js";
import { ReinitialiserApparenceUC } from "./UseCases/apparenceUseCases/ReinitialiserApparenceUC.js";

import { ActiverSilhouetteUC } from "./UseCases/contoursUseCases/ActiverSilhouetteUC.js";
import { ActiverReliefUC } from "./UseCases/contoursUseCases/ActiverReliefUC.js";
import { ActiverContourCouleurUC } from "./UseCases/contoursUseCases/ActiverContourCouleurUC.js";
import { ChangerEpaisseurContourUC } from "./UseCases/contoursUseCases/ChangerEpaisseurContourUC.js";
import { ChangerCouleurContourUC } from "./UseCases/contoursUseCases/ChangerCouleurContourUC.js";
import { DesactiverContoursUC } from "./UseCases/contoursUseCases/DesactiverContoursUC.js";
import { ReinitialiserContoursUC } from "./UseCases/contoursUseCases/ReinitialiserContoursUC.js";
import { ChoisirCouleurContourAdaptativeUC } from "./UseCases/contoursUseCases/ChoisirCouleurContourAdaptativeUC.js";

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
import { ChoisirVueSaillanceUC } from "./UseCases/modele3dUseCases/ChoisirVueSaillanceUC.js";

import { ChargerProfilLocalUC } from "./UseCases/profilUseCases/ChargerProfilLocalUC.js";
import { SauvegarderProfilLocalUC } from "./UseCases/profilUseCases/SauvegarderProfilLocalUC.js";
import { AppliquerProfilUC } from "./UseCases/profilUseCases/AppliquerProfilUC.js";
import { ReinitialiserProfilUC } from "./UseCases/profilUseCases/ReinitialiserProfilUC.js";
import { ToggleAccessUC } from "./UseCases/accessibiliteUseCases/ToggleAccessUC.js";

import { ControleurAnimationInterface } from "./Presentation/controleurs/ControleurAnimationInterface.js";
import { ControleurInterface } from "./Presentation/controleurs/ControleurInterface.js";
import { ControleurApparence } from "./Presentation/controleurs/ControleurApparence.js";
import { ControleurContours } from "./Presentation/controleurs/ControleurContours.js";
import { ControleurCamera } from "./Presentation/controleurs/ControleurCamera.js";
import { ControleurModele3D } from "./Presentation/controleurs/ControleurModele3D.js";
import { ControleurProfil } from "./Presentation/controleurs/ControleurProfil.js";
import { ControleurLumiere } from "./Presentation/controleurs/ControleurLumiere.js";
import { ControleurAccess } from "./Presentation/controleurs/ControleurAccess.js";
import { ControleurAvis } from "./Presentation/controleurs/ControleurAvis.js";

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
        // ZoomReintBtn reste un bouton simple : il ne doit pas être utilisé comme conteneur d'accordéon,
        // sinon il disparaît quand les accordéons sont initialisés.
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
        couleurOptimaleBtns: [
            "ContoAutoBtn",
            "ContAutoBtn",
            "ContCouleurAutoBtn",
            "CoulAutoBtn",
            "CouleurAutoBtn",
            "ContOptBtn",
            "CouleurOptimaleBtn",
            "ContCouleurOptBtn"
        ],
        epaisseurSlider: "ContEpaiSlider",
        epaisseurValeurTxt: "ContEpaiValTxt",
        presetSombreBtns: [
            "SombreBtn",
            "HighSombrBtn",
            "HighSombreBtn",
            "ContPresetSombreBtn",
            "PresetSombreBtn",
            "ContSombreBtn",
            "ContourSombreBtn"
        ],
        presetClairBtns: [
            "ClairBtn",
            "HighClairBtn",
            "ContPresetClairBtn",
            "PresetClairBtn",
            "ContClairBtn",
            "ContourClairBtn"
        ],
        reinitialiserHighlightContoursBtns: [
            "ContPresetReintBtn",
            "ContReintHighlightBtn",
            "ContReintReglagesBtn"
        ],
        couleurs: ["ContBtn1", "ContBtn2", "ContBtn3", "ContBtn4", "ContBtn5", "ContBtn6", "ContBtn7", "ContBtn8"]
    },

    texture: {
        originaleBtn: "TxtuBtn0",
        damierBtn: "TxtuBtn1",
        rayuresBtn: "TxtuBtn2",
        tailleMotifSlider: "TextuTailleSlider",
        tailleMotifTxt: "TextuTailleTxt",
        reinitialiserBtn: "TxtuReintBtn"
    },

    camera: {
        zoomReinitBtn: "ZoomReintBtn",
        reinitZoomBtn: "ReintZoomsBtn",
        reinitPositionBtn: "ReintPosBtn"
    },

    modeles: {
        scrollViewer: "ModelScroll",
        conteneurListe: "MdlScrollStkPnl",
        objet1Btn: "MdlBtn0",
        objet2Btn: "MdlBtn1"
    },

    access: {
        bouton: "AccesBtn",
        texte: "AccesBtnTxt",
        panneau: "AccesRect",
        retour: "AccesRetourBtn",
        caseBtn: "AccessCheckBtn",
        caseTxt: "AccessCheckBtnTxt",
        anciensBoutons: ["AccessBtn", "AccBtn"],
        anciensTextes: ["AccessBtnTxt", "AccBtnTxt"]
    },

    avis: {
        bouton: "AvisBtn",
        texte: "AvisBtnTxt"
    },

    entropie: {
        bouton: "EntropieBtn",
        texte: "EntropieTxt",
        boutonAncien: "EntropieTestBtn",
        texteAncien: "EntropieResultTxt"
    },

    saillance: {
        bouton: "SaillanceBtn",
        texte: "SaillanceTxt",
        texteBouton: "SaillanceBtnTxt"
    }
});

function obtenir(controles, nom) {
    return nom ? controles[nom] ?? null : null;
}

function obtenirPremier(controles, noms) {
    if (!Array.isArray(noms)) {
        return obtenir(controles, noms);
    }

    for (const nom of noms) {
        const controle = obtenir(controles, nom);

        if (controle) {
            return controle;
        }
    }

    return null;
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
        "EspaceRect", "EspaceTxt",

        // Bouton flottant et fenêtre de confirmation de fermeture.
        "FermBtn", "FermBtnTxt", "FermRect", "FermMainGrid", "FermBtnGrid", "Fermer",
        "FermerBtn", "FermerBtnTxt", "AnnulerBtn", "AnnulerBtnTxt",

        "ZoomBtn", "ZoomBtnDropTxt", "ZoomBtnTxt", "ZoomReintBtn", "ZoomReintBtnTxt",

        "TextuTailleSlider", "TextuTailleTxt", "TxtuReintBtn", "TxtuReintBtnTxt",
        "AccesBtn", "AccesBtnTxt", "AccesRect", "AccesRetourBtn", "AccesRetourBtnTxt",
        "AccessCheckBtn", "AccessCheckBtnTxt",
        "AccessBtn", "AccessBtnTxt", "AccBtn", "AccBtnTxt",
        "EntropieBtn", "EntropieTxt", "EntropieTestBtn", "EntropieResultTxt",
        "SaillanceBtn", "SaillanceTxt", "SaillanceBtnTxt"
    ].forEach((nom) => {
        controles[nom] = recherche.obtenir(nom, false);
    });

    return controles;
}

/**
 * Branche le bouton de fermeture défini dans guiTexture.json.
 * La destination se modifie dans Configuration/chemins.js :
 * chemins.navigation.fermetureApplication.
 */
function brancherFermetureApplication({ etatApplication, destination = "#" } = {}) {
    const controles = etatApplication?.gui?.controles ?? {};
    const panneau = controles.FermRect;
    const boutonOuvrir = controles.FermBtn;
    const icone = controles.FermBtnTxt;
    const titre = controles.Fermer;
    const boutonAnnuler = controles.AnnulerBtn;
    const texteAnnuler = controles.AnnulerBtnTxt ?? boutonAnnuler?.textBlock ?? null;
    const boutonFermer = controles.FermerBtn;
    const texteFermer = controles.FermerBtnTxt ?? boutonFermer?.textBlock ?? null;
    const grillePrincipale = controles.FermMainGrid
        ?? etatApplication?.gui?.advancedTexture?.getControlByName?.("FermMainGrid")
        ?? null;
    const grilleBoutons = controles.FermBtnGrid
        ?? etatApplication?.gui?.advancedTexture?.getControlByName?.("FermBtnGrid")
        ?? null;

    if (!panneau || !boutonOuvrir || !boutonAnnuler || !boutonFermer) {
        console.warn("[Fermeture] Contrôles GUI incomplets : FermBtn, FermRect, AnnulerBtn ou FermerBtn introuvable.");
        return;
    }

    if (icone) {
        icone.metadata = icone.metadata || {};
        icone.metadata.texteDynamique = true;
        icone.metadata.nePasModifierTailleTexte = true;
        icone.metadata.nePasAccessibilite = true;
        icone.metadata.nePasAutoFit = true;
        icone.text = "✕";
        icone.fontSize = "28px";
        icone.fontWeight = "700";
        icone.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        icone.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    }

    let jetonOuverture = 0;
    let canvasMesure = null;
    let contexteMesure = null;

    const obtenirThemeCourant = () => {
        const nomTheme = etatApplication?.interface?.parametres?.theme;
        return constantesInterface.themes?.[nomTheme]
            ?? constantesInterface.themes?.[constantesInterface.themeDefaut]
            ?? {};
    };

    const obtenirPoliceCourante = () => String(
        etatApplication?.interface?.parametres?.police || "OpenDyslexic"
    );

    const obtenirPilePolice = (famille) => {
        const nom = String(famille || "OpenDyslexic").replace(/["']/g, "").trim();
        return nom.toLowerCase() === "arial"
            ? "Arial, sans-serif"
            : `"${nom}", Arial, sans-serif`;
    };

    const attendreImages = (nombre = 1) => new Promise((resolve) => {
        let restantes = Math.max(1, Number(nombre) || 1);
        const suivante = () => {
            restantes -= 1;
            if (restantes <= 0) {
                resolve();
                return;
            }

            if (typeof requestAnimationFrame === "function") {
                requestAnimationFrame(suivante);
            } else {
                setTimeout(suivante, 0);
            }
        };

        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(suivante);
        } else {
            setTimeout(suivante, 0);
        }
    });

    const attendrePolice = async (famille) => {
        if (typeof document === "undefined" || !document.fonts?.load) return;

        const nom = String(famille || "OpenDyslexic").replace(/["']/g, "").trim();
        const chargement = Promise.allSettled([
            document.fonts.load(`400 28px "${nom}"`),
            document.fonts.load(`700 28px "${nom}"`)
        ]);

        // Une police défaillante ne doit jamais bloquer l'ouverture de la fenêtre.
        await Promise.race([
            chargement,
            new Promise((resolve) => setTimeout(resolve, 450))
        ]);
    };

    const preparerContexteMesure = () => {
        if (!canvasMesure && typeof document !== "undefined") {
            canvasMesure = document.createElement("canvas");
            contexteMesure = canvasMesure.getContext("2d");
        }
        return contexteMesure;
    };

    const ajusterUneLigne = ({ textBlock, texte, tailleMax, tailleMin, poids = "700", marge = 24 }) => {
        if (!textBlock) return;

        // La fenêtre utilise la police réellement sélectionnée dans IRENE.
        // Arial et sans-serif restent dans la pile comme secours immédiat :
        // le texte reste visible même si la police personnalisée se charge encore.
        const famille = obtenirPoliceCourante();
        const pile = obtenirPilePolice(famille);
        const largeurMesuree = Number(textBlock?._currentMeasure?.width ?? 0);
        const largeurParent = Number(textBlock?.parent?._currentMeasure?.width ?? 0);
        const largeurDisponible = Math.max(80, (largeurMesuree || largeurParent || 320) - marge);
        const contexte = preparerContexteMesure();

        let taille = Math.max(tailleMin, tailleMax);
        if (contexte) {
            while (taille > tailleMin) {
                contexte.font = `${poids} ${taille}px ${pile}`;
                if (contexte.measureText(String(texte)).width <= largeurDisponible) break;
                taille -= 1;
            }
        }

        textBlock.metadata = {
            ...(textBlock.metadata ?? {}),
            texteDynamique: true,
            nePasAutoFit: true,
            nePasModifierTailleTexte: true,
            nePasAccessibilite: true
        };
        textBlock.text = String(texte);
        textBlock.fontFamily = pile;
        textBlock.fontWeight = poids;
        textBlock.fontSize = `${Math.max(tailleMin, taille)}px`;
        textBlock.textWrapping = false;
        textBlock.resizeToFit = false;
        textBlock.clipContent = false;
        textBlock.alpha = 1;
        textBlock.isVisible = true;
        textBlock.isEnabled = true;
        textBlock.notRenderable = false;
        textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        textBlock._markAsDirty?.();
    };

    const stabiliserStructureFenetre = () => {
        panneau.clipChildren = false;
        panneau.clipContent = false;

        if (grillePrincipale && titre && grilleBoutons) {
            try {
                grillePrincipale.removeControl?.(titre);
                grillePrincipale.removeControl?.(grilleBoutons);
                grillePrincipale.addControl?.(titre, 0, 0);
                grillePrincipale.addControl?.(grilleBoutons, 1, 0);
            } catch (_erreur) {
                // Le JSON peut avoir déjà restauré correctement les cellules.
            }
        }

        if (grilleBoutons) {
            try {
                grilleBoutons.removeControl?.(boutonAnnuler);
                grilleBoutons.removeControl?.(boutonFermer);
                grilleBoutons.addControl?.(boutonAnnuler, 0, 0);
                grilleBoutons.addControl?.(boutonFermer, 0, 1);
            } catch (_erreur) {
                // Même principe : on conserve le placement existant si besoin.
            }
        }

        if (titre) {
            titre.width = "95%";
            titre.height = "100%";
            titre.clipContent = false;
            titre.clipChildren = false;
            titre.paddingTop = "0px";
            titre.paddingBottom = "0px";
            titre.isVisible = true;
            titre.isEnabled = true;
            titre.notRenderable = false;
        }
    };

    const appliquerPresentationFenetre = () => {
        stabiliserStructureFenetre();
        const theme = obtenirThemeCourant();
        const couleurTexte = theme.textePrincipal ?? "#FFFFFFFF";
        const fondPanneau = theme.fondPrincipal ?? "#2B2B2BFF";
        const bordurePanneau = theme.bordure ?? couleurTexte;
        const fondBouton = theme.boutonFond ?? fondPanneau;
        const bordureBouton = theme.boutonBordure ?? bordurePanneau;
        const texteBouton = theme.boutonTexte ?? couleurTexte;
        const accessibiliteActive = etatApplication?.accessibilite?.actif === true;
        const remPx = Number(etatApplication?.accessibilite?.preferencesNavigateur?.remPx);
        const tailleReference = accessibiliteActive && Number.isFinite(remPx) && remPx > 0
            ? remPx
            : 24;

        panneau.background = fondPanneau;
        panneau.color = bordurePanneau;
        panneau.alpha = Math.max(0, Number(panneau.alpha) || 0);

        [boutonAnnuler, boutonFermer].forEach((bouton) => {
            bouton.background = fondBouton;
            bouton.color = bordureBouton;
            bouton.alpha = 1;
            bouton.isVisible = true;
            bouton.notRenderable = false;
            bouton._markAsDirty?.();
        });

        if (titre) titre.color = couleurTexte;
        if (texteAnnuler) texteAnnuler.color = texteBouton;
        if (texteFermer) texteFermer.color = texteBouton;

        ajusterUneLigne({
            textBlock: titre,
            texte: "Fermer l'application ?",
            tailleMax: Math.min(50, Math.max(28, Math.round(tailleReference * 1.35))),
            tailleMin: 22,
            poids: "700",
            marge: 36
        });
        ajusterUneLigne({
            textBlock: texteAnnuler,
            texte: "Annuler",
            tailleMax: Math.min(40, Math.max(22, Math.round(tailleReference * 1.00))),
            tailleMin: 18,
            poids: "700",
            marge: 30
        });
        ajusterUneLigne({
            textBlock: texteFermer,
            texte: "Fermer",
            tailleMax: Math.min(40, Math.max(22, Math.round(tailleReference * 1.00))),
            tailleMin: 18,
            poids: "700",
            marge: 30
        });

        // Les couleurs sont remises après l'ajustement afin que les métadonnées
        // d'OpenDyslexic ou un ancien thème ne puissent pas rendre un texte invisible.
        if (titre) titre.color = couleurTexte;
        if (texteAnnuler) texteAnnuler.color = texteBouton;
        if (texteFermer) texteFermer.color = texteBouton;

        panneau._markAsDirty?.();
        etatApplication.gui.advancedTexture?.markAsDirty?.();
    };

    const changerVisibilite = (visible, { transparent = false } = {}) => {
        panneau.isVisible = visible;
        panneau.notRenderable = !visible;
        panneau.isEnabled = visible;
        panneau.isHitTestVisible = visible;
        panneau.isPointerBlocker = visible;
        panneau.zIndex = 1000;
        panneau.alpha = visible ? (transparent ? 0 : 1) : 1;
        panneau._markAsDirty?.();
        etatApplication.gui.advancedTexture?.markAsDirty?.();
    };

    const ouvrirFenetre = async () => {
        const jeton = ++jetonOuverture;
        const famille = obtenirPoliceCourante();

        // Premier affichage immédiat avec la pile de secours. L'utilisateur ne
        // voit jamais une fenêtre vide, même avec OpenDyslexic.
        changerVisibilite(true, { transparent: false });
        appliquerPresentationFenetre();

        // Dès que la police active et le layout sont prêts, on recalcule une
        // seconde fois la plus grande taille qui tient réellement.
        await Promise.all([
            attendrePolice(famille),
            attendreImages(1)
        ]);

        if (jeton !== jetonOuverture || panneau.isVisible === false) return;

        appliquerPresentationFenetre();
        panneau.alpha = 1;
        panneau._markAsDirty?.();
        etatApplication.gui.advancedTexture?.markAsDirty?.();
    };

    changerVisibilite(false);

    boutonOuvrir.onPointerClickObservable.clear();
    boutonOuvrir.onPointerClickObservable.add(() => {
        void ouvrirFenetre();
    });

    boutonAnnuler.onPointerClickObservable.clear();
    boutonAnnuler.onPointerClickObservable.add(() => {
        ++jetonOuverture;
        changerVisibilite(false);
    });

    boutonFermer.onPointerClickObservable.clear();
    boutonFermer.onPointerClickObservable.add(() => {
        ++jetonOuverture;
        changerVisibilite(false);

        const url = String(destination ?? "#").trim() || "#";
        window.location.assign(url);
    });
}

function supprimerBoutonsEtPanneauxTest(advancedTexture) {
    if (!advancedTexture?.getControlByName) return;

    const nomsTest = [
        "AccessBtn",
        "AccessBtnTxt",
        "AccBtn",
        "AccBtnTxt",
        "EntropieBtn",
        "EntropieTxt",
        "EntropiePanel",
        "EntropieTestBtn",
        "EntropieResultTxt",
        "SaillanceBtn",
        "SaillanceTxt",
        "SaillancePanel",
        "SaillanceBtnTxt"
    ];

    nomsTest.forEach((nom) => {
        const controle = advancedTexture.getControlByName(nom);
        if (!controle) return;

        controle.isVisible = false;
        controle.isEnabled = false;
        controle.notRenderable = true;
        controle.isHitTestVisible = false;
        controle.isPointerBlocker = false;

        if (controle.parent?.removeControl) {
            controle.parent.removeControl(controle);
        }
    });

    advancedTexture.markAsDirty?.();
}

function installerGestionBoutonsFlottants({ etatApplication, scene, serviceLoupe3D }) {
    const nomsBoutonsFlottants = ["AccesBtn", "LoupeBtn"];
    const nomsPanneauxBloquants = [
        "PoliRect",
        "MenuRect",
        "ContoRect",
        "TextuRect",
        "LumRect",
        "ModelRect",
        "AccesRect"
    ];

    // Quand un sous-menu du menu principal est déroulé, les boutons ronds du bas
    // peuvent recouvrir les réglages. On les masque donc complètement dans ce cas.
    const nomsPanneauxDeroulantsBloquants = [
        "RegOptnRect",
        "ConfOptnRect"
    ];

    const controles = () => etatApplication?.gui?.controles ?? {};

    const obtenirControle = (nom) => {
        const c = controles();
        return c[nom]
            ?? etatApplication?.gui?.advancedTexture?.getControlByName?.(nom)
            ?? null;
    };

    const controleEffectivementVisible = (controle) => {
        let courant = controle;

        while (courant) {
            if (courant.isVisible === false || courant.notRenderable === true) {
                return false;
            }
            courant = courant.parent ?? null;
        }

        return Boolean(controle);
    };

    const estPanneauOuvert = () => [
        ...nomsPanneauxBloquants,
        ...nomsPanneauxDeroulantsBloquants
    ].some((nom) => {
        const panneau = obtenirControle(nom);
        return controleEffectivementVisible(panneau);
    });

    const memoriserEtatInitial = (bouton) => {
        if (!bouton) return;
        bouton.metadata = bouton.metadata ?? {};

        if (!bouton.metadata.etatInitialBoutonFlottant) {
            bouton.metadata.etatInitialBoutonFlottant = {
                isEnabled: bouton.isEnabled !== false,
                isHitTestVisible: bouton.isHitTestVisible !== false,
                isPointerBlocker: bouton.isPointerBlocker === true,
                isVisible: bouton.isVisible !== false,
                notRenderable: bouton.notRenderable === true,
                alpha: Number.isFinite(Number(bouton.alpha)) ? Number(bouton.alpha) : 1
            };
        }
    };

    const appliquerDisponibilite = (bouton, disponible) => {
        if (!bouton) return;
        memoriserEtatInitial(bouton);

        const initial = bouton.metadata.etatInitialBoutonFlottant;

        if (!disponible) {
            bouton.metadata.boutonFlottantSuspendu = true;

            // On masque les boutons flottants pour qu'ils ne recouvrent pas les menus,
            // mais on ne les met plus en isEnabled=false / notRenderable=true.
            // Ces états peuvent rester coincés avec certains contrôles GUI et donner
            // l'impression que toute l'interface est désactivée.
            bouton.isVisible = false;
            bouton.alpha = 0;
            bouton.isHitTestVisible = false;
            bouton.isPointerBlocker = false;
            bouton._markAsDirty?.();
            return;
        }

        if (bouton.metadata.boutonFlottantSuspendu) {
            bouton.metadata.boutonFlottantSuspendu = false;
            bouton.isVisible = initial.isVisible !== false;
            bouton.notRenderable = initial.notRenderable === true;
            bouton.isEnabled = initial.isEnabled !== false;
            bouton.isHitTestVisible = initial.isHitTestVisible !== false;
            bouton.isPointerBlocker = initial.isPointerBlocker === true;
            bouton.alpha = initial.alpha ?? 1;
            bouton._markAsDirty?.();
        }
    };

    let dernierEtat = null;
    let dernierControleMs = 0;
    const delaiControleMs = 80;

    const synchroniser = ({ forcer = false } = {}) => {
        const maintenant = globalThis.performance?.now?.() ?? Date.now();
        if (!forcer && maintenant - dernierControleMs < delaiControleMs) return;
        dernierControleMs = maintenant;

        const panneauOuvert = estPanneauOuvert();
        const disponible = !panneauOuvert;

        if (panneauOuvert && serviceLoupe3D?.actif) {
            serviceLoupe3D.desactiver?.();
        }

        if (dernierEtat === disponible) return;
        dernierEtat = disponible;

        nomsBoutonsFlottants.forEach((nom) => appliquerDisponibilite(obtenirControle(nom), disponible));
        etatApplication?.gui?.advancedTexture?.markAsDirty?.();
    };

    synchroniser({ forcer: true });
    scene?.onBeforeRenderObservable?.add?.(() => synchroniser());

    return synchroniser;
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
    const serviceEntropieVueBabylon = new ServiceEntropieVueBabylon();
    const serviceSaillanceVueBabylon = new ServiceSaillanceVueBabylon();
    const serviceCouleurContourAdaptativeBabylon = new ServiceCouleurContourAdaptativeBabylon();
    const boucleRenduBabylon = new BoucleRenduBabylon();
    const serviceControlesSpeciauxGUI = new ServiceControlesSpeciauxGUI();
    const serviceLoupe3D = new ServiceLoupe3D();
    const serviceFormulaireAvisHTML = new ServiceFormulaireAvisHTML({
        configuration: configurationFormulaireAvis
    });

    etatApplication.services = {
        ...(etatApplication.services ?? {}),
        lumiere: serviceLumiereBabylon,
        scene: serviceSceneBabylon,
        materiaux: serviceMateriauxBabylon
    };

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
    const serviceAnimationGUI = new ServiceAnimationGUI(serviceDimensionsGUI, etatApplication.scenes.sceneGUI, etatApplication);
    const serviceDropdownGUI = new ServiceDropdownGUI();
    const serviceStyleInterfaceGUI = new ServiceStyleInterfaceGUI();
    const serviceStyleBoutonsGUI = new ServiceStyleBoutonsGUI();
    const serviceTexteGUI = new ServiceTexteGUI();
    const serviceTexteResponsiveGUI = new ServiceTexteResponsiveGUI();

    etatApplication.services = {
        ...(etatApplication.services ?? {}),
        texteGUI: serviceTexteGUI,
        texteResponsive: serviceTexteResponsiveGUI
    };
    const serviceBlocagePointeurGUI = new ServiceBlocagePointeurGUI();
    const serviceListeModelesGUI = new ServiceListeModelesGUI();

    etatApplication.services = {
        ...(etatApplication.services ?? {}),
        listeModelesGUI: serviceListeModelesGUI
    };
    const serviceDetectionModeles3D = new ServiceDetectionModeles3D({
        dossierModeles: chemins.modeles.dossier,
        extensions: ["glb"]
    });

    const servicePolicesNavigateur = new ServicePolicesNavigateur();
    const accessNav = new AccessNav();

    await servicePolicesNavigateur.chargerPolices(constantesInterface.policesDisponibles);

    ////////////////////////////////////////////////////////////////

    // Ligne de base avec le fichier JSON :
     await chargeurInterfaceGUI.chargerDepuisJson(etatApplication.gui.advancedTexture, chemins.gui.fichier);

    etatApplication.gui.controles = recupererTousLesControles(etatApplication.gui.advancedTexture);
    supprimerBoutonsEtPanneauxTest(etatApplication.gui.advancedTexture);
    serviceTexteResponsiveGUI.installer({
        etatApplication,
        advancedTexture: etatApplication.gui.advancedTexture
    });
    serviceLoupe3D.installer({
        etatApplication,
        scene: etatApplication.scenes.scene3D,
        camera: etatApplication.camera.cameraBabylon,
        canvas,
        advancedTexture: etatApplication.gui.advancedTexture,
        serviceCameraBabylon
    });

    etatApplication.accessibilite = {
        preferencesNavigateur: accessNav.lire(),
        actif: false
    };

    const postTraitApparence = new PostTraitApparence();
    const postTraitNettete = new PostTraitNettete();
    const postTraitContProfNorm = new PostTraitContProfNorm();
    const postTraitContoursCouleur = new PostTraitContoursCouleur();
    const postTraitMiseLumiereNormales = new PostTraitMiseLumiereNormales();
    const postTraitMiseLumiereCouleurs = new PostTraitMiseLumiereCouleurs();
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
    const changerTailleMotifTextureUC = new ChangerTailleMotifTextureUC(etatApplication);
    const reinitialiserApparenceUC = new ReinitialiserApparenceUC(etatApplication);

    const activerSilhouetteUC = new ActiverSilhouetteUC(etatApplication);
    const activerReliefUC = new ActiverReliefUC(etatApplication);
    const activerContourCouleurUC = new ActiverContourCouleurUC(etatApplication);
    const changerEpaisseurContourUC = new ChangerEpaisseurContourUC(etatApplication);
    const changerCouleurContourUC = new ChangerCouleurContourUC(etatApplication);
    const desactiverContoursUC = new DesactiverContoursUC(etatApplication, constantesContours.epaisseurDefaut);
    const reinitialiserContoursUC = new ReinitialiserContoursUC(etatApplication);
    const choisirCouleurContourAdaptativeUC = new ChoisirCouleurContourAdaptativeUC(
        etatApplication,
        serviceCouleurContourAdaptativeBabylon
    );
    const changerVitesseCameraUC = new ChangerVitesseCameraUC(etatApplication);
    const reinitialiserCameraUC = new ReinitialiserCameraUC(etatApplication);
    const bloquerCameraUC = new BloquerCameraUC(etatApplication);
    const debloquerCameraUC = new DebloquerCameraUC(etatApplication);

    const listerModelesUC = new ListerModelesUC(etatApplication, {
        serviceDetectionModeles3D
    });

    try {
        await listerModelesUC.actualiserDepuisDossier();
    } catch (erreur) {
        console.warn("[Modèles 3D] Détection automatique indisponible au démarrage. Catalogue de secours conservé.", erreur);
    }
    const changerModeleActifUC = new ChangerModeleActifUC(etatApplication);
    const chargerModeleUC = new ChargerModeleUC(etatApplication);
    const supprimerModeleActuelUC = new SupprimerModeleActuelUC(etatApplication);
    const normaliserModeleUC = new NormaliserModeleUC(etatApplication);
    const choisirVueEntropieUC = new ChoisirVueEntropieUC(etatApplication);
    const choisirVueSaillanceUC = new ChoisirVueSaillanceUC(etatApplication);

    const chargerProfilLocalUC = new ChargerProfilLocalUC(etatApplication, stockageProfilLocal);
    const sauvegarderProfilLocalUC = new SauvegarderProfilLocalUC(etatApplication, stockageProfilLocal);
    const appliquerProfilUC = new AppliquerProfilUC(etatApplication);
    const reinitialiserProfilUC = new ReinitialiserProfilUC(etatApplication);

    const toggleAccessUC = new ToggleAccessUC({
        etatApplication,
        accessNav,
        serviceStyleInterfaceGUI,
        serviceTexteGUI,
        serviceSceneBabylon,
        serviceLumiereBabylon,
        postTraitApparence,
        postTraitNettete,
        sauvegarderProfilLocalUC
    });

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
        serviceCameraBabylon,
        serviceControlesSpeciauxGUI
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
        servicePolicesNavigateur,
        serviceControlesSpeciauxGUI
    });

    const controleurApparence = new ControleurApparence({
        etatApplication,
        changerContrasteUC,
        changerLuminositeUC,
        changerSaturationUC,
        changerNetteteUC,
        changerTextureUC,
        changerTailleMotifTextureUC,
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
        choisirCouleurContourAdaptativeUC,
        desactiverContoursUC,
        reinitialiserContoursUC,
        postTraitContProfNorm,
        postTraitContoursCouleur,
        postTraitMiseLumiereNormales,
        postTraitMiseLumiereCouleurs,
        postTraitApparence,
        serviceSceneBabylon
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
        serviceSaillanceVueBabylon,
        constantesCamera
    });

    const controleurLumiere = new ControleurLumiere({
        etatApplication,
        serviceLumiereBabylon
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
        serviceSceneBabylon,
        serviceLumiereBabylon,
        controleurLumiere,
        controleurContours,
        controleurInterface,
        serviceMateriauxBabylon,
        serviceControlesSpeciauxGUI,
        postTraitApparence,
        postTraitNettete,
        postTraitContProfNorm,
        postTraitContoursCouleur,
        postTraitMiseLumiereNormales,
        postTraitMiseLumiereCouleurs
    });

    const controleurAccess = new ControleurAccess({
        etatApplication,
        toggleAccessUC
    });

    const controleurAvis = new ControleurAvis({
        etatApplication,
        serviceFormulaireAvisHTML,
        configurationFormulaireAvis,
        constantesInterface
    });

    // Après chaque changement de thème, on remet l’icône Accessibilité
    // dans la même couleur que le texte du bouton.
    const appliquerThemeInterfaceOriginal = serviceStyleInterfaceGUI.appliquerTheme.bind(serviceStyleInterfaceGUI);
    serviceStyleInterfaceGUI.appliquerTheme = (...args) => {
        const retour = appliquerThemeInterfaceOriginal(...args);
        const synchroniserInterfaceSpeciale = () => {
            controleurAccess.synchroniserEtatVisuel?.();
            controleurContours.mettreAJourBoutonsPresets?.();
            controleurContours.mettreAJourBoutonCouleurAdaptative?.();
            serviceListeModelesGUI.actualiserStylesBoutonsModeles?.(etatApplication);
            serviceTexteGUI.appliquerParametresTexte?.(etatApplication);
        };
        queueMicrotask?.(synchroniserInterfaceSpeciale);
        setTimeout(synchroniserInterfaceSpeciale, 80);
        return retour;
    };

    brancherAnimationInterface(controleurAnimationInterface);
    controleurInterface.brancherDepuisNomsGUI(NOMS_GUI, serviceAnimationGUI);
    brancherFermetureApplication({
        etatApplication,
        destination: chemins.navigation?.fermetureApplication ?? "#"
    });
    brancherApparence(controleurApparence);
    brancherContours(controleurContours);
    controleurCamera.brancherDepuisNomsGUI(NOMS_GUI.camera);
    controleurLumiere.brancherDepuisNomsGUI();
    serviceControlesSpeciauxGUI.installerSuiviSliderTemperature(etatApplication);
    controleurAccess.brancherDepuisNomsGUI(NOMS_GUI.access);
    controleurAvis.brancherDepuisNomsGUI(NOMS_GUI.avis);
    etatApplication.scenes.sceneGUI?.onDisposeObservable?.add?.(() => controleurAvis.detruire());
    installerGestionBoutonsFlottants({
        etatApplication,
        scene: etatApplication.scenes.scene3D,
        serviceLoupe3D
    });
    await brancherModele3D(controleurModele3D);

    const profilRestaure = controleurProfil.chargerProfilAuDemarrage();
    initialiserAccessibiliteApresProfil({
        profilRestaure,
        toggleAccessUC,
        controleurAccess
    });
    controleurProfil.installerSauvegardeAutomatique();

    // Aide de test en développement : permet de forcer la sauvegarde depuis la console
    // sans attendre la fermeture de l’onglet.
    if (typeof window !== "undefined") {
        window.saotraSauvegarde = {
            cle: "saotra_reglages_utilisateur",
            sauvegarder: () => controleurProfil.sauvegarderMaintenant(),
            charger: () => JSON.parse(localStorage.getItem("saotra_reglages_utilisateur") || "null"),
            effacer: () => localStorage.removeItem("saotra_reglages_utilisateur")
        };

        window.saotraModeles = {
            dossier: chemins.modeles.dossier,
            liste: () => etatApplication.modele3d.modelesDisponibles.map((modele) => ({
                id: modele.id,
                nom: modele.nom,
                chemin: modele.chemin
            })),
            actualiser: async () => {
                await listerModelesUC.actualiserDepuisDossier({ forcer: true });
                const conteneurListe = obtenir(etatApplication.gui.controles, NOMS_GUI.modeles.conteneurListe);
                if (conteneurListe) {
                    await controleurModele3D.afficherListeModeles(conteneurListe);
                }
                serviceTexteResponsiveGUI.planifierAjustement();
                return window.saotraModeles.liste();
            }
        };

        window.saotraContours = {
            presetSombre: () => controleurContours.appliquerPresetContours("sombre"),
            presetClair: () => controleurContours.appliquerPresetContours("clair"),
            basculerPresetSombre: () => controleurContours.basculerPresetContours("sombre"),
            basculerPresetClair: () => controleurContours.basculerPresetContours("clair"),
            desactiverHighlight: () => controleurContours.desactiverPresetContours(),
            reinitialiserHighlight: () => controleurContours.reinitialiserReglagesContoursHighlight(),
            proposerPresetAccessibilite: () => controleurContours.proposerPresetSelonAccessibilite(),
            appliquerPresetAccessibilite: () => controleurContours.proposerPresetSelonAccessibilite({ appliquer: true }),
            etatHighlight: () => ({
                normalesActif: Boolean(etatApplication.contours?.miseLumiereNormalesActif),
                couleursActif: Boolean(etatApplication.contours?.miseLumiereCouleursActif),
                parametres: { ...(etatApplication.contours?.parametresMiseLumiere ?? {}) }
            })
        };

        window.saotraLoupe = {
            activer: () => serviceLoupe3D.activer(),
            desactiver: () => serviceLoupe3D.desactiver(),
            basculer: () => serviceLoupe3D.basculer(),
            reglerZoom: (valeur) => serviceLoupe3D.reglerZoom(valeur),
            reglerDiametre: (valeur) => serviceLoupe3D.reglerDiametre(valeur),
            reglerNettete: (valeur) => serviceLoupe3D.reglerNettete(valeur),
            reglerInversionY: (actif) => serviceLoupe3D.reglerInversionY(actif),
            etat: () => serviceLoupe3D.etat()
        };

        window.saotraTexteResponsive = {
            ajuster: () => serviceTexteResponsiveGUI.ajuster(),
            planifier: () => serviceTexteResponsiveGUI.planifierAjustement(),
            debug: (actif = true) => serviceTexteResponsiveGUI.debug(actif)
        };
    }

    serviceStyleInterfaceGUI.appliquerTheme(etatApplication);
    controleurContours.mettreAJourBoutonsPresets?.();
    serviceTexteGUI.appliquerParametresTexte(etatApplication);
    serviceTexteResponsiveGUI.planifierAjustement();


    // On crée une première sauvegarde légère dès que l’interface est prête.
    // Comme ça, la clé existe déjà dans localStorage même avant fermeture du navigateur.
    controleurProfil.sauvegarderMaintenant();

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

    // Après chargement du modèle, on réapplique les réglages restaurés qui
    // dépendent du modèle ou de la caméra réelle.
    controleurProfil.appliquerEffetsVisuels({ appliquerCamera: false });
    controleurProfil.mettreAJourInterfaceDepuisEtat();
    serviceTexteResponsiveGUI.planifierAjustement();
    controleurProfil.sauvegarderMaintenant();
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

        controleur.brancherTailleMotifTexture({
            slider: obtenir(c, texture.tailleMotifSlider),
            texteValeur: null
        });

        controleur.brancherReinitialisationTexture({
            bouton: obtenir(c, texture.reinitialiserBtn),
            slider: obtenir(c, texture.tailleMotifSlider),
            texteValeur:null
        });
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

    const boutonCouleurOptimale = obtenirPremier(c, n.couleurOptimaleBtns);
    if (boutonCouleurOptimale) controleur.brancherCouleurAdaptative(boutonCouleurOptimale);

    controleur.brancherSliderEpaisseur({
        slider: obtenir(c, n.epaisseurSlider),
        texteValeur: obtenir(c, n.epaisseurValeurTxt)
    });

    // L'ancienne interface Highlight (boutons Normale/Couleur + sliders)
    // n'existe plus dans le GUI. On garde seulement les presets Contours.
    controleur.brancherPresetsDepuisNomsGUI?.({
        sombreBtns: n.presetSombreBtns,
        clairBtns: n.presetClairBtns,
        reinitialiserBtns: n.reinitialiserHighlightContoursBtns
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

async function brancherModele3D(controleur) {
    const c = etatApplication.gui.controles;
    const conteneurListe = obtenir(c, NOMS_GUI.modeles.conteneurListe);
    const scrollViewer = obtenir(c, NOMS_GUI.modeles.scrollViewer);

    preparerScrollModeles(scrollViewer, conteneurListe);

    if (conteneurListe) {
        await controleur.afficherListeModeles(conteneurListe);
    }

    const boutonPanneauModeles = obtenir(c, NOMS_GUI.panneaux.modeles.bouton);

    if (boutonPanneauModeles && conteneurListe) {
        boutonPanneauModeles.onPointerClickObservable.add(async () => {
            await controleur.afficherListeModeles(conteneurListe, { forcerDetection: true });
        });
    }

    const modeles = controleur.listerModelesUC.executer();

    controleur.brancherBoutonsModelesExistants([
        { bouton: obtenir(c, NOMS_GUI.modeles.objet1Btn), idModele: modeles[0]?.id },
        { bouton: obtenir(c, NOMS_GUI.modeles.objet2Btn), idModele: modeles[1]?.id }
    ].filter((liaison) => liaison.bouton && liaison.idModele));
}

function preparerScrollModeles(scrollViewer, conteneurListe) {
    if (scrollViewer) {
        scrollViewer.forceVerticalBar = true;
        scrollViewer.barSize = Math.max(Number(scrollViewer.barSize ?? 18), 22);
        scrollViewer.thumbLength = Math.max(Number(scrollViewer.thumbLength ?? 0.15), 0.18);
        scrollViewer.barColor = scrollViewer.barColor || "#000000FF";
        scrollViewer.barBackground = scrollViewer.barBackground || "#D0D0D0FF";
        scrollViewer.isPointerBlocker = true;
        scrollViewer._markAsDirty?.();
    }

    if (conteneurListe) {
        conteneurListe.isVertical = true;
        conteneurListe.adaptHeightToChildren = true;
        conteneurListe.width = "100%";
        conteneurListe._markAsDirty?.();
    }
}

function preparerTexteDynamique(textBlock, texteParDefaut = "") {
    if (!textBlock) return;
    textBlock.metadata = textBlock.metadata || {};
    textBlock.metadata.texteDynamique = true;
    textBlock.isVisible = true;

    if (!textBlock.text && texteParDefaut) {
        textBlock.text = texteParDefaut;
    }

    textBlock._markAsDirty?.();
    etatApplication.gui.advancedTexture?.markAsDirty?.();
}




function initialiserAccessibiliteApresProfil({ profilRestaure, toggleAccessUC, controleurAccess }) {
    const accessibiliteProfil = profilRestaure?.accessibilite;
    const choixProfilExiste = typeof accessibiliteProfil?.actif === "boolean";
    const doitActiver = choixProfilExiste ? accessibiliteProfil.actif : true;

    etatApplication.accessibilite = {
        ...(etatApplication.accessibilite ?? {}),
        actif: false,
        preferencesNavigateur: null,
        sauvegardeAvantActivation: null
    };

    if (doitActiver) {
        toggleAccessUC.activer({ sauvegarderProfil: false });
    } else {
        toggleAccessUC.desactiver({ sauvegarderProfil: false });
    }

    controleurAccess.synchroniserEtatVisuel?.();
}

function obtenirMeshesModelePourEntropie(scene) {
    const depuisEtat = etatApplication.modele3d?.meshesImportes;

    if (Array.isArray(depuisEtat) && depuisEtat.length > 0) {
        return depuisEtat;
    }

    return scene?.meshes?.filter((mesh) => {
        return mesh &&
            mesh.getBoundingInfo &&
            mesh.isVisible !== false &&
            mesh.getTotalVertices?.() > 0;
    }) ?? [];
}

async function chargerModeleInitial(controleurModele3D) {
    const modeleInitial = etatApplication.modele3d.modeleSelectionne
        ?? etatApplication.modele3d.modelesDisponibles[0];

    if (modeleInitial) {
        await controleurModele3D.changerModele(modeleInitial.id);
    }
}

main().catch((erreur) => {
    console.error("Erreur au démarrage de l'application Saotra :", erreur);
});
