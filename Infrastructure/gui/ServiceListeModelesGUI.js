import {
    constantesInterface,
    obtenirThemeInterface
} from "../../Configuration/constantesInterface.js";

import {
    viderConteneur
} from "../../Util/GuiUtils.js";

/**
 * Gère l'affichage dynamique de la liste des modèles 3D.
 *
 * Le nombre d'objets n'est pas fixé dans l'interface.
 * Les boutons sont créés à partir du catalogue des modèles disponibles.
 */
export class ServiceListeModelesGUI {
    afficherModeles({
                        conteneurListe,
                        modeles,
                        etatApplication,
                        callbackSelection
                    }) {
        if (!conteneurListe) {
            throw new Error("Conteneur de liste des modèles introuvable.");
        }

        if (!Array.isArray(modeles)) {
            throw new Error("Liste des modèles invalide.");
        }

        this.preparerConteneurListe(conteneurListe, modeles.length);
        viderConteneur(conteneurListe);

        modeles.forEach((modele) => {
            const estActif = this.estModeleActif(modele, etatApplication);

            const bouton = this.creerBoutonModele({
                modele,
                etatApplication,
                estActif
            });

            bouton.onPointerClickObservable.add(async () => {
                // Mise à jour visuelle immédiate : le bouton sélectionné prend
                // l'état actif sans attendre la fin du chargement / saillance.
                this.marquerModeleActif({
                    conteneurListe,
                    idModeleActif: modele.id,
                    etatApplication
                });

                if (typeof callbackSelection === "function") {
                    await callbackSelection(modele);
                }

                this.marquerModeleActif({
                    conteneurListe,
                    idModeleActif: modele.id,
                    etatApplication
                });
            });

            conteneurListe.addControl(bouton);
        });

        this.rafraichirScroll(conteneurListe);
        this.planifierAutoFitModeles(etatApplication);
    }

    preparerConteneurListe(conteneurListe, nombreModeles = 0) {
        const style = constantesInterface.stylesComposants.boutonModele;
        const hauteurBoutonPx = this.extrairePixels(style.hauteur, 75);
        const margePx = 8;
        const hauteurContenu = Math.max(hauteurBoutonPx, nombreModeles * (hauteurBoutonPx + margePx));

        conteneurListe.isVertical = true;
        conteneurListe.spacing = margePx;
        conteneurListe.adaptHeightToChildren = true;
        conteneurListe.height = `${hauteurContenu}px`;
        conteneurListe.width = "100%";

        const scrollViewer = this.trouverScrollViewer(conteneurListe);

        this.configurerScrollViewer(scrollViewer);
    }


    configurerScrollViewer(scrollViewer) {
        if (!scrollViewer) {
            return;
        }

        // verticalBar est un getter dans Babylon GUI : on ne doit pas lui affecter
        // une valeur directement, sinon certains navigateurs déclenchent
        // "setting getter-only property verticalBar" au démarrage.
        if ("forceVerticalBar" in scrollViewer) {
            scrollViewer.forceVerticalBar = true;
        }

        if ("barSize" in scrollViewer) {
            scrollViewer.barSize = Math.max(Number(scrollViewer.barSize) || 0, 22);
        }

        if ("thumbLength" in scrollViewer) {
            scrollViewer.thumbLength = Math.max(Number(scrollViewer.thumbLength) || 0, 0.18);
        }

        if ("barColor" in scrollViewer) {
            scrollViewer.barColor = scrollViewer.barColor || "#000000FF";
        }

        if ("barBackground" in scrollViewer) {
            scrollViewer.barBackground = scrollViewer.barBackground || "#D0D0D0FF";
        }

        if ("wheelPrecision" in scrollViewer) {
            scrollViewer.wheelPrecision = Math.max(Number(scrollViewer.wheelPrecision) || 0, 25);
        }

        scrollViewer.isPointerBlocker = true;
        scrollViewer.isVisible = true;
        scrollViewer.isEnabled = true;

        const barreVerticale = scrollViewer.verticalBar ?? scrollViewer._verticalBar ?? null;

        if (barreVerticale) {
            barreVerticale.isVisible = true;
            barreVerticale.isEnabled = true;
            barreVerticale.alpha = 1;

            if ("width" in barreVerticale) {
                barreVerticale.width = "18px";
            }

            if ("color" in barreVerticale) {
                barreVerticale.color = "#000000FF";
            }

            if ("background" in barreVerticale) {
                barreVerticale.background = "#D0D0D0FF";
            }
        }

        scrollViewer._markAsDirty?.();
    }

