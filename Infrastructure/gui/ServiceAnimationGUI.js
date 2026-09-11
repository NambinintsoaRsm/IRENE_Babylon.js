/**
 * @file Gestion des animations et de la disposition dynamique de Babylon GUI.
 *
 * Rôle : piloter le menu latéral, les trois accordéons principaux, Réglages et les
 * panneaux secondaires tout en maintenant les flèches et hauteurs cohérentes.
 *
 * Utilisation : ControleurAnimationInterface initialise ce service puis les autres
 * contrôleurs lui demandent d'ouvrir/fermer leurs panneaux. L'état visuel des
 * accordéons est mémorisé dans metadata.estOuvert des contrôles GUI.
 *
 * Contrainte : la taille/position de Réinitialiser vient de guiTexture.json et ne
 * doit pas être recalculée arbitrairement par ce service.
 */
import { PositionMenu } from "../../Domain/interface/PositionMenu.js";
import { constantesInterface } from "../../Configuration/constantesInterface.js";
import { lireNombreDepuisValeurCss } from "../../Util/ValeurCssUtils.js";

/**
 * Gère les comportements visuels de l'interface Babylon GUI :
 * menu latéral, accordéons, panneaux secondaires et flèches.
 */
export class ServiceAnimationGUI {
    constructor(serviceDimensionsGUI = null, scene = null, etatApplication = null) {
        this.serviceDimensionsGUI = serviceDimensionsGUI;
        this.scene = scene;
        this.etatApplication = etatApplication;
    }

    definirEtatApplication(etatApplication) {
        this.etatApplication = etatApplication;
    }

    definirScene(scene) {
        this.scene = scene;
    }

    initialiserMenu({ etatApplication, menuRect, flecheRect, flecheText }) {
        if (menuRect) {
            menuRect.isVisible = true;
            menuRect.isPointerBlocker = true;
            menuRect.isHitTestVisible = true;
            menuRect.zIndex = 20;
        }

        if (flecheRect) {
            flecheRect.isVisible = true;
            flecheRect.isPointerBlocker = true;
            flecheRect.isHitTestVisible = true;
            flecheRect.zIndex = 100;
        }

        const menu = etatApplication.animation.menuLateral;
        if (typeof menu.estOuvert !== "boolean") {
            menu.estOuvert = true;
        }

        this.appliquerPositionMenu({ etatApplication, menuRect, flecheRect, flecheText });

        // La pile principale commence réellement sous le bouton de fermeture et
        // sa hauteur est recalculée d'après la fenêtre courante.
        this.ajusterDispositionMenuPrincipal();
        this.brancherRedimensionnementDisposition();
    }

    basculerMenu({ etatApplication, menuRect, flecheRect, flecheText }) {
        // Le pliage/dépliage du menu principal garde son animation.
        // Les transitions entre panneaux secondaires restent instantanées.
        this.appliquerPositionMenu({ etatApplication, menuRect, flecheRect, flecheText, animer: true });
    }

    /**
     * Positionne le menu et sa flèche pour le côté gauche ou droit.
     *
     * La flèche est recalculée dans la même opération afin d'éviter le décalage
     * d'un clic observé lorsque position et symbole étaient mis à jour séparément.
     */
    appliquerPositionMenu({ etatApplication, menuRect, flecheRect, flecheText, animer = false }) {
        if (!menuRect || !flecheRect) return;

        const positionMenu = etatApplication.interface.parametres.positionMenu;
        const menuOuvert = etatApplication.animation.menuLateral.estOuvert;
        const largeurMenu = this.obtenirLargeurMenu(etatApplication, menuRect);

        let alignement;
        let gaucheMenu;
        let gaucheFleche;

        if (positionMenu === PositionMenu.GAUCHE || positionMenu === "gauche") {
            alignement = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            gaucheMenu = menuOuvert ? 0 : -largeurMenu;
            gaucheFleche = menuOuvert ? largeurMenu : 0;
        } else {
            alignement = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            gaucheMenu = menuOuvert ? 0 : largeurMenu;
            gaucheFleche = menuOuvert ? -largeurMenu : 0;
        }

        menuRect.horizontalAlignment = alignement;
        flecheRect.horizontalAlignment = alignement;

        if (animer) {
            const duree = this.obtenirDureeMenu(etatApplication);
            this.animerPourcentage(menuRect, "left", lireNombreDepuisValeurCss(menuRect.left), gaucheMenu, duree);
            this.animerPourcentage(flecheRect, "left", lireNombreDepuisValeurCss(flecheRect.left), gaucheFleche, duree);
        } else {
            menuRect.left = `${gaucheMenu}%`;
            flecheRect.left = `${gaucheFleche}%`;
        }

        this.mettreAJourFlecheMenu({ flecheText, positionMenu, menuOuvert });
        this.retournerOngletPliageSelonPosition({ flecheRect, positionMenu });
    }

