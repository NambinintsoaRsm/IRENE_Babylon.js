/**
 * @file Contrôleur de présentation du panneau Accessibilité.
 *
 * Rôle : relier le bouton flottant, la fenêtre et la case d'activation au Use Case
 * ToggleAccessUC, puis synchroniser immédiatement l'état visuel de la GUI.
 *
 * Utilisation : main.js appelle brancherDepuisNomsGUI() après le chargement complet
 * de la GUI. Les préférences elles-mêmes restent gérées dans ToggleAccessUC.
 */
import { obtenirThemeInterface } from "../../Configuration/constantesInterface.js";

/**
 * Contrôleur du panneau Accessibilité.
 *
 * Le bouton flottant AccesBtn ne modifie pas directement les réglages :
 * il ouvre la fenêtre AccesRect. L'activation/désactivation se fait dans
 * la fenêtre via AccessCheckBtn.
 */
export class ControleurAccess {
    constructor({ etatApplication, toggleAccessUC }) {
        this.etatApplication = etatApplication;
        this.toggleAccessUC = toggleAccessUC;
        this.bouton = null;
        this.panneau = null;
        this.boutonRetour = null;
        this.caseBtn = null;
        this.caseTxt = null;
        this.texteBouton = null;
        this.titre = null;
        this.iconeBouton = null;
        this._dernierClicMs = 0;
        this._observateurThemeIcone = null;
        this._compteurSurveillanceIcone = 0;
        this._themeObserve = null;
    }

    brancherDepuisNomsGUI(noms = {}) {
        this.bouton = this.obtenir(noms.bouton)
            ?? this.obtenir("AccesBtn");

        this.texteBouton = this.obtenir(noms.texte)
            ?? this.obtenir("AccesBtnTxt")
            ?? this.trouverPremierTextBlock(this.bouton);

        this.panneau = this.obtenir(noms.panneau) ?? this.obtenir("AccesRect");
        this.boutonRetour = this.obtenir(noms.retour) ?? this.obtenir("AccesRetourBtn");
        this.caseBtn = this.obtenir(noms.caseBtn) ?? this.obtenir("AccessCheckBtn");
        this.caseTxt = this.obtenir(noms.caseTxt) ?? this.obtenir("AccessCheckBtnTxt") ?? this.trouverPremierTextBlock(this.caseBtn);
        this.titre = this.obtenir(noms.titre) ?? this.obtenir("AccesTitle");

        if (!this.bouton) {
            console.warn("[Accessibilité] Bouton introuvable. Nom attendu : AccesBtn.");
            return;
        }

        this.preparerBoutonIcone();
        this.preparerCaseActivation();
        this.preparerTitreAccessibilite();
        this.mettreAJourCase(this.etatApplication.accessibilite?.actif === true);
        this.installerSynchronisationCouleurDynamique();
        this.planifierAjustementTitreInitial();

        const ouvrir = () => this.ouvrirPanneauDepuisBouton();

        this.bouton.onPointerClickObservable?.clear?.();
        this.bouton.onPointerClickObservable?.add?.(ouvrir);

        // Sécurité : selon les contrôles superposés du GUI, certains navigateurs
        // déclenchent plus sûrement le pointerUp que le click sur les boutons ronds.
        this.bouton.onPointerUpObservable?.clear?.();
        this.bouton.onPointerUpObservable?.add?.(ouvrir);

        this.boutonRetour?.onPointerClickObservable?.clear?.();
        this.boutonRetour?.onPointerClickObservable?.add?.(() => {
            this.fermerPanneau();
        });

        this.caseBtn?.onPointerClickObservable?.clear?.();
        this.caseBtn?.onPointerClickObservable?.add?.(() => {
            const resultat = this.toggleAccessUC?.executer?.({ sauvegarderProfil: true });

            // La mise à jour doit être immédiate : sans cela, certains textes
            // ne reprenaient la taille accessibilité qu'après un rafraîchissement.
            this.synchroniserEtatVisuel();
            this.forcerRafraichissementTexteApresToggle();

            console.log("[Accessibilité]", resultat);
        });
    }