    creerBoutonModele({ modele, etatApplication, estActif = false }) {
        if (!modele) {
            throw new Error("Modèle invalide pour créer un bouton.");
        }

        const nomAffiche = this.formaterNomAffiche(modele.nom);
        const bouton = BABYLON.GUI.Button.CreateSimpleButton(
            `ModeleBtn_${modele.id}`,
            nomAffiche
        );

        bouton.metadata = {
            ...(bouton.metadata ?? {}),
            estBoutonModele: true,
            idModele: modele.id
        };

        this.appliquerStyleBoutonModele({
            bouton,
            etatApplication,
            estActif,
            nomModele: nomAffiche
        });

        return bouton;
    }

    appliquerStyleBoutonModele({ bouton, etatApplication, estActif = false, nomModele = null }) {
        if (!bouton) {
            return;
        }

        const style = constantesInterface.stylesComposants.boutonModele;
        const styleActif = constantesInterface.stylesComposants.boutonModeleActif;

        const parametresInterface = etatApplication?.interface?.parametres;
        const themeActif = parametresInterface?.theme;
        const theme = obtenirThemeInterface(themeActif);

        bouton.metadata = {
            ...(bouton.metadata ?? {}),
            estBoutonModele: true,
            estOptionActive: Boolean(estActif),
            estBoutonOptionActive: Boolean(estActif),
            estModeleActif: Boolean(estActif)
        };

        bouton.width = style.largeur;
        bouton.height = style.hauteur;
        bouton.thickness = estActif
            ? Math.max(Number(style.epaisseurBordure) || 1, 2)
            : style.epaisseurBordure;

        bouton.paddingTop = style.paddingHaut;
        bouton.paddingBottom = style.paddingBas;

        const fondInactif = theme.boutonFond ?? style.couleurFond;
        const fondActif = this.couleurFondModeleActif(themeActif, theme, styleActif);

        bouton.background = estActif ? fondActif : fondInactif;
        bouton.color = estActif
            ? fondActif
            : theme.boutonBordure ?? style.couleurBordure;

        if (bouton.textBlock) {
            this.appliquerStyleTexteModele({
                textBlock: bouton.textBlock,
                texte: nomModele ?? bouton.textBlock.text,
                style,
                styleActif,
                theme,
                parametresInterface,
                estActif,
                etatApplication
            });
        }
    }