    obtenirLargeurMenu(etatApplication, menuRect) {
        const memorisee = etatApplication?.gui?.dimensionsInitiales?.menu?.largeurValeur;
        if (Number.isFinite(memorisee) && memorisee > 0) return memorisee;
        return lireNombreDepuisValeurCss(menuRect?.width, 20);
    }

    mettreAJourFlecheMenu({ flecheText, positionMenu, menuOuvert }) {
        if (!flecheText) return;

        const fleches = constantesInterface.flechesMenu[positionMenu]
            ?? constantesInterface.flechesMenu[PositionMenu.DROITE]
            ?? { ouvert: "▶", ferme: "◀" };

        // La flèche indique l'action du prochain clic, et non simplement l'état courant.
        // ouvert  => action suivante : replier le menu.
        // fermé   => action suivante : ouvrir le menu.
        flecheText.text = menuOuvert ? fleches.ouvert : fleches.ferme;
        flecheText.metadata = flecheText.metadata || {};
        flecheText.metadata.indiqueActionDuProchainClic = true;
        flecheText._markAsDirty?.();
    }

    retournerOngletPliageSelonPosition({ flecheRect, positionMenu }) {
        if (!flecheRect) return;

        flecheRect.metadata = flecheRect.metadata || {};

        if (flecheRect.metadata.rotationInitiale === undefined) {
            flecheRect.metadata.rotationInitiale = Number.isFinite(flecheRect.rotation)
                ? flecheRect.rotation
                : 0;
        }

        const estAGauche = positionMenu === PositionMenu.GAUCHE || positionMenu === "gauche";

        // On conserve la rotation de l'onglet pour garder la bonne forme graphique,
        // mais on contre-rotationne le bouton et le texte afin que le symbole affiché
        // corresponde réellement au sens de l'action attendue au clic.
        flecheRect.rotation = estAGauche
            ? flecheRect.metadata.rotationInitiale + Math.PI
            : flecheRect.metadata.rotationInitiale;

        const rotationACompenser = Number.isFinite(flecheRect.rotation) ? -flecheRect.rotation : 0;

        this.parcourirControle(flecheRect, (controle) => {
            if (!controle || controle === flecheRect) return;

            if (controle.name === "FlecheMenuBtn") {
                controle.rotation = rotationACompenser;
                controle._markAsDirty?.();
                return;
            }

            if (controle.name === "FlecheMenuBtnTxt") {
                controle.rotation = 0;
                controle._markAsDirty?.();
            }
        });
    }

    initialiserAccordeons(dropdowns = []) {
        dropdowns.forEach(({ rect, fleche, hauteur }) => {
            if (!rect) return;

            rect.metadata = rect.metadata || {};
            rect.metadata.estOuvert = false;

            const hauteurNaturelle = hauteur ?? lireNombreDepuisValeurCss(rect.height, 0);
            rect.metadata.hauteurNaturelle = hauteurNaturelle;
            rect.metadata.hauteurOuverte = hauteurNaturelle;
            rect.metadata.hauteurActuelle = 0;

            rect.height = "0px";
            rect.alpha = 0;
            rect.isVisible = false;

            if (fleche) fleche.text = constantesInterface.flechesDropdown.ferme;
        });
    }

