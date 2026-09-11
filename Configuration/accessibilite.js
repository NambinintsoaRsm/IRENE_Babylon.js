/**
 * @file Valeurs appliquées par le mode Accessibilité d'ANNA.
 *
 * Ce fichier décrit des profils de réglages, pas l'état courant de l'interface.
 * ToggleAccessUC applique temporairement ces valeurs puis restaure les réglages
 * précédents de l'utilisateur lorsque le mode est désactivé.
 *
 * Les coefficients sont empiriques et correspondent au comportement validé de
 * la V1. Ils doivent être testés avec les profils utilisateurs avant modification.
 */
import { ThemeInterface } from "../Domain/interface/ThemeInterface.js";
import { constantesAnimation } from "./constantesAnimation.js";
import { constantesCamera } from "./constantesCamera.js";


export const access = Object.freeze({
    bouton: Object.freeze({
        texteActif: "Accessibilité : ON",
        texteInactif: "Accessibilité : OFF"
    }),

    rem: Object.freeze({
        /**
         * Valeur de secours de 1rem en pixels si la mesure navigateur échoue.
         * 16 px correspond à la valeur par défaut des navigateurs courants.
         */
        basePx: 16
    }),

    mouvement: Object.freeze({
        /**
         * Le mode de réduction des mouvements ralentit les transitions au lieu de
         * les supprimer, afin de conserver le retour visuel d'ouverture/fermeture.
         */
        facteurDuree: 2,
        facteurVitesseLumiere: 0.5,
        facteurSensibiliteCamera: 2
    }),

    /** Valeurs à restaurer quand le ralentissement d'accessibilité est retiré. */
    animationDefaut: Object.freeze({
        dureeMenuLateral: constantesAnimation.dureeMenuLateral,
        dureePanneauDeroulant: constantesAnimation.dureePanneauDeroulant
    }),

    cameraDefaut: Object.freeze({
        wheelPrecision: constantesCamera.wheelPrecision,
        sensibiliteRotation: constantesCamera.sensibiliteRotation
    }),

    /**
     * Profils de contraste proposés par le mode Accessibilité.
     * `fondScene` suit l'échelle utilisée par le slider de scène (0 à 100).
     */
    contraste: Object.freeze({
        more: Object.freeze({
            contraste: 1.25,
            nettete: 1.2,
            saturation: 1.1,
            luminosite: 0,
            bordureMenu: 4,
            bordureBouton: 3,
            fondScene: 80
        }),

        less: Object.freeze({
            contraste: 0.9,
            nettete: 0.6,
            saturation: 0.9,
            luminosite: 0,
            bordureMenu: 2,
            bordureBouton: 2,
            fondScene: 35
        }),

        custom: Object.freeze({
            contraste: 1.15,
            nettete: 1,
            saturation: 1,
            luminosite: 0,
            bordureMenu: 3,
            bordureBouton: 3,
            fondScene: 50
        }),

        normal: Object.freeze({
            contraste: 1,
            nettete: 0,
            saturation: 1,
            luminosite: 0,
            bordureMenu: 1,
            bordureBouton: 1,
            fondScene: 0
        })
    }),

    themes: Object.freeze({
        dark: Object.freeze({
            themeInterface: ThemeInterface.GRIS_FONCE,
            fondScene: 80
        }),

        light: Object.freeze({
            themeInterface: ThemeInterface.BLANC,
            fondScene: 0
        })
    })
});
