/**
 * @file Point d'entrée et composition de l'application ANNA.
 *
 * Rôle : instancier les services, Use Cases et contrôleurs, charger la scène
 * Babylon.js et relier les contrôles de la GUI aux comportements applicatifs.
 *
 * Utilisation : ce fichier est chargé une seule fois par la page principale.
 * Les règles métier doivent rester dans les classes du domaine et les Use Cases ;
 * main.js ne doit contenir que du câblage, de l'initialisation et les adaptations
 * nécessaires entre Babylon.js et la GUI.
 *
 * Contrainte : l'ordre d'initialisation est important. La scène, la GUI et l'état
 * partagé doivent exister avant le branchement des contrôleurs qui les utilisent.
 */
import { chemins } from "./Configuration/chemins.js";
import { constantesCamera } from "./Configuration/constantesCamera.js";
import { constantesApparence } from "./Configuration/constantesApparence.js";
import { constantesInterface } from "./Configuration/constantesInterface.js";
import { constantesContours } from "./Configuration/constantesContours.js";
import { constantesSauvegarde } from "./Configuration/constantesSauvegarde.js";
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
import { ServiceSaillanceVueBabylon } from "./Infrastructure/babylon/ServiceSaillanceVueBabylon.js";
import { ServiceCouleurContourAdaptativeBabylon } from "./Infrastructure/babylon/ServiceCouleurContourAdaptativeBabylon.js";
import { BoucleRenduBabylon } from "./Infrastructure/babylon/BoucleRenduBabylon.js";

import { ChargeurInterfaceGUI } from "./Infrastructure/gui/ChargeurInterfaceGUI.js";
import { RechercheControleGUI } from "./Infrastructure/gui/RechercheControleGUI.js";
import { ServiceDimensionsGUI } from "./Infrastructure/gui/ServiceDimensionsGUI.js";
import { ServiceAnimationGUI } from "./Infrastructure/gui/ServiceAnimationGUI.js";
import { ServiceStyleInterfaceGUI } from "./Infrastructure/gui/ServiceStyleInterfaceGUI.js";
import { ServiceTexteGUI } from "./Infrastructure/gui/ServiceTexteGUI.js";
import { ServiceTexteResponsiveGUI } from "./Infrastructure/gui/ServiceTexteResponsiveGUI.js";
import { ServiceBlocagePointeurGUI } from "./Infrastructure/gui/ServiceBlocagePointeurGUI.js";
import { ServiceListeModelesGUI } from "./Infrastructure/gui/ServiceListeModelesGUI.js";
import { ServiceControlesSpeciauxGUI } from "./Infrastructure/gui/ServiceControlesSpeciauxGUI.js";

import { ServicePolicesNavigateur } from "./Infrastructure/accessibilite/ServicePolicesNavigateur.js";
import { AccessNav } from "./Infrastructure/accessibilite/AccessNav.js";

import { PostTraitApparence } from "./Infrastructure/postTraitements/PostTraitApparence.js";
import { PostTraitNettete } from "./Infrastructure/postTraitements/PostTraitNettete.js";
import { PostTraitSilhouette } from "./Infrastructure/postTraitements/PostTraitSilhouette.js";

import { StockageProfilLocal } from "./Infrastructure/stockage/StockageProfilLocal.js";
import { ServiceDetectionModeles3D } from "./Infrastructure/modele3d/ServiceDetectionModeles3D.js";
import { ServiceLoupe3D } from "./Infrastructure/loupe/ServiceLoupe3D.js";
import { ServiceFormulaireAvisHTML } from "./Infrastructure/web/ServiceFormulaireAvisHTML.js";
import { ServiceEnregistrementEnqueteHTTP } from "./Infrastructure/web/ServiceEnregistrementEnqueteHTTP.js";