    preparerBoutonIcone() {
        if (!this.bouton || !globalThis.BABYLON?.GUI) return;

        this.bouton.metadata = {
            ...(this.bouton.metadata ?? {}),
            boutonAccessibilite: true
        };

        // On conserve la taille, la position et le fond définis par le GUI / thème.
        // Le code ajoute seulement le pictogramme dans le bouton existant.
        this.bouton.isPointerBlocker = true;
        this.bouton.isHitTestVisible = true;
        this.bouton.isEnabled = true;
        this.bouton.clipChildren = true;
        this.bouton.clipContent = true;
        this.bouton.paddingLeft = "0px";
        this.bouton.paddingRight = "0px";
        this.bouton.paddingTop = "0px";
        this.bouton.paddingBottom = "0px";
        this.bouton.cornerRadius = Math.max(
            Number(this.bouton.cornerRadius) || 0,
            50
        );

        if (this.texteBouton) {
            this.texteBouton.text = "";
            this.texteBouton.isVisible = false;
            this.texteBouton.isHitTestVisible = false;
            this.texteBouton.isPointerBlocker = false;
            this.texteBouton.metadata = {
                ...(this.texteBouton.metadata ?? {}),
                texteDynamique: false,
                nePasAutoFit: true
            };
            this.texteBouton._markAsDirty?.();
        }

        this.supprimerIconesBoutonExistantes(this.bouton, "AccesBtnIcon");

        this.couleurIconeCourante = this.couleurIconeAccessibilite();

        const icone = new BABYLON.GUI.Image(
            "AccesBtnIcon",
            this.creerDataUriIconeAccessibilite(this.couleurIconeCourante)
        );

        // Taille du pictogramme dans le bouton.
        // 85% garde le bonhomme grand sans couper les bras/jambes.
        icone.width = "85%";
        icone.height = "85%";
        icone.paddingLeft = "0px";
        icone.paddingRight = "0px";
        icone.paddingTop = "0px";
        icone.paddingBottom = "0px";
        icone.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
        icone.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        icone.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        icone.isHitTestVisible = false;
        icone.isPointerBlocker = false;
        icone.zIndex = 10;
        icone.metadata = {
            sourceBibliotheque: "Google Material Icons",
            icone: "accessibility_new",
            licence: "Apache-2.0"
        };

        this.bouton.addControl?.(icone);
        this.iconeBouton = icone;
        this.planifierSynchronisationCouleurIcone();

        this.bouton._markAsDirty?.();
        this.etatApplication.gui?.advancedTexture?.markAsDirty?.();
    }

    planifierSynchronisationCouleurIcone() {
        const appliquer = () => this.mettreAJourCouleurIcone();

        requestAnimationFrame(appliquer);
        setTimeout(appliquer, 80);
        setTimeout(appliquer, 180);
        setTimeout(appliquer, 350);
    }

    mettreAJourCouleurIcone({ forcer = false } = {}) {
        if (!this.iconeBouton) return false;

        const couleur = this.couleurIconeAccessibilite();

        if (!forcer && couleur === this.couleurIconeCourante) {
            return false;
        }

        this.couleurIconeCourante = couleur;
        this.iconeBouton.source = this.creerDataUriIconeAccessibilite(couleur);
        this.iconeBouton._markAsDirty?.();
        this.bouton?._markAsDirty?.();
        this.etatApplication.gui?.advancedTexture?.markAsDirty?.();
        return true;
    }

