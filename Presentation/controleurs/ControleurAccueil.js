import { constantesAccueil } from "../../Configuration/constantesAccueil.js";
import { constantesInterface } from "../../Configuration/constantesInterface.js";

/**
 * Gère l'écran d'accueil ANNA chargé depuis guiTexture_acc.json.
 *
 * L'accueil utilise sa propre AdvancedDynamicTexture : il ne dépend donc plus
 * des contrôles de guiTexture.json. À sa fermeture, sa texture est détruite et
 * l'interface principale reste seule affichée.
 */
export class ControleurAccueil {
    constructor({
        etatApplication,
        serviceBlocagePointeurGUI,
        advancedTexture = null,
        configuration = constantesAccueil,
        policeAccueil = constantesInterface.policeDefaut
    } = {}) {
        this.etatApplication = etatApplication;
        this.serviceBlocagePointeurGUI = serviceBlocagePointeurGUI;
        this.configuration = configuration;
        this.policeAccueil = policeAccueil || "Luciole";
        this.advancedTexture = advancedTexture;

        this.panneauAccueil = null;
        this.boutonFermer = null;
        this.boutonNePlusAfficher = null;
        this.texteNePlusAfficher = null;
        this.iconeCoche = null;
        this.nePlusAfficher = false;
        this.estOuvert = false;
        this.gestionnaireClavier = null;
        this.detruit = false;
    }

    /**
     * Permet à main.js de savoir s'il faut charger guiTexture_acc.json.
     * La clé localStorage reste identique à l'ancien mécanisme.
     */
    static doitAfficherAuDemarrage(configuration = constantesAccueil) {
        try {
            return globalThis.localStorage?.getItem?.(
                configuration.cleNePlusAfficher
            ) !== "true";
        } catch {
            return true;
        }
    }

    installer() {
        this.advancedTexture = this.advancedTexture
            ?? this.etatApplication?.gui?.advancedTextureAccueil
            ?? null;

        if (!this.advancedTexture || !globalThis.BABYLON?.GUI) return false;

        // L'accueil doit utiliser la même police par défaut que l'interface ANNA.
        // La valeur vient de constantesInterface.policeDefaut : pour changer la
        // police par défaut plus tard, un seul endroit reste à modifier.
        this.appliquerPoliceAccueil();

        // BackMainRect couvre réellement tout l'écran dans le nouveau JSON.
        // AccRect reste un secours si une future version retire BackMainRect.
        this.panneauAccueil = this.obtenir("BackMainRect")
            ?? this.obtenir("AccRect")
            ?? this.advancedTexture.rootContainer
            ?? null;

        if (!this.panneauAccueil) return false;

        this.boutonFermer = this.obtenir("AccFermBtn");
        this.boutonNePlusAfficher = this.obtenir("AccBotCheckBtn");
        this.texteNePlusAfficher = this.obtenir("AccBotAffTxt")
            ?? this.obtenir("AccBotTxt");

        this.preparerBoutonFermeture();
        this.injecterIcones();
        this.brancherActions();
        this.installerBlocageClavier();

        this.nePlusAfficher = this.lirePreferenceNePlusAfficher();
        this.mettreAJourCoche();

        // Sécurité : si la préférence a changé entre le test de main.js et
        // l'installation du contrôleur, l'accueil est immédiatement supprimé.
        if (this.nePlusAfficher) {
            this.masquerAuDemarrage();
        } else {
            this.ouvrir();
        }

        return true;
    }

    obtenir(nom) {
        return this.advancedTexture?.getControlByName?.(nom) ?? null;
    }

