/**
 * Service de gestion du texte de l'interface Babylon GUI.
 *
 * Règle importante :
 * - on ne convertit plus les tailles en pixels ;
 * - on conserve l'unité définie dans guiTexture.json : %, px ou nombre ;
 * - taillePolice est une variation relative : 0 = taille originale, -10 = -10 %, +2 = +2 %.
 */
export class ServiceTexteGUI {
    appliquerParametresTexte(etatApplication) {
        const advancedTexture = etatApplication?.gui?.advancedTexture;
        const parametres = etatApplication?.interface?.parametres;

        if (!advancedTexture || !parametres) return;

        advancedTexture.getDescendants().forEach((controle) => {
            if (controle instanceof BABYLON.GUI.TextBlock) {
                this.appliquerSurTextBlock(controle, parametres);
            }

            if (controle instanceof BABYLON.GUI.Button && controle.textBlock) {
                this.appliquerSurTextBlock(controle.textBlock, parametres);
            }
        });

        // Si le mode accessibilité est actif, on garde la taille navigateur
        // même après un changement de thème, de police ou de style.
        const remPx = Number(etatApplication?.accessibilite?.preferencesNavigateur?.remPx);
        if (etatApplication?.accessibilite?.actif && Number.isFinite(remPx) && remPx > 0) {
            this.appliquerTailleNavigateurPx(etatApplication, Math.round(remPx));
            return;
        }

        advancedTexture.markAsDirty();
    }

    appliquerSurTextBlock(textBlock, parametres) {
        if (!textBlock) return;

        textBlock.metadata = textBlock.metadata || {};

        if (textBlock.metadata.fontSizeOriginal === undefined) {
            textBlock.metadata.fontSizeOriginal = textBlock.fontSize;
        }

        const estTexteDynamique = textBlock.metadata.texteDynamique === true;

        if (!estTexteDynamique && textBlock.metadata.texteOriginal === undefined) {
            textBlock.metadata.texteOriginal = textBlock.text;
        }

        const police = parametres.police || "OpenDyslexic";
        const variationPourcentage = Number.isFinite(parametres.taillePolice)
            ? parametres.taillePolice
            : 0;

        textBlock.fontFamily = police;
        textBlock.fontSize = this.calculerFontSizeAvecVariation(
            textBlock.metadata.fontSizeOriginal,
            variationPourcentage
        );
        textBlock.fontWeight = parametres.gras ? "700" : "400";
        textBlock.characterSpacing = 0;

        const texteSource = estTexteDynamique
            ? textBlock.text
            : (textBlock.metadata.texteOriginal ?? textBlock.text);

        textBlock.text = police === "OpenDyslexic"
            ? String(texteSource).replace(/ /g, "\u2009")
            : String(texteSource);

        textBlock._markAsDirty();
    }

    calculerFontSizeAvecVariation(fontSizeOriginal, variationPourcentage) {
        const facteur = Math.max(0.1, 1 + variationPourcentage / 100);

        if (typeof fontSizeOriginal === "number") {
            return Math.max(1, fontSizeOriginal * facteur);
        }

        if (typeof fontSizeOriginal === "string") {
            const valeur = parseFloat(fontSizeOriginal);
            if (!Number.isFinite(valeur)) return fontSizeOriginal;

            if (fontSizeOriginal.includes("%")) {
                return `${Math.max(1, valeur * facteur)}%`;
            }

            if (fontSizeOriginal.includes("px")) {
                return `${Math.max(1, valeur * facteur)}px`;
            }

            return `${Math.max(1, valeur * facteur)}px`;
        }

        return fontSizeOriginal;
    }

    appliquerTailleNavigateurPx(etatApplication, taillePx) {
        const advancedTexture = etatApplication?.gui?.advancedTexture;
        const valeur = Number(taillePx);

        if (!advancedTexture || !Number.isFinite(valeur) || valeur <= 0) return;

        advancedTexture.getDescendants().forEach((controle) => {
            if (controle instanceof BABYLON.GUI.TextBlock) {
                this.appliquerTailleNavigateurSurTextBlock(controle, valeur);
            }

            if (controle instanceof BABYLON.GUI.Button && controle.textBlock) {
                this.appliquerTailleNavigateurSurTextBlock(controle.textBlock, valeur);
            }
        });

        advancedTexture.markAsDirty();
    }

    appliquerTailleNavigateurSurTextBlock(textBlock, taillePx) {
        if (!textBlock) return;

        textBlock.metadata = textBlock.metadata || {};

        if (textBlock.metadata.fontSizeOriginal === undefined) {
            textBlock.metadata.fontSizeOriginal = textBlock.fontSize;
        }

        textBlock.metadata.tailleAccessibiliteNavigateurPx = taillePx;
        textBlock.fontSize = `${taillePx}px`;
        textBlock._markAsDirty?.();
    }

}