    couleurIconeAccessibilite() {
        // Priorité au fond réel du bouton, car c'est ce qui est visible à l'écran
        // après l'application du thème. Cela rend l'icône dynamique même si le
        // TextBlock du bouton est masqué ou garde une ancienne couleur.
        const fondBouton = this.normaliserCouleurFondOpaque(this.bouton?.background);

        if (fondBouton) {
            return this.couleurTexteLisible(fondBouton);
        }

        // Fallback : même logique que les textes de l'interface via le thème actif.
        const theme = obtenirThemeInterface(
            this.etatApplication?.interface?.parametres?.theme
        );

        const couleurTheme = this.normaliserCouleurSvg(
            theme?.boutonTexte
                || theme?.textePrincipal
        );

        if (couleurTheme) {
            return couleurTheme;
        }

        // Dernier recours : couleur réellement appliquée à un éventuel TextBlock.
        const couleurTexte = this.normaliserCouleurSvg(this.texteBouton?.color);

        return couleurTexte || "#000000";
    }

    installerSynchronisationCouleurDynamique() {
        this.brancherSynchronisationCouleurSurBoutonsTheme();
        this.installerSurveillanceThemeIcone();
        this.planifierSynchronisationCouleurIcone();
    }

    brancherSynchronisationCouleurSurBoutonsTheme() {
        const noms = [
            "BlancBtn",
            "NoirBtn",
            "GrisBtn",
            "GrisFoncBtn",
            "MenuReintBtn",
            "RegReintBtn"
        ];

        noms.forEach((nom) => {
            const bouton = this.obtenir(nom);
            if (!bouton || bouton.metadata?.syncIconeAccessibiliteInstalle) return;

            bouton.metadata = {
                ...(bouton.metadata ?? {}),
                syncIconeAccessibiliteInstalle: true
            };

            const synchroniser = () => this.planifierSynchronisationCouleurIcone();
            bouton.onPointerClickObservable?.add?.(synchroniser);
            bouton.onPointerUpObservable?.add?.(synchroniser);
        });
    }

    installerSurveillanceThemeIcone() {
        const sceneGUI = this.etatApplication?.scenes?.sceneGUI;
        const observable = sceneGUI?.onBeforeRenderObservable;

        if (!observable || this._observateurThemeIcone) {
            return;
        }

        this._themeObserve = this.cleEtatCouleurIcone();

        this._observateurThemeIcone = observable.add(() => {
            // Surveillance volontairement légère : un contrôle toutes les 8 frames.
            this._compteurSurveillanceIcone = (this._compteurSurveillanceIcone + 1) % 8;
            if (this._compteurSurveillanceIcone !== 0) return;

            const cle = this.cleEtatCouleurIcone();
            if (cle === this._themeObserve) return;

            this._themeObserve = cle;
            this.planifierSynchronisationCouleurIcone();
        });
    }

    cleEtatCouleurIcone() {
        const theme = this.etatApplication?.interface?.parametres?.theme ?? "";
        const fond = this.bouton?.background ?? "";
        const couleur = this.texteBouton?.color ?? "";
        return `${theme}|${fond}|${couleur}`;
    }

