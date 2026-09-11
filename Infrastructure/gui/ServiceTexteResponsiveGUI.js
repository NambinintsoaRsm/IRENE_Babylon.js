import { constantesInterface } from "../../Configuration/constantesInterface.js";

/**
 * Ajustement responsive du texte Babylon GUI.
 *
 * Principe volontairement simple :
 * - le code applique d'abord la taille demandée par le GUI et par le slider ;
 * - l'auto-fit ne grossit jamais cette taille ;
 * - il mesure ensuite le texte avec la police active ;
 * - si le texte dépasse en largeur ou en hauteur, il réduit progressivement
 *   jusqu'à trouver la plus grande taille qui rentre dans le contrôle.
 */
export class ServiceTexteResponsiveGUI {
    constructor({
        policeCible = "OpenDyslexic",
        tailleMinAbsolue = 8,
        facteurMinDefaut = 0.35,
        debug = constantesInterface.sliderTaillePolice?.debugAutoFit === true
    } = {}) {
        this.policeCible = policeCible;
        this.tailleMinAbsolue = tailleMinAbsolue;
        this.facteurMinDefaut = facteurMinDefaut;
        this.debugActif = debug;
        this.etatApplication = null;
        this.advancedTexture = null;
        this.canvasMesure = null;
        this.contexteMesure = null;
        this.timer = null;
        this.resizeBranche = false;
        this.ecouteursApresAjustement = new Set();
        this.dernierDiagnosticMaximumTaillePolice = null;
    }

    installer({ etatApplication, advancedTexture } = {}) {
        if (!etatApplication || !advancedTexture) return this;

        this.etatApplication = etatApplication;
        this.advancedTexture = advancedTexture;
        this.canvasMesure = document.createElement("canvas");
        this.contexteMesure = this.canvasMesure.getContext("2d");

        etatApplication.services = {
            ...(etatApplication.services ?? {}),
            texteResponsive: this
        };

        if (!this.resizeBranche && typeof window !== "undefined") {
            window.addEventListener("resize", () => this.planifierAjustement(120), { passive: true });
            this.resizeBranche = true;
        }

        if (document?.fonts?.ready) {
            document.fonts.ready.then(() => this.planifierAjustement(80)).catch(() => {});
        }

        this.planifierAjustement(80);
        return this;
    }

    reinitialiserBasesAutoFit() {
        if (!this.advancedTexture?.getDescendants) return;

        this.advancedTexture.getDescendants().forEach((controle) => {
            if (!(controle instanceof BABYLON.GUI.TextBlock)) return;

            const metadata = controle.metadata ?? {};
            delete metadata.responsiveFontSizeBasePx;
            delete metadata.fontSizeDemandeeAutoFitPx;
            delete metadata.tailleAccessibiliteNavigateurPx;
            delete metadata.accessibiliteFontSizePx;
            delete metadata.facteurAccessibiliteTaille;
            delete metadata.fontSizeDemandeeAutoFit;
            delete metadata.dernierTexteAutoFit;
            delete metadata.signatureAutoFit;
            delete metadata.dernierFontSizeAutoFit;

            if (metadata.roleAccessibilite === "titre" || metadata.roleAccessibilite === "boutonModele") {
                delete metadata.roleAccessibilite;
                delete metadata.tailleMinAutoFitPx;
                delete metadata.facteurMinAutoFit;
                delete metadata.lignesMaxAutoFit;
            }

            controle.metadata = metadata;
            controle._markAsDirty?.();
        });

        this.advancedTexture.markAsDirty?.();
    }

    planifierAjustement(delai = 40) {
        if (!this.advancedTexture) return;

        if (this.timer !== null) {
            clearTimeout(this.timer);
        }

        this.timer = setTimeout(() => {
            this.timer = null;
            requestAnimationFrame(() => this.ajuster());
        }, delai);
    }

    ajuster() {
        if (!this.advancedTexture) return 0;

        const textes = this.advancedTexture.getDescendants()
            .filter((controle) => controle instanceof BABYLON.GUI.TextBlock)
            .filter((texte) => this.doitAjuster(texte));

        let nb = 0;
        textes.forEach((texte) => {
            if (this.ajusterTextBlock(texte)) nb += 1;
        });

        if (nb > 0) {
            this.advancedTexture.markAsDirty?.();
        }

        this.notifierApresAjustement();
        return nb;
    }

    ajouterEcouteurApresAjustement(ecouteur) {
        if (typeof ecouteur !== "function") return () => {};

        this.ecouteursApresAjustement.add(ecouteur);
        return () => this.ecouteursApresAjustement.delete(ecouteur);
    }

    notifierApresAjustement() {
        this.ecouteursApresAjustement.forEach((ecouteur) => {
            try {
                ecouteur();
            } catch (erreur) {
                console.warn("[Texte responsive] Échec d'un écouteur après ajustement.", erreur);
            }
        });
    }

    /**
     * Calcule la plus grande variation entière de taille de police qui peut être
     * appliquée à l'ensemble de l'interface sans qu'un texte redimensionnable ne
     * dépasse son propre contrôle.
     *
     * La borne n'est pas une constante : elle dépend des dimensions Babylon
     * courantes, du texte, de la police active et de son poids (normal/gras).
     *
     * @param {Object} options
     * @param {number} [options.variationCourante] Variation déjà appliquée.
     * @param {number} [options.variationMinimale=0] Borne basse du slider.
     * @param {Function|null} [options.estTexteExclu=null] Même règle d'exclusion
     *        que ServiceTexteGUI afin de garder une seule définition des textes
     *        concernés par le changement global de taille.
     * @returns {number|null} Variation maximale en pourcentage, ou null si aucune
     *          mesure exploitable n'est disponible.
     */
    calculerVariationMaximaleTaillePolice({
        variationCourante = Number(
            this.etatApplication?.interface?.parametres?.taillePolice ?? 0
        ),
        variationMinimale = 0,
        estTexteExclu = null,
        debug = false
    } = {}) {
        if (!this.advancedTexture?.getDescendants) return null;

        const variationActive = Number.isFinite(Number(variationCourante))
            ? Number(variationCourante)
            : 0;
        const minimum = Number.isFinite(Number(variationMinimale))
            ? Math.max(0, Math.round(Number(variationMinimale)))
            : 0;

        let maximumGlobal = Number.POSITIVE_INFINITY;
        let nombreTextesMesures = 0;
        let diagnosticLimitant = null;
        const diagnostics = [];
        const exclusions = [];

        this.advancedTexture.getDescendants().forEach((controle) => {
            if (!(controle instanceof BABYLON.GUI.TextBlock)) return;

            const nom = controle.name || "(sans nom)";
            if (typeof estTexteExclu === "function" && estTexteExclu(controle)) {
                if (debug) exclusions.push({ nom, raison: "exclu par ServiceTexteGUI" });
                return;
            }

            if (!this.estControleMesurable(controle)) {
                if (debug) exclusions.push({ nom, raison: "contrôle non mesurable / masqué" });
                return;
            }

            const participeMalgreTexteDynamique =
                controle.metadata?.participeCalculMaximumTaillePolice === true
                || controle.metadata?.estLabelBoutonModele === true;
            if (controle.metadata?.texteDynamique === true && !participeMalgreTexteDynamique) {
                if (debug) exclusions.push({ nom, raison: "texte dynamique technique" });
                return;
            }

            const source = this.normaliserTexteSource(
                this.texteSource(controle),
                {
                    conserverRetoursLigne:
                        controle.metadata?.conserverRetoursLigneAutoFit === true
                }
            );

            if (!source || source.length <= 1) {
                if (debug) exclusions.push({ nom, raison: "texte vide/court" });
                return;
            }
            if (/^[✓✕▶▼▲◀🔍+\-]+$/.test(source)) {
                if (debug) exclusions.push({ nom, raison: "pictogramme" });
                return;
            }
            if (/^[+\-]?\d+(?:[.,]\d+)?\s*%?$/.test(source)) {
                if (debug) exclusions.push({ nom, raison: "valeur numérique" });
                return;
            }

            const mesure = controle._currentMeasure;
            const largeurMesuree = Number(mesure?.width ?? 0);
            const hauteurMesuree = Number(mesure?.height ?? 0);

            if (!Number.isFinite(largeurMesuree) || largeurMesuree <= 8
                || !Number.isFinite(hauteurMesuree) || hauteurMesuree <= 8) {
                if (debug) exclusions.push({ nom, raison: "dimensions indisponibles" });
                return;
            }

            const largeurDisponible = Math.max(10,
                largeurMesuree - this.largeurPadding(controle) - 6
            );
            const hauteurDisponible = Math.max(8,
                hauteurMesuree - this.hauteurPadding(controle) - 4
            );
            const tailleReference = this.tailleReferenceZeroPx(
                controle,
                variationActive
            );

            if (!Number.isFinite(tailleReference) || tailleReference <= 0) {
                if (debug) exclusions.push({ nom, raison: "taille de référence inconnue" });
                return;
            }

            const famille = controle.fontFamily
                || this.etatApplication?.interface?.parametres?.police
                || this.policeCible;
            const poids = controle.fontWeight || "400";
            const lignesMax = this.lignesMax(controle);
            const conserverRetoursLigne =
                controle.metadata?.conserverRetoursLigneAutoFit === true;

            const resultatMaximum = this.calculerVariationMaximalePourTextBlock({
                textBlock: controle,
                texte: source,
                tailleReference,
                largeurDisponible,
                hauteurDisponible,
                famille,
                poids,
                lignesMax,
                conserverRetoursLigne
            });

            const maximumTexte = Number(resultatMaximum?.maximum);
            if (!Number.isFinite(maximumTexte)) {
                if (debug) exclusions.push({ nom, raison: "maximum non calculable" });
                return;
            }

            nombreTextesMesures += 1;

            const diagnostic = {
                nom,
                texte: source.replace(/\n/g, " ↵ "),
                police: String(famille),
                gras: String(poids),
                basePx: Math.round(tailleReference * 100) / 100,
                largeurDispoPx: Math.round(largeurDisponible * 100) / 100,
                hauteurDispoPx: Math.round(hauteurDisponible * 100) / 100,
                largeurBasePx: Math.round(Number(resultatMaximum?.largeurReference ?? 0) * 100) / 100,
                hauteurBasePx: Math.round(Number(resultatMaximum?.hauteurReference ?? 0) * 100) / 100,
                maxPourcent: Math.floor(maximumTexte)
            };
            diagnostics.push(diagnostic);

            if (maximumTexte < maximumGlobal) {
                maximumGlobal = maximumTexte;
                diagnosticLimitant = diagnostic;
            }
        });

        if (nombreTextesMesures === 0 || !Number.isFinite(maximumGlobal)) {
            this.dernierDiagnosticMaximumTaillePolice = null;
            if (debug) {
                console.warn("[ANNA][TaillePolice] Aucun TextBlock exploitable pour calculer le maximum.");
                if (exclusions.length) console.table?.(exclusions);
            }
            return null;
        }

        const maximum = Math.max(minimum, Math.floor(maximumGlobal));
        this.dernierDiagnosticMaximumTaillePolice = {
            police: this.etatApplication?.interface?.parametres?.police ?? "",
            gras: this.etatApplication?.interface?.parametres?.gras === true,
            variationCourante: variationActive,
            minimumPourcentage: minimum,
            maximumPourcentage: maximum,
            nombreTextesMesures,
            limitant: diagnosticLimitant,
            diagnostics,
            exclusions
        };

        if (debug) {
            console.groupCollapsed?.(
                `[ANNA][TaillePolice] ${this.dernierDiagnosticMaximumTaillePolice.police}`
                + ` | gras=${this.dernierDiagnosticMaximumTaillePolice.gras}`
                + ` | max=${maximum}%`
            );
            console.log("Résumé", {
                variationCourante: variationActive,
                minimum,
                maximum,
                textesMesures: nombreTextesMesures,
                texteLimitant: diagnosticLimitant?.nom ?? null
            });
            console.table?.(
                [...diagnostics].sort((a, b) => a.maxPourcent - b.maxPourcent)
            );
            if (exclusions.length) {
                console.log("Textes exclus du calcul :");
                console.table?.(exclusions);
            }
            console.groupEnd?.();
        }

        return maximum;
    }

    tailleReferenceZeroPx(textBlock, variationCourante = 0) {
        if (!textBlock) return NaN;

        const metadata = textBlock.metadata ?? {};
        const variation = Number.isFinite(Number(variationCourante))
            ? Number(variationCourante)
            : 0;
        const facteurVariation = Math.max(0.1, 1 + variation / 100);

        // En mode accessibilité, la taille navigateur constitue la référence
        // fonctionnelle du contrôle. On retire seulement la variation du slider.
        const tailleAccessibilite = Number(metadata.tailleAccessibiliteNavigateurPx);
        if (this.etatApplication?.accessibilite?.actif === true
            && Number.isFinite(tailleAccessibilite)
            && tailleAccessibilite > 0) {
            return tailleAccessibilite / facteurVariation;
        }

        // Pour les boutons de modèles, la source de vérité est le style du bouton
        // créé dynamiquement. Elle ne doit jamais être reconstruite à partir du
        // résultat d'un auto-fit précédent.
        if (metadata.estLabelBoutonModele === true && metadata.fontSizeModeleBase !== undefined) {
            const tailleModele = this.convertirTailleDemandeeEnPixels(
                metadata.fontSizeModeleBase,
                textBlock
            );
            if (Number.isFinite(tailleModele) && tailleModele > 0) {
                return tailleModele;
            }
        }

        // fontSizeOriginal est mémorisé avant toute variation par ServiceTexteGUI.
        // C'est la référence 0 % la plus stable : on la privilégie AVANT les
        // valeurs runtime que l'auto-fit peut réduire.
        const tailleOriginale = this.convertirTailleDemandeeEnPixels(
            metadata.fontSizeOriginal,
            textBlock
        );
        if (Number.isFinite(tailleOriginale) && tailleOriginale > 0) {
            return tailleOriginale;
        }

        // Fallback pour les contrôles qui n'auraient pas encore reçu
        // fontSizeOriginal. On retire la variation courante de la taille demandée,
        // mais jamais de la taille finale auto-fitée.
        const tailleDemandeePx = Number(metadata.fontSizeDemandeeAutoFitPx);
        if (Number.isFinite(tailleDemandeePx) && tailleDemandeePx > 0) {
            return tailleDemandeePx / facteurVariation;
        }

        const tailleDemandee = this.convertirTailleDemandeeEnPixels(
            metadata.fontSizeDemandeeAutoFit,
            textBlock
        );
        if (Number.isFinite(tailleDemandee) && tailleDemandee > 0) {
            return tailleDemandee / facteurVariation;
        }

        const tailleCourante = this.fontSizeCourantePx(textBlock);
        return Number.isFinite(tailleCourante) && tailleCourante > 0
            ? tailleCourante / facteurVariation
            : NaN;
    }

    calculerVariationMaximalePourTextBlock({
        textBlock,
        texte,
        tailleReference,
        largeurDisponible,
        hauteurDisponible,
        famille,
        poids,
        lignesMax,
        conserverRetoursLigne
    }) {
        const base = Math.max(1, Number(tailleReference));

        const reference = this.mesurerOccupationPourBorneSlider({
            textBlock,
            texte,
            taille: base,
            largeurDisponible,
            famille,
            poids,
            lignesMax,
            conserverRetoursLigne
        });

        if (!reference?.lignes?.length) {
            return { maximum: 0, largeurReference: 0, hauteurReference: 0 };
        }

        const hauteurReference = Math.max(1, Number(reference.hauteur));
        const largeurReference = Math.max(1, Number(reference.largeurMax));

        // La borne haute de recherche vient des métriques réelles du texte à 0 %.
        // On évite ainsi l'ancien plafond taille*1.08 qui pouvait conclure à 0 %
        // alors que le glyphe affiché disposait encore de marge dans son contenant.
        const facteurHauteur = Math.max(1, hauteurDisponible / hauteurReference);
        const maximumTheorique = Math.max(0, Math.floor((facteurHauteur - 1) * 100));

        let bas = 0;
        let haut = maximumTheorique;
        let meilleur = 0;

        while (bas <= haut) {
            const milieu = Math.floor((bas + haut) / 2);
            const tailleCandidate = base * (1 + milieu / 100);
            const tient = this.texteTientPourBorneSlider({
                textBlock,
                texte,
                taille: tailleCandidate,
                largeurDisponible,
                hauteurDisponible,
                famille,
                poids,
                lignesMax,
                conserverRetoursLigne
            });

            if (tient) {
                meilleur = milieu;
                bas = milieu + 1;
            } else {
                haut = milieu - 1;
            }
        }

        return {
            maximum: meilleur,
            largeurReference,
            hauteurReference
        };
    }

    texteTientPourBorneSlider({
        textBlock,
        texte,
        taille,
        largeurDisponible,
        hauteurDisponible,
        famille,
        poids,
        lignesMax,
        conserverRetoursLigne = false
    }) {
        if (textBlock?.metadata?.espacesCompactsAutoFit === true) {
            return this.texteEspacesCompactsTient({
                texte,
                taille,
                largeurDisponible,
                hauteurDisponible,
                famille,
                poids,
                lignesMax
            });
        }

        const occupation = this.mesurerOccupationPourBorneSlider({
            textBlock,
            texte,
            taille,
            largeurDisponible,
            famille,
            poids,
            lignesMax,
            conserverRetoursLigne
        });

        if (!occupation || occupation.depasse || !occupation.lignes?.length) return false;
        if (occupation.largeurMax > largeurDisponible) return false;
        return occupation.hauteur <= hauteurDisponible;
    }

    mesurerOccupationPourBorneSlider({
        texte,
        taille,
        largeurDisponible,
        famille,
        poids,
        lignesMax,
        conserverRetoursLigne = false
    }) {
        const resultat = this.decouperEnLignes({
            texte,
            largeurDisponible,
            taille,
            famille,
            poids,
            lignesMax,
            conserverRetoursLigne,
            couperDerniereLigne: false
        });

        if (!resultat?.lignes?.length) {
            return { lignes: [], depasse: true, largeurMax: Infinity, hauteur: Infinity };
        }

        this.preparerContexteMesure({ taille, famille, poids });
        const largeurs = resultat.lignes.map((ligne) => this.mesurerLargeur(ligne));
        const largeurMax = largeurs.length ? Math.max(...largeurs) : 0;
        const hauteur = this.hauteurGlyphesPourBorneSlider(
            resultat.lignes,
            taille,
            famille,
            poids
        );

        return {
            lignes: resultat.lignes,
            depasse: resultat.depasse === true,
            largeurMax,
            hauteur
        };
    }

    hauteurGlyphesPourBorneSlider(lignes, taille, famille, poids) {
        this.preparerContexteMesure({ taille, famille, poids });

        const liste = Array.isArray(lignes) && lignes.length ? lignes : ["MgÉgjpq"];
        const hauteurs = liste.map((ligne) => {
            const metriques = this.contexteMesure?.measureText(String(ligne ?? ""));
            const asc = Number(metriques?.actualBoundingBoxAscent ?? 0);
            const desc = Number(metriques?.actualBoundingBoxDescent ?? 0);
            const valeur = asc + desc;
            return Number.isFinite(valeur) && valeur > 0 ? valeur : Number(taille);
        });

        const hauteurLigne = Math.max(1, ...hauteurs);
        if (liste.length <= 1) return hauteurLigne;

        // Pour plusieurs lignes, le pas vertical reste lié à la taille de police,
        // comme dans Babylon GUI, mais la hauteur d'une ligne vient des glyphes
        // réellement mesurés dans le navigateur courant.
        const pasLigne = Math.max(hauteurLigne, Number(taille));
        return hauteurLigne + (liste.length - 1) * pasLigne;
    }

    texteTientDansControle({
        textBlock,
        texte,
        taille,
        largeurDisponible,
        hauteurDisponible,
        famille,
        poids,
        lignesMax,
        conserverRetoursLigne = false
    }) {
        if (textBlock?.metadata?.espacesCompactsAutoFit === true) {
            return this.texteEspacesCompactsTient({
                texte,
                taille,
                largeurDisponible,
                hauteurDisponible,
                famille,
                poids,
                lignesMax
            });
        }

        const resultat = this.decouperEnLignes({
            texte,
            largeurDisponible,
            taille,
            famille,
            poids,
            lignesMax,
            conserverRetoursLigne,
            couperDerniereLigne: false
        });

        if (resultat.depasse || !resultat.lignes?.length) return false;

        this.preparerContexteMesure({ taille, famille, poids });
        if (resultat.lignes.some(
            (ligne) => this.mesurerLargeur(ligne) > largeurDisponible
        )) {
            return false;
        }

        return this.hauteurTexte(resultat.lignes, taille, famille, poids)
            <= hauteurDisponible;
    }

    texteEspacesCompactsTient({
        texte,
        taille,
        largeurDisponible,
        hauteurDisponible,
        famille,
        poids,
        lignesMax
    }) {
        const mots = String(texte ?? "")
            .replace(/[\u2009\u202F\u00A0]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .split(" ")
            .filter(Boolean);

        if (!mots.length) return true;

        const espaceCompact = "\u202F";
        const maxLignes = Math.max(1, Math.min(2, Number(lignesMax) || 1));
        this.preparerContexteMesure({ taille, famille, poids });

        const uneLigne = mots.join(espaceCompact);
        if (this.mesurerLargeur(uneLigne) <= largeurDisponible
            && this.hauteurTexte([uneLigne], taille, famille, poids) <= hauteurDisponible) {
            return true;
        }

        if (maxLignes < 2 || mots.length < 2) return false;

        for (let coupure = 1; coupure < mots.length; coupure += 1) {
            const ligne1 = mots.slice(0, coupure).join(espaceCompact);
            const ligne2 = mots.slice(coupure).join(espaceCompact);

            if (this.mesurerLargeur(ligne1) > largeurDisponible
                || this.mesurerLargeur(ligne2) > largeurDisponible) {
                continue;
            }

            if (this.hauteurTexte(
                [ligne1, ligne2],
                taille,
                famille,
                poids
            ) <= hauteurDisponible) {
                return true;
            }
        }

        return false;
    }

    doitAjuster(textBlock) {
        if (!textBlock || textBlock.isVisible === false) return false;
        if (textBlock.metadata?.nePasAutoFit === true) return false;
        if (!this.estControleMesurable(textBlock)) return false;

        const texte = this.texteSource(textBlock).trim();
        if (!texte || texte.length <= 1) return false;

        // Icônes seules : pas d'auto-fit.
        if (/^[✓✕▶▼▲◀🔍+\-]$/.test(texte)) return false;

        const mesure = textBlock._currentMeasure;
        return Boolean(mesure && mesure.width > 8 && mesure.height > 8);
    }

    estControleMesurable(controle) {
        let courant = controle;

        while (courant) {
            if (courant.isVisible === false || courant.notRenderable === true) {
                return false;
            }

            const hauteurOuverte = Number(courant.metadata?.hauteurOuverte);
            if (Number.isFinite(hauteurOuverte) && hauteurOuverte > 0) {
                if (courant.metadata?.estOuvert !== true) {
                    return false;
                }

                const hauteurMesuree = Number(courant._currentMeasure?.height ?? 0);
                if (!Number.isFinite(hauteurMesuree)
                    || hauteurMesuree < Math.max(8, hauteurOuverte * 0.94)) {
                    return false;
                }
            }

            courant = courant.parent ?? null;
        }

        return true;
    }

    ajusterTextBlock(textBlock) {
        const conserverRetoursLigne = textBlock.metadata?.conserverRetoursLigneAutoFit === true;
        const source = this.normaliserTexteSource(
            this.texteSource(textBlock),
            { conserverRetoursLigne }
        );
        if (!source) return false;

        const mesure = textBlock._currentMeasure;
        const largeurDisponible = Math.max(10,
            Number(mesure?.width ?? 0)
            - this.largeurPadding(textBlock)
            - 6
        );
        const hauteurDisponible = Math.max(8,
            Number(mesure?.height ?? 0)
            - this.hauteurPadding(textBlock)
            - 4
        );

        const tailleBase = this.tailleBasePx(textBlock);
        if (!Number.isFinite(tailleBase) || tailleBase <= 0) return false;

        const lignesMax = this.lignesMax(textBlock);
        const tailleMin = this.tailleMin(tailleBase);
        const famille = textBlock.fontFamily
            || this.etatApplication?.interface?.parametres?.police
            || this.policeCible;
        const poids = textBlock.fontWeight || "400";

        textBlock.metadata = textBlock.metadata || {};
        const signature = [
            source,
            Math.round(largeurDisponible),
            Math.round(hauteurDisponible),
            Math.round(tailleBase),
            Math.round(tailleMin),
            lignesMax,
            String(famille),
            String(poids)
        ].join("|");

        if (textBlock.metadata.signatureAutoFit === signature
            && textBlock.text === textBlock.metadata.dernierTexteAutoFit
            && String(textBlock.fontSize) === String(textBlock.metadata.dernierFontSizeAutoFit)) {
            return false;
        }

        const utiliserEspacesCompacts = textBlock.metadata?.espacesCompactsAutoFit === true;
        const resultat = utiliserEspacesCompacts
            ? this.calculerAjustementEspacesCompacts({
                texte: source,
                largeurDisponible,
                hauteurDisponible,
                tailleBase,
                tailleMin,
                lignesMax,
                famille,
                poids
            })
            : this.calculerAjustement({
                texte: source,
                largeurDisponible,
                hauteurDisponible,
                tailleBase,
                tailleMin,
                lignesMax,
                famille,
                poids,
                conserverRetoursLigne
            });

        const texteFinal = resultat.texte;
        const fontSizeFinal = `${Math.max(1, Math.round(resultat.taille))}px`;
        const textWrappingFinal = utiliserEspacesCompacts
            ? false
            : (conserverRetoursLigne
                ? false
                : (lignesMax > 1
                    ? (BABYLON.GUI.TextWrapping?.WordWrap ?? true)
                    : false));
        const lineSpacingFinal = lignesMax > 1 ? "0px" : textBlock.lineSpacing;

        const doitMettreAJour = textBlock.text !== texteFinal
            || String(textBlock.fontSize) !== fontSizeFinal
            || textBlock.textWrapping !== textWrappingFinal
            || textBlock.resizeToFit !== false
            || textBlock.clipContent !== true
            || Number(textBlock.characterSpacing ?? 0) !== 0;

        textBlock.metadata.signatureAutoFit = signature;
        textBlock.metadata.dernierTexteAutoFit = texteFinal;
        textBlock.metadata.dernierFontSizeAutoFit = fontSizeFinal;

        if (!doitMettreAJour) {
            return false;
        }

        textBlock.text = texteFinal;
        textBlock.fontSize = fontSizeFinal;
        textBlock.textWrapping = textWrappingFinal;
        textBlock.resizeToFit = false;
        textBlock.clipContent = true;
        textBlock.characterSpacing = 0;
        textBlock.lineSpacing = lineSpacingFinal;
        textBlock._markAsDirty?.();

        if (this.debugActif) {
            const variationDemandee = Number(
                this.etatApplication?.interface?.parametres?.taillePolice ?? 0
            );
            const reduction = Math.max(0, Number(tailleBase) - Number(resultat.taille));

            // Log uniquement lorsqu'un auto-fit a effectivement réduit la taille
            // ou modifié le texte. On distingue ainsi clairement le choix global
            // du slider de la sécurité locale appliquée à un seul libellé.
            if (reduction > 0.5 || texteFinal !== source) {
                console.log("[ANNA][AutoFit]", {
                    nom: textBlock.name || "(sans nom)",
                    texte: source,
                    police: famille,
                    gras: String(poids) === "700" || String(poids).toLowerCase() === "bold",
                    sliderDemande: `${Math.round(variationDemandee)}%`,
                    tailleDemandeePx: Math.round(Number(tailleBase) * 100) / 100,
                    tailleAppliqueePx: Math.round(Number(resultat.taille) * 100) / 100,
                    reductionPx: Math.round(reduction * 100) / 100,
                    largeurDisponible: Math.round(largeurDisponible),
                    hauteurDisponible: Math.round(hauteurDisponible),
                    lignesMax
                });
            }
        }

        return true;
    }

    normaliserTexteSource(texte, { conserverRetoursLigne = false } = {}) {
        const source = String(texte ?? "")
            .replace(/[\u2009\u202F\u00A0]/g, " ")
            .replace(/\r\n?/g, "\n");

        if (conserverRetoursLigne) {
            return source
                .split("\n")
                .map((ligne) => ligne.replace(/[ \t]+/g, " ").trim())
                .filter((ligne) => ligne.length > 0)
                .join("\n")
                .trim();
        }

        const normalise = source
            .replace(/[ \t]+/g, " ")
            .replace(/\s*\n\s*/g, " ")
            .trim();

        const morceaux = normalise.split(" ").filter(Boolean);
        if (morceaux.length >= 3 && morceaux.every((morceau) => Array.from(morceau).length === 1)) {
            return morceaux.join("");
        }

        return normalise;
    }

    /**
     * Ajustement dédié aux courts textes d'aide qui doivent rester compacts
     * avec OpenDyslexic. Le contenu vient toujours du GUI : seuls les espaces
     * d'affichage sont remplacés par des espaces fins insécables.
     *
     * On teste d'abord une seule ligne. Si elle ne tient pas, on cherche la
     * meilleure coupure sur deux lignes, puis on réduit la taille uniquement
     * si nécessaire.
     */
    calculerAjustementEspacesCompacts({
        texte,
        largeurDisponible,
        hauteurDisponible,
        tailleBase,
        tailleMin,
        lignesMax,
        famille,
        poids
    }) {
        const mots = String(texte ?? "")
            .replace(/[\u2009\u202F\u00A0]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .split(" ")
            .filter(Boolean);

        if (!mots.length) {
            return { taille: tailleBase, texte: "" };
        }

        // U+202F : espace fine insécable. Elle conserve une séparation lisible
        // sans l'écartement très large que peut produire un espace standard
        // avec OpenDyslexic dans Babylon GUI.
        const espaceCompact = "\u202F";
        const depart = Math.max(tailleMin, Math.round(tailleBase));
        const maxLignes = Math.max(1, Math.min(2, Number(lignesMax) || 1));

        for (let taille = depart; taille >= tailleMin; taille -= 1) {
            this.preparerContexteMesure({ taille, famille, poids });

            const uneLigne = mots.join(espaceCompact);
            if (this.mesurerLargeur(uneLigne) <= largeurDisponible
                && this.hauteurTexte([uneLigne], taille, famille, poids) <= hauteurDisponible) {
                return { taille, texte: uneLigne };
            }

            if (maxLignes < 2 || mots.length < 2) continue;

            let meilleur = null;
            for (let coupure = 1; coupure < mots.length; coupure += 1) {
                const ligne1 = mots.slice(0, coupure).join(espaceCompact);
                const ligne2 = mots.slice(coupure).join(espaceCompact);
                const largeur1 = this.mesurerLargeur(ligne1);
                const largeur2 = this.mesurerLargeur(ligne2);

                if (largeur1 > largeurDisponible || largeur2 > largeurDisponible) continue;

                const lignes = [ligne1, ligne2];
                if (this.hauteurTexte(lignes, taille, famille, poids) > hauteurDisponible) continue;

                const score = Math.max(largeur1, largeur2)
                    + Math.abs(largeur1 - largeur2) * 0.15;

                if (!meilleur || score < meilleur.score) {
                    meilleur = { lignes, score };
                }
            }

            if (meilleur) {
                return { taille, texte: meilleur.lignes.join("\n") };
            }
        }

        // Secours : à la taille minimale, on garde au maximum deux lignes et
        // des espaces compacts. Le découpage est équilibré afin de ne pas
        // reproduire le grand décalage observé avec des espaces standards.
        const milieu = Math.max(1, Math.ceil(mots.length / 2));
        const lignesSecours = maxLignes > 1
            ? [mots.slice(0, milieu).join(espaceCompact), mots.slice(milieu).join(espaceCompact)].filter(Boolean)
            : [mots.join(espaceCompact)];

        return {
            taille: tailleMin,
            texte: lignesSecours.join("\n")
        };
    }

    calculerAjustement({
        texte,
        largeurDisponible,
        hauteurDisponible,
        tailleBase,
        tailleMin,
        lignesMax,
        famille,
        poids,
        conserverRetoursLigne = false
    }) {
        const depart = Math.max(tailleMin, Math.round(tailleBase));

        for (let taille = depart; taille >= tailleMin; taille -= 1) {
            const lignes = this.decouperEnLignes({
                texte,
                largeurDisponible,
                taille,
                famille,
                poids,
                lignesMax,
                conserverRetoursLigne,
                couperDerniereLigne: false
            });

            if (lignes.depasse) continue;

            const hauteur = this.hauteurTexte(lignes.lignes, taille, famille, poids);
            if (hauteur <= hauteurDisponible) {
                return {
                    taille,
                    texte: lignes.lignes.join("\n")
                };
            }
        }

        const lignesEllipsis = this.decouperEnLignes({
            texte,
            largeurDisponible,
            taille: tailleMin,
            famille,
            poids,
            lignesMax,
            conserverRetoursLigne,
            couperDerniereLigne: true
        });

        return {
            taille: tailleMin,
            texte: lignesEllipsis.lignes.join("\n")
        };
    }

    decouperEnLignes({
        texte,
        largeurDisponible,
        taille,
        famille,
        poids,
        lignesMax,
        conserverRetoursLigne = false,
        couperDerniereLigne = false
    }) {
        this.preparerContexteMesure({ taille, famille, poids });

        if (conserverRetoursLigne) {
            const lignesFixes = String(texte ?? "")
                .split("\n")
                .map((ligne) => ligne.trim())
                .filter(Boolean);

            if (lignesFixes.length > lignesMax) {
                return { lignes: lignesFixes.slice(0, lignesMax), depasse: true };
            }

            const ligneTropLarge = lignesFixes.some(
                (ligne) => this.mesurerLargeur(ligne) > largeurDisponible
            );

            if (!ligneTropLarge) {
                return { lignes: lignesFixes, depasse: false };
            }

            if (!couperDerniereLigne) {
                return { lignes: lignesFixes, depasse: true };
            }

            return {
                lignes: lignesFixes.map((ligne) => this.ellipsis(ligne, largeurDisponible)),
                depasse: true
            };
        }

        if (lignesMax <= 1) {
            const largeur = this.mesurerLargeur(texte);
            if (largeur <= largeurDisponible) {
                return { lignes: [texte], depasse: false };
            }

            return {
                lignes: [couperDerniereLigne ? this.ellipsis(texte, largeurDisponible) : texte],
                depasse: true
            };
        }

        const mots = String(texte).split(/\s+/).filter(Boolean);
        const lignes = [];
        let ligne = "";
        let depasse = false;

        const ajouteLigne = (contenu) => {
            if (lignes.length < lignesMax) {
                lignes.push(contenu);
            } else {
                depasse = true;
            }
        };

        mots.forEach((mot) => {
            const candidat = ligne ? `${ligne} ${mot}` : mot;

            if (this.mesurerLargeur(candidat) <= largeurDisponible) {
                ligne = candidat;
                return;
            }

            if (ligne) {
                ajouteLigne(ligne);
                ligne = mot;
            } else {
                ajouteLigne(couperDerniereLigne ? this.ellipsis(mot, largeurDisponible) : mot);
                ligne = "";
            }
        });

        if (ligne) ajouteLigne(ligne);

        if (lignes.length > lignesMax) {
            depasse = true;
            lignes.length = lignesMax;
        }

        if (couperDerniereLigne && depasse && lignes.length > 0) {
            const dernier = lignes.length - 1;
            lignes[dernier] = this.ellipsis(`${lignes[dernier]}…`, largeurDisponible);
        }

        return { lignes: lignes.length ? lignes : [""], depasse };
    }

    ellipsis(texte, largeurDisponible) {
        const t = String(texte ?? "").replace(/…+$/g, "");
        if (this.mesurerLargeur(t) <= largeurDisponible) return t;

        let debut = t;
        while (debut.length > 1 && this.mesurerLargeur(`${debut}…`) > largeurDisponible) {
            debut = debut.slice(0, -1);
        }

        return `${debut.trim()}…`;
    }

    texteSource(textBlock) {
        const metadata = textBlock.metadata ?? {};
        const texteCourant = String(textBlock.text ?? "");

        if (metadata.texteDynamique === true) {
            const dernierAutoFit = String(metadata.dernierTexteAutoFit ?? "");

            if (texteCourant && texteCourant !== dernierAutoFit) {
                metadata.responsiveTexteOriginal = texteCourant.replace(/\n/g, " ");
                textBlock.metadata = metadata;
            }

            // Pour un texte dynamique (pourcentages, valeurs de sliders, etc.),
            // texteOriginal correspond souvent au contenu du JSON au chargement
            // (par exemple "0%"). Il ne doit jamais reprendre la priorité après
            // un auto-fit ou une fermeture/réouverture du panneau.
            return String(
                metadata.responsiveTexteOriginal
                ?? texteCourant
                ?? ""
            ).replace(/\u2009/g, " ");
        }

        return String(
            metadata.texteOriginal
            ?? metadata.responsiveTexteOriginal
            ?? texteCourant
            ?? ""
        ).replace(/\u2009/g, " ");
    }

    tailleBasePx(textBlock) {
        textBlock.metadata = textBlock.metadata || {};
        const metadata = textBlock.metadata;

        const tailleAccessibilite = Number(metadata.tailleAccessibiliteNavigateurPx);
        if (this.etatApplication?.accessibilite?.actif === true
            && Number.isFinite(tailleAccessibilite)
            && tailleAccessibilite > 0) {
            return tailleAccessibilite;
        }

        const memorisee = Number(metadata.fontSizeDemandeeAutoFitPx);
        if (Number.isFinite(memorisee) && memorisee > 0) {
            return memorisee;
        }

        // À ce moment-là, ServiceTexteGUI vient de remettre la taille demandée
        // par guiTexture.json + slider. fontSizeInPixels est donc la meilleure
        // source : c'est exactement ce que Babylon aurait affiché sans auto-fit.
        const courante = this.fontSizeCourantePx(textBlock);
        if (Number.isFinite(courante) && courante > 0) {
            metadata.fontSizeDemandeeAutoFitPx = courante;
            return courante;
        }

        const demandee = this.convertirTailleDemandeeEnPixels(metadata.fontSizeDemandeeAutoFit, textBlock);
        if (Number.isFinite(demandee) && demandee > 0) {
            metadata.fontSizeDemandeeAutoFitPx = demandee;
            return demandee;
        }

        return 18;
    }

    fontSizeCourantePx(textBlock) {
        const direct = Number(textBlock.fontSizeInPixels);
        if (Number.isFinite(direct) && direct > 0) return direct;

        const valeur = parseFloat(textBlock.fontSize);
        if (Number.isFinite(valeur) && String(textBlock.fontSize).includes("px")) return valeur;

        return this.convertirTailleDemandeeEnPixels(textBlock.fontSize, textBlock);
    }

    convertirTailleDemandeeEnPixels(valeur, textBlock) {
        if (typeof valeur === "number") {
            return Number.isFinite(valeur) ? valeur : NaN;
        }

        if (typeof valeur !== "string") return NaN;

        const nombre = parseFloat(valeur);
        if (!Number.isFinite(nombre)) return NaN;

        if (valeur.includes("%")) {
            // Repli seulement. En fonctionnement normal, fontSizeInPixels est
            // utilisé avant cette conversion. Ici on se base sur la hauteur du
            // TextBlock lui-même, pas sur le parent, pour éviter les tailles géantes.
            const reference = Number(textBlock?._currentMeasure?.height)
                || Number(textBlock?.parent?._currentMeasure?.height)
                || 0;
            return reference > 0 ? reference * nombre / 100 : NaN;
        }

        return nombre;
    }

    lignesMax(textBlock) {
        const specifique = Number(textBlock.metadata?.lignesMaxAutoFit);
        if (Number.isFinite(specifique) && specifique > 0) {
            return Math.max(1, Math.round(specifique));
        }

        // Par défaut, les libellés et boutons restent sur une ligne. Cela rend
        // l'auto-fit prévisible : on réduit la police au lieu de passer sur deux lignes.
        return 1;
    }

    tailleMin(tailleBase) {
        const parFacteur = Math.round(tailleBase * this.facteurMinDefaut);
        return Math.max(this.tailleMinAbsolue, Math.min(tailleBase, parFacteur));
    }

    hauteurTexte(lignes, taille, famille, poids) {
        this.preparerContexteMesure({ taille, famille, poids });

        const contenu = Array.isArray(lignes) && lignes.length
            ? lignes.join(" MgÉgjpq ")
            : "MgÉgjpq";

        let hauteurGlyphes = taille;
        if (this.contexteMesure) {
            const metriques = this.contexteMesure.measureText(contenu);
            const mesure = Number(metriques.actualBoundingBoxAscent || 0)
                + Number(metriques.actualBoundingBoxDescent || 0);
            if (Number.isFinite(mesure) && mesure > 0) {
                hauteurGlyphes = mesure;
            }
        }

        const nombreLignes = Math.max(1, Array.isArray(lignes) ? lignes.length : Number(lignes) || 1);
        const hauteurLigne = Math.max(taille * 1.08, hauteurGlyphes * 1.12);
        const espacement = nombreLignes > 1 ? taille * 0.12 : 0;
        return nombreLignes * hauteurLigne + Math.max(0, nombreLignes - 1) * espacement;
    }

    preparerContexteMesure({ taille, famille, poids }) {
        if (!this.contexteMesure) return;

        const valeur = String(famille || "sans-serif").trim();
        const estPile = valeur.includes(",");
        const dejaEntreGuillemets = /^["'].*["']$/.test(valeur);
        const police = estPile || dejaEntreGuillemets || !valeur.includes(" ")
            ? valeur
            : `"${valeur}"`;

        this.contexteMesure.font = `${poids || "400"} ${Math.round(taille)}px ${police}`;
    }

    mesurerLargeur(texte) {
        if (!this.contexteMesure) return String(texte ?? "").length * 10;
        return this.contexteMesure.measureText(String(texte ?? "")).width;
    }

    largeurPadding(textBlock) {
        return this.pixelsPadding(textBlock.paddingLeft, textBlock._currentMeasure?.width)
            + this.pixelsPadding(textBlock.paddingRight, textBlock._currentMeasure?.width);
    }

    hauteurPadding(textBlock) {
        return this.pixelsPadding(textBlock.paddingTop, textBlock._currentMeasure?.height)
            + this.pixelsPadding(textBlock.paddingBottom, textBlock._currentMeasure?.height);
    }

    pixelsPadding(valeur, reference = 0) {
        if (typeof valeur === "number") return valeur;
        if (typeof valeur !== "string") return 0;

        const nombre = parseFloat(valeur);
        if (!Number.isFinite(nombre)) return 0;
        if (valeur.includes("%")) return Math.max(0, reference * nombre / 100);
        return nombre;
    }

    debug(actif = true) {
        this.debugActif = Boolean(actif);
        return this.debugActif;
    }
}
