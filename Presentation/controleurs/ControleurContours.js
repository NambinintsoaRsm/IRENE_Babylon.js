/**
 * @file Contrôleur du menu Contours de la V1.
 *
 * Rôle : relier Silhouette, Épaisseur, Couleur manuelle et Choix automatique aux
 * Use Cases puis synchroniser les états visuels des boutons.
 *
 * Utilisation : ce contrôleur ne doit contenir aucun calcul de contour. Le rendu est
 * délégué à PostTraitSilhouette et le choix automatique à son service dédié.
 *
 * Extension V2 : Relief, contour par couleur et surbrillance devront être injectés
 * comme modules séparés afin de ne pas fragiliser le noyau Silhouette validé.
 */
import { TypeContour } from "../../Domain/contours/TypeContour.js";
import { constantesContours } from "../../Configuration/constantesContours.js";
import { obtenirThemeInterface } from "../../Configuration/constantesInterface.js";

/**
 * Contrôleur Contours - ANNA V1.
 *
 * Fonctionnalités conservées :
 * - Silhouette ;
 * - épaisseur ;
 * - choix manuel de la couleur ;
 * - choix automatique de la couleur.
 *
 * Les extensions Relief / contours par couleur / surbrillance sont volontairement
 * absentes de cette classe. Elles pourront être ajoutées comme modules séparés en V2.
 */
export class ControleurContours {
    constructor({
        etatApplication,
        activerSilhouetteUC,
        changerEpaisseurContourUC,
        changerCouleurContourUC,
        choisirCouleurContourAdaptativeUC = null,
        desactiverContoursUC,
        reinitialiserContoursUC,
        postTraitSilhouette
    }) {
        this.etatApplication = etatApplication;
        this.activerSilhouetteUC = activerSilhouetteUC;
        this.changerEpaisseurContourUC = changerEpaisseurContourUC;
        this.changerCouleurContourUC = changerCouleurContourUC;
        this.choisirCouleurContourAdaptativeUC = choisirCouleurContourAdaptativeUC;
        this.desactiverContoursUC = desactiverContoursUC;
        this.reinitialiserContoursUC = reinitialiserContoursUC;
        this.postTraitSilhouette = postTraitSilhouette;

        this.boutonSilhouette = null;
        this.sliderEpaisseur = null;
        this.texteEpaisseur = null;
        this.promesseCouleurAdaptative = null;
    }

    /**
     * Relie le bouton Silhouette au paramètre métier et au post-traitement V1.
     *
     * @param {BABYLON.GUI.Button|null} bouton Bouton Contours/Silhouette.
     */
    brancherSilhouette(bouton) {
        if (!bouton) return;

        this.boutonSilhouette = bouton;
        this.memoriserStyleBouton(bouton);

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(async () => {
            const parametres = this.etatApplication.contours?.parametres;
            if (!parametres) return;

            try {
                if (this.estSilhouetteActive(parametres)) {
                    this.desactiverContoursUC.executer(TypeContour.SILHOUETTE);
                    this.postTraitSilhouette?.supprimer?.(this.etatApplication);
                } else {
                    this.activerSilhouetteUC.executer();
                    await this.recalculerCouleurAdaptativeSiNecessaire({
                        forcer: false,
                        raison: "activation-silhouette"
                    });
                    this.postTraitSilhouette?.appliquer?.(this.etatApplication);
                }

                this.mettreAJourSliderEpaisseurSiContoursDesactives();
                this.mettreAJourBoutonSilhouette();
                this.mettreAJourBoutonsCouleurs(null);
                this.mettreAJourBoutonCouleurAdaptative();
            } catch (erreur) {
                console.error("Erreur pendant l'activation de la silhouette.", erreur);
            }
        });

        this.mettreAJourBoutonSilhouette();
    }