    creerDataUriIconeAccessibilite(couleur = "#000000") {
        const couleurSvg = this.normaliserCouleurSvg(couleur) || "#000000";

        // Icône Google Material Icons "accessibility_new".
        // Le SVG ne contient pas de fond : le bouton garde son apparence du GUI.
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24" role="img" aria-label="Accessibilite">
<path fill="${couleurSvg}" d="M12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm8.5 0c-2.76.8-5.69 1-8.5 1s-5.74-.2-8.5-1L3 8c2.04.59 4.16.91 6.31 1.06L9 22h2l.31-6h1.38L13 22h2l-.31-12.94C16.84 8.91 18.96 8.59 21 8l-.5-2z"/>
</svg>`;

        return `data:image/svg+xml;base64,${this.encoderBase64(svg)}`;
    }

    encoderBase64(texte) {
        const propre = String(texte ?? "").replace(/\s{2,}/g, " ").trim();

        if (typeof btoa === "function") {
            return btoa(propre);
        }

        if (typeof Buffer !== "undefined") {
            return Buffer.from(propre, "utf8").toString("base64");
        }

        return propre;
    }

    normaliserCouleurFondOpaque(couleur) {
        if (typeof couleur !== "string") return null;

        const texte = couleur.trim();
        if (!texte.startsWith("#")) return null;

        // #RGBA : dernier caractère = alpha.
        if (texte.length === 5) {
            const alpha = parseInt(texte[4] + texte[4], 16);
            if (!Number.isFinite(alpha) || alpha <= 8) return null;
        }

        // #RRGGBBAA : deux derniers caractères = alpha.
        if (texte.length >= 9) {
            const alpha = parseInt(texte.slice(7, 9), 16);
            if (!Number.isFinite(alpha) || alpha <= 8) return null;
        }

        return this.normaliserCouleurHex(texte);
    }

    normaliserCouleurSvg(couleur) {
        const hex = this.normaliserCouleurHex(couleur);

        if (!hex) return null;

        // Évite d'utiliser une couleur totalement transparente pour le pictogramme.
        const texte = String(couleur).trim();
        if (texte.length >= 9 && texte.slice(7, 9).toLowerCase() === "00") {
            return null;
        }

        return hex;
    }

    normaliserCouleurHex(couleur) {
        if (typeof couleur !== "string") return null;

        const texte = couleur.trim();
        if (!texte.startsWith("#")) return null;

        if (texte.length === 4) {
            const r = texte[1];
            const g = texte[2];
            const b = texte[3];
            return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
        }

        if (texte.length >= 7) {
            return texte.slice(0, 7).toUpperCase();
        }

        return null;
    }

    couleurTexteLisible(couleurFond) {
        const fond = this.normaliserCouleurHex(couleurFond);
        if (!fond) return "#000000";

        const r = parseInt(fond.slice(1, 3), 16) / 255;
        const g = parseInt(fond.slice(3, 5), 16) / 255;
        const b = parseInt(fond.slice(5, 7), 16) / 255;

        const luminance = 0.2126 * this.lineariserCanalCouleur(r)
            + 0.7152 * this.lineariserCanalCouleur(g)
            + 0.0722 * this.lineariserCanalCouleur(b);

        return luminance > 0.55 ? "#111111" : "#FFFFFF";
    }

    lineariserCanalCouleur(valeur) {
        return valeur <= 0.03928
            ? valeur / 12.92
            : Math.pow((valeur + 0.055) / 1.055, 2.4);
    }

    supprimerIconesBoutonExistantes(controle, nomIcone) {
        if (!controle || !Array.isArray(controle.children)) return;

        [...controle.children].forEach((enfant) => {
            const estIcone = enfant?.name === nomIcone
                || enfant?.metadata?.icone === "accessibility"
                || enfant?.metadata?.icone === "accessibility_new";

            if (estIcone && enfant.parent?.removeControl) {
                enfant.parent.removeControl(enfant);
            }
        });
    }

    preparerTitreAccessibilite() {
        if (!this.titre) return;

        this.titre.metadata = {
            ...(this.titre.metadata ?? {}),
            texteOriginal: "Accessibilité",
            responsiveTexteOriginal: "Accessibilité",
            titreAccessibilite: true,
            roleAccessibilite: "titre",
            roleTexte: "titre",
            // Ce titre est long et se trouve dans un panneau assez étroit : il
            // doit rester prioritaire, mais il doit surtout rentrer dans le cadre.
            lignesMaxAutoFit: 1,
            facteurMinAutoFit: 0.45,
            tailleMinAutoFitPx: 14
        };
        this.titre.text = "Accessibilité";
        this.titre.resizeToFit = false;
        this.titre.textWrapping = false;
        this.titre.clipContent = true;
        this.titre.lineSpacing = "0px";
        this.titre.characterSpacing = 0;
        this.titre._markAsDirty?.();
    }

    planifierAjustementTitreInitial() {
        if (!this.titre) return;
        this.planifierAjustementTitre();
    }

    planifierAjustementTitre() {
        if (!this.titre) return;
        this.etatApplication?.services?.texteResponsive?.planifierAjustement?.(40);
    }

    preparerCaseActivation() {
        if (!this.caseBtn) return;

        this.caseBtn.metadata = {
            ...(this.caseBtn.metadata ?? {}),
            boutonActivationAccessibilite: true
        };

        if (this.caseTxt) {
            this.caseTxt.metadata = {
                ...(this.caseTxt.metadata ?? {}),
                texteDynamique: true
            };
            this.caseTxt.isVisible = true;
            this.caseTxt.color = this.caseTxt.color || "#000000FF";
            this.caseTxt.fontWeight = "700";
        }
    }

    ouvrirPanneauDepuisBouton() {
        const maintenant = Date.now();

        // Évite un double appel quand click + pointerUp sont déclenchés ensemble.
        if (maintenant - this._dernierClicMs < 160) return;
        this._dernierClicMs = maintenant;

        this.ouvrirPanneau();
    }

    ouvrirPanneau() {
        if (!this.panneau) {
            console.warn("[Accessibilité] Panneau AccesRect introuvable.");
            return;
        }

        this.fermerPanneauxSecondairesSaufAccessibilite();

        this.panneau.isVisible = true;
        this.panneau.isEnabled = true;
        this.panneau.notRenderable = false;
        this.panneau.isHitTestVisible = true;
        this.panneau.isPointerBlocker = true;
        this.panneau.alpha = 1;
        this.panneau.zIndex = Math.max(Number(this.panneau.zIndex) || 0, 120);
        this.panneau._markAsDirty?.();
        this.etatApplication.gui?.advancedTexture?.markAsDirty?.();
        this.etatApplication.services?.texteResponsive?.planifierAjustement?.(80);
        this.planifierAjustementTitre();
    }

    fermerPanneau() {
        if (!this.panneau) return;

        // Important : on masque le panneau Accessibilité sans mettre durablement
        // l'interface en état désactivé. Les autres contrôleurs Babylon GUI
        // réutilisent les mêmes boutons/panneaux après fermeture.
        this.panneau.isVisible = false;
        this.panneau.alpha = 1;
        this.panneau.isPointerBlocker = true;
        this.panneau.isHitTestVisible = true;
        this.panneau._markAsDirty?.();
        this.etatApplication.gui?.advancedTexture?.markAsDirty?.();
    }

    fermerPanneauxSecondairesSaufAccessibilite() {
        const noms = [
            "PoliRect",
            "MenuRect",
            "ContoRect",
            "TextuRect",
            "LumRect",
            "ModelRect"
        ];

        noms.forEach((nom) => {
            const panneau = this.obtenir(nom);
            if (!panneau || panneau === this.panneau) return;

            // On ferme seulement visuellement. On ne désactive pas les contrôles,
            // sinon certains boutons de menu restent muets après avoir ouvert
            // puis fermé la fenêtre d'accessibilité.
            panneau.isVisible = false;
            panneau.alpha = 1;
            panneau.isPointerBlocker = true;
            panneau.isHitTestVisible = true;
            panneau._markAsDirty?.();
        });
    }

    mettreAJourCase(actif) {
        const bouton = this.caseBtn;
        const fond = actif
            ? this.couleurFondCheckboxActive()
            : this.couleurFondCheckboxInactive();
        const couleurTexte = this.couleurTexteLisible(fond);
        const theme = this.obtenirThemeActif();

        if (bouton) {
            bouton.metadata = {
                ...(bouton.metadata ?? {}),
                accessibiliteActif: Boolean(actif),
                checkboxActif: Boolean(actif),
                estOptionActive: Boolean(actif)
            };

            bouton.background = fond;
            bouton.color = actif
                ? fond
                : (theme?.boutonBordure || bouton.metadata?.colorOriginal || "#000000FF");
            bouton.thickness = actif
                ? Math.max(Number(bouton.metadata?.thicknessOriginal ?? bouton.thickness ?? 1), 2)
                : Math.max(Number(bouton.metadata?.thicknessOriginal ?? bouton.thickness ?? 1), 1);
            bouton._markAsDirty?.();
        }

        if (this.caseTxt) {
            this.caseTxt.metadata = {
                ...(this.caseTxt.metadata ?? {}),
                texteDynamique: true,
                nePasAutoFit: true,
                fontSizeOriginal: "30px"
            };

            this.caseTxt.text = actif ? "✓" : "";
            this.caseTxt.color = couleurTexte;
            this.caseTxt.fontWeight = "700";
            this.caseTxt.fontSize = "30px";
            this.caseTxt.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            this.caseTxt.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            this.caseTxt._markAsDirty?.();
        }

        this.etatApplication.gui?.advancedTexture?.markAsDirty?.();
    }

    obtenirThemeActif() {
        const themeActif = this.etatApplication.interface?.parametres?.theme;
        return obtenirThemeInterface(themeActif);
    }

    couleurFondCheckboxInactive() {
        const themeActif = String(this.etatApplication.interface?.parametres?.theme ?? "").toLowerCase();
        const theme = this.obtenirThemeActif();

        if (themeActif === "noir") {
            return "#000000FF";
        }

        if (themeActif === "gris-fonce" || themeActif.includes("fonce")) {
            return "#1A1A1AFF";
        }

        return this.normaliserCouleurOpaque(theme?.boutonFond) || "#FFFFFFFF";
    }

    couleurFondCheckboxActive() {
        const themeActif = String(this.etatApplication.interface?.parametres?.theme ?? "").toLowerCase();

        if (themeActif === "noir" || themeActif === "gris-fonce" || themeActif.includes("fonce")) {
            return "#FFFFFFFF";
        }

        return "#111111FF";
    }

    normaliserCouleurOpaque(couleur) {
        const hex = this.normaliserCouleurHex(couleur);
        return hex ? `${hex}FF` : null;
    }

    synchroniserEtatVisuel() {
        this.mettreAJourCase(this.etatApplication.accessibilite?.actif === true);
        this.mettreAJourCouleurIcone?.({ forcer: true });
        this.planifierAjustementTitreInitial();
    }

    forcerRafraichissementTexteApresToggle() {
        const serviceTexte = this.etatApplication?.services?.texteGUI;
        const serviceResponsive = this.etatApplication?.services?.texteResponsive;

        serviceTexte?.appliquerParametresTexte?.(this.etatApplication);
        serviceResponsive?.planifierAjustement?.(40);

        this.etatApplication.gui?.advancedTexture?.markAsDirty?.();
    }

    trouverPremierTextBlock(controle) {
        if (!controle) return null;
        if (controle instanceof BABYLON.GUI.TextBlock) return controle;
        if (controle.textBlock) return controle.textBlock;

        if (Array.isArray(controle.children)) {
            for (const enfant of controle.children) {
                const resultat = this.trouverPremierTextBlock(enfant);
                if (resultat) return resultat;
            }
        }

        return null;
    }

    trouverEnfantParNom(controle, nom) {
        if (!controle || !nom) return null;
        if (controle.name === nom) return controle;

        if (Array.isArray(controle.children)) {
            for (const enfant of controle.children) {
                const resultat = this.trouverEnfantParNom(enfant, nom);
                if (resultat) return resultat;
            }
        }

        return null;
    }

    obtenir(nom) {
        if (!nom) return null;

        const controles = this.etatApplication.gui?.controles ?? {};
        if (controles[nom]) return controles[nom];

        const controle = this.etatApplication.gui?.advancedTexture?.getControlByName?.(nom) ?? null;
        if (controle) {
            controles[nom] = controle;
        }

        return controle;
    }
}
