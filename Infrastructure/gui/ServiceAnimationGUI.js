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
    }

    basculerMenu({ etatApplication, menuRect, flecheRect, flecheText }) {
        // Le pliage/dépliage du menu principal garde son animation.
        // Les transitions entre panneaux secondaires restent instantanées.
        this.appliquerPositionMenu({ etatApplication, menuRect, flecheRect, flecheText, animer: true });
    }

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

        flecheText.text = menuOuvert ? fleches.ouvert : fleches.ferme;
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

        // Le rectangle d'onglet doit être miroir quand le menu passe à gauche,
        // mais le texte/flèche à l'intérieur doit rester lisible et non inversé.
        flecheRect.rotation = estAGauche
            ? flecheRect.metadata.rotationInitiale + Math.PI
            : flecheRect.metadata.rotationInitiale;

        if (Array.isArray(flecheRect.children)) {
            flecheRect.children.forEach((enfant) => {
                if (enfant?.name === "FlecheMenuBtn") {
                    enfant.rotation = estAGauche ? Math.PI : 0;
                }
            });
        }
    }

    initialiserAccordeons(dropdowns = []) {
        dropdowns.forEach(({ rect, fleche, hauteur }) => {
            if (!rect) return;

            rect.metadata = rect.metadata || {};
            rect.metadata.estOuvert = false;
            rect.metadata.hauteurOuverte = hauteur ?? lireNombreDepuisValeurCss(rect.height, 0);
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

        const hauteur = hauteurOuverte ?? rect.metadata?.hauteurOuverte ?? lireNombreDepuisValeurCss(rect.height, 0);
        const duree = this.obtenirDureePanneau();

        rect.isVisible = true;
        rect.metadata = rect.metadata || {};
        rect.metadata.estOuvert = true;

        const departHauteur = rect.metadata.hauteurActuelle || lireNombreDepuisValeurCss(rect.height, 0) || 0;
        const departAlpha = Number.isFinite(rect.alpha) ? rect.alpha : 0;

        this.animerHauteurRect(rect, departHauteur, hauteur, duree);
        this.animerAlpha(rect, departAlpha, 1, duree);
        rect.metadata.hauteurActuelle = hauteur;

        if (fleche) fleche.text = constantesInterface.flechesDropdown.ouvert;
    }

    fermerAccordeon(rect, fleche) {
        if (!rect) return;

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

    mettreAJourFlecheDropdown(texteFleche, estOuvert) {
        if (!texteFleche) return;
        texteFleche.text = estOuvert
            ? constantesInterface.flechesDropdown.ouvert
            : constantesInterface.flechesDropdown.ferme;
    }

    basculerSection({ section, controleSection, texteFleche, hauteurInitiale }) {
        if (!section || !controleSection) return;
        if (section.estOuvert) {
            this.ouvrirAccordeon(controleSection, texteFleche, lireNombreDepuisValeurCss(hauteurInitiale, hauteurInitiale));
        } else {
            this.fermerAccordeon(controleSection, texteFleche);
        }
    }

    masquerSectionsSuivantes() {
        // Conservé pour compatibilité avec le contrôleur existant.
    }

    afficherToutesLesSections() {
        // Conservé pour compatibilité avec le contrôleur existant.
    }

    fermerSectionGUI(controleSection, texteFleche = null) {
        this.fermerAccordeon(controleSection, texteFleche);
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
