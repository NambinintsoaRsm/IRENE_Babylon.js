import { constantesInterface } from "../../Configuration/constantesInterface.js";

/**
 * Service de gestion du texte de l'interface Babylon GUI.
 *
 * Règle importante :
 * - on ne convertit plus les tailles en pixels en mode standard ;
 * - on conserve l'unité définie dans guiTexture.json : %, px ou nombre ;
 * - taillePolice est une variation relative positive : 0 = taille originale, +2 = +2 % ;
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

        // La liste des flèches est centralisée dans constantesInterface afin que
        // la police fixe, l'exclusion du calcul de taille et le centrage optique
        // utilisent exactement les mêmes contrôles.
        this.nomsFlechesPoliceFixeArial = new Set(
            constantesInterface.flechesNavigation?.noms ?? []
        );
        this.nomsFlechesCentrageExclues = new Set(
            constantesInterface.flechesNavigation?.exclusCentrageOptique ?? []
        );

        this.canvasMesureFleches = null;
        this.contexteMesureFleches = null;
        this.timerCentrageFleches = null;
        this.resizeCentrageFlechesBranche = false;
        this.interactionCentrageFlechesBranche = false;
        this.dernierEtatApplicationCentrageFleches = null;

        this.nomsTitresMenus = new Set([
            "FichBtnTxt",
            "OuvBtnText",
            "EnrBtnText",
            "ConfBtnTxt",
            "PolBtnText",
            "MenuBtnText",
            "OutiBtnText",
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
            // Configurations / Scène
            "ConfThmTxt",

            // Réglages
            "RegNetTxt",
            "RegConTxt",
            "RegLumTxt",
            "RegSatTxt",

            // Contours
            "ContCoulTxt",
            "ContoAutoTxt",
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
            "ConfThmTxt",
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

        // Textes multiligne identifiés statiquement par nom. L'aide de la
        // touche Espace n'est volontairement plus ici : son rôle est posé au
        // runtime par ControleurLumiere à partir de son conteneur EspaceRect.
        this.nomsTextesMultilignes = new Set();
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

        // La police choisie reste appliquée normalement à tous les textes.
        // On ne corrige qu’ensuite les pictogrammes de flèche afin de les
        // remettre en Arial, sans toucher au mécanisme Tiresias/Liberation/etc.
        this.appliquerPoliceFixeFleches(advancedTexture);
        this.installerSuiviCentrageFleches(etatApplication);

        // Si le mode accessibilité est actif, on applique ensuite la taille
        // navigateur en conservant une hiérarchie : titres > textes courants.
        const remPx = Number(etatApplication?.accessibilite?.preferencesNavigateur?.remPx);
        if (etatApplication?.accessibilite?.actif && Number.isFinite(remPx) && remPx > 0) {
            this.appliquerTailleNavigateurPx(etatApplication, Math.round(remPx));
            this.planifierCentrageOptiqueFleches(etatApplication);
            return;
        }

        advancedTexture.markAsDirty();
        this.reappliquerAutoFitApresChangement(etatApplication);
        this.planifierCentrageOptiqueFleches(etatApplication);
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
        const estTexteMultiligne = this.estTexteMultiligne(textBlock);

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
        delete textBlock.metadata.signatureAutoFit;
        delete textBlock.metadata.dernierFontSizeAutoFit;

        const texteSource = estBoutonModeleAutoFit
            ? (textBlock.metadata.texteOriginal ?? textBlock.text)
            : (estTexteDynamique
                ? textBlock.text
                : (textBlock.metadata.texteOriginal ?? textBlock.text));

        textBlock.text = estTexteMultiligne
            ? String(texteSource).replace(/[\u2009\u202F\u00A0]/g, " ")
            : this.normaliserTexteUneLigne(texteSource);

        if (estBoutonModeleAutoFit) {
            textBlock.resizeToFit = false;
            textBlock.textWrapping = (BABYLON.GUI.TextWrapping?.WordWrap ?? true);
            textBlock.clipContent = true;
            textBlock.lineSpacing = "0px";
        }

        if (estTexteMultiligne) {
            delete textBlock.metadata.nePasAutoFit;
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

    estTexteMultiligne(textBlock) {
        if (!textBlock) return false;

        return textBlock.metadata?.roleAideEspace === true
            || this.nomsTextesMultilignes.has(String(textBlock.name ?? ""));
    }

    appliquerPoliceFixeFleches(advancedTexture) {
        if (!advancedTexture) return;

        const policeFleches = constantesInterface.flechesNavigation?.police || "Arial";

        advancedTexture.getDescendants().forEach((controle) => {
            if (!(controle instanceof BABYLON.GUI.TextBlock)) return;
            if (!this.nomsFlechesPoliceFixeArial.has(String(controle.name ?? ""))) return;

            controle.fontFamily = policeFleches;
            controle._markAsDirty?.();
        });
    }

    /**
     * Branche une seule fois le recalcul du centrage après resize / chargement
     * des polices. Le JSON n'est jamais modifié : seules de petites compensations
     * runtime sont appliquées aux TextBlock de flèches concernés.
     */
    installerSuiviCentrageFleches(etatApplication) {
        this.dernierEtatApplicationCentrageFleches = etatApplication ?? this.dernierEtatApplicationCentrageFleches;

        if (!this.resizeCentrageFlechesBranche && typeof window !== "undefined") {
            window.addEventListener("resize", () => {
                this.planifierCentrageOptiqueFleches(this.dernierEtatApplicationCentrageFleches, 60);
            }, { passive: true });
            this.resizeCentrageFlechesBranche = true;
        }

        // Les accordéons changent leur symbole ▶/▼ au clic. Un recalcul après
        // pointerup suffit : pas de boucle par frame et aucune dépendance aux
        // contrôleurs particuliers.
        if (!this.interactionCentrageFlechesBranche && typeof window !== "undefined") {
            window.addEventListener("pointerup", () => {
                this.planifierCentrageOptiqueFleches(this.dernierEtatApplicationCentrageFleches, 0);
            }, { passive: true });
            window.addEventListener("keyup", () => {
                this.planifierCentrageOptiqueFleches(this.dernierEtatApplicationCentrageFleches, 0);
            }, { passive: true });
            this.interactionCentrageFlechesBranche = true;
        }

        if (typeof document !== "undefined" && document.fonts?.ready) {
            document.fonts.ready
                .then(() => this.planifierCentrageOptiqueFleches(this.dernierEtatApplicationCentrageFleches, 0))
                .catch(() => {});
        }
    }

    planifierCentrageOptiqueFleches(etatApplication, delai = 0) {
        const etat = etatApplication ?? this.dernierEtatApplicationCentrageFleches;
        if (!etat?.gui?.advancedTexture) return;

        if (this.timerCentrageFleches !== null) {
            clearTimeout(this.timerCentrageFleches);
        }

        this.timerCentrageFleches = setTimeout(() => {
            this.timerCentrageFleches = null;

            const executer = () => this.appliquerCentrageOptiqueFleches(etat);
            if (typeof requestAnimationFrame === "function") {
                requestAnimationFrame(() => requestAnimationFrame(executer));
            } else {
                executer();
            }
        }, Math.max(0, Number(delai) || 0));
    }

    appliquerCentrageOptiqueFleches(etatApplication) {
        const advancedTexture = etatApplication?.gui?.advancedTexture;
        if (!advancedTexture?.getDescendants) return;

        const debug = constantesInterface.flechesNavigation?.debugCentrage === true;
        const diagnostics = [];

        advancedTexture.getDescendants().forEach((controle) => {
            if (!(controle instanceof BABYLON.GUI.TextBlock)) return;

            const nom = String(controle.name ?? "");
            if (!this.nomsFlechesPoliceFixeArial.has(nom)) return;
            if (this.nomsFlechesCentrageExclues.has(nom)) return;

            const symbole = String(controle.text ?? "").trim();
            if (!/^[▶▼▲◀]$/.test(symbole)) return;

            const decalage = this.calculerDecalageOptiqueFleche(controle, symbole);
            if (!decalage) return;

            controle.metadata = controle.metadata || {};
            const metadata = controle.metadata;

            if (metadata.centrageFlecheBaseLeftPx === undefined) {
                metadata.centrageFlecheBaseLeftPx = this.valeurPxSimple(controle.left);
            }
            if (metadata.centrageFlecheBaseTopPx === undefined) {
                metadata.centrageFlecheBaseTopPx = this.valeurPxSimple(controle.top);
            }

            const baseLeft = Number(metadata.centrageFlecheBaseLeftPx) || 0;
            const baseTop = Number(metadata.centrageFlecheBaseTopPx) || 0;

            // Compensation calculée avec les métriques du navigateur courant.
            // Aucun décalage fixe spécifique à Firefox/Chrome/Brave n'est stocké.
            controle.left = `${baseLeft + decalage.x}px`;
            controle.top = `${baseTop + decalage.y}px`;
            controle._markAsDirty?.();

            diagnostics.push({
                nom,
                symbole,
                police: controle.fontFamily,
                taillePx: Math.round(decalage.taillePx * 100) / 100,
                decalageX: Math.round(decalage.x * 100) / 100,
                decalageY: Math.round(decalage.y * 100) / 100
            });
        });

        if (debug && diagnostics.length) {
            console.groupCollapsed?.("[ANNA][Flèches] Centrage optique navigateur");
            console.table?.(diagnostics);
            console.groupEnd?.();
        }
    }

    calculerDecalageOptiqueFleche(textBlock, symbole) {
        if (typeof document === "undefined") return null;

        if (!this.canvasMesureFleches) {
            this.canvasMesureFleches = document.createElement("canvas");
            this.contexteMesureFleches = this.canvasMesureFleches.getContext("2d");
        }

        const contexte = this.contexteMesureFleches;
        if (!contexte) return null;

        const taillePx = this.taillePoliceTextBlockPx(textBlock);
        if (!Number.isFinite(taillePx) || taillePx <= 0) return null;

        const familleBrute = String(textBlock.fontFamily || "Arial").trim();
        const famille = familleBrute.includes(",") || /^['"].*['"]$/.test(familleBrute)
            ? familleBrute
            : (familleBrute.includes(" ") ? `"${familleBrute}"` : familleBrute);
        const poids = String(textBlock.fontWeight || "400");

        contexte.font = `${poids} ${taillePx}px ${famille}`;
        contexte.textAlign = "center";
        contexte.textBaseline = "alphabetic";

        const metriques = contexte.measureText(symbole);
        const gauche = Number(metriques.actualBoundingBoxLeft);
        const droite = Number(metriques.actualBoundingBoxRight);

        const decalageX = Number.isFinite(gauche) && Number.isFinite(droite)
            ? (gauche - droite) / 2
            : 0;

        const asc = Number(metriques.actualBoundingBoxAscent);
        const desc = Number(metriques.actualBoundingBoxDescent);
        const ascPolice = Number(metriques.fontBoundingBoxAscent ?? metriques.emHeightAscent);
        const descPolice = Number(metriques.fontBoundingBoxDescent ?? metriques.emHeightDescent);

        let decalageY = 0;
        if ([asc, desc, ascPolice, descPolice].every(Number.isFinite)) {
            const centreEncre = (desc - asc) / 2;
            const centrePolice = (descPolice - ascPolice) / 2;
            decalageY = centrePolice - centreEncre;
        }

        return {
            x: this.limiterDecalageFleche(decalageX, taillePx),
            y: this.limiterDecalageFleche(decalageY, taillePx),
            taillePx
        };
    }

    taillePoliceTextBlockPx(textBlock) {
        const directe = Number(textBlock?.fontSizeInPixels);
        if (Number.isFinite(directe) && directe > 0) return directe;

        const valeur = parseFloat(textBlock?.fontSize);
        if (!Number.isFinite(valeur) || valeur <= 0) return NaN;

        const brute = String(textBlock?.fontSize ?? "");
        if (brute.includes("%")) {
            const hauteur = Number(textBlock?._currentMeasure?.height ?? 0);
            return hauteur > 0 ? hauteur * valeur / 100 : NaN;
        }

        return valeur;
    }

    limiterDecalageFleche(valeur, taillePx) {
        if (!Number.isFinite(valeur)) return 0;

        // Le correctif reste une compensation optique et ne peut jamais déplacer
        // la flèche de plus d'un quart de sa taille. La limite est proportionnelle
        // à la taille courante, donc indépendante de la résolution.
        const limite = Math.max(1, Number(taillePx) * 0.25);
        return Math.max(-limite, Math.min(limite, valeur));
    }

    valeurPxSimple(valeur) {
        if (typeof valeur === "number" && Number.isFinite(valeur)) return valeur;
        const texte = String(valeur ?? "0px").trim();
        if (!texte || texte === "0") return 0;
        if (!texte.endsWith("px")) return 0;
        const nombre = parseFloat(texte);
        return Number.isFinite(nombre) ? nombre : 0;
    }

    normaliserTexteUneLigne(texte) {
        const normalise = String(texte ?? "")
            .replace(/[\u2009\u202F\u00A0]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const morceaux = normalise.split(" ").filter(Boolean);
        if (morceaux.length >= 3 && morceaux.every((morceau) => Array.from(morceau).length === 1)) {
            return morceaux.join("");
        }

        return normalise;
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

    appliquerFacteurFontSize(fontSize, facteur) {
        const valeur = parseFloat(fontSize);
        if (!Number.isFinite(valeur) || !Number.isFinite(facteur)) return fontSize;

        const nouvelleValeur = Math.max(1, valeur * facteur);
        if (typeof fontSize === "number") return nouvelleValeur;

        const texte = String(fontSize);
        if (texte.includes("%")) return `${nouvelleValeur}%`;
        return `${nouvelleValeur}px`;
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
        this.planifierCentrageOptiqueFleches(etatApplication);
    }

    reappliquerAutoFitApresChangement(etatApplication) {
        const serviceResponsive = etatApplication?.services?.texteResponsive;
        const advancedTexture = etatApplication?.gui?.advancedTexture;
        if (!serviceResponsive || !advancedTexture) return;

        this.timersAutoFit.forEach((timer) => clearTimeout(timer));
        this.timersAutoFit = [];

        advancedTexture.markAsDirty?.();

        // Ne pas auto-fitter immédiatement avec les mesures de la frame précédente.
        // Après un changement de police/taille, Babylon doit d'abord recalculer la
        // disposition. Sinon certains textes sont momentanément tronqués puis un
        // second auto-fit global les corrige avec des dimensions différentes.
        const ajusterApresDisposition = () => {
            if (typeof serviceResponsive.ajuster === "function") {
                serviceResponsive.ajuster();
            } else {
                serviceResponsive.planifierAjustement?.(0);
            }
        };

        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => {
                ajusterApresDisposition();
                // Une seconde passe stabilise les contrôles dont la hauteur dépend
                // elle-même du texte, sans déclencher de recalcul de borne du slider.
                requestAnimationFrame(ajusterApresDisposition);
            });
        } else {
            const timer = setTimeout(ajusterApresDisposition, 20);
            const timer2 = setTimeout(ajusterApresDisposition, 50);
            this.timersAutoFit.push(timer, timer2);
        }
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

        if (this.estTexteMultiligne(textBlock)) {
            textBlock.metadata.roleAccessibilite = "texteMultiligne";
            delete textBlock.metadata.nePasAutoFit;
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

        // Aucun facteur fixe spécifique à OpenDyslexic : l'auto-fit mesure la
        // police réellement active et ne réduit le texte que si nécessaire.
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

    /**
     * Règles spécifiques au calcul de la borne haute du slider. Un texte peut
     * suivre visuellement le réglage de taille sans pour autant devoir limiter
     * la borne globale : valeurs numériques, pourcentages et pictogrammes sont
     * par exemple des contenus dynamiques courts.
     */
    estTexteExcluCalculMaximum(textBlock) {
        if (!textBlock) return true;
        if (this.estTexteExcluTaille(textBlock)) return true;

        const nom = String(textBlock.name ?? "");
        const texte = String(
            textBlock.metadata?.texteOriginal
            ?? textBlock.text
            ?? ""
        ).trim();

        if (this.nomsFlechesPoliceFixeArial.has(nom)) return true;

        // Un libellé de modèle est créé dynamiquement parce que son texte dépend
        // du fichier chargé, mais il doit malgré tout participer au réglage global
        // de police et au calcul de la borne du slider. Les autres textes
        // dynamiques (valeurs numériques, pourcentages, états) restent exclus.
        const participeMalgreTexteDynamique =
            textBlock.metadata?.participeCalculMaximumTaillePolice === true
            || textBlock.metadata?.estLabelBoutonModele === true;
        if (textBlock.metadata?.texteDynamique === true && !participeMalgreTexteDynamique) {
            return true;
        }

        if (textBlock.isVisible === false || textBlock.notRenderable === true) return true;
        if (!texte || texte.length <= 1) return true;
        if (/^[✓✕▶▼▲◀🔍+\-]+$/.test(texte)) return true;
        if (/^[+\-]?\d+(?:[.,]\d+)?\s*%?$/.test(texte)) return true;

        return false;
    }
}