    brancherAccordeonsExclusifs(dropdowns = []) {
        this.initialiserAccordeons(dropdowns);

        dropdowns.forEach((dropdown) => {
            const { bouton, rect, fleche, hauteur } = dropdown;
            if (!bouton || !rect) return;

            bouton.onPointerClickObservable.add(() => {
                const doitOuvrir = !rect.metadata?.estOuvert;

                dropdowns.forEach((autre) => {
                    if (autre.rect && autre.rect !== rect) {
                        this.fermerAccordeon(autre.rect, autre.fleche);
                    }
                });

                if (doitOuvrir) {
                    this.ouvrirAccordeon(rect, fleche, hauteur);
                } else {
                    this.fermerAccordeon(rect, fleche);
                }
            });
        });
    }

    ouvrirAccordeon(rect, fleche, hauteurOuverte = null) {
        if (!rect) return;

        if (rect.name === "RegOptnRect") {
            // Quand Réglages est ouvert, les trois autres entrées d'Outils sont
            // temporairement masquées pour donner toute la hauteur disponible aux sliders.
            this.afficherBoutonsOutilsSecondaires(false);
            this.ajusterLargeurPanneauReglages();
            this.restaurerPositionBoutonReinitialiserReglages();

            // Le panneau peut avoir subi un auto-fit pendant sa fermeture.
            // On resynchronise donc systématiquement les sliders ET leurs labels
            // depuis l'état métier courant avant de le réafficher.
            this.synchroniserReglagesApparenceDepuisEtat();
        }

        // Pour Outils et Réglages, la hauteur dépend de la taille de la fenêtre
        // et des enfants réellement affichés. Pour les autres accordéons on
        // conserve la hauteur naturelle issue du GUI.
        const hauteurDemandee = hauteurOuverte
            ?? rect.metadata?.hauteurNaturelle
            ?? rect.metadata?.hauteurOuverte
            ?? lireNombreDepuisValeurCss(rect.height, 0);
        const hauteur = this.calculerHauteurAccordeon(rect, hauteurDemandee);
        const duree = this.obtenirDureePanneau();

        rect.isVisible = true;
        rect.metadata = rect.metadata || {};
        rect.metadata.estOuvert = true;
        rect.metadata.hauteurOuverte = hauteur;

        const departHauteur = rect.metadata.hauteurActuelle || lireNombreDepuisValeurCss(rect.height, 0) || 0;
        const departAlpha = Number.isFinite(rect.alpha) ? rect.alpha : 0;

        // L'auto-fit ne doit pas mesurer les textes pendant que la hauteur du
        // panneau est encore en cours d'animation. Avec OpenDyslexic, cela
        // pouvait mémoriser une boîte trop petite lors de la première ouverture.
        this.animerHauteurRect(rect, departHauteur, hauteur, duree, () => {
            rect.height = `${hauteur}px`;
            rect.metadata.hauteurActuelle = hauteur;
            rect._markAsDirty?.();

            this.relancerAutoFitApresDisposition({
                delais: [0, 70, 180],
                attendrePolice: true
            });
        });
        this.animerAlpha(rect, departAlpha, 1, duree);
        rect.metadata.hauteurActuelle = hauteur;

        if (fleche) fleche.text = constantesInterface.flechesDropdown.ouvert;
    }

    fermerAccordeon(rect, fleche) {
        if (!rect) return;

        if (rect.name === "RegOptnRect") {
            this.afficherBoutonsOutilsSecondaires(true);
        }

        rect.metadata = rect.metadata || {};
        rect.metadata.estOuvert = false;

        const duree = this.obtenirDureePanneau();
        const depart = rect.metadata.hauteurActuelle || lireNombreDepuisValeurCss(rect.height, 0);

        this.animerHauteurRect(rect, depart, 0, duree, () => {
            if (!rect.metadata.estOuvert) {
                rect.isVisible = false;
                rect.alpha = 0;
            }
        });
        this.animerAlpha(rect, Number.isFinite(rect.alpha) ? rect.alpha : 1, 0, duree);

        rect.metadata.hauteurActuelle = 0;

        if (fleche) fleche.text = constantesInterface.flechesDropdown.ferme;
        // Aucun auto-fit pendant la fermeture : les mesures intermédiaires
        // correspondent à une hauteur volontairement réduite et ne doivent pas
        // devenir la nouvelle référence des textes.
    }