    /**
     * Applique immédiatement la police par défaut à tous les TextBlock de
     * guiTexture_acc.json. On ne dépend pas d'un fontFamily écrit dans le JSON,
     * ce qui permet de continuer à modifier l'accueil avec le Babylon GUI Editor.
     *
     * La police est chargée par main.js avant le chargement des interfaces ;
     * ce passage sert donc uniquement à affecter Luciole aux contrôles Babylon.
     */
    appliquerPoliceAccueil() {
        const racine = this.advancedTexture?.rootContainer;
        if (!racine || !globalThis.BABYLON?.GUI) return;

        const police = String(this.policeAccueil || "Luciole").trim() || "Luciole";

        const parcourir = (controle) => {
            if (!controle) return;

            const estTexte = controle instanceof BABYLON.GUI.TextBlock
                || controle?.className === "TextBlock";

            if (estTexte) {
                controle.fontFamily = police;
                controle._markAsDirty?.();
            }

            const enfants = Array.isArray(controle.children)
                ? controle.children
                : (Array.isArray(controle._children) ? controle._children : []);

            enfants.forEach(parcourir);
        };

        parcourir(racine);
        this.advancedTexture.markAsDirty?.();
    }

    preparerBoutonFermeture() {
        const bouton = this.boutonFermer;
        const texte = this.obtenir("AccFermBtnTxt");
        if (!bouton || !texte) return;

        // Le bouton d'accueil est maintenant autonome : son apparence vient du
        // guiTexture_acc.json et non plus du bouton FermBtn de guiTexture.json.
        texte.isVisible = true;
        texte.isHitTestVisible = false;
        texte.isPointerBlocker = false;
        texte.text = "X";
        texte.fontWeight = "700";
        texte.fontSize = "63%";
        texte.color = bouton.color || "#000000";
        texte.outlineWidth = Math.max(Number(texte.outlineWidth) || 0, 1);
        texte.outlineColor = texte.color;
        texte.metadata = {
            ...(texte.metadata ?? {}),
            texteDynamique: false,
            nePasModifierTailleTexte: true,
            nePasAccessibilite: true,
            nePasAutoFit: true
        };

        texte._markAsDirty?.();
        bouton._markAsDirty?.();
    }

    injecterIcones() {
        this.injecterIconeDansControle({
            parentNom: "Icon1Rect",
            nomIcone: "AccueilIconeModele",
            type: "document",
            taille: this.configuration.tailleIconePrincipale
        });

        this.injecterIconeDansControle({
            parentNom: "IconRect2",
            nomIcone: "AccueilIconeConfigurations",
            type: "engrenage",
            taille: this.configuration.tailleIconePrincipale
        });

        this.injecterIconeDansControle({
            parentNom: "IconRect3",
            nomIcone: "AccueilIconeOutils",
            type: "outil",
            taille: this.configuration.tailleIconePrincipale
        });

        this.injecterIconeDansControle({
            parentNom: "AccBotCheckBtn",
            nomIcone: "AccueilIconeCoche",
            type: "coche",
            taille: this.configuration.tailleIconeCoche
        });

        this.iconeCoche = this.trouverEnfantParNom(
            this.boutonNePlusAfficher,
            "AccueilIconeCoche"
        );
    }

    injecterIconeDansControle({ parentNom, nomIcone, type, taille }) {
        const parent = this.obtenir(parentNom);
        if (!parent) return null;

        this.masquerTextesVides(parent);

        const existante = this.trouverEnfantParNom(parent, nomIcone);
        if (existante) return existante;

        const couleur = this.couleurIcone(parent);
        const source = this.creerDataUriPng(type, couleur);
        if (!source) return null;

        const image = new BABYLON.GUI.Image(nomIcone, source);
        image.width = taille;
        image.height = taille;
        image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
        image.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        image.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        image.isHitTestVisible = false;
        image.isPointerBlocker = false;
        image.zIndex = 20;
        image.metadata = {
            ...(image.metadata ?? {}),
            iconeAccueil: true,
            nePasAutoFit: true
        };

        parent.addControl?.(image);
        parent._markAsDirty?.();
        return image;
    }

    masquerTextesVides(parent) {
        const enfants = Array.isArray(parent?.children)
            ? parent.children
            : (Array.isArray(parent?._children) ? parent._children : []);

        enfants.forEach((enfant) => {
            const estTexte = enfant instanceof BABYLON.GUI.TextBlock
                || enfant?.className === "TextBlock";

            if (!estTexte || String(enfant.text ?? "").trim() !== "") return;

            enfant.isVisible = false;
            enfant.isHitTestVisible = false;
            enfant.isPointerBlocker = false;
            enfant.metadata = {
                ...(enfant.metadata ?? {}),
                nePasAutoFit: true,
                texteDynamique: false
            };
            enfant._markAsDirty?.();
        });
    }

    trouverEnfantParNom(parent, nom) {
        if (!parent) return null;
        const enfants = Array.isArray(parent.children)
            ? parent.children
            : (Array.isArray(parent._children) ? parent._children : []);

        for (const enfant of enfants) {
            if (enfant?.name === nom) return enfant;
            const imbrique = this.trouverEnfantParNom(enfant, nom);
            if (imbrique) return imbrique;
        }

        return null;
    }

    brancherActions() {
        if (this.boutonFermer) {
            this.boutonFermer.isPointerBlocker = true;
            this.boutonFermer.onPointerClickObservable?.clear?.();
            this.boutonFermer.onPointerClickObservable?.add?.(() => this.fermer());
        }

        const basculerPreference = () => this.basculerNePlusAfficher();

        if (this.boutonNePlusAfficher) {
            this.boutonNePlusAfficher.isPointerBlocker = true;
            this.boutonNePlusAfficher.onPointerClickObservable?.clear?.();
            this.boutonNePlusAfficher.onPointerClickObservable?.add?.(basculerPreference);
        }

        if (this.texteNePlusAfficher) {
            this.texteNePlusAfficher.isHitTestVisible = true;
            this.texteNePlusAfficher.isPointerBlocker = true;
            this.texteNePlusAfficher.onPointerClickObservable?.clear?.();
            this.texteNePlusAfficher.onPointerClickObservable?.add?.(basculerPreference);
        }
    }

    ouvrir() {
        if (!this.advancedTexture || !this.panneauAccueil) return;

        this.estOuvert = true;
        this.definirEtatAccueilOuvert(true);
        this.definirInteractionInterfacePrincipale(false);

        const racine = this.advancedTexture.rootContainer;
        if (racine) {
            racine.isVisible = true;
            racine.isEnabled = true;
            racine.isHitTestVisible = true;
        }

        this.panneauAccueil.isVisible = true;
        this.panneauAccueil.isEnabled = true;
        this.panneauAccueil.isHitTestVisible = true;
        this.panneauAccueil.isPointerBlocker = true;

        this.serviceBlocagePointeurGUI?.definirVerrouForce?.(true);
        this.mettreAJourCoche();
        this.marquerGUI();
    }

    fermer() {
        if (!this.advancedTexture || this.detruit) return;

        this.estOuvert = false;
        this.definirEtatAccueilOuvert(false);
        this.definirInteractionInterfacePrincipale(true);
        this.serviceBlocagePointeurGUI?.definirVerrouForce?.(false);

        const racine = this.advancedTexture.rootContainer;
        if (racine) {
            racine.isVisible = false;
            racine.isEnabled = false;
            racine.isHitTestVisible = false;
        }

        this.restaurerIndicateurChargementAuPremierPlan();
        this.marquerGUI();

        // On détruit la texture dans une micro-tâche pour laisser l'événement de
        // clic Babylon se terminer proprement avant de supprimer son GUI source.
        queueMicrotask(() => this.detruire({ disposerTexture: true }));
    }

    masquerAuDemarrage() {
        this.estOuvert = false;
        this.definirEtatAccueilOuvert(false);
        this.definirInteractionInterfacePrincipale(true);
        this.serviceBlocagePointeurGUI?.definirVerrouForce?.(false);

        const racine = this.advancedTexture?.rootContainer;
        if (racine) {
            racine.isVisible = false;
            racine.isEnabled = false;
            racine.isHitTestVisible = false;
        }

        this.restaurerIndicateurChargementAuPremierPlan();
        queueMicrotask(() => this.detruire({ disposerTexture: true }));
    }

    definirInteractionInterfacePrincipale(active) {
        const racinePrincipale = this.etatApplication?.gui?.advancedTexture?.rootContainer;
        if (!racinePrincipale) return;

        // L'interface principale reste rendue derrière le fond gris de l'accueil
        // afin de conserver ses mesures Babylon, mais elle ne reçoit aucun clic.
        racinePrincipale.isEnabled = Boolean(active);
        racinePrincipale.isHitTestVisible = Boolean(active);
        racinePrincipale._markAsDirty?.();
    }

    definirEtatAccueilOuvert(ouvert) {
        if (this.etatApplication?.interface) {
            this.etatApplication.interface.accueilOuvert = Boolean(ouvert);
        }

        if (ouvert) {
            this.placerIndicateurChargementDerriereAccueil();
        } else {
            this.restaurerIndicateurChargementAuPremierPlan();
        }
    }

    placerIndicateurChargementDerriereAccueil() {
        if (typeof document === "undefined") return;

        const indicateur = document.getElementById("anna-indicateur-chargement-modele");
        if (!indicateur) return;

        if (!indicateur.dataset.annaZIndexNormal) {
            indicateur.dataset.annaZIndexNormal = indicateur.style.zIndex || "9000";
        }

        indicateur.style.zIndex = "-1";
        indicateur.setAttribute("aria-hidden", "true");
    }

    restaurerIndicateurChargementAuPremierPlan() {
        if (typeof document === "undefined") return;

        const indicateur = document.getElementById("anna-indicateur-chargement-modele");
        if (!indicateur) return;

        indicateur.style.zIndex = indicateur.dataset.annaZIndexNormal || "9000";

        const actif = indicateur.dataset?.annaChargementActif === "true";
        if (actif) {
            indicateur.style.display = "flex";
            indicateur.style.visibility = "visible";
            indicateur.style.opacity = "0.96";
            indicateur.setAttribute("aria-hidden", "false");
        }
    }

    basculerNePlusAfficher() {
        this.nePlusAfficher = !this.nePlusAfficher;
        this.ecrirePreferenceNePlusAfficher(this.nePlusAfficher);
        this.mettreAJourCoche();
    }

    mettreAJourCoche() {
        if (!this.iconeCoche) {
            this.iconeCoche = this.trouverEnfantParNom(
                this.boutonNePlusAfficher,
                "AccueilIconeCoche"
            );
        }

        if (this.iconeCoche) {
            this.iconeCoche.isVisible = Boolean(this.nePlusAfficher);
            this.iconeCoche._markAsDirty?.();
        }

        if (this.boutonNePlusAfficher) {
            this.boutonNePlusAfficher.metadata = {
                ...(this.boutonNePlusAfficher.metadata ?? {}),
                coche: Boolean(this.nePlusAfficher)
            };
            this.boutonNePlusAfficher._markAsDirty?.();
        }

        this.marquerGUI();
    }

    lirePreferenceNePlusAfficher() {
        try {
            return globalThis.localStorage?.getItem?.(
                this.configuration.cleNePlusAfficher
            ) === "true";
        } catch {
            return false;
        }
    }

    ecrirePreferenceNePlusAfficher(valeur) {
        try {
            globalThis.localStorage?.setItem?.(
                this.configuration.cleNePlusAfficher,
                valeur ? "true" : "false"
            );
        } catch {
            // L'accueil reste fonctionnel même si le stockage local est indisponible.
        }
    }

    installerBlocageClavier() {
        if (this.gestionnaireClavier || typeof window === "undefined") return;

        this.gestionnaireClavier = (evenement) => {
            if (!this.estOuvert) return;

            if (evenement.code === "Space" || evenement.key === " ") {
                evenement.preventDefault?.();
                evenement.stopImmediatePropagation?.();
            }
        };

        window.addEventListener("keydown", this.gestionnaireClavier, true);
    }

    detruire({ disposerTexture = false } = {}) {
        if (this.detruit && !disposerTexture) return;

        if (this.gestionnaireClavier && typeof window !== "undefined") {
            window.removeEventListener("keydown", this.gestionnaireClavier, true);
            this.gestionnaireClavier = null;
        }

        this.estOuvert = false;
        this.serviceBlocagePointeurGUI?.definirVerrouForce?.(false);
        this.definirInteractionInterfacePrincipale(true);

        if (disposerTexture && this.advancedTexture) {
            const texture = this.advancedTexture;
            this.advancedTexture = null;

            if (this.etatApplication?.gui?.advancedTextureAccueil === texture) {
                this.etatApplication.gui.advancedTextureAccueil = null;
            }

            texture.dispose?.();
        }

        this.detruit = true;
    }

    couleurIcone(parent) {
        const couleurTexte = this.normaliserCouleur(
            this.obtenir("AccTopTxt")?.color
        );
        if (couleurTexte) return couleurTexte;

        const couleurParent = this.normaliserCouleur(parent?.color);
        return couleurParent || "#000000";
    }

    normaliserCouleur(couleur) {
        if (typeof couleur !== "string") return null;
        const texte = couleur.trim();
        if (!texte.startsWith("#")) return null;

        if (texte.length === 4) {
            return `#${texte[1]}${texte[1]}${texte[2]}${texte[2]}${texte[3]}${texte[3]}`;
        }

        if (texte.length >= 7) return texte.slice(0, 7);
        return null;
    }

    creerDataUriPng(type, couleur = "#000000") {
        if (!globalThis.document?.createElement) return null;

        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.clearRect(0, 0, 128, 128);
        ctx.strokeStyle = couleur;
        ctx.fillStyle = couleur;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (type === "document") this.dessinerDocument(ctx);
        if (type === "engrenage") this.dessinerEngrenage(ctx);
        if (type === "outil") this.dessinerOutil(ctx);
        if (type === "coche") this.dessinerCoche(ctx);

        return canvas.toDataURL("image/png");
    }

    dessinerDocument(ctx) {
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(34, 18);
        ctx.lineTo(76, 18);
        ctx.lineTo(98, 40);
        ctx.lineTo(98, 110);
        ctx.lineTo(34, 110);
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(76, 18);
        ctx.lineTo(76, 40);
        ctx.lineTo(98, 40);
        ctx.stroke();
    }

    dessinerEngrenage(ctx) {
        const cx = 64;
        const cy = 64;
        const dents = 8;
        const rayonCreux = 37;
        const rayonDent = 52;
        const demiDent = Math.PI / 18;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.lineWidth = 7;

        ctx.beginPath();
        for (let i = 0; i < dents; i += 1) {
            const centre = (Math.PI * 2 * i) / dents - Math.PI / 2;
            const angles = [
                centre - Math.PI / 8,
                centre - demiDent,
                centre + demiDent,
                centre + Math.PI / 8
            ];
            const rayons = [rayonCreux, rayonDent, rayonDent, rayonCreux];

            angles.forEach((angle, index) => {
                const x = Math.cos(angle) * rayons[index];
                const y = Math.sin(angle) * rayons[index];
                if (i === 0 && index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
        }
        ctx.closePath();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    dessinerOutil(ctx) {
        ctx.save();
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(34, 99);
        ctx.lineTo(76, 57);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(29, 104, 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(74, 58);
        ctx.bezierCurveTo(68, 48, 70, 36, 78, 28);
        ctx.bezierCurveTo(86, 20, 97, 18, 106, 23);
        ctx.lineTo(92, 37);
        ctx.lineTo(101, 46);
        ctx.lineTo(115, 32);
        ctx.bezierCurveTo(118, 43, 114, 55, 106, 63);
        ctx.bezierCurveTo(97, 72, 84, 72, 74, 58);
        ctx.stroke();

        ctx.restore();
    }

    dessinerCoche(ctx) {
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(25, 67);
        ctx.lineTo(52, 92);
        ctx.lineTo(103, 35);
        ctx.stroke();
    }

    marquerGUI() {
        this.panneauAccueil?._markAsDirty?.();
        this.advancedTexture?.markAsDirty?.();
    }
}
