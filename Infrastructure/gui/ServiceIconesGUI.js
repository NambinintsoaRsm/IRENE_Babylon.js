import { configurationIconesGUI } from "../../Configuration/configurationIconesGUI.js";

/** Adaptateur Babylon GUI des icônes, indépendant des contrôleurs. */
export class ServiceIconesGUI {
    symbole(direction) {
        return configurationIconesGUI.fleches.symboles[direction] ?? "";
    }

    /**
     * Applique une taille commune à un pictogramme, indépendamment du symbole.
     * La politique d'activation appartient à la configuration, pas au service.
     */
    appliquerTailleFleche(controle, taillePx) {
        if (!controle || !Number.isFinite(taillePx) || taillePx <= 0) return;

        controle.metadata ??= {};
        controle.metadata.texteDynamique = true;
        controle.metadata.nePasAutoFit = true;
        controle.metadata.nePasModifierTailleTexte = true;
        controle.metadata.nePasAccessibilite = true;
        controle.metadata.fontSizeOriginal = `${taillePx}px`;
        controle.metadata.fontSizeDemandeeAutoFit = `${taillePx}px`;
        controle.fontFamily = configurationIconesGUI.fleches.police;
        controle.fontSize = `${taillePx}px`;
        controle._markAsDirty?.();
    }

    preparerFleche(controle) {
        const regle = configurationIconesGUI.fleches.tailleUniforme;
        if (!regle?.actif || !regle.nomsControles?.includes(controle?.name)) return;
        this.appliquerTailleFleche(controle, Number(regle.taillePx));
    }

    mettreAJourFleche(controle, estOuvert) {
        if (!controle) return;
        // La taille est stabilisée avant ET après le changement de direction.
        this.preparerFleche(controle);
        const direction = estOuvert ? "bas" : "droite";
        const visuel = configurationIconesGUI.fleches.normalisationVisuelle;
        if (visuel?.actif && visuel.nomsControles?.includes(controle.name)) {
            // Un seul glyphe Arial est tourné : aucune différence de proportions
            // entre ▶ et ▼, à fontSize=68px constant.
            controle.text = visuel.symboleReference ?? "▶";
            controle.rotation = direction === "bas" ? Math.PI / 2 : 0;
            controle.metadata ??= {};
            // Le centrage standard mesure le glyphe avant rotation : on le
            // remplace ici par un centrage qui projette les corrections optiques
            // dans l'orientation affichée.
            controle.metadata.nePasCentrageOptiqueFleche = true;
            this.centrerFlecheTournee(controle);
        } else {
            controle.text = this.symbole(direction);
        }
        controle._markAsDirty?.();
    }

    /**
     * Centre le glyphe visible après rotation, sans déplacer la cellule GUI.
     * Les offsets sont toujours recalculés à partir des positions initiales :
     * aucune dérive n'est possible entre les ouvertures/fermetures.
     */
    centrerFlecheTournee(controle) {
        if (!controle || typeof document === "undefined") return;

        const metadata = controle.metadata ??= {};
        if (metadata.centrageFlecheRotationBaseLeftPx === undefined) {
            metadata.centrageFlecheRotationBaseLeftPx = Number.parseFloat(controle.left) || 0;
        }
        if (metadata.centrageFlecheRotationBaseTopPx === undefined) {
            metadata.centrageFlecheRotationBaseTopPx = Number.parseFloat(controle.top) || 0;
        }

        this.canvasCentrageFleche ??= document.createElement("canvas");
        const ctx = this.canvasCentrageFleche.getContext("2d");
        if (!ctx) return;
        const taille = Number(controle.fontSizeInPixels) || Number.parseFloat(controle.fontSize);
        if (!Number.isFinite(taille) || taille <= 0) return;

        const famille = String(controle.fontFamily || "Arial").trim();
        const poids = String(controle.fontWeight || "400");
        ctx.font = `${poids} ${taille}px ${famille.includes(" ") ? `"${famille}"` : famille}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        const mesures = ctx.measureText(String(controle.text || "▶"));

        const gauche = Number(mesures.actualBoundingBoxLeft);
        const droite = Number(mesures.actualBoundingBoxRight);
        const asc = Number(mesures.actualBoundingBoxAscent);
        const desc = Number(mesures.actualBoundingBoxDescent);
        const ascPolice = Number(mesures.fontBoundingBoxAscent ?? mesures.emHeightAscent);
        const descPolice = Number(mesures.fontBoundingBoxDescent ?? mesures.emHeightDescent);

        // Même référence optique que ServiceTexteGUI, projetée par la rotation.
        const correctionX = Number.isFinite(gauche) && Number.isFinite(droite)
            ? (gauche - droite) / 2 : 0;
        const correctionY = [asc, desc, ascPolice, descPolice].every(Number.isFinite)
            ? (descPolice - ascPolice - desc + asc) / 2 : 0;
        const angle = Number(controle.rotation) || 0;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const limite = Math.max(1, taille * 0.25);
        const borner = (valeur) => Math.max(-limite, Math.min(limite, valeur));
        const decalageX = borner(correctionX * cos - correctionY * sin);
        const decalageY = borner(correctionX * sin + correctionY * cos) + (Math.abs(angle) < 0.001 ? -2 : 0);        controle.left = `${metadata.centrageFlecheRotationBaseLeftPx + decalageX}px`;
        controle.top = `${metadata.centrageFlecheRotationBaseTopPx + decalageY}px`;
        controle._markAsDirty?.();
    }

    creerImage(nom, source, taille = null, { categorie = "accueil", zIndex = null } = {}) {
        const image = new BABYLON.GUI.Image(nom, source);
        const config = configurationIconesGUI[categorie] ?? configurationIconesGUI.accueil;
        image.width = taille ?? config.largeur ?? "100%";
        image.height = taille ?? config.hauteur ?? "100%";
        image.stretch = BABYLON.GUI.Image.STRETCH_UNIFORM;
        image.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        image.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        image.isHitTestVisible = false;
        image.isPointerBlocker = false;
        image.zIndex = zIndex ?? config.zIndex ?? 20;
        if (categorie === "accessibilite") {
            image.paddingLeft = "0px";
            image.paddingRight = "0px";
            image.paddingTop = "0px";
            image.paddingBottom = "0px";
        }
        return image;
    }

    creerDataUriAccessibilite(couleur = "#000000") {
        const chemin = configurationIconesGUI.accessibilite.cheminSvg;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24" role="img" aria-label="Accessibilite"><path fill="${couleur}" d="${chemin}"/></svg>`;
        const propre = svg.replace(/\s{2,}/g, " ").trim();
        const code = typeof btoa === "function"
            ? btoa(propre)
            : (typeof Buffer !== "undefined" ? Buffer.from(propre, "utf8").toString("base64") : propre);
        return `data:image/svg+xml;base64,${code}`;
    }

    creerDataUriPng(type, couleur = "#000000") {
        if (!globalThis.document?.createElement) return null;

        const canvas = document.createElement("canvas");
        canvas.width = configurationIconesGUI.accueil.resolutionCanvas;
        canvas.height = configurationIconesGUI.accueil.resolutionCanvas;
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

}