    ouvrirPanneauSecondaire(panneau, panneauxAfermer = []) {
        panneauxAfermer.forEach((p) => this.fermerPanneauSecondaire(p));

        if (!panneau) return;

        // Pas d'animation entre les panneaux de menu : on évite les transitions globales.
        // Seuls les dropdowns principaux utilisent une apparition douce.
        panneau.isVisible = true;
        panneau.zIndex = 30;
        panneau.isPointerBlocker = true;
        panneau.isHitTestVisible = true;
        panneau.alpha = 1;

        // Les panneaux secondaires étaient auparavant ajustés trop tôt, avant
        // que Babylon ait recalculé leurs dimensions après isVisible = true.
        this.relancerAutoFitApresDisposition({
            delais: [0, 70, 180],
            attendrePolice: true
        });
    }

    fermerPanneauSecondaire(panneau) {
        if (!panneau) return;

        panneau.isVisible = false;
        panneau.alpha = 1;
    }

    initialiserPanneauxSecondaires(panneaux = []) {
        panneaux.forEach((panneau) => {
            if (!panneau) return;
            panneau.isVisible = false;
            panneau.zIndex = 30;
            panneau.isPointerBlocker = true;
            panneau.isHitTestVisible = true;
        });
    }

    deplacerPanneaux(alignement, panneaux = []) {
        panneaux.forEach((panneau) => {
            if (!panneau) return;
            panneau.horizontalAlignment = alignement;
            // On ne modifie plus les left/top internes quand le menu passe à gauche/droite :
            // les décalages du guiTexture.json restent la source de vérité.
        });
    }

    appliquerDecalagesInternesSelonCote(panneau, estAGauche) {
        this.parcourirControle(panneau, (controle) => {
            if (!controle || controle.className === "TextBlock") return;
            if (this.estControleCouleurAConserver(controle)) return;

            controle.metadata = controle.metadata || {};

            if (controle.metadata.leftInitial === undefined) {
                controle.metadata.leftInitial = controle.left ?? "0px";
            }

            const leftInitial = controle.metadata.leftInitial;

            // Le JSON a beaucoup de décalages négatifs prévus pour un menu à droite
            // ex : left = -4%. À gauche, on inverse seulement ces décalages.
            if (estAGauche) {
                controle.left = this.inverserSeulementSiNegatif(leftInitial);
            } else {
                controle.left = leftInitial;
            }
        });
    }

    inverserSeulementSiNegatif(valeurCss) {
        if (typeof valeurCss !== "string") return valeurCss;

        const valeur = parseFloat(valeurCss);
        if (!Number.isFinite(valeur) || valeur >= 0) return valeurCss;

        const unite = valeurCss.includes("%") ? "%" : "px";
        return `${Math.abs(valeur)}${unite}`;
    }

    estControleCouleurAConserver(controle) {
        if (!controle?.name) return false;

        return /^ContBtn[1-8]$/.test(controle.name) ||
            /^(BlancBtn|NoirBtn|GrisBtn|GrisFoncBtn)$/.test(controle.name);
    }

    parcourirControle(controle, callback) {
        callback(controle);

        if (Array.isArray(controle?.children)) {
            controle.children.forEach((enfant) => this.parcourirControle(enfant, callback));
        }
    }


    obtenirControle(nom) {
        if (!nom) return null;

        return this.etatApplication?.gui?.controles?.[nom]
            ?? this.etatApplication?.gui?.advancedTexture?.getControlByName?.(nom)
            ?? null;
    }

    obtenirHauteurViewport() {
        const texture = this.etatApplication?.gui?.advancedTexture;
        const tailleTexture = texture?.getSize?.();
        const hauteurTexture = Number(tailleTexture?.height);
        if (Number.isFinite(hauteurTexture) && hauteurTexture > 0) return hauteurTexture;

        const canvas = this.etatApplication?.canvas;
        const hauteurCanvas = Number(canvas?.clientHeight ?? canvas?.height);
        if (Number.isFinite(hauteurCanvas) && hauteurCanvas > 0) return hauteurCanvas;

        const hauteurFenetre = typeof window !== "undefined" ? Number(window.innerHeight) : 0;
        return Number.isFinite(hauteurFenetre) && hauteurFenetre > 0 ? hauteurFenetre : 900;
    }

