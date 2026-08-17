/**
 * Service de gestion du texte de l'interface Babylon GUI.
 *
 * Règle importante :
 * - on ne convertit plus les tailles en pixels en mode standard ;
 * - on conserve l'unité définie dans guiTexture.json : %, px ou nombre ;
 * - taillePolice est une variation relative : 0 = taille originale, -10 = -10 %, +2 = +2 % ;
 * - en mode accessibilité, certains rôles ont une hiérarchie de taille :
 *   les titres restent plus grands que les textes courants.
 */
export class ServiceTexteGUI {
    constructor() {
        this.timersAutoFit = [];

        this.nomsTextesIconesExclus = new Set([
            "LoupeBtnTxt",
            "AccesBtnTxt"
        ]);

        this.nomsTitresMenus = new Set([
            "ConfBtnTxt",
            "PolBtnText",
            "MenuBtnText",
            "RegBtnTxt",
            "Mod3DBtnText",
            "ContBtnText",
            "TextuBtnTxt",
            "LumBtnTxt",
            "AvisBtnTxt",
            "Fermer"
        ]);

        // Libellés de section qui disposent visuellement d'assez de place,
        // mais dont le contrôle GUI est parfois peu haut dans le JSON. Sans
        // rôle explicite, l'auto-fit pouvait les réduire beaucoup plus que les
        // boutons, notamment avec OpenDyslexic en taille navigateur 32 px.
        this.nomsLibellesSections = new Set([
            // Réglages
            "RegThmTxt",
            "RegNetTxt",
            "RegConTxt",
            "RegLumTxt",
            "RegSatTxt",

            // Contours
            "ContCoulTxt",
            "ContSurbTxt",
            "ContoAutoTxt",
            "HighClairTxt",
            "HighSombrTxt",
            "ContEpaiTxt",

            // Police, texture et lumière
            "PoliTailleTxt",
            "PoliGrasTxt",
            "TextuTailleTxt",
            "LumIntTxt",
            "LumTempTxt",

            // Configuration du menu
            "MenuBordTxt",
            "BdTaiMenuTxt",
            "BdTaiBoutonTxt",
            "MenuPosiTxt"
        ]);

        // Ces libellés courts doivent rester proches de la taille demandée :
        // leur largeur disponible est largement suffisante.
        this.nomsLibellesSectionsCourts = new Set([
            "RegThmTxt",
            "RegNetTxt",
            "RegConTxt",
            "RegLumTxt",
            "RegSatTxt",
            "ContEpaiTxt",
            "PoliTailleTxt",
            "PoliGrasTxt",
            "TextuTailleTxt",
            "LumIntTxt",
            "LumTempTxt",
            "MenuBordTxt",
            "BdTaiMenuTxt",
            "BdTaiBoutonTxt",
            "MenuPosiTxt"
        ]);

        // Nouveaux textes du guiTexture mis à jour qui doivent pouvoir
        // utiliser plusieurs lignes sans être réduits excessivement.
        this.nomsTextesMultilignes = new Set([
            "EspaceTxt"
        ]);
    }

    appliquerParametresTexte(etatApplication) {
        const advancedTexture = etatApplication?.gui?.advancedTexture;
        const parametres = etatApplication?.interface?.parametres;

        if (!advancedTexture || !parametres) return;

        if (etatApplication?.accessibilite?.actif !== true) {
            this.nettoyerTailleAccessibilite(etatApplication);
        }

        const dejaTraites = new Set();

        advancedTexture.getDescendants().forEach((controle) => {
            if (controle instanceof BABYLON.GUI.TextBlock && !dejaTraites.has(controle)) {
                dejaTraites.add(controle);
                this.appliquerSurTextBlock(controle, parametres);
            }

            if (controle instanceof BABYLON.GUI.Button && controle.textBlock && !dejaTraites.has(controle.textBlock)) {
                dejaTraites.add(controle.textBlock);
                this.appliquerSurTextBlock(controle.textBlock, parametres);
            }
        });

        // Si le mode accessibilité est actif, on applique ensuite la taille
        // navigateur en conservant une hiérarchie : titres > textes courants.
        const remPx = Number(etatApplication?.accessibilite?.preferencesNavigateur?.remPx);
        if (etatApplication?.accessibilite?.actif && Number.isFinite(remPx) && remPx > 0) {
            this.appliquerTailleNavigateurPx(etatApplication, Math.round(remPx));
            return;
        }

        advancedTexture.markAsDirty();
        this.reappliquerAutoFitApresChangement(etatApplication);
    }