    brancherSliderEpaisseur({ slider, texteValeur = null }) {
        if (!slider) return;

        this.sliderEpaisseur = slider;
        this.texteEpaisseur = texteValeur;

        const configuration = constantesContours.epaisseurSlider;
        slider.minimum = configuration.min;
        slider.maximum = configuration.max;
        slider.step = configuration.step;

        const valeurInitiale = this.obtenirEpaisseurAfficheeDepuisEtat();
        slider.value = valeurInitiale;

        if (texteValeur) {
            texteValeur.metadata = { ...(texteValeur.metadata ?? {}), texteDynamique: true };
            texteValeur.text = String(valeurInitiale);
        }

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            const epaisseur = Math.min(
                configuration.max,
                Math.max(configuration.min, Math.round(Number(valeur) || configuration.defaut))
            );

            this.changerEpaisseurContourUC.executer(epaisseur);

            if (texteValeur) {
                texteValeur.text = String(epaisseur);
                texteValeur._markAsDirty?.();
            }

            if (this.estSilhouetteActive()) {
                this.postTraitSilhouette?.appliquer?.(this.etatApplication);
            }
        });
    }

    brancherCouleur({ bouton, couleur }) {
        if (!bouton) return;

        bouton.metadata = {
            ...(bouton.metadata ?? {}),
            estBoutonCouleurContour: true
        };
        this.memoriserStyleBouton(bouton);

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            this.changerCouleurContourUC.executer(couleur);

            if (this.estSilhouetteActive()) {
                this.postTraitSilhouette?.appliquer?.(this.etatApplication);
            }

            this.mettreAJourBoutonsCouleurs(bouton);
            this.mettreAJourBoutonCouleurAdaptative();
        });
    }

    /**
     * Relie le choix automatique à l'analyse locale du rendu.
     * Le calcul n'est relancé que lorsque sa signature d'entrée change ou lorsqu'il
     * est explicitement forcé, afin d'éviter un traitement coûteux inutile.
     */
    brancherCouleurAdaptative(bouton) {
        if (!bouton) return;

        bouton.metadata = {
            ...(bouton.metadata ?? {}),
            estBoutonCouleurAdaptative: true
        };
        this.memoriserStyleBouton(bouton);

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(async () => {
            const parametres = this.etatApplication.contours?.parametres;
            if (!parametres) return;

            const prochainEtat = !Boolean(parametres.couleurAutomatiqueActive);
            parametres.activerCouleurAutomatique?.(prochainEtat);

            bouton.isEnabled = false;
            try {
                if (prochainEtat) {
                    await this.recalculerCouleurAdaptativeSiNecessaire({
                        forcer: true,
                        raison: "choix-automatique"
                    });
                }

                if (this.estSilhouetteActive()) {
                    this.postTraitSilhouette?.appliquer?.(this.etatApplication);
                }

                this.mettreAJourBoutonsCouleurs(null);
                this.mettreAJourBoutonCouleurAdaptative();
            } catch (erreur) {
                console.error("Erreur pendant le choix automatique de couleur.", erreur);
            } finally {
                bouton.isEnabled = true;
            }
        });

        this.mettreAJourBoutonCouleurAdaptative();
    }

    async recalculerCouleurAdaptativeSiNecessaire({ forcer = false, raison = "" } = {}) {
        const parametres = this.etatApplication.contours?.parametres;

        if (!parametres || !this.choisirCouleurContourAdaptativeUC) {
            return null;
        }

        const autoActif = Boolean(parametres.couleurAutomatiqueActive);
        const couleurManuelle = Boolean(parametres.couleurManuelleChoisie);

        if (!forcer && !autoActif && couleurManuelle) {
            return null;
        }

        const signature = this.obtenirSignatureCouleurAdaptative();
        if (
            !forcer
            && autoActif
            && parametres.couleurAutomatiqueCalculee
            && parametres.signatureCouleurAutomatique === signature
        ) {
            return null;
        }

        if (this.promesseCouleurAdaptative) {
            return this.promesseCouleurAdaptative;
        }

        this.promesseCouleurAdaptative = this.choisirCouleurContourAdaptativeUC
            .executer({ activerSilhouette: false, raison })
            .then((resultat) => {
                const courant = this.etatApplication.contours?.parametres;
                if (courant) {
                    courant.signatureCouleurAutomatique = this.obtenirSignatureCouleurAdaptative();
                }
                this.mettreAJourBoutonCouleurAdaptative();
                return resultat;
            })
            .finally(() => {
                this.promesseCouleurAdaptative = null;
            });

        return this.promesseCouleurAdaptative;
    }

    appliquerDepuisEtat() {
        if (this.estSilhouetteActive()) {
            this.postTraitSilhouette?.appliquer?.(this.etatApplication);
        } else {
            this.postTraitSilhouette?.supprimer?.(this.etatApplication);
        }
    }

    reinitialiser() {
        this.reinitialiserContoursUC.executer();
        this.postTraitSilhouette?.supprimer?.(this.etatApplication);
        this.mettreAJourInterfaceDepuisEtat();
    }

    mettreAJourInterfaceDepuisEtat() {
        this.mettreAJourSliderEpaisseur(this.obtenirEpaisseurAfficheeDepuisEtat());
        this.mettreAJourBoutonSilhouette();
        this.mettreAJourBoutonCouleurAdaptative();
    }

    obtenirSignatureCouleurAdaptative() {
        const scene = this.etatApplication.scenes?.scene3D;
        const camera = this.etatApplication.camera?.cameraBabylon;
        const clearColor = scene?.clearColor;
        const cible = camera?.target;

        const arrondir = (valeur) => {
            const nombre = Number(valeur);
            return Number.isFinite(nombre) ? Math.round(nombre * 1000) / 1000 : null;
        };

        return JSON.stringify({
            modele: this.etatApplication.modele3d?.modeleActuel?.id
                ?? this.etatApplication.modele3d?.modeleSelectionne?.id
                ?? null,
            texture: this.etatApplication.apparence?.parametres?.textureActive ?? null,
            tailleMotif: this.etatApplication.apparence?.parametres?.textureMotifTaille ?? null,
            fondScene: this.etatApplication.apparence?.parametres?.fondScene ?? null,
            clearColor: clearColor
                ? [arrondir(clearColor.r), arrondir(clearColor.g), arrondir(clearColor.b), arrondir(clearColor.a)]
                : null,
            camera: camera
                ? {
                    alpha: arrondir(camera.alpha),
                    beta: arrondir(camera.beta),
                    rayon: arrondir(camera.radius),
                    cible: cible ? [arrondir(cible.x), arrondir(cible.y), arrondir(cible.z)] : null
                }
                : null
        });
    }

    estSilhouetteActive(parametres = this.etatApplication.contours?.parametres) {
        if (!parametres?.actif) return false;
        if (typeof parametres.estActif === "function") {
            return parametres.estActif(TypeContour.SILHOUETTE);
        }
        if (Array.isArray(parametres.typesActifs)) {
            return parametres.typesActifs.includes(TypeContour.SILHOUETTE);
        }
        return parametres.typeActif === TypeContour.SILHOUETTE;
    }

    mettreAJourSliderEpaisseurSiContoursDesactives() {
        if (this.estSilhouetteActive()) return;

        const valeur = constantesContours.epaisseurSlider.defaut;
        this.etatApplication.contours?.parametres?.changerEpaisseur?.(valeur);
        this.mettreAJourSliderEpaisseur(valeur);
    }

    obtenirEpaisseurAfficheeDepuisEtat() {
        const configuration = constantesContours.epaisseurSlider;
        const parametres = this.etatApplication.contours?.parametres;

        if (!this.estSilhouetteActive(parametres)) {
            return configuration.defaut;
        }

        return Math.min(
            configuration.max,
            Math.max(configuration.min, Math.round(Number(parametres?.epaisseur) || configuration.defaut))
        );
    }

    mettreAJourSliderEpaisseur(valeur) {
        const configuration = constantesContours.epaisseurSlider;
        const epaisseur = Math.min(
            configuration.max,
            Math.max(configuration.min, Math.round(Number(valeur) || configuration.defaut))
        );

        if (this.sliderEpaisseur) {
            this.sliderEpaisseur.value = epaisseur;
            this.sliderEpaisseur._markAsDirty?.();
        }

        if (this.texteEpaisseur) {
            this.texteEpaisseur.text = String(epaisseur);
            this.texteEpaisseur._markAsDirty?.();
        }
    }

    mettreAJourBoutonSilhouette() {
        if (!this.boutonSilhouette) return;
        this.appliquerStyleBoutonOption({
            bouton: this.boutonSilhouette,
            actif: this.estSilhouetteActive()
        });
    }

    mettreAJourBoutonsCouleurs(boutonActif) {
        Object.values(this.etatApplication.gui?.controles ?? {}).forEach((controle) => {
            if (!controle?.metadata?.estBoutonCouleurContour) return;

            controle.background = controle.metadata.backgroundOriginal;
            controle.color = controle.metadata.colorOriginal;
            controle.thickness = controle === boutonActif
                ? 3
                : controle.metadata.thicknessOriginal;
            controle._markAsDirty?.();
        });
    }

    mettreAJourBoutonCouleurAdaptative() {
        const actif = Boolean(this.etatApplication.contours?.parametres?.couleurAutomatiqueActive);

        Object.values(this.etatApplication.gui?.controles ?? {}).forEach((controle) => {
            if (!controle?.metadata?.estBoutonCouleurAdaptative) return;
            this.mettreAJourCocheBouton(controle, actif, "ContoAutoBtnTxt");
        });
    }

    memoriserStyleBouton(bouton) {
        bouton.metadata = {
            ...(bouton.metadata ?? {}),
            backgroundOriginal: bouton.metadata?.backgroundOriginal ?? bouton.background,
            thicknessOriginal: bouton.metadata?.thicknessOriginal ?? bouton.thickness,
            colorOriginal: bouton.metadata?.colorOriginal ?? bouton.color
        };
    }

    appliquerStyleBoutonOption({ bouton, actif }) {
        if (!bouton) return;

        const fond = actif ? this.couleurFondOptionActive() : this.couleurFondOptionInactive();
        const theme = this.obtenirThemeActif();

        bouton.background = fond;
        bouton.color = theme?.boutonBordure || bouton.metadata?.colorOriginal || "#000000FF";
        bouton.thickness = actif
            ? Math.max(Number(bouton.metadata?.thicknessOriginal ?? 1), 2)
            : bouton.metadata?.thicknessOriginal;

        this.appliquerCouleurTexteBouton(bouton, this.couleurTexteLisible(fond));
        bouton._markAsDirty?.();
    }

    obtenirThemeActif() {
        return obtenirThemeInterface(this.etatApplication.interface?.parametres?.theme);
    }

    couleurFondOptionInactive() {
        const themeActif = this.etatApplication.interface?.parametres?.theme;
        const theme = this.obtenirThemeActif();

        if (themeActif === "noir") return "#000000FF";
        if (themeActif === "gris-fonce") return "#3A3A3AFF";
        return theme?.boutonFond || "#FFFFFFFF";
    }

    couleurFondOptionActive() {
        const themeActif = this.etatApplication.interface?.parametres?.theme;
        return themeActif === "noir" || themeActif === "gris-fonce"
            ? "#FFFFFFFF"
            : "#3A3A3AFF";
    }

    appliquerCouleurTexteBouton(bouton, couleurTexte) {
        if (bouton?.textBlock) {
            bouton.textBlock.color = couleurTexte;
            bouton.textBlock._markAsDirty?.();
        }

        const TextBlock = globalThis.BABYLON?.GUI?.TextBlock;
        if (!TextBlock || !Array.isArray(bouton?.children)) return;

        bouton.children.forEach((enfant) => {
            if (enfant instanceof TextBlock) {
                enfant.color = couleurTexte;
                enfant._markAsDirty?.();
            }
        });
    }

    mettreAJourCocheBouton(bouton, actif, nomTextBlock = null) {
        if (!bouton) return;

        const fond = actif ? this.couleurFondCheckboxActive() : this.couleurFondCheckboxInactive();
        const theme = this.obtenirThemeActif();

        bouton.background = fond;
        bouton.color = actif
            ? fond
            : (theme?.boutonBordure || bouton.metadata?.colorOriginal || "#000000FF");
        bouton.thickness = actif
            ? Math.max(Number(bouton.metadata?.thicknessOriginal ?? 1), 2)
            : Math.max(Number(bouton.metadata?.thicknessOriginal ?? 1), 1);

        const coche = this.obtenirTextBlockBouton(bouton, nomTextBlock);
        if (coche) {
            coche.metadata = {
                ...(coche.metadata ?? {}),
                texteDynamique: true,
                nePasAutoFit: true,
                fontSizeOriginal: "30px"
            };
            coche.text = actif ? "✓" : "";
            coche.color = this.couleurTexteLisible(fond);
            coche.fontWeight = "700";
            coche._markAsDirty?.();
        }

        bouton._markAsDirty?.();
    }

    couleurFondCheckboxActive() {
        return this.couleurFondOptionActive();
    }

    couleurFondCheckboxInactive() {
        return this.couleurFondOptionInactive();
    }

    obtenirTextBlockBouton(bouton, nomPrioritaire = null) {
        if (!bouton) return null;

        const controlePrioritaire = nomPrioritaire
            ? this.etatApplication.gui?.controles?.[nomPrioritaire]
            : null;
        if (controlePrioritaire) return controlePrioritaire;
        if (bouton.textBlock) return bouton.textBlock;

        const TextBlock = globalThis.BABYLON?.GUI?.TextBlock;
        if (!TextBlock || !Array.isArray(bouton.children)) return null;

        return bouton.children.find((enfant) => enfant instanceof TextBlock) ?? null;
    }

    couleurTexteLisible(couleur) {
        const rgb = this.extraireRgbDepuisHex(couleur);
        if (!rgb) return "#000000FF";

        const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
        return luminance > 0.55 ? "#000000FF" : "#FFFFFFFF";
    }

    extraireRgbDepuisHex(couleur) {
        if (typeof couleur !== "string") return null;

        const hex = couleur.trim().replace("#", "");
        if (![6, 8].includes(hex.length)) return null;

        const r = Number.parseInt(hex.slice(0, 2), 16);
        const g = Number.parseInt(hex.slice(2, 4), 16);
        const b = Number.parseInt(hex.slice(4, 6), 16);

        return [r, g, b].some(Number.isNaN) ? null : { r, g, b };
    }
}