    obtenirHauteurControle(controle, fallback = 0) {
        if (!controle) return fallback;

        const mesure = Number(controle?._currentMeasure?.height);
        if (Number.isFinite(mesure) && mesure > 0) return mesure;

        const hauteurCss = lireNombreDepuisValeurCss(controle.height, NaN);
        if (Number.isFinite(hauteurCss) && hauteurCss > 0) return hauteurCss;

        return fallback;
    }

    obtenirEspacementPile(pile, fallback = 12) {
        const valeur = Number(pile?.spacing);
        return Number.isFinite(valeur) && valeur >= 0 ? valeur : fallback;
    }

    /**
     * Positionne la pile principale sous le bouton de fermeture.
     * On utilise des pixels pour que le décalage reste correct quelle que soit
     * la hauteur du navigateur ou le niveau de zoom.
     */
    ajusterDispositionMenuPrincipal() {
        const pile = this.obtenirControle("MainStaPan");
        const boutonFermer = this.obtenirControle("FermBtn");
        if (!pile || !boutonFermer) return;

        // On laisse une vraie respiration visuelle sous le bouton X.
        // La marge est ajoutée à sa hauteur réelle afin de rester correcte si
        // le bouton change de taille avec le zoom ou la résolution.
        const margeHaut = 20;
        const margeBas = 8;
        const hauteurFermeture = this.obtenirHauteurControle(boutonFermer, 45);
        const hauteurViewport = this.obtenirHauteurViewport();
        const top = Math.max(68, Math.round(hauteurFermeture + margeHaut));
        const hauteurDisponible = Math.max(120, Math.floor(hauteurViewport - top - margeBas));

        pile.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        pile.top = `${top}px`;
        pile.height = `${hauteurDisponible}px`;
        pile._markAsDirty?.();

        this.ajusterLargeurPanneauReglages();
        this.restaurerPositionBoutonReinitialiserReglages();

        // Si un volet dynamique est déjà ouvert lors d'un resize, on le remet
        // immédiatement à une hauteur compatible avec la nouvelle fenêtre.
        this.rafraichirHauteursDynamiques({ animer: false });
    }

    brancherRedimensionnementDisposition() {
        if (this._redimensionnementDispositionBranche || typeof window === "undefined") return;
        this._redimensionnementDispositionBranche = true;

        let timer = null;
        window.addEventListener("resize", () => {
            if (timer !== null) clearTimeout(timer);
            timer = setTimeout(() => {
                timer = null;
                this.ajusterDispositionMenuPrincipal();
                this.relancerAutoFitApresDisposition({ delais: [0, 80], attendrePolice: false });
            }, 60);
        }, { passive: true });
    }

    obtenirHauteurMaxVoletPrincipal() {
        const pile = this.obtenirControle("MainStaPan");
        const hauteurPile = this.obtenirHauteurControle(pile, this.obtenirHauteurViewport());
        const espacement = this.obtenirEspacementPile(pile, 12);

        const boutons = ["FichBtn", "ConfBtn", "OutiBtn"]
            .map((nom) => this.obtenirControle(nom))
            .filter(Boolean);
        const hauteurBoutons = boutons.reduce(
            (somme, bouton) => somme + this.obtenirHauteurControle(bouton, 80),
            0
        );

        // Quand un accordéon principal est ouvert, quatre éléments sont visibles
        // dans la pile : les 3 boutons principaux + le panneau courant.
        const nbEspacements = boutons.length;
        return Math.max(0, hauteurPile - hauteurBoutons - espacement * nbEspacements);
    }

    obtenirHauteurNaturelleReglages() {
        const rect = this.obtenirControle("RegOptnRect");
        const naturelle = Number(rect?.metadata?.hauteurNaturelle);
        if (Number.isFinite(naturelle) && naturelle > 0) return naturelle;
        return lireNombreDepuisValeurCss(rect?.height, 600);
    }

    ajusterLargeurPanneauReglages() {
        const rect = this.obtenirControle("RegOptnRect");
        const grille = this.obtenirControle("RegGrid");

        if (rect) {
            // Réglages doit utiliser toute la largeur disponible du volet Outils.
            rect.width = "100%";
            rect.left = "0px";
            rect._markAsDirty?.();
        }

        if (grille) {
            grille.width = "100%";
            grille.left = "0px";
            grille._markAsDirty?.();
        }
    }