import { BasculerMenuUC } from "./UseCases/animIntUseCases/BasculerMenuUC.js";

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
import { ChangerEpaisseurContourUC } from "./UseCases/contoursUseCases/ChangerEpaisseurContourUC.js";
import { ChangerCouleurContourUC } from "./UseCases/contoursUseCases/ChangerCouleurContourUC.js";
import { DesactiverContoursUC } from "./UseCases/contoursUseCases/DesactiverContoursUC.js";
import { ReinitialiserContoursUC } from "./UseCases/contoursUseCases/ReinitialiserContoursUC.js";
import { ChoisirCouleurContourAdaptativeUC } from "./UseCases/contoursUseCases/ChoisirCouleurContourAdaptativeUC.js";

import { ChangerVitesseCameraUC } from "./UseCases/cameraUseCases/ChangerVitesseCameraUC.js";

import { ListerModelesUC } from "./UseCases/modele3dUseCases/ListerModelesUC.js";
import { ChangerModeleActifUC } from "./UseCases/modele3dUseCases/ChangerModeleActifUC.js";
import { ChargerModeleUC } from "./UseCases/modele3dUseCases/ChargerModeleUC.js";

import { ChargerProfilLocalUC } from "./UseCases/profilUseCases/ChargerProfilLocalUC.js";
import { SauvegarderProfilLocalUC } from "./UseCases/profilUseCases/SauvegarderProfilLocalUC.js";
import { AppliquerProfilUC } from "./UseCases/profilUseCases/AppliquerProfilUC.js";
import { ReinitialiserProfilUC } from "./UseCases/profilUseCases/ReinitialiserProfilUC.js";
import { ToggleAccessUC } from "./UseCases/accessibiliteUseCases/ToggleAccessUC.js";
import { EnregistrerReponseEnqueteUC } from "./UseCases/enqueteUseCases/EnregistrerReponseEnqueteUC.js";

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
import { ControleurAccueil } from "./Presentation/controleurs/ControleurAccueil.js";