    appliquerSurTextBlock(textBlock, parametres) {
        if (!textBlock) return;

        // L'icône de fermeture conserve une taille proportionnelle au bouton,
        // mais sa famille de police doit suivre la police choisie dans l'interface.
        // On synchronise donc uniquement la famille et le gras avant d'exclure
        // cette icône des changements globaux de taille/accessibilité.
        if (String(textBlock.name ?? "") === "FermBtnTxt") {
            textBlock.fontFamily = parametres.police || "OpenDyslexic";
            textBlock.fontWeight = "700";
            // Le caractère ASCII X existe dans toutes les polices proposées.
            // Contrairement au symbole Unicode ✕, il ne déclenche donc pas
            // une police de secours qui masquerait le changement de famille.
            textBlock.text = "X";
            textBlock.outlineWidth = Math.max(Number(textBlock.outlineWidth) || 0, 2);
            textBlock.outlineColor = textBlock.color;
            textBlock._markAsDirty?.();
        }

        if (this.estTexteExcluTaille(textBlock)) return;

        textBlock.metadata = textBlock.metadata || {};

        if (textBlock.metadata.fontSizeOriginal === undefined) {
            textBlock.metadata.fontSizeOriginal = textBlock.fontSize;
        }

        const estTexteDynamique = textBlock.metadata.texteDynamique === true;
        const estBoutonModeleAutoFit = textBlock.metadata.boutonModeleAutoFit === true;
        const estTexteMultiligne = this.nomsTextesMultilignes.has(String(textBlock.name ?? ""));

        if (!estTexteDynamique && textBlock.metadata.texteOriginal === undefined) {
            textBlock.metadata.texteOriginal = textBlock.text;
        }

        const police = parametres.police || "OpenDyslexic";
        const variationPourcentage = Number.isFinite(parametres.taillePolice)
            ? parametres.taillePolice
            : 0;

        textBlock.fontFamily = police;
        textBlock.fontSize = estBoutonModeleAutoFit
            ? this.calculerFontSizeModeleAutoFit(
                textBlock.metadata.texteOriginal ?? textBlock.text,
                textBlock.metadata.fontSizeModeleBase ?? textBlock.metadata.fontSizeOriginal,
                variationPourcentage
            )
            : this.calculerFontSizeAvecVariation(
                textBlock.metadata.fontSizeOriginal,
                variationPourcentage
            );
        // On mémorise la taille demandée séparément de la taille finale que
        // l'auto-fit pourra réduire. Ainsi une augmentation ultérieure repart
        // bien de la nouvelle taille et non de l'ancien résultat réduit.
        textBlock.metadata.fontSizeDemandeeAutoFit = textBlock.fontSize;
        textBlock.fontWeight = parametres.gras ? "700" : this.poidsParDefaut(textBlock);
        textBlock.characterSpacing = 0;

        // La taille demandée vient d'être recalculée (police, slider ou retour
        // au mode standard). L'auto-fit doit repartir de cette nouvelle taille
        // et non d'une ancienne valeur mise en cache après un ajustement.
        delete textBlock.metadata.responsiveFontSizeBasePx;
        delete textBlock.metadata.fontSizeDemandeeAutoFitPx;

        const texteSource = estBoutonModeleAutoFit
            ? (textBlock.metadata.texteOriginal ?? textBlock.text)
            : (estTexteDynamique
                ? textBlock.text
                : (textBlock.metadata.texteOriginal ?? textBlock.text));

        textBlock.text = String(texteSource).replace(/\u2009/g, " ");

        if (estBoutonModeleAutoFit) {
            textBlock.resizeToFit = false;
            textBlock.textWrapping = (BABYLON.GUI.TextWrapping?.WordWrap ?? true);
            textBlock.clipContent = true;
            textBlock.lineSpacing = "0px";
        }

        if (estTexteMultiligne) {
            textBlock.metadata.lignesMaxAutoFit = 2;
            textBlock.metadata.tailleMinAutoFitPx = 13;
            textBlock.metadata.facteurMinAutoFit = 0.52;
            textBlock.textWrapping = (BABYLON.GUI.TextWrapping?.WordWrap ?? true);
            textBlock.resizeToFit = false;
            textBlock.clipContent = true;
            textBlock.lineSpacing = "0px";
        }

        textBlock._markAsDirty();
    }

    poidsParDefaut(textBlock) {
        if (textBlock?.metadata?.boutonModeleAutoFit === true) {
            return textBlock.metadata.fontWeightModeleBase ?? "500";
        }

        return textBlock?.metadata?.fontWeightOriginal ?? "400";
    }

