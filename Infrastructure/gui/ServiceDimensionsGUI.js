/**
 * @file Lecture et mémorisation des dimensions de contrôles Babylon GUI.
 *
 * Rôle : convertir les valeurs CSS/GUI en nombres exploitables par les animations.
 *
 * Utilisation : ServiceAnimationGUI s'appuie sur ce service pour déplacer le menu
 * sans coder en dur ses dimensions.
 */
import {
    lireNombreDepuisValeurCss,
    estValeurPourcentage,
    estValeurPixel
} from "../../Util/ValeurCssUtils.js";

/**
 * Lit les dimensions réelles des composants GUI.
 *
 * Les largeurs, hauteurs et positions qui viennent du fichier guiTexture.json
 * doivent être lues ici, au lieu d'être fixées dans le code.
 */
export class ServiceDimensionsGUI {
    lireLargeur(controle) {
        if (!controle) {
            throw new Error("Contrôle GUI introuvable pour lire la largeur.");
        }

        return {
            brute: controle.width,
            valeur: lireNombreDepuisValeurCss(controle.width),
            estPourcentage: estValeurPourcentage(controle.width),
            estPixel: estValeurPixel(controle.width)
        };
    }

    lireHauteur(controle) {
        if (!controle) {
            throw new Error("Contrôle GUI introuvable pour lire la hauteur.");
        }

        return {
            brute: controle.height,
            valeur: lireNombreDepuisValeurCss(controle.height),
            estPourcentage: estValeurPourcentage(controle.height),
            estPixel: estValeurPixel(controle.height)
        };
    }

    lirePositionGauche(controle) {
        if (!controle) {
            throw new Error("Contrôle GUI introuvable pour lire la position gauche.");
        }

        return {
            brute: controle.left,
            valeur: lireNombreDepuisValeurCss(controle.left),
            estPourcentage: estValeurPourcentage(controle.left),
            estPixel: estValeurPixel(controle.left)
        };
    }

    memoriserMenu(etatApplication, menuControle, flecheControle) {
        if (!etatApplication?.gui?.dimensionsInitiales) {
            throw new Error("Dimensions initiales GUI introuvables.");
        }

        const largeurMenu = menuControle ? this.lireLargeur(menuControle) : null;
        const largeurFleche = flecheControle ? this.lireLargeur(flecheControle) : null;
        const positionFleche = flecheControle ? this.lirePositionGauche(flecheControle) : null;

        etatApplication.gui.dimensionsInitiales.menu = {
            largeur: largeurMenu?.brute ?? null,
            largeurValeur: largeurMenu?.valeur ?? 0,
            estPourcentage: largeurMenu?.estPourcentage ?? false,
            estPixel: largeurMenu?.estPixel ?? false
        };

        etatApplication.gui.dimensionsInitiales.flecheMenu = {
            largeur: largeurFleche?.brute ?? null,
            largeurValeur: largeurFleche?.valeur ?? 0,
            left: positionFleche?.brute ?? null,
            leftValeur: positionFleche?.valeur ?? 0
        };

        return etatApplication.gui.dimensionsInitiales;
    }

}