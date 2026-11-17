import { constantesInterface } from "../../Configuration/constantesInterface.js";

/**
 * Centre optiquement les glyphes visibles à l'intérieur des boutons Babylon GUI.
 * La position initiale du JSON reste intacte dans metadata ; ni la taille de police,
 * ni l'AutoFit, ni les dimensions des contrôles ne sont modifiés.
 *
 * Cette correction passe après l'AutoFit et se recalcule à chaque changement de police,
 * de taille, de texte, de résolution et après le chargement des polices web.
 */
export class ServiceCentreTxtBtnsGUI {
    constructor() {
        this.advancedTexture = null;
        this.canvas = null;
        this.contexte = null;
        this.timer = null;
        this.resizeInstalle = false;
        this.policesObservees = false;
        this.nomsFleches = new Set(constantesInterface.flechesNavigation?.noms ?? []);
    }

    installer(advancedTexture) {
        this.advancedTexture = advancedTexture;
        if (!this.resizeInstalle && typeof window !== "undefined") {
            window.addEventListener("resize", () => this.planifierCentrage(80), { passive: true });
            this.resizeInstalle = true;
        }
        if (!this.policesObservees && typeof document !== "undefined" && document.fonts) {
            document.fonts.ready.then(() => this.planifierCentrage(0)).catch(() => {});
            document.fonts.addEventListener?.("loadingdone", () => this.planifierCentrage(0));
            this.policesObservees = true;
        }
        this.planifierCentrage();
    }

    planifierCentrage(delai = 0) {
        if (!this.advancedTexture) return;
        if (this.timer !== null) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.timer = null;
            const executer = () => this.appliquerCentrage();
            if (typeof requestAnimationFrame === "function") {
                requestAnimationFrame(() => requestAnimationFrame(executer));
            } else {
                executer();
            }
        }, Math.max(0, Number(delai) || 0));
    }

    appliquerCentrage() {
        const texture = this.advancedTexture;
        if (!texture?.getDescendants || typeof document === "undefined") return;
        if (!this.contexte) {
            this.canvas = document.createElement("canvas");
            this.contexte = this.canvas.getContext("2d");
        }
        if (!this.contexte) return;

        const config = constantesInterface.centrageOptiqueBoutons ?? {};
        if (config.actif === false) return;
        const exclus = new Set(config.nomsExclus ?? []);
        let modifications = 0;

        texture.getDescendants().forEach((controle) => {
            if (!(controle instanceof BABYLON.GUI.TextBlock)) return;
            if (!this.estLibelleBouton(controle, exclus)) return;

            const metadata = controle.metadata = controle.metadata ?? {};
            const base = this.lirePositionDeReference(controle, metadata);
            if (base === null) return;

            const decalageY = this.calculerDecalage(controle, config);
            if (decalageY === null) return;
            const nouveauTop = base + decalageY;
            const dernierTop = Number.parseFloat(controle.top);
            if (Number.isFinite(dernierTop) && Math.abs(dernierTop - nouveauTop) < 0.1) return;

            controle.top = `${nouveauTop.toFixed(3)}px`;
            controle._markAsDirty?.();
            modifications += 1;
        });

        if (modifications) texture.markAsDirty?.();
    }

    estLibelleBouton(texte, exclus) {
        if (exclus.has(texte.name) || this.nomsFleches.has(texte.name)) return false;
        if (texte.metadata?.nePasCentrerOptiquement === true) return false;
        if (!String(texte.text ?? "").trim() || /[\r\n]/.test(texte.text)) return false;
        if (texte.textWrapping && String(texte.text).includes("\n")) return false;

        let parent = texte.parent;
        while (parent) {
            if (parent instanceof BABYLON.GUI.Button) return true;
            parent = parent.parent;
        }
        return false;
    }

    lirePositionDeReference(texte, metadata) {
        if (metadata.centrageBoutonTopOriginalPx !== undefined) {
            return metadata.centrageBoutonTopOriginalPx;
        }

        // Une position initiale non nulle en % doit rester pilotée par le layout.
        // On ne peut pas lui ajouter des px sans changer la sémantique du JSON.
        const brut = String(texte.top ?? "0px").trim();
        if (brut.endsWith("%") && Number.parseFloat(brut) !== 0) return null;
        if (!brut.endsWith("px") && !brut.endsWith("%") && brut !== "0") return null;
        const base = Number.parseFloat(brut);
        if (!Number.isFinite(base)) return null;
        metadata.centrageBoutonTopOriginalPx = base;
        return base;
    }

    calculerDecalage(texte, config) {
        const taille = Number(texte.fontSizeInPixels);
        if (!Number.isFinite(taille) || taille <= 0) return null;

        const policeBrute = String(texte.fontFamily || "Arial").trim();
        const police = policeBrute.includes(",") || /^["'].*["']$/.test(policeBrute)
            ? policeBrute
            : policeBrute.includes(" ") ? `"${policeBrute}"` : policeBrute;
        const poids = String(texte.fontWeight || "400");
        this.contexte.font = `${poids} ${taille}px ${police}`;
        this.contexte.textAlign = "center";
        this.contexte.textBaseline = "alphabetic";

        // On utilise la boîte visible réelle des glyphes, plutôt que la boîte
        // typographique qui comprend des réserves invisibles pour accents/descentes.
        const mesure = this.contexte.measureText(String(texte.text));
        const asc = mesure.actualBoundingBoxAscent;
        const desc = mesure.actualBoundingBoxDescent;
        const ascPolice = mesure.fontBoundingBoxAscent ?? mesure.emHeightAscent;
        const descPolice = mesure.fontBoundingBoxDescent ?? mesure.emHeightDescent;
        if (![asc, desc, ascPolice, descPolice].every(Number.isFinite)) return null;

        const centreVisible = (desc - asc) / 2;
        const centrePolice = (descPolice - ascPolice) / 2;
        const correction = centrePolice - centreVisible;
        const limite = Math.min(Number(config.decalageMaxPx ?? 8), taille * 0.25);
        if (!Number.isFinite(correction) || !Number.isFinite(limite)) return null;
        return Math.max(-limite, Math.min(limite, correction));
    }
}