    restaurerPositionBoutonReinitialiserReglages({ forcerCellule = false } = {}) {
        const grille = this.obtenirControle("RegGrid");
        const bouton = this.obtenirControle("RegReintBtn");
        if (!grille || !bouton) return;

        bouton.metadata = bouton.metadata || {};

        // Dans guiTexture(8), Réinitialiser appartient à la 5e ligne de RegGrid
        // (ligne 4, colonne 0). On rétablit cette cellule uniquement si nécessaire.
        // Cela évite qu'il soit mesuré comme un enfant libre et qu'il recouvre les sliders.
        const cellule = bouton.metadata?._cellInfo;
        const ligneCorrecte = Number(cellule?.row) === 4 && Number(cellule?.column) === 0;
        const parentCorrect = bouton.parent === grille;

        if (forcerCellule || !parentCorrect || !ligneCorrecte) {
            try {
                bouton.parent?.removeControl?.(bouton);
                grille.addControl?.(bouton, 4, 0);
            } catch (erreur) {
                console.warn("[GUI] Impossible de replacer RegReintBtn dans RegGrid", erreur);
            }
        }

        // Valeurs EXACTES du GUI : aucune adaptation responsive de la géométrie du bouton.
        bouton.width = "95%";
        bouton.height = "90%";
        bouton.left = "0px";
        bouton.top = "0px";
        bouton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        bouton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        bouton.zIndex = 0;
        bouton.isVisible = true;
        bouton.alpha = 1;
        bouton.isEnabled = true;
        bouton.isHitTestVisible = true;
        bouton.isPointerBlocker = true;

        bouton.metadata._cellInfo = { row: "4", column: "0" };
        bouton._markAsDirty?.();
        grille._markAsDirty?.();
    }

    synchroniserReglagesApparenceDepuisEtat() {
        const apparence = this.etatApplication?.apparence?.parametres;
        if (!apparence) return;

        const configs = [
            ["NetteteSlider", "RegNetValTxt", apparence.nettete, false],
            ["ContrasteSlider", "RegConValTxt", apparence.contraste, false],
            ["LuminositeSlider", "RegLumValTxt", apparence.luminosite, true],
            ["SaturationSlider", "RegLumSatTxt", apparence.saturation, false]
        ];

        configs.forEach(([nomSlider, nomTexte, valeurBrute, afficherSigne]) => {
            const valeur = Number(valeurBrute);
            if (!Number.isFinite(valeur)) return;

            const slider = this.obtenirControle(nomSlider);
            const texte = this.obtenirControle(nomTexte);

            if (slider) {
                slider.value = valeur;
                slider._markAsDirty?.();
            }

            if (texte) {
                const pourcentage = Math.round(valeur * 100);
                texte.metadata = texte.metadata || {};
                texte.metadata.texteDynamique = true;
                texte.text = afficherSigne && pourcentage > 0
                    ? `+${pourcentage}%`
                    : `${pourcentage}%`;
                texte.metadata.responsiveTexteOriginal = texte.text;
                delete texte.metadata.dernierTexteAutoFit;
                texte._markAsDirty?.();
            }
        });

        this.etatApplication?.gui?.advancedTexture?.markAsDirty?.();
    }

    afficherBoutonsOutilsSecondaires(afficher = true) {
        ["ContBtn", "TextuBtn", "LumBtn"].forEach((nom) => {
            const bouton = this.obtenirControle(nom);
            if (!bouton) return;
            bouton.isVisible = Boolean(afficher);
            bouton.isEnabled = Boolean(afficher);
            bouton.isHitTestVisible = Boolean(afficher);
            bouton._markAsDirty?.();
        });
    }

