import { TypeContour } from "../../Domain/contours/TypeContour.js";

/**
 * Contrôleur des contours.
 *
 * Particularité importante : plusieurs contours peuvent être actifs en même temps.
 * Exemple : Silhouette + Relief + Couleur.
 */
export class ControleurContours {
    constructor({
        etatApplication,
        activerSilhouetteUC,
        activerReliefUC,
        activerContourCouleurUC,
        changerEpaisseurContourUC,
        changerCouleurContourUC,
        desactiverContoursUC,
        reinitialiserContoursUC,
        postTraitContProfNorm,
        postTraitContoursCouleur
    }) {
        this.etatApplication = etatApplication;
        this.activerSilhouetteUC = activerSilhouetteUC;
        this.activerReliefUC = activerReliefUC;
        this.activerContourCouleurUC = activerContourCouleurUC;
        this.changerEpaisseurContourUC = changerEpaisseurContourUC;
        this.changerCouleurContourUC = changerCouleurContourUC;
        this.desactiverContoursUC = desactiverContoursUC;
        this.reinitialiserContoursUC = reinitialiserContoursUC;
        this.postTraitContProfNorm = postTraitContProfNorm;
        this.postTraitContoursCouleur = postTraitContoursCouleur;
        this.boutonsType = new Map();
    }

    brancherSilhouette(bouton) {
        this.brancherBoutonTypeContour({ bouton, typeContour: TypeContour.SILHOUETTE });
    }

    brancherRelief(bouton) {
        this.brancherBoutonTypeContour({ bouton, typeContour: TypeContour.RELIEF });
    }

    brancherContourCouleur(bouton) {
        this.brancherBoutonTypeContour({ bouton, typeContour: TypeContour.COULEUR });
    }

    brancherBoutonTypeContour({ bouton, typeContour }) {
        if (!bouton) return;

        bouton.metadata = bouton.metadata || {};
        bouton.metadata.backgroundOriginal = bouton.metadata.backgroundOriginal ?? bouton.background;
        bouton.metadata.thicknessOriginal = bouton.metadata.thicknessOriginal ?? bouton.thickness;
        bouton.metadata.colorOriginal = bouton.metadata.colorOriginal ?? bouton.color;

        this.boutonsType.set(typeContour, { bouton });

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            const parametres = this.etatApplication.contours.parametres;

            if (typeof parametres.basculer === "function") {
                parametres.basculer(typeContour);
            } else {
                // Compatibilité si l'ancien domaine est encore chargé.
                if (parametres.actif && parametres.typeActif === typeContour) {
                    this.desactiverContoursUC.executer();
                } else {
                    if (typeContour === TypeContour.SILHOUETTE) this.activerSilhouetteUC.executer();
                    if (typeContour === TypeContour.RELIEF) this.activerReliefUC.executer();
                    if (typeContour === TypeContour.COULEUR) this.activerContourCouleurUC.executer();
                }
            }

            this.appliquerContours();
            this.mettreAJourBoutonsTypes();
        });
    }

    brancherSliderEpaisseur({ slider, texteValeur = null }) {
        if (!slider) return;

        const valeurInitiale = Math.min(
            3,
            Math.max(1, Math.round(this.etatApplication.contours.parametres.epaisseur ?? 1))
        );

        slider.minimum = 1;
        slider.maximum = 3;
        slider.step = 1;
        slider.value = valeurInitiale;

        if (texteValeur) {
            texteValeur.metadata = texteValeur.metadata || {};
            texteValeur.metadata.texteDynamique = true;
            texteValeur.text = String(valeurInitiale);
        }

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            const epaisseur = Math.min(3, Math.max(1, Math.round(valeur)));

            if (texteValeur) {
                texteValeur.text = String(epaisseur);
            }

            this.changerEpaisseurContourUC.executer(epaisseur);
            this.appliquerContours();
        });
    }

    brancherCouleur({ bouton, couleur }) {
        if (!bouton) return;

        bouton.metadata = bouton.metadata || {};
        bouton.metadata.estBoutonCouleurContour = true;
        bouton.metadata.backgroundOriginal = bouton.metadata.backgroundOriginal ?? bouton.background;
        bouton.metadata.thicknessOriginal = bouton.metadata.thicknessOriginal ?? bouton.thickness;
        bouton.metadata.colorOriginal = bouton.metadata.colorOriginal ?? bouton.color;

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            this.changerCouleurContourUC.executer(couleur);
            this.appliquerContours();
            this.mettreAJourBoutonsCouleurs(bouton);
        });
    }

    brancherReinitialisation(bouton) {
        if (!bouton) return;

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            this.reinitialiserContoursUC.executer();
            this.appliquerContours();
            this.mettreAJourBoutonsTypes();
            this.mettreAJourBoutonsCouleurs(null);
        });
    }

    mettreAJourBoutonsTypes() {
        const parametres = this.etatApplication.contours.parametres;

        this.boutonsType.forEach(({ bouton }, typeContour) => {
            const actif = this.estContourActif(parametres, typeContour);

            bouton.background = actif
                ? this.couleurActiveFaibleSelonTheme()
                : bouton.metadata.backgroundOriginal;
            bouton.thickness = actif
                ? Math.max(Number(bouton.metadata.thicknessOriginal ?? 1), 2)
                : bouton.metadata.thicknessOriginal;
            bouton.color = bouton.metadata.colorOriginal;
        });
    }

    couleurActiveFaibleSelonTheme() {
        const theme = this.etatApplication.interface?.parametres?.theme;

        if (theme === "noir") return "#1A1A1AFF";
        if (theme === "gris-fonce") return "#444444FF";
        if (theme === "gris-clair") return "#DADADAFF";
        return "#F2F2F2FF";
    }

    mettreAJourBoutonsCouleurs(boutonActif) {
        Object.values(this.etatApplication.gui.controles).forEach((controle) => {
            if (!controle?.metadata?.estBoutonCouleurContour) return;

            controle.background = controle.metadata.backgroundOriginal;
            controle.color = controle.metadata.colorOriginal;
            controle.thickness = controle === boutonActif
                ? 3
                : controle.metadata.thicknessOriginal;
        });
    }

    estContourActif(parametres, typeContour) {
        if (!parametres?.actif) return false;
        if (typeof parametres.estActif === "function") return parametres.estActif(typeContour);
        if (Array.isArray(parametres.typesActifs)) return parametres.typesActifs.includes(typeContour);
        return parametres.typeActif === typeContour;
    }

    appliquerContours() {
        this.postTraitContProfNorm.appliquer(this.etatApplication);
        this.postTraitContoursCouleur.appliquer(this.etatApplication);
    }
}