const NOMS_GUI = Object.freeze({
    menu: {
        rect: "MainMenuRect",
        stackPrincipal: "MainStaPan",
        flecheRect: "FlecheMenuRect",
        flecheBtn: "FlecheMenuBtn",
        flecheTxt: "FlecheMenuBtnTxt"
    },

    // Niveau 1 : les trois volets du menu principal.
    accordions: {
        fichier: { bouton: "FichBtn", rect: "FichOptnRect", fleche: "FichDropBtnTxt" },
        configurations: { bouton: "ConfBtn", rect: "ConfOptnRect", fleche: "ConfDropBtnTxt" },
        outils: { bouton: "OutiBtn", rect: "OutiRect", fleche: "OutiBtnDropText" }
    },

    // Niveau 2 : Réglages est contenu dans Outils.
    accordionsImbriques: {
        reglages: { bouton: "RegBtn", rect: "RegOptnRect", fleche: "RegBtnDropTxt" }
    },

    fichier: {
        ouvrirBtn: "OuvBtn",
        enregistrerBtn: "EnrBtn"
    },

    panneaux: {
        police: { bouton: "PolBtn", panneau: "PoliRect", retour: "PoliRetourBtn" },
        menu: { bouton: "MenuBtn", panneau: "MenuRect", retour: "MenuRetourBtn" },
        contours: { bouton: "ContBtn", panneau: "ContoRect", retour: "ContRetourBtn" },
        texture: { bouton: "TextuBtn", panneau: "TextuRect", retour: "TxtuRetourBtn" },
        lumiere: { bouton: "LumBtn", panneau: "LumRect", retour: "LumRetourBtn" },
        modeles: { bouton: "OuvBtn", panneau: "ModelRect", retour: "ModelRetourBtn" }
    },

    police: {
        boutonDropdown: "PlcDropBtn",
        texteSelection: "PlcDropBtnTxt",
        liste: "PlcTyPoScrollV",
        options: [
            { bouton: "FntFmBtn0", valeur: "OpenDyslexic" },
            { bouton: "FntFmBtn1", valeur: "Liberation" },
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
        themeSceneValeurTxt: "ConfThmValTxt",
        reinitialiserBtn: "RegReintBtn"
    },

    // V1 : uniquement Silhouette + épaisseur + couleur manuelle/automatique.
    contours: {
        silhouetteBtn: "ContDBtn",
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
        caseTxt: "AccessCheckBtnTxt"
    },

    avis: {
        bouton: "AvisBtn",
        texte: "AvisBtnTxt"
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
        "EspaceRect",

        // Bouton flottant et fenêtre de confirmation de fermeture.
        "FermBtn", "FermBtnTxt", "FermRect", "FermMainGrid", "FermBtnGrid", "Fermer",
        "FermerBtn", "FermerBtnTxt", "AnnulerBtn", "AnnulerBtnTxt",

        "ZoomBtn", "ZoomBtnDropTxt", "ZoomBtnTxt", "ZoomReintBtn", "ZoomReintBtnTxt",

        "TextuTailleSlider", "TextuTailleTxt", "TxtuReintBtn", "TxtuReintBtnTxt",
        "AccesBtn", "AccesBtnTxt", "AccesRect", "AccesRetourBtn", "AccesRetourBtnTxt",
        "AccessCheckBtn", "AccessCheckBtnTxt"
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
/**
 * Configure la fenêtre de confirmation utilisée par le bouton de fermeture ANNA.
 *
 * @param {Object} options
 * @param {Object} options.etatApplication État partagé contenant les contrôles GUI.
 * @param {string} [options.destination="#"] URL cible après confirmation.
 * @param {Function|null} [options.avantFermeture=null] Action appelée juste avant la navigation, notamment pour sauvegarder le profil.
 */
function brancherFermetureApplication({ etatApplication, destination = "#", avantFermeture = null } = {}) {
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

    // Le bouton de fermeture est une action globale : il doit rester facilement
    // repérable quel que soit le thème ou l’épaisseur de bordure choisie ailleurs.
    const styleBoutonFermeture = constantesInterface.stylesComposants?.boutonFermeture ?? {};
    boutonOuvrir.width = styleBoutonFermeture.largeur ?? "4.7%";
    boutonOuvrir.fixedRatio = Number(styleBoutonFermeture.ratio) || 1;
    boutonOuvrir.fixedRatioMasterIsWidth = styleBoutonFermeture.largeurPiloteRatio !== false;
    boutonOuvrir.cornerRadius = styleBoutonFermeture.rayonCoin ?? 10;
    boutonOuvrir.thickness = Math.max(
        Number(boutonOuvrir.thickness) || 0,
        Number(styleBoutonFermeture.epaisseurBordureMinimum) || 4
    );
    boutonOuvrir.zIndex = styleBoutonFermeture.zIndex ?? 100;
    boutonOuvrir.hoverCursor = "pointer";
    boutonOuvrir.isPointerBlocker = true;

    if (icone) {
        icone.metadata = icone.metadata || {};
        icone.metadata.texteDynamique = true;
        icone.metadata.nePasModifierTailleTexte = true;
        icone.metadata.nePasAccessibilite = true;
        icone.metadata.nePasAutoFit = true;
        icone.text = styleBoutonFermeture.caractereIcone ?? "X";
        icone.fontFamily = String(etatApplication?.interface?.parametres?.police || constantesInterface.policeDefaut || "Arial");
        icone.fontSize = styleBoutonFermeture.tailleIcone ?? "63%";
        icone.fontWeight = styleBoutonFermeture.poidsIcone ?? "700";
        icone.outlineWidth = Number(styleBoutonFermeture.epaisseurVisuelleIcone) || 0;
        icone.outlineColor = icone.color;
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
        etatApplication?.interface?.parametres?.police || constantesInterface.policeDefaut
    );

    const obtenirPilePolice = (famille) => {
        const nom = String(famille || constantesInterface.policeDefaut).replace(/["']/g, "").trim();
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

        const nom = String(famille || constantesInterface.policeDefaut).replace(/["']/g, "").trim();
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

        // La fenêtre utilise la police réellement sélectionnée dans ANNA.
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

        // Sauvegarde explicite avant la navigation. On ne dépend donc plus
        // uniquement de beforeunload/pagehide, qui peuvent arriver trop tard
        // selon le navigateur ou le mode de fermeture.
        try {
            avantFermeture?.();
        } catch (erreur) {
            console.warn("[Sauvegarde] Échec de la sauvegarde juste avant fermeture.", erreur);
        }

        const url = String(destination ?? "#").trim() || "#";
        window.location.assign(url);
    });
}

/**
 * Gère la visibilité de Loupe, Accessibilité et Avis selon le panneau affiché.
 *
 * Les trois boutons restent visibles au niveau des accordéons principaux
 * (Fichier, Configurations, Outils) et sont masqués dès qu'un sous-menu
 * occupe l'espace de travail du menu latéral.
 */
function installerGestionBoutonsFlottants({ etatApplication, scene, serviceLoupe3D }) {
    const nomsBoutonsFlottants = ["AccesBtn", "LoupeBtn", "AvisBtn"];

    // Les trois boutons restent visibles tant que l'utilisateur se trouve au
    // niveau principal : Fichier, Configurations ou Outils peuvent être déroulés.
    // Ils disparaissent uniquement lorsqu'un vrai sous-menu/panneau est ouvert.
    const nomsPanneauxSecondairesBloquants = [
        "PoliRect",
        "MenuRect",
        "ContoRect",
        "TextuRect",
        "LumRect",
        "ModelRect",
        "AccesRect"
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

    const estReglagesOuvert = () => {
        const reglages = obtenirControle("RegOptnRect");
        return Boolean(reglages?.metadata?.estOuvert === true);
    };

    const estPanneauSecondaireOuvert = () => nomsPanneauxSecondairesBloquants.some((nom) => {
        const panneau = obtenirControle(nom);
        return controleEffectivementVisible(panneau);
    });

    const doitMasquerBoutons = () => estReglagesOuvert() || estPanneauSecondaireOuvert();

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

    // BotGrid ne doit jamais capturer les clics lorsqu'il est masqué.
    const botGrid = obtenirControle("BotGrid");
    if (botGrid) {
        botGrid.isPointerBlocker = false;
        botGrid._markAsDirty?.();
    }

    const synchroniser = ({ forcer = false } = {}) => {
        const maintenant = globalThis.performance?.now?.() ?? Date.now();
        if (!forcer && maintenant - dernierControleMs < delaiControleMs) return;
        dernierControleMs = maintenant;

        const masquer = doitMasquerBoutons();
        const disponible = !masquer;

        if (masquer && serviceLoupe3D?.actif) {
            serviceLoupe3D.desactiver?.();
        }

        if (dernierEtat === disponible) return;
        dernierEtat = disponible;

        nomsBoutonsFlottants.forEach((nom) => appliquerDisponibilite(obtenirControle(nom), disponible));

        if (botGrid) {
            botGrid.isVisible = disponible;
            botGrid.alpha = disponible ? 1 : 0;
            botGrid.isHitTestVisible = disponible;
            botGrid.isPointerBlocker = false;
            botGrid._markAsDirty?.();
        }

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
    const serviceSaillanceVueBabylon = new ServiceSaillanceVueBabylon();
    const serviceCouleurContourAdaptativeBabylon = new ServiceCouleurContourAdaptativeBabylon();
    const boucleRenduBabylon = new BoucleRenduBabylon();
    const serviceControlesSpeciauxGUI = new ServiceControlesSpeciauxGUI();
    const serviceLoupe3D = new ServiceLoupe3D();
    const serviceFormulaireAvisHTML = new ServiceFormulaireAvisHTML({
        configuration: configurationFormulaireAvis
    });
    const serviceEnregistrementEnqueteHTTP = new ServiceEnregistrementEnqueteHTTP({
        endpoint: configurationFormulaireAvis.enregistrement?.endpoint,
        cleStockageSecours: configurationFormulaireAvis.enregistrement?.cleStockageSecours,
        delaiMaximumMs: configurationFormulaireAvis.enregistrement?.delaiMaximumMs
    });

    // Une réponse conservée localement après une panne réseau est renvoyée
    // automatiquement lors d'un prochain chargement de l'application.
    serviceEnregistrementEnqueteHTTP.reessayerEnvoisEnAttente()
        .then(({ envoyees, restantes }) => {
            if (envoyees > 0 || restantes > 0) {
                console.info("[Enquête] Réponses en attente :", { envoyees, restantes });
            }
        })
        .catch((erreur) => {
            console.warn("[Enquête] Réessai des réponses en attente impossible.", erreur);
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
    etatApplication.gui.advancedTexture = fabriqueSceneGUI.creerTexture(etatApplication.scenes.sceneGUI, "InterfaceUtilisateur");

    const chargeurInterfaceGUI = new ChargeurInterfaceGUI();
    const serviceDimensionsGUI = new ServiceDimensionsGUI();
    const serviceAnimationGUI = new ServiceAnimationGUI(serviceDimensionsGUI, etatApplication.scenes.sceneGUI, etatApplication);
    const serviceStyleInterfaceGUI = new ServiceStyleInterfaceGUI();
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
        dossierModeles: chemins.modeles.dossier
    });

    const servicePolicesNavigateur = new ServicePolicesNavigateur();
    const accessNav = new AccessNav();

    await servicePolicesNavigateur.chargerPolices(constantesInterface.policesDisponibles);

    ////////////////////////////////////////////////////////////////

    // Ligne de base avec le fichier JSON :
     await chargeurInterfaceGUI.chargerDepuisJson(etatApplication.gui.advancedTexture, chemins.gui.principale);

    etatApplication.gui.controles = recupererTousLesControles(etatApplication.gui.advancedTexture);
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
    const postTraitSilhouette = new PostTraitSilhouette();
    const stockageProfilLocal = new StockageProfilLocal();

    const basculerMenuUC = new BasculerMenuUC(etatApplication);

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
    const changerEpaisseurContourUC = new ChangerEpaisseurContourUC(etatApplication);
    const changerCouleurContourUC = new ChangerCouleurContourUC(etatApplication);
    const desactiverContoursUC = new DesactiverContoursUC(etatApplication, constantesContours.epaisseurDefaut);
    const reinitialiserContoursUC = new ReinitialiserContoursUC(etatApplication);
    const choisirCouleurContourAdaptativeUC = new ChoisirCouleurContourAdaptativeUC(
        etatApplication,
        serviceCouleurContourAdaptativeBabylon
    );
    const changerVitesseCameraUC = new ChangerVitesseCameraUC(etatApplication);

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

    const chargerProfilLocalUC = new ChargerProfilLocalUC(etatApplication, stockageProfilLocal);
    const sauvegarderProfilLocalUC = new SauvegarderProfilLocalUC(etatApplication, stockageProfilLocal);
    const appliquerProfilUC = new AppliquerProfilUC(etatApplication);
    const reinitialiserProfilUC = new ReinitialiserProfilUC(etatApplication);

    const enregistrerReponseEnqueteUC = new EnregistrerReponseEnqueteUC({
        serviceEnregistrement: serviceEnregistrementEnqueteHTTP
    });

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
        serviceAnimationGUI,
        serviceDimensionsGUI,
        serviceBlocagePointeurGUI,
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
        serviceSceneBabylon,
        sauvegarderProfilLocalUC
    });

    const controleurContours = new ControleurContours({
        etatApplication,
        activerSilhouetteUC,
        changerEpaisseurContourUC,
        changerCouleurContourUC,
        choisirCouleurContourAdaptativeUC,
        desactiverContoursUC,
        reinitialiserContoursUC,
        postTraitSilhouette
    });

    const controleurCamera = new ControleurCamera({
        etatApplication,
        changerVitesseCameraUC,
        serviceCameraBabylon
    });

    const controleurModele3D = new ControleurModele3D({
        etatApplication,
        listerModelesUC,
        changerModeleActifUC,
        chargerModeleUC,
        serviceListeModelesGUI,
        serviceSceneBabylon,
        chargeurModeleBabylon,
        serviceOrientationModeleBabylon,
        serviceNormalisationModeleBabylon,
        serviceCadrageCameraBabylon,
        serviceMateriauxBabylon,
        serviceCameraBabylon,
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
        postTraitNettete
    });

    const controleurAccess = new ControleurAccess({
        etatApplication,
        toggleAccessUC
    });

    const controleurAvis = new ControleurAvis({
        etatApplication,
        serviceFormulaireAvisHTML,
        configurationFormulaireAvis,
        constantesInterface,
        enregistrerReponseEnqueteUC
    });

    // Après chaque changement de thème, on remet l’icône Accessibilité
    // dans la même couleur que le texte du bouton.
    const appliquerThemeInterfaceOriginal = serviceStyleInterfaceGUI.appliquerTheme.bind(serviceStyleInterfaceGUI);
    serviceStyleInterfaceGUI.appliquerTheme = (...args) => {
        const retour = appliquerThemeInterfaceOriginal(...args);
        const synchroniserInterfaceSpeciale = () => {
            controleurAccess.synchroniserEtatVisuel?.();
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
        destination: chemins.navigation?.fermetureApplication ?? "#",
        avantFermeture: () => controleurProfil.sauvegarderMaintenant()
    });
    // Le bouton X reçoit sa taille finale dans brancherFermetureApplication.
    // On recalcule ensuite le haut du menu pour garantir la marge sous le bouton.
    serviceAnimationGUI.ajusterDispositionMenuPrincipal?.();

    // Sauvegarde manuelle : le bouton Enregistrer déclenche exactement la même
    // sauvegarde que l'automatique, mais avec un retour visuel explicite.
    controleurProfil.configurerConfirmationSauvegarde?.();
    controleurProfil.brancherSauvegarde(
        etatApplication.gui.controles?.[NOMS_GUI.fichier.enregistrerBtn]
        ?? etatApplication.gui.advancedTexture?.getControlByName?.(NOMS_GUI.fichier.enregistrerBtn)
    );

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
    // Si un profil existe, ses quatre réglages visuels manuels reprennent la
    // priorité après la réactivation automatique du mode Accessibilité.
    controleurProfil.restaurerReglagesApparenceDepuisProfil?.(profilRestaure);
    controleurProfil.installerSauvegardeAutomatique();

    // Aide de test en développement : permet de forcer la sauvegarde depuis la console
    // sans attendre la fermeture de l’onglet.
    if (typeof window !== "undefined") {
        window.annaSauvegarde = {
            cle: constantesSauvegarde.cleProfil,
            sauvegarder: () => controleurProfil.sauvegarderMaintenant(),
            charger: () => JSON.parse(localStorage.getItem(constantesSauvegarde.cleProfil) || "null"),
            effacer: () => localStorage.removeItem(constantesSauvegarde.cleProfil)
        };

        window.annaModeles = {
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
                return window.annaModeles.liste();
            }
        };

        window.annaContours = {
            activerSilhouette: () => {
                const p = etatApplication.contours?.parametres;
                if (!p?.estActif?.("silhouette")) activerSilhouetteUC.executer();
                controleurContours.appliquerDepuisEtat();
            },
            desactiverSilhouette: () => {
                desactiverContoursUC.executer("silhouette");
                controleurContours.appliquerDepuisEtat();
            },
            etat: () => ({
                actif: Boolean(etatApplication.contours?.parametres?.actif),
                epaisseur: etatApplication.contours?.parametres?.epaisseur,
                couleur: etatApplication.contours?.parametres?.couleur,
                couleurAutomatiqueActive: Boolean(etatApplication.contours?.parametres?.couleurAutomatiqueActive)
            })
        };

        window.annaLoupe = {
            activer: () => serviceLoupe3D.activer(),
            desactiver: () => serviceLoupe3D.desactiver(),
            basculer: () => serviceLoupe3D.basculer(),
            reglerZoom: (valeur) => serviceLoupe3D.reglerZoom(valeur),
            reglerDiametre: (valeur) => serviceLoupe3D.reglerDiametre(valeur),
            reglerNettete: (valeur) => serviceLoupe3D.reglerNettete(valeur),
            reglerInversionY: (actif) => serviceLoupe3D.reglerInversionY(actif),
            etat: () => serviceLoupe3D.etat()
        };

        window.annaTexteResponsive = {
            ajuster: () => serviceTexteResponsiveGUI.ajuster(),
            planifier: () => serviceTexteResponsiveGUI.planifierAjustement(),
            debug: (actif = true) => serviceTexteResponsiveGUI.debug(actif)
        };
    }

    serviceStyleInterfaceGUI.appliquerTheme(etatApplication);
    serviceTexteGUI.appliquerParametresTexte(etatApplication);
    serviceTexteResponsiveGUI.planifierAjustement();

    // Écran d'accueil séparé : guiTexture_acc.json est chargé dans sa propre
    // AdvancedDynamicTexture. La préférence « Ne plus afficher au démarrage »
    // est vérifiée AVANT le chargement pour éviter une requête inutile.
    let controleurAccueil = null;
    if (ControleurAccueil.doitAfficherAuDemarrage()) {
        try {
            etatApplication.gui.advancedTextureAccueil = fabriqueSceneGUI.creerTexture(
                etatApplication.scenes.sceneGUI,
                "InterfaceAccueil"
            );

            await chargeurInterfaceGUI.chargerDepuisJson(
                etatApplication.gui.advancedTextureAccueil,
                chemins.gui.accueil
            );

            controleurAccueil = new ControleurAccueil({
                etatApplication,
                serviceBlocagePointeurGUI,
                advancedTexture: etatApplication.gui.advancedTextureAccueil
            });

            controleurAccueil.installer();
            etatApplication.scenes.sceneGUI?.onDisposeObservable?.add?.(() => {
                controleurAccueil?.detruire();
            });
        } catch (erreur) {
            // Une erreur de l'accueil ne doit jamais empêcher l'ouverture d'ANNA.
            console.warn("[Accueil] Impossible de charger l'interface d'accueil.", erreur);
            etatApplication.gui.advancedTextureAccueil?.dispose?.();
            etatApplication.gui.advancedTextureAccueil = null;
            serviceBlocagePointeurGUI.definirVerrouForce?.(false);
        }
    } else if (etatApplication.interface) {
        etatApplication.interface.accueilOuvert = false;
    }


    // On crée une première sauvegarde légère dès que l’interface est prête.
    // Comme ça, la clé existe déjà dans localStorage même avant fermeture du navigateur.
    controleurProfil.sauvegarderMaintenant();

    // On ne crée pas les post-traitements au démarrage :
    // ils seront créés seulement quand une valeur quitte son état neutre.

    boucleRenduBabylon.lancer(
        etatApplication.moteur,
        etatApplication.scenes.scene3D,
        etatApplication.scenes.sceneGUI
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

    controleur.brancherAccordeonsImbriques(Object.values(NOMS_GUI.accordionsImbriques).map((item) => ({
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
        ...Object.values(NOMS_GUI.accordionsImbriques).map((item) => obtenir(c, item.rect)),
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
            controleur.notifierReglageManuel?.({ nettete: v });
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
            controleur.notifierReglageManuel?.({ contraste: v });
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
            controleur.notifierReglageManuel?.({ luminosite: v });
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
            controleur.notifierReglageManuel?.({ saturation: v });
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
    textBlock.metadata = textBlock.metadata || {};
    textBlock.metadata.texteDynamique = true;

    if (afficherSigne && pourcentage > 0) {
        textBlock.text = `+${pourcentage}%`;
    } else {
        textBlock.text = `${pourcentage}%`;
    }

    textBlock.metadata.responsiveTexteOriginal = textBlock.text;
    delete textBlock.metadata.dernierTexteAutoFit;
    textBlock._markAsDirty?.();
    etatApplication.gui?.advancedTexture?.markAsDirty?.();
}

function brancherContours(controleur) {
    const c = etatApplication.gui.controles;
    const n = NOMS_GUI.contours;

    if (obtenir(c, n.silhouetteBtn)) controleur.brancherSilhouette(obtenir(c, n.silhouetteBtn));

    const boutonCouleurOptimale = obtenirPremier(c, n.couleurOptimaleBtns);
    if (boutonCouleurOptimale) controleur.brancherCouleurAdaptative(boutonCouleurOptimale);

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
    console.error("Erreur au démarrage de l'application ANNA :", erreur);
});