    formaterNomAffiche(nom) {
        return this.normaliserTexteUnicode(nom)
            .replace(/_/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    normaliserTexteUnicode(texte) {
        let valeur = String(texte ?? "");

        if (/[ÃÂ]/.test(valeur)) {
            try {
                const bytes = Uint8Array.from(Array.from(valeur), (caractere) => caractere.charCodeAt(0) & 0xff);
                const repare = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
                if (repare && !repare.includes("�")) {
                    valeur = repare;
                }
            } catch (_erreur) {
                // On garde la valeur initiale si la réparation échoue.
            }
        }

        return valeur.normalize("NFC");
    }

    appliquerStyleTexteModele({
                                 textBlock,
                                 texte,
                                 style,
                                 styleActif,
                                 theme,
                                 parametresInterface,
                                 estActif,
                                 etatApplication = null
                             }) {
        const texteOriginal = String(texte ?? textBlock.text ?? "");
        const police = parametresInterface?.police || "OpenDyslexic";
        const gras = parametresInterface?.gras === true;
        const variationPolice = Number.isFinite(parametresInterface?.taillePolice)
            ? parametresInterface.taillePolice
            : 0;

        textBlock.metadata = {
            ...(textBlock.metadata ?? {}),
            texteDynamique: true,
            texteOriginal: texteOriginal,
            boutonModeleAutoFit: true,
            estLabelBoutonModele: true,
            fontSizeModeleBase: style.fontSize,
            fontWeightModeleBase: style.fontWeight ?? "500",
            lignesMaxAutoFit: 1,
            facteurMinAutoFit: 0.45
        };

        // Espaces normaux : ils permettent le retour à la ligne avec OpenDyslexic.
        textBlock.text = texteOriginal;

        const fondBouton = estActif
            ? this.couleurFondModeleActif(parametresInterface?.theme, theme, styleActif)
            : theme.boutonFond ?? style.couleurFond;

        textBlock.color = estActif
            ? this.couleurTexteLisible(fondBouton)
            : theme.boutonTexte ?? style.couleurTexte;

        const accessActif = etatApplication?.accessibilite?.actif === true;
        const remPx = Number(etatApplication?.accessibilite?.preferencesNavigateur?.remPx);

        textBlock.fontFamily = police;
        textBlock.fontWeight = gras ? "700" : (style.fontWeight ?? "500");
        textBlock.fontSize = accessActif && Number.isFinite(remPx) && remPx > 0
            ? this.calculerFontSizeModeleAccessibilite({
                texte: texteOriginal,
                remPx,
                variationPolice
            })
            : this.calculerFontSizeAutoFit({
                texte: texteOriginal,
                fontSizeBase: style.fontSize,
                variationPolice
            });
        textBlock.metadata.fontSizeDemandeeAutoFit = textBlock.fontSize;

        if (accessActif && Number.isFinite(remPx) && remPx > 0) {
            const tailleBase = parseFloat(textBlock.fontSize);
            if (Number.isFinite(tailleBase)) {
                textBlock.metadata.tailleAccessibiliteNavigateurPx = tailleBase;
                textBlock.metadata.responsiveFontSizeBasePx = tailleBase;
                textBlock.metadata.accessibiliteFontSizePx = tailleBase;
                textBlock.metadata.tailleMinAutoFitPx = Math.max(13, Math.round(remPx * 0.85));
            }
        }

        textBlock.resizeToFit = false;
        // Les noms de modèles sont maintenus sur une seule ligne ; l'auto-fit
        // réduit la taille en fonction de la largeur réelle du bouton.
        textBlock.textWrapping = false;
        textBlock.clipContent = true;
        textBlock.textHorizontalAlignment = style.alignementTexte === "centre"
            ? BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
            : BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        textBlock.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        textBlock.paddingLeft = style.paddingTexteGauche;
        textBlock.paddingRight = "5%";
        textBlock.lineSpacing = "0px";

        textBlock._markAsDirty?.();
    }

    calculerFontSizeAutoFit({ texte: _texte, fontSizeBase, variationPolice = 0 }) {
        const valeurBase = this.extraireNombre(fontSizeBase, 40);
        const unite = String(fontSizeBase ?? "%").includes("px") ? "px" : "%";
        const facteurVariation = Math.max(0.65, 1 + variationPolice / 100);

        // La mesure exacte est effectuée ensuite avec la police réellement
        // chargée. On évite donc une approximation basée sur le nombre de lettres.
        return `${Math.max(1, valeurBase * facteurVariation)}${unite}`;
    }


    calculerFontSizeModeleAccessibilite({ texte: _texte, remPx, variationPolice = 0 }) {
        const facteurVariation = Math.max(0.75, 1 + variationPolice / 100);
        const valeur = Math.max(15, Math.round(remPx * 1.18 * facteurVariation));

        return `${valeur}px`;
    }

    actualiserStylesBoutonsModeles(etatApplication) {
        const advancedTexture = etatApplication?.gui?.advancedTexture;
        if (!advancedTexture?.getDescendants) return;

        const boutons = advancedTexture.getDescendants().filter((controle) => {
            return controle instanceof BABYLON.GUI.Button
                && (controle.metadata?.estBoutonModele === true || String(controle.name ?? "").startsWith("ModeleBtn_"));
        });

        boutons.forEach((bouton) => {
            const idModele = bouton.metadata?.idModele ?? String(bouton.name ?? "").replace("ModeleBtn_", "");
            const modele = etatApplication?.modele3d?.modelesDisponibles?.find((m) => m.id === idModele);
            const idActif = etatApplication?.modele3d?.modeleActuel?.id
                ?? etatApplication?.modele3d?.modeleSelectionne?.id
                ?? null;

            this.appliquerStyleBoutonModele({
                bouton,
                etatApplication,
                estActif: idModele === idActif,
                nomModele: modele?.nom
                    ? this.formaterNomAffiche(modele.nom)
                    : (bouton.textBlock?.metadata?.texteOriginal ?? bouton.textBlock?.text)
            });
        });

        advancedTexture.markAsDirty?.();
        this.planifierAutoFitModeles(etatApplication);
    }

    marquerModeleActif({
                           conteneurListe,
                           idModeleActif,
                           etatApplication
                       }) {
        if (!conteneurListe?.children) {
            return;
        }

        conteneurListe.children.forEach((controle) => {
            if (!controle?.name?.startsWith("ModeleBtn_")) {
                return;
            }

            const idModele = controle.name.replace("ModeleBtn_", "");
            const modele = etatApplication?.modele3d?.modelesDisponibles?.find((m) => m.id === idModele);
            const estActif = idModele === idModeleActif;

            this.appliquerStyleBoutonModele({
                bouton: controle,
                etatApplication,
                estActif,
                nomModele: modele?.nom
                    ? this.formaterNomAffiche(modele.nom)
                    : (controle.textBlock?.metadata?.texteOriginal ?? controle.textBlock?.text)
            });
        });

        this.planifierAutoFitModeles(etatApplication);
    }

    planifierAutoFitModeles(etatApplication) {
        const service = etatApplication?.services?.texteResponsive;
        if (!service) return;

        const ajuster = () => {
            etatApplication?.gui?.advancedTexture?.markAsDirty?.();
            service.planifierAjustement?.(0);
        };

        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(() => requestAnimationFrame(ajuster));
        } else {
            ajuster();
        }

        setTimeout(ajuster, 80);
        setTimeout(ajuster, 220);
    }

    estModeleActif(modele, etatApplication) {
        if (!modele || !etatApplication?.modele3d) {
            return false;
        }

        const modeleActuelId = etatApplication.modele3d.modeleActuel?.id;
        const modeleSelectionneId = etatApplication.modele3d.modeleSelectionne?.id;

        return modele.id === modeleActuelId || modele.id === modeleSelectionneId;
    }

    couleurFondModeleActif(themeActif, theme, styleActif) {
        const nomTheme = String(themeActif ?? "").toLowerCase();

        if (nomTheme === "noir" || nomTheme === "gris-fonce" || nomTheme.includes("fonce")) {
            return "#FFFFFFFF";
        }

        return styleActif?.couleurFond ?? "#000000FF";
    }

    couleurTexteLisible(couleurFond) {
        const couleur = this.normaliserCouleurHex(couleurFond);
        if (!couleur) return "#000000FF";

        const r = parseInt(couleur.slice(1, 3), 16) / 255;
        const g = parseInt(couleur.slice(3, 5), 16) / 255;
        const b = parseInt(couleur.slice(5, 7), 16) / 255;
        const luminance = 0.2126 * this.lineariserCanalCouleur(r)
            + 0.7152 * this.lineariserCanalCouleur(g)
            + 0.0722 * this.lineariserCanalCouleur(b);

        return luminance > 0.55 ? "#111111FF" : "#FFFFFFFF";
    }

    normaliserCouleurHex(couleur) {
        if (typeof couleur !== "string") return null;

        const texte = couleur.trim();
        if (!texte.startsWith("#")) return null;

        if (texte.length === 4) {
            const r = texte[1];
            const g = texte[2];
            const b = texte[3];
            return `#${r}${r}${g}${g}${b}${b}`;
        }

        if (texte.length >= 7) {
            return texte.slice(0, 7);
        }

        return null;
    }

    lineariserCanalCouleur(valeur) {
        return valeur <= 0.03928
            ? valeur / 12.92
            : Math.pow((valeur + 0.055) / 1.055, 2.4);
    }

    trouverScrollViewer(conteneurListe) {
        let courant = conteneurListe?.parent ?? null;

        while (courant) {
            if (courant instanceof BABYLON.GUI.ScrollViewer) {
                return courant;
            }

            courant = courant.parent ?? null;
        }

        return null;
    }

    rafraichirScroll(conteneurListe) {
        conteneurListe._markAsDirty?.();
        const scrollViewer = this.trouverScrollViewer(conteneurListe);
        this.configurerScrollViewer(scrollViewer);
        scrollViewer?._markAsDirty?.();
    }

    extrairePixels(valeur, defaut = 0) {
        const nombre = parseFloat(valeur);
        return Number.isFinite(nombre) ? nombre : defaut;
    }

    extraireNombre(valeur, defaut = 0) {
        const nombre = parseFloat(valeur);
        return Number.isFinite(nombre) ? nombre : defaut;
    }
}