    obtenirHauteurBaseOutils({ inclureEspaceReglages = false } = {}) {
        const pile = this.obtenirControle("BotBtnStaPAn");
        const espacement = this.obtenirEspacementPile(pile, 12);

        // On part réellement des enfants de la pile afin que le rectangle Outils
        // suive les futures modifications de hauteur des boutons dans le GUI.
        const enfants = Array.isArray(pile?.children) ? pile.children : [];
        const enfantsFixes = enfants.filter((enfant) => {
            return enfant?.name !== "RegOptnRect" && enfant?.isVisible !== false;
        });
        const hauteurEnfants = enfantsFixes.reduce((somme, enfant) => {
            return somme + this.obtenirHauteurControle(enfant, 80);
        }, 0);

        const nbElements = enfantsFixes.length + (inclureEspaceReglages ? 1 : 0);
        const nbEspaces = Math.max(0, nbElements - 1);
        return hauteurEnfants + espacement * nbEspaces;
    }

    calculerHauteurReglagesDisponible() {
        const hauteurMaxOutils = this.obtenirHauteurMaxVoletPrincipal();
        const baseOutilsAvecReglages = this.obtenirHauteurBaseOutils({ inclureEspaceReglages: true });
        const disponible = Math.max(0, hauteurMaxOutils - baseOutilsAvecReglages);
        const naturelle = this.obtenirHauteurNaturelleReglages();

        // Ne jamais dépasser la hauteur naturelle du panneau. Si l'écran est
        // plus petit, les lignes du Grid se répartissent automatiquement dans
        // l'espace restant et l'auto-fit texte réduit seulement si nécessaire.
        return Math.max(0, Math.min(naturelle, disponible));
    }

    calculerHauteurOutils() {
        const reglages = this.obtenirControle("RegOptnRect");
        const reglagesOuverts = reglages?.metadata?.estOuvert === true;
        const base = this.obtenirHauteurBaseOutils({ inclureEspaceReglages: reglagesOuverts });
        const hauteurReglages = reglagesOuverts ? this.calculerHauteurReglagesDisponible() : 0;
        const max = this.obtenirHauteurMaxVoletPrincipal();
        return Math.max(0, Math.min(max, base + hauteurReglages));
    }

    calculerHauteurAccordeon(rect, hauteurDemandee = 0) {
        if (!rect) return Math.max(0, Number(hauteurDemandee) || 0);

        if (rect.name === "RegOptnRect") {
            this.ajusterLargeurPanneauReglages();
            return this.calculerHauteurReglagesDisponible();
        }

        if (rect.name === "OutiRect") {
            return this.calculerHauteurOutils();
        }

        const hauteur = Number(hauteurDemandee);
        return Number.isFinite(hauteur) && hauteur > 0
            ? hauteur
            : lireNombreDepuisValeurCss(rect.height, 0);
    }

    synchroniserHauteurOutils({ animer = true } = {}) {
        const outils = this.obtenirControle("OutiRect");
        if (!outils?.metadata?.estOuvert) return;

        const cible = this.calculerHauteurOutils();
        const depart = outils.metadata.hauteurActuelle
            || lireNombreDepuisValeurCss(outils.height, 0)
            || 0;

        outils.metadata.hauteurOuverte = cible;
        outils.metadata.hauteurActuelle = cible;

        if (animer) {
            this.animerHauteurRect(outils, depart, cible, this.obtenirDureePanneau(), () => {
                outils.height = `${cible}px`;
                outils._markAsDirty?.();
            });
        } else {
            outils.height = `${cible}px`;
            outils._markAsDirty?.();
        }
    }

    rafraichirHauteursDynamiques({ animer = false } = {}) {
        const reglages = this.obtenirControle("RegOptnRect");
        this.afficherBoutonsOutilsSecondaires(!(reglages?.metadata?.estOuvert === true));
        this.ajusterLargeurPanneauReglages();
        this.restaurerPositionBoutonReinitialiserReglages();

        if (reglages?.metadata?.estOuvert) {
            const cibleReglages = this.calculerHauteurReglagesDisponible();
            reglages.metadata.hauteurOuverte = cibleReglages;
            reglages.metadata.hauteurActuelle = cibleReglages;
            reglages.height = `${cibleReglages}px`;
            reglages._markAsDirty?.();
        }

        this.synchroniserHauteurOutils({ animer });
    }

    mettreAJourFlecheDropdown(texteFleche, estOuvert) {
        if (!texteFleche) return;
        texteFleche.text = estOuvert
            ? constantesInterface.flechesDropdown.ouvert
            : constantesInterface.flechesDropdown.ferme;
    }

