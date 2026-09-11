/**
 * @file État partagé de l'application ANNA.
 *
 * Ce module assemble les objets métier qui décrivent l'état courant de la GUI,
 * de la scène 3D, du profil et des traitements visuels. Les contrôleurs modifient
 * cet objet ; les services Babylon/GUI lisent ensuite les valeurs nécessaires.
 *
 * Il ne doit pas contenir de logique métier : les règles de modification restent
 * dans les Use Cases et les contrôleurs.
 */
import { EtatMenuLateral } from "../Domain/animationInterface/EtatMenuLateral.js";
import { ParametresAnimation } from "../Domain/animationInterface/ParametresAnimation.js";

import { EtatModele3D } from "../Domain/modele3d/EtatModele3D.js";

import { constantesAnimation } from "../Configuration/constantesAnimation.js";
import { catalogueModeles3D } from "../Configuration/catalogueModeles3D.js";
import { profilParDefaut } from "../Configuration/profilParDefaut.js";

export const etatApplication = {
    canvas: null,
    moteur: null,

    scenes: {
        scene3D: null,
        sceneGUI: null
    },

    gui: {
        /** Interface principale ANNA. */
        advancedTexture: null,

        /** Interface d'accueil temporaire, distincte de l'interface principale. */
        advancedTextureAccueil: null,

        controles: {},

        dimensionsInitiales: {
            menu: null,
            flecheMenu: null
        }
    },

    animation: {
        parametres: new ParametresAnimation({
            dureeMenuLateral: constantesAnimation.dureeMenuLateral,
            dureePanneauDeroulant: constantesAnimation.dureePanneauDeroulant
        }),

        menuLateral: new EtatMenuLateral()
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
        postTraitementSilhouette: null
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