    calculerFontSizeModeleAutoFit(_texte, fontSizeBase, variationPourcentage = 0) {
        const valeurBase = this.extraireNombre(fontSizeBase, 40);
        const unite = String(fontSizeBase ?? "%").includes("px") ? "px" : "%";
        const facteurVariation = Math.max(0.65, 1 + variationPourcentage / 100);

        // On ne réduit plus selon le nombre de caractères. La taille demandée
        // est d'abord appliquée, puis le service responsive mesure la largeur
        // réelle avec la police active et conserve la plus grande taille qui tient.
        return `${Math.max(1, valeurBase * facteurVariation)}${unite}`;
    }

    extraireNombre(valeur, defaut = 0) {
        const nombre = parseFloat(valeur);
        return Number.isFinite(nombre) ? nombre : defaut;
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

        const dejaTraites = new Set();

        const variationPourcentage = Number(
            etatApplication?.interface?.parametres?.taillePolice ?? 0
        );

        advancedTexture.getDescendants().forEach((controle) => {
            if (controle instanceof BABYLON.GUI.TextBlock && !dejaTraites.has(controle)) {
                dejaTraites.add(controle);
                this.appliquerTailleNavigateurSurTextBlock(
                    controle,
                    valeur,
                    variationPourcentage
                );
            }

            if (controle instanceof BABYLON.GUI.Button && controle.textBlock && !dejaTraites.has(controle.textBlock)) {
                dejaTraites.add(controle.textBlock);
                this.appliquerTailleNavigateurSurTextBlock(
                    controle.textBlock,
                    valeur,
                    variationPourcentage
                );
            }
        });

        advancedTexture.markAsDirty();
        this.reappliquerAutoFitApresChangement(etatApplication);
    }