    fermerTousPanneauxSecondaires(panneaux = []) {
        panneaux.forEach((panneau) => this.fermerPanneauSecondaire(panneau));
    }

    fermerTousAccordeons(dropdowns = []) {
        dropdowns.forEach(({ rect, fleche }) => this.fermerAccordeon(rect, fleche));
    }

    fermerTouteInterfaceActive({ dropdowns = [], panneaux = [] } = {}) {
        this.fermerTousAccordeons(dropdowns);
        this.fermerTousPanneauxSecondaires(panneaux);
    }

    relancerAutoFitApresDisposition({ delais = [0, 80, 180], attendrePolice = false } = {}) {
        const serviceResponsive = this.etatApplication?.services?.texteResponsive;
        const advancedTexture = this.etatApplication?.gui?.advancedTexture;

        if (!serviceResponsive || !advancedTexture) return;

        const ajusterApresDeuxFrames = () => {
            advancedTexture.markAsDirty?.();

            const ajuster = () => {
                advancedTexture.markAsDirty?.();
                serviceResponsive.ajuster?.();
            };

            if (typeof requestAnimationFrame === "function") {
                requestAnimationFrame(() => {
                    advancedTexture.markAsDirty?.();
                    requestAnimationFrame(ajuster);
                });
            } else {
                setTimeout(ajuster, 0);
            }
        };

        delais.forEach((delai) => {
            const valeur = Number(delai);
            if (!Number.isFinite(valeur) || valeur <= 0) {
                ajusterApresDeuxFrames();
            } else {
                setTimeout(ajusterApresDeuxFrames, valeur);
            }
        });

        if (attendrePolice && typeof document !== "undefined" && document.fonts) {
            const police = this.etatApplication?.interface?.parametres?.police ?? constantesInterface.policeDefaut;
            const promesses = [];

            if (typeof document.fonts.load === "function") {
                promesses.push(document.fonts.load(`32px "${police}"`));
            }

            if (document.fonts.ready) {
                promesses.push(document.fonts.ready);
            }

            Promise.allSettled(promesses).then(() => ajusterApresDeuxFrames());
        }
    }

    animerHauteurRect(rect, depart, arrivee, duree = 300, callbackFin = null) {
        this.animerNombre({
            depart,
            arrivee,
            duree,
            appliquer: (valeur) => {
                rect.height = `${valeur}px`;
            },
            callbackFin
        });
    }

    animerPourcentage(controle, propriete, depart, arrivee, duree = 450, callbackFin = null) {
        this.animerNombre({
            depart,
            arrivee,
            duree,
            appliquer: (valeur) => {
                controle[propriete] = `${valeur}%`;
            },
            callbackFin
        });
    }

    animerNombre({ depart, arrivee, duree, appliquer, callbackFin = null }) {
        if (!this.scene?.onBeforeRenderObservable) {
            appliquer(arrivee);
            if (callbackFin) callbackFin();
            return;
        }

        const debut = performance.now();
        let observateur = null;

        observateur = this.scene.onBeforeRenderObservable.add(() => {
            const temps = performance.now() - debut;
            const t = Math.min(temps / duree, 1);
            const progression = this.progressionDouce(t);
            const valeur = depart + (arrivee - depart) * progression;

            appliquer(valeur);

            if (t >= 1) {
                this.scene.onBeforeRenderObservable.remove(observateur);
                if (callbackFin) callbackFin();
            }
        });
    }

    animerAlpha(controle, depart, arrivee, duree = 300, callbackFin = null) {
        this.animerNombre({
            depart,
            arrivee,
            duree,
            appliquer: (valeur) => {
                controle.alpha = valeur;
            },
            callbackFin
        });
    }

    obtenirDureeMenu(etatApplication = null) {
        return etatApplication?.animation?.parametres?.dureeMenuLateral
            ?? this.etatApplication?.animation?.parametres?.dureeMenuLateral
            ?? 450;
    }

    obtenirDureePanneau() {
        return this.etatApplication?.animation?.parametres?.dureePanneauDeroulant
            ?? 300;
    }

    progressionDouce(t) {
        return t * t * (3 - 2 * t);
    }
}
