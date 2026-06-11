import { ThemeInterface } from "../Domain/interface/ThemeInterface.js";
import { constantesAnimation } from "./constantesAnimation.js";
import { constantesCamera } from "./constantesCamera.js";

export const access = Object.freeze({
    bouton: Object.freeze({
        texteActif: "Accessibilité : ON",
        texteInactif: "Accessibilité : OFF"
    }),

    rem: Object.freeze({
        // Taille de référence si la mesure 1rem échoue.
        // Si le navigateur renvoie 16px, 19px ou 52px, on applique directement cette valeur.
        basePx: 16
    }),

    mouvement: Object.freeze({
        // prefers-reduced-motion ne supprime pas les animations : il les ralentit.
        facteurDuree: 2,
        facteurVitesseLumiere: 0.5,
        facteurSensibiliteCamera: 2
    }),

    animationDefaut: Object.freeze({
        dureeMenuLateral: constantesAnimation.dureeMenuLateral,
        dureePanneauDeroulant: constantesAnimation.dureePanneauDeroulant
    }),

    cameraDefaut: Object.freeze({
        wheelPrecision: constantesCamera.wheelPrecision,
        sensibiliteRotation: constantesCamera.sensibiliteRotation
    }),

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