    reappliquerAutoFitApresChangement(etatApplication) {
        const serviceResponsive = etatApplication?.services?.texteResponsive;
        const advancedTexture = etatApplication?.gui?.advancedTexture;
        if (!serviceResponsive || !advancedTexture) return;

        this.timersAutoFit.forEach((timer) => clearTimeout(timer));
        this.timersAutoFit = [];

        const ajusterImmediatement = () => {
            advancedTexture.markAsDirty?.();

            // La police choisie est déjà chargée avant l'appel de ce service.
            // Les dimensions des contrôles ne changent pas : on peut donc
            // calculer la taille finale avec leurs mesures courantes, dans le
            // même tour JavaScript, avant le prochain rendu Babylon. Cela évite
            // d'afficher brièvement la grande taille puis sa correction.
            if (typeof serviceResponsive.ajuster === "function") {
                serviceResponsive.ajuster();
            } else {
                serviceResponsive.planifierAjustement?.(0);
            }

            advancedTexture.markAsDirty?.();
        };

        const verifierApresDisposition = () => {
            advancedTexture.markAsDirty?.();
            serviceResponsive.planifierAjustement?.(0);
        };

        // Premier calcul atomique avant l'image suivante : il masque le flash
        // visible sur les boutons lors d'un changement de police ou de taille.
        ajusterImmediatement();

        // Les passages différés restent uniquement des vérifications, utiles si
        // Babylon recalcule ensuite une dimension ou si une métrique de police
        // arrive légèrement plus tard. En principe ils ne changent plus le
        // rendu visible, puisque la première taille a déjà été calculée.
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => requestAnimationFrame(verifierApresDisposition));
        } else {
            verifierApresDisposition();
        }

        [60, 160, 360].forEach((delai) => {
            const timer = setTimeout(verifierApresDisposition, delai);
            this.timersAutoFit.push(timer);
        });
    }

    appliquerTailleNavigateurSurTextBlock(
        textBlock,
        taillePx,
        variationPourcentage = 0
    ) {
        if (!textBlock || this.estTexteExcluTaille(textBlock)) return;

        textBlock.metadata = textBlock.metadata || {};

        if (textBlock.metadata.fontSizeOriginal === undefined) {
            textBlock.metadata.fontSizeOriginal = textBlock.fontSize;
        }

        if (textBlock.metadata.fontSizeAvantAccessibilite === undefined
            && textBlock.metadata.tailleAccessibiliteNavigateurPx === undefined) {
            textBlock.metadata.fontSizeAvantAccessibilite = textBlock.fontSize;
        }

        const facteur = this.facteurAccessibiliteTextBlock(textBlock);
        const variation = Number.isFinite(Number(variationPourcentage))
            ? Number(variationPourcentage)
            : 0;
        const facteurVariation = Math.max(0.1, 1 + variation / 100);
        const tailleAppliquee = Math.max(
            10,
            Math.round(taillePx * facteur * facteurVariation)
        );

        textBlock.metadata.tailleAccessibiliteNavigateurPx = tailleAppliquee;
        textBlock.metadata.responsiveFontSizeBasePx = tailleAppliquee;
        textBlock.metadata.accessibiliteFontSizePx = tailleAppliquee;
        textBlock.metadata.facteurAccessibiliteTaille = facteur;
        textBlock.metadata.fontSizeDemandeeAutoFit = `${tailleAppliquee}px`;

        if (this.estTitreInterface(textBlock)) {
            textBlock.metadata.roleAccessibilite = "titre";
            textBlock.metadata.lignesMaxAutoFit = 1;

            if (textBlock.name === "AvisBtnTxt") {
                // « Avis ? » est un titre de menu court. Il doit conserver la
                // même taille d'accessibilité que les autres titres et ne pas
                // être réduit à la taille d'un texte courant par l'auto-fit.
                textBlock.metadata.tailleMinAutoFitPx = Math.max(
                    18,
                    Math.round(tailleAppliquee * 0.92)
                );
                textBlock.metadata.facteurMinAutoFit = 0.92;
                textBlock.metadata.hauteurCompacteAutoFit = true;
                textBlock.textWrapping = false;
                textBlock.resizeToFit = false;
            } else if (textBlock.metadata?.titreAccessibilite === true || textBlock.name === "AccesTitle") {
                // Le panneau Accessibilité est plus étroit.
                textBlock.metadata.tailleMinAutoFitPx = 14;
                textBlock.metadata.facteurMinAutoFit = 0.45;
            } else {
                // L'auto-fit part de la grande taille accessibilité et conserve
                // automatiquement la plus grande taille qui tient dans le bouton.
                textBlock.metadata.tailleMinAutoFitPx = 15;
                textBlock.metadata.facteurMinAutoFit = 0.45;
            }
        }

        if (this.estBoutonModele(textBlock)) {
            textBlock.metadata.roleAccessibilite = "boutonModele";
            textBlock.metadata.tailleMinAutoFitPx = 13;
            textBlock.metadata.facteurMinAutoFit = 0.45;
            // Une seule ligne : le texte se réduit horizontalement au lieu
            // de créer une deuxième ligne susceptible d'être coupée.
            textBlock.metadata.lignesMaxAutoFit = 1;
        }

        if (this.estLibelleSection(textBlock)) {
            textBlock.metadata.roleAccessibilite = "libelleSection";
            textBlock.metadata.lignesMaxAutoFit = 1;

            const facteurMinimum = this.nomsLibellesSectionsCourts.has(String(textBlock.name ?? ""))
                ? 0.90
                : 0.72;

            // L'auto-fit peut encore réduire un texte long, mais il ne doit
            // plus ramener les libellés courts à une taille minuscule alors
            // que la largeur de la ligne est disponible.
            textBlock.metadata.tailleMinAutoFitPx = Math.max(18, Math.round(tailleAppliquee * facteurMinimum));
            textBlock.metadata.facteurMinAutoFit = facteurMinimum;
            textBlock.textWrapping = false;
            textBlock.resizeToFit = false;
        }

        if (this.nomsTextesMultilignes.has(String(textBlock.name ?? ""))) {
            textBlock.metadata.roleAccessibilite = "texteMultiligne";
            textBlock.metadata.lignesMaxAutoFit = 2;
            textBlock.metadata.tailleMinAutoFitPx = Math.max(13, Math.round(tailleAppliquee * 0.52));
            textBlock.metadata.facteurMinAutoFit = 0.52;
            textBlock.textWrapping = (BABYLON.GUI.TextWrapping?.WordWrap ?? true);
            textBlock.resizeToFit = false;
            textBlock.clipContent = true;
            textBlock.lineSpacing = "0px";
        }

        if (textBlock.metadata.responsiveTexteOriginal === undefined) {
            textBlock.metadata.responsiveTexteOriginal = textBlock.metadata.texteOriginal ?? textBlock.text;
        }

        textBlock.fontSize = `${tailleAppliquee}px`;
        textBlock._markAsDirty?.();
    }

    nettoyerTailleAccessibilite(etatApplication) {
        const advancedTexture = etatApplication?.gui?.advancedTexture;
        if (!advancedTexture?.getDescendants) return;

        advancedTexture.getDescendants().forEach((controle) => {
            if (!(controle instanceof BABYLON.GUI.TextBlock)) return;

            const metadata = controle.metadata ?? {};
            const etaitAgrandit = metadata.tailleAccessibiliteNavigateurPx !== undefined
                || metadata.fontSizeAvantAccessibilite !== undefined;

            if (!etaitAgrandit) return;

            const tailleNormale = metadata.fontSizeAvantAccessibilite
                ?? metadata.fontSizeOriginal;

            if (tailleNormale !== undefined) {
                controle.fontSize = tailleNormale;
            }

            delete metadata.tailleAccessibiliteNavigateurPx;
            delete metadata.fontSizeAvantAccessibilite;
            delete metadata.responsiveFontSizeBasePx;
            delete metadata.accessibiliteFontSizePx;
            delete metadata.facteurAccessibiliteTaille;
            delete metadata.fontSizeDemandeeAutoFit;
            delete metadata.fontSizeDemandeeAutoFitPx;
            delete metadata.dernierTexteAutoFit;
            delete metadata.roleAccessibilite;
            delete metadata.tailleMinAutoFitPx;
            delete metadata.facteurMinAutoFit;
            delete metadata.lignesMaxAutoFit;

            // Le marquage venant du JSON reste en place, mais les valeurs
            // calculées spécifiquement pour le mode accessibilité sont nettoyées.
            if (controle.name === "AvisBtnTxt") {
                metadata.hauteurCompacteAutoFit = true;
                metadata.estTitreMenu = true;
                metadata.roleTexte = "titre";
            }

            controle.metadata = metadata;
            controle._markAsDirty?.();
        });
    }

    facteurAccessibiliteTextBlock(textBlock) {
        if (this.estTitreInterface(textBlock)) {
            return 1.45;
        }

        if (this.estBoutonModele(textBlock)) {
            return 1.18;
        }

        return 1;
    }

    estTitreInterface(textBlock) {
        const nom = String(textBlock?.name ?? "");

        return nom.endsWith("Title")
            || nom === "ContoTitle"
            || this.nomsTitresMenus.has(nom)
            || textBlock?.metadata?.roleTexte === "titre"
            || textBlock?.metadata?.estTitreMenu === true;
    }

    estBoutonModele(textBlock) {
        const nom = String(textBlock?.name ?? "");
        const parent = textBlock?.parent;

        return textBlock?.metadata?.boutonModeleAutoFit === true
            || textBlock?.metadata?.estLabelBoutonModele === true
            || nom.startsWith("ModeleBtn_")
            || /^MdlBtn\d+Txt$/.test(nom)
            || parent?.metadata?.estBoutonModele === true
            || String(parent?.name ?? "").startsWith("ModeleBtn_");
    }

    estLibelleSection(textBlock) {
        const nom = String(textBlock?.name ?? "");
        const texte = String(textBlock?.text ?? "").trim();

        if (this.nomsLibellesSections.has(nom)
            || textBlock?.metadata?.roleTexte === "libelleSection"
            || textBlock?.metadata?.estLibelleSection === true) {
            return true;
        }

        // Les labels de section du GUI se terminent généralement par « Txt ».
        // On exclut explicitement les valeurs, les textes de boutons, les icônes
        // et les titres. Cette règle rend l'auto-fit cohérent même lorsqu'un
        // nouveau label est ajouté dans guiTexture.json sans être encore listé ici.
        const ressembleALibelle = nom.endsWith("Txt")
            && !nom.endsWith("ValTxt")
            && !nom.endsWith("BtnTxt")
            && !nom.endsWith("DropTxt")
            && !nom.endsWith("IcoTxt")
            && !nom.endsWith("TitleTxt")
            && !this.estTitreInterface(textBlock)
            && !this.estBoutonModele(textBlock)
            && texte.length > 1
            && !/^[+\-]?\d+(?:[.,]\d+)?%?$/.test(texte)
            && !/^[✓✕▶▼▲◀🔍]+$/.test(texte);

        return ressembleALibelle;
    }

    estTexteExcluTaille(textBlock) {
        const nom = String(textBlock?.name ?? "");
        const texte = String(textBlock?.text ?? textBlock?.metadata?.texteOriginal ?? "").trim();
        const parent = textBlock?.parent;

        return textBlock?.metadata?.nePasModifierTailleTexte === true
            || textBlock?.metadata?.nePasAccessibilite === true
            || this.nomsTextesIconesExclus.has(nom)
            || parent?.metadata?.estBoutonLoupe3D === true
            || nom === "LoupeBtnTxt"
            || (texte === "🔍" || texte === "✕") && parent?.metadata?.estBoutonLoupe3D === true;
    }
}
