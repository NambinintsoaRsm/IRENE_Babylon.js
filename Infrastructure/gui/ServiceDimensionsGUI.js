/**
 * Lit les dimensions réelles des composants GUI.
 *
 * Les largeurs, hauteurs et positions qui viennent du fichier guiTexture.json
 * doivent être lues ici, au lieu d'être fixées dans le code.
 */
export class ServiceDimensionsGUI {
    lireValeurNumerique(valeur) {
        if (typeof valeur === "number") {
            return valeur;
        }

        if (typeof valeur !== "string") {
            return 0;
        }

        return parseFloat(valeur.replace("%", "").replace("px", "")) || 0;
    }

    estPourcentage(valeur) {
        return typeof valeur === "string" && valeur.includes("%");
    }

    estPixel(valeur) {
        return typeof valeur === "string" && valeur.includes("px");
    }

    lireLargeur(controle) {
        if (!controle) {
            throw new Error("Contrôle GUI introuvable pour lire la largeur.");
        }

        return {
            brute: controle.width,
            valeur: this.lireValeurNumerique(controle.width),
            estPourcentage: this.estPourcentage(controle.width),
            estPixel: this.estPixel(controle.width)
        };
    }

    lireHauteur(controle) {
        if (!controle) {
            throw new Error("Contrôle GUI introuvable pour lire la hauteur.");
        }

        return {
            brute: controle.height,
            valeur: this.lireValeurNumerique(controle.height),
            estPourcentage: this.estPourcentage(controle.height),
            estPixel: this.estPixel(controle.height)
        };
    }

    memoriserDimensionSection(etatApplication, nomSection, controleSection) {
        if (!etatApplication?.gui?.dimensionsInitiales?.sections) {
            throw new Error("Zone des dimensions initiales introuvable.");
        }

        const hauteur = this.lireHauteur(controleSection);

        etatApplication.gui.dimensionsInitiales.sections[nomSection] = {
            hauteur: hauteur.brute,
            hauteurValeur: hauteur.valeur,
            estPourcentage: hauteur.estPourcentage,
            estPixel: hauteur.estPixel
        };

        return etatApplication.gui.dimensionsInitiales.sections[nomSection];
    }

    memoriserMenu(etatApplication, menuControle, flecheControle) {
        if (!etatApplication?.gui?.dimensionsInitiales) {
            throw new Error("Dimensions initiales GUI introuvables.");
        }

        etatApplication.gui.dimensionsInitiales.menu = {
            largeur: menuControle?.width ?? null,
            largeurValeur: menuControle ? this.lireValeurNumerique(menuControle.width) : 0
        };

        etatApplication.gui.dimensionsInitiales.flecheMenu = {
            largeur: flecheControle?.width ?? null,
            largeurValeur: flecheControle ? this.lireValeurNumerique(flecheControle.width) : 0,
            left: flecheControle?.left ?? null
        };

        return etatApplication.gui.dimensionsInitiales;
    }

    fermerVisuellementSection(controleSection) {
        if (!controleSection) {
            return;
        }

        controleSection.height = "0px";
        controleSection.isVisible = false;
    }

    ouvrirVisuellementSection(controleSection, hauteurInitiale) {
        if (!controleSection) {
            return;
        }

        controleSection.height = hauteurInitiale;
        controleSection.isVisible = true;
    }
}