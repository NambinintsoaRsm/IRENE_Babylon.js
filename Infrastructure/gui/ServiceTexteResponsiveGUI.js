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
        debug = false
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

        return nb;
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
        const source = this.texteSource(textBlock).replace(/\s+/g, " ").trim();
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

        const resultat = this.calculerAjustement({
            texte: source,
            largeurDisponible,
            hauteurDisponible,
            tailleBase,
            tailleMin,
            lignesMax,
            famille,
            poids
        });

        const texteFinal = resultat.texte;
        const fontSizeFinal = `${Math.max(1, Math.round(resultat.taille))}px`;
        const dejaOk = textBlock.text === texteFinal && String(textBlock.fontSize) === fontSizeFinal;

        textBlock.text = texteFinal;
        textBlock.fontSize = fontSizeFinal;
        textBlock.metadata = textBlock.metadata || {};
        textBlock.metadata.dernierTexteAutoFit = texteFinal;
        textBlock.textWrapping = lignesMax > 1
            ? (BABYLON.GUI.TextWrapping?.WordWrap ?? true)
            : false;
        textBlock.resizeToFit = false;
        textBlock.clipContent = true;
        textBlock.lineSpacing = lignesMax > 1 ? "0px" : textBlock.lineSpacing;
        textBlock._markAsDirty?.();

        if (this.debugActif && !dejaOk) {
            console.log("[Auto-fit texte]", {
                nom: textBlock.name,
                source,
                texteFinal,
                tailleBase,
                tailleFinale: resultat.taille,
                largeurDisponible,
                hauteurDisponible,
                lignesMax
            });
        }

        return !dejaOk;
    }

    calculerAjustement({
        texte,
        largeurDisponible,
        hauteurDisponible,
        tailleBase,
        tailleMin,
        lignesMax,
        famille,
        poids
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
        couperDerniereLigne = false
    }) {
        this.preparerContexteMesure({ taille, famille, poids });

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

            return String(
                metadata.texteOriginal
                ?? metadata.responsiveTexteOriginal
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
