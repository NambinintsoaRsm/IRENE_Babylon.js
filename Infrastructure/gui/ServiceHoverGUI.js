/**
 * Effet de survol léger sur les menus déroulants.
 * Seul le fond est modulé ; les couleurs de texte et les bordures restent
 * sous la responsabilité du service de thème.
 */
import { configurationHoverGUI } from "../../Configuration/configurationHoverGUI.js";

const limiter = (valeur, min, max) => Math.max(min, Math.min(max, valeur));

function decoderCouleurHex(couleur) {
    if (typeof couleur !== "string") return null;
    const hex = couleur.trim().replace(/^#/, "");
    if (!/^(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) return null;
    return {
        rouge: parseInt(hex.slice(0, 2), 16),
        vert: parseInt(hex.slice(2, 4), 16),
        bleu: parseInt(hex.slice(4, 6), 16),
        alpha: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : null
    };
}

function couleurHex({ rouge, vert, bleu, alpha }) {
    const canal = (valeur) => Math.round(limiter(valeur, 0, 255)).toString(16).padStart(2, "0").toUpperCase();
    return `#${canal(rouge)}${canal(vert)}${canal(bleu)}${alpha === null ? "" : canal(alpha)}`;
}

function interpolerCouleurs(depart, arrivee, progression) {
    return couleurHex({
        rouge: depart.rouge + (arrivee.rouge - depart.rouge) * progression,
        vert: depart.vert + (arrivee.vert - depart.vert) * progression,
        bleu: depart.bleu + (arrivee.bleu - depart.bleu) * progression,
        alpha: depart.alpha
    });
}

/** Préserve la teinte du thème et module légèrement sa luminosité. */
function couleurDeSurvol(couleur, intensite) {
    const original = decoderCouleurHex(couleur);
    if (!original) return null;
    const force = limiter(Number(intensite) || 0, 0, 1);
    const luminosite = (0.2126 * original.rouge) + (0.7152 * original.vert) + (0.0722 * original.bleu);
    const destination = luminosite < 128 ? 255 : 0;
    return couleurHex({
        rouge: original.rouge + (destination - original.rouge) * force,
        vert: original.vert + (destination - original.vert) * force,
        bleu: original.bleu + (destination - original.bleu) * force,
        alpha: original.alpha
    });
}

export class ServiceHoverGUI {
    constructor(etatApplication, serviceStyleInterfaceGUI) {
        this.etatApplication = etatApplication;
        this.serviceStyleInterfaceGUI = serviceStyleInterfaceGUI;
        this.controlesBranches = new Set();
        this.controlesSurvoles = new Map();
        this.animations = new Map();
        this.positionPointeur = null;
        this.suiviPointeurBranche = false;
    }

    /**
     * Le pointer-out Babylon peut manquer lorsqu'un panneau est masqué ou
     * déplacé sous la souris. On contrôle donc aussi la position effective.
     */
    brancherSuiviPointeur() {
        if (this.suiviPointeurBranche || typeof document === "undefined") return;
        this.suiviPointeurBranche = true;
        document.addEventListener("pointermove", (evenement) => {
            this.positionPointeur = { x: evenement.clientX, y: evenement.clientY };
            this.nettoyerSurvolsObsoletes();
        }, { passive: true });
        document.addEventListener("pointerleave", () => {
            this.positionPointeur = null;
            this.reinitialiserSurvols();
        });
        window.addEventListener("blur", () => {
            this.positionPointeur = null;
            this.reinitialiserSurvols();
        });
    }

    estVisibleDansHierarchie(controle) {
        for (let parent = controle; parent; parent = parent.parent) {
            if (parent.isVisible === false || parent.notRenderable === true) return false;
        }
        return true;
    }

    /** Compare les coordonnées DOM avec le rectangle calculé par Babylon GUI. */
    contientPointeur(bouton) {
        if (!this.positionPointeur || !this.estVisibleDansHierarchie(bouton)) return false;
        const texture = this.etatApplication?.gui?.advancedTexture;
        const canvas = texture?.getScene?.()?.getEngine?.()?.getRenderingCanvas?.();
        const mesure = bouton._currentMeasure;
        const rect = canvas?.getBoundingClientRect?.();
        const taille = texture?.getSize?.();
        if (!mesure || !rect || !rect.width || !rect.height || !taille?.width || !taille?.height) {
            // Si les mesures ne sont pas disponibles, ne pas supprimer un vrai hover.
            return true;
        }
        const x = (this.positionPointeur.x - rect.left) * taille.width / rect.width;
        const y = (this.positionPointeur.y - rect.top) * taille.height / rect.height;
        return x >= mesure.left && x <= mesure.left + mesure.width
            && y >= mesure.top && y <= mesure.top + mesure.height;
    }

    nettoyerSurvolsObsoletes() {
        for (const bouton of [...this.controlesSurvoles.keys()]) {
            if (!this.contientPointeur(bouton)) this.quitter(bouton);
        }
    }

    reinitialiserSurvols() {
        for (const bouton of [...this.controlesSurvoles.keys()]) this.quitter(bouton);
    }

    /** Retire immédiatement les anciens survols d'une liste reconstruite. */
    reinitialiserSurvolsDans(conteneur) {
        if (!conteneur) return;
        const estDescendant = (bouton) => {
            for (let courant = bouton; courant; courant = courant.parent) {
                if (courant === conteneur) return true;
            }
            return false;
        };
        for (const [bouton, fondAvantSurvol] of [...this.controlesSurvoles]) {
            if (!estDescendant(bouton)) continue;
            this.annulerAnimation(bouton);
            this.controlesSurvoles.delete(bouton);
            bouton.background = fondAvantSurvol;
            bouton._markAsDirty?.();
        }
    }

    brancherBouton(bouton) {
        if (!configurationHoverGUI.actif || !configurationHoverGUI.dropdowns.actif) return;
        if (!(bouton instanceof BABYLON.GUI.Button)) return;
        if (configurationHoverGUI.dropdowns.nomsExclus.includes(bouton.name)) return;
        if (this.serviceStyleInterfaceGUI.estBoutonAvecCouleurPropre(bouton)) return;
        if (this.controlesBranches.has(bouton)) return;
        this.controlesBranches.add(bouton);
        this.brancherSuiviPointeur();
        bouton.onPointerEnterObservable.add(() => this.survoler(bouton));
        bouton.onPointerOutObservable.add(() => this.quitter(bouton));
    }

    brancherDropdowns(dropdowns = []) {
        for (const { bouton, rect } of dropdowns) {
            this.brancherBouton(bouton);
            if (!rect) continue;
            const visiter = (controle) => {
                if (controle instanceof BABYLON.GUI.Button) this.brancherBouton(controle);
                for (const enfant of controle.children ?? []) visiter(enfant);
            };
            visiter(rect);
        }
    }

    annulerAnimation(bouton) {
        const animation = this.animations.get(bouton);
        if (animation !== undefined && typeof cancelAnimationFrame === "function") {
            cancelAnimationFrame(animation);
        }
        this.animations.delete(bouton);
    }

    changerFond(bouton, couleurCible) {
        this.annulerAnimation(bouton);
        const debut = decoderCouleurHex(bouton.background);
        const fin = decoderCouleurHex(couleurCible);
        const duree = Math.max(0, Number(configurationHoverGUI.dropdowns.dureeTransitionMs) || 0);
        if (!debut || !fin || !duree || typeof requestAnimationFrame !== "function") {
            bouton.background = couleurCible;
            bouton._markAsDirty?.();
            return;
        }
        let instantDepart = null;
        const etape = (instant) => {
            if (instantDepart === null) instantDepart = instant;
            const progression = limiter((instant - instantDepart) / duree, 0, 1);
            bouton.background = progression >= 1 ? couleurCible : interpolerCouleurs(debut, fin, progression);
            bouton._markAsDirty?.();
            if (progression < 1) {
                this.animations.set(bouton, requestAnimationFrame(etape));
            } else {
                this.animations.delete(bouton);
            }
        };
        this.animations.set(bouton, requestAnimationFrame(etape));
    }

    survoler(bouton) {
        if (!this.estVisibleDansHierarchie(bouton)) return;
        if (this.controlesSurvoles.has(bouton)) return;
        const fond = bouton.background;
        const variante = couleurDeSurvol(fond, configurationHoverGUI.dropdowns.intensite);
        if (!variante) return;
        this.controlesSurvoles.set(bouton, fond);
        this.changerFond(bouton, variante);
    }

    quitter(bouton) {
        if (!this.controlesSurvoles.has(bouton)) return;
        const fond = this.controlesSurvoles.get(bouton);
        this.controlesSurvoles.delete(bouton);
        this.changerFond(bouton, fond);
    }

    /** Le thème a déjà appliqué ses nouveaux fonds. Ne pas réutiliser l'ancien. */
    apresApplicationTheme() {
        for (const bouton of [...this.controlesSurvoles.keys()]) {
            this.annulerAnimation(bouton);
            const fondDuTheme = bouton.background;
            if (!this.contientPointeur(bouton)) {
                // Le fond courant vient du thème, pas de l'ancien survol.
                this.controlesSurvoles.delete(bouton);
                continue;
            }
            this.controlesSurvoles.set(bouton, fondDuTheme);
            const variante = couleurDeSurvol(fondDuTheme, configurationHoverGUI.dropdowns.intensite);
            if (variante) this.changerFond(bouton, variante);
        }
    }
}
