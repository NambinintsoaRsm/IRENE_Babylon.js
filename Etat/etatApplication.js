import { EtatMenuLateral } from "../Domain/animationInterface/EtatMenuLateral.js";
import { EtatPanneauDeroulant } from "../Domain/animationInterface/EtatPanneauDeroulant.js";
import { ParametresAnimation } from "../Domain/animationInterface/ParametresAnimation.js";

import { EtatModele3D } from "../Domain/modele3d/EtatModele3D.js";

import { constantesAnimation } from "../Configuration/constantesAnimation.js";
import { catalogueModeles3D } from "../Configuration/catalogueModeles3D.js";
import { profilParDefaut } from "../Configuration/profilParDefaut.js";
import { constantesContours } from "../Configuration/constantesContours.js";

function creerSectionsAnimation() {
    return {
        configurations: new EtatPanneauDeroulant({
            nom: "configurations"
        }),

        police: new EtatPanneauDeroulant({
            nom: "police"
        }),

        menu: new EtatPanneauDeroulant({
            nom: "menu"
        }),

        theme: new EtatPanneauDeroulant({
            nom: "theme"
        }),

        reglages: new EtatPanneauDeroulant({
            nom: "reglages"
        }),

        apparence: new EtatPanneauDeroulant({
            nom: "apparence"
        }),

        visualisation: new EtatPanneauDeroulant({
            nom: "visualisation"
        }),

        contours: new EtatPanneauDeroulant({
            nom: "contours"
        }),

        modele3d: new EtatPanneauDeroulant({
            nom: "modele3d"
        })
    };
}

export const etatApplication = {
    canvas: null,
    moteur: null,

    scenes: {
        scene3D: null,
        sceneGUI: null,
        sceneContoursCouleur: null
    },

    gui: {
        advancedTexture: null,

        controles: {},

        dimensionsInitiales: {
            menu: null,
            flecheMenu: null,
            sections: {}
        }
    },

    animation: {
        parametres: new ParametresAnimation({
            dureeMenuLateral: constantesAnimation.dureeMenuLateral,
            dureePanneauDeroulant: constantesAnimation.dureePanneauDeroulant,
            largeurMenu: constantesAnimation.largeurMenu,
            largeurPanneauSecondaire: constantesAnimation.largeurPanneauSecondaire
        }),

        menuLateral: new EtatMenuLateral(),

        sections: creerSectionsAnimation(),

        sectionActive: null
    },

    interface: {
        parametres: profilParDefaut.interfaceUtilisateur
    },

    apparence: {
        parametres: profilParDefaut.apparence,

        postTraitementApparence: null,
        postTraitementNettete: null
    },

    contours: {
        parametres: profilParDefaut.contours,
        parametresMiseLumiere: {
            intervalleClignotement: constantesContours.miseLumiereGradients.animation.intervalleSecondes.defaut,
            luminanceSliderValeur: constantesContours.miseLumiereGradients.animation.luminancePourcentage.defaut,
            luminanceDelta: constantesContours.miseLumiereGradients.animation.luminancePourcentage.deltaDefaut,
            largeur: constantesContours.miseLumiereGradients.animation.largeur.defaut
        },

        postTraitContProfNorm: null,
        postTraitementContoursCouleur: null,

        miseLumiereNormalesActif: false,
        miseLumiereCouleursActif: false,
        postTraitMiseLumiereNormales: null,
        postTraitMiseLumiereCouleurs: null
    },

    camera: {
        cameraBabylon: null,
        parametres: profilParDefaut.camera,

        positionInitiale: null,
        cibleInitiale: null,
        rayonInitial: null
    },

    modele3d: new EtatModele3D({
        modelesDisponibles: catalogueModeles3D,
        modeleSelectionne: null,
        modeleActuel: null,
        meshActuel: null,
        meshesImportes: [],
        estEnChargement: false,
        erreurChargement: null
    }),

    profil: {
        profilActuel: profilParDefaut
    }
};