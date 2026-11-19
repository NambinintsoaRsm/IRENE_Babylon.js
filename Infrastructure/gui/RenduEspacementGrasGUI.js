import {
    graphemesTexte,
    mesurerTexteAvecEspacement
} from "../../Domain/interface/EspacementGrasProportionnel.js";

/**
 * Adaptateur Babylon GUI : ne remplace _drawText que pour l'instance activée.
 * API interne Babylon (expérimental) : à revalider après mise à jour du moteur.
 */
export function configurerRenduEspacementGras(textBlock, ratio) {
    if (!textBlock) return;
    textBlock.metadata = textBlock.metadata || {};
    const meta = textBlock.metadata;
    const valeur = Number.isFinite(Number(ratio)) ? Math.max(0, Number(ratio)) : 0;
    meta.trackingGrasRatio = valeur;

    if (valeur <= 0) {
        if (Object.prototype.hasOwnProperty.call(textBlock, "_drawText")
            && meta.renduTrackingGrasInstalle === true) {
            if (meta.trackingGrasAvaitMethodePropre) {
                textBlock._drawText = meta.trackingGrasMethodePrecedente;
            } else {
                delete textBlock._drawText;
            }
            delete meta.trackingGrasMethodePrecedente;
            delete meta.trackingGrasAvaitMethodePropre;
        }
        meta.renduTrackingGrasInstalle = false;
        textBlock._markAsDirty?.();
        return;
    }

    if (meta.renduTrackingGrasInstalle === true) {
        textBlock._markAsDirty?.();
        return;
    }

    meta.trackingGrasAvaitMethodePropre = Object.prototype.hasOwnProperty.call(textBlock, "_drawText");
    if (meta.trackingGrasAvaitMethodePropre) {
        meta.trackingGrasMethodePrecedente = textBlock._drawText;
    }

    textBlock._drawText = function (texte, largeurOriginale, y, contexte) {
        const ratioActif = Number(this.metadata?.trackingGrasRatio) || 0;
        const taille = Number(this.fontSizeInPixels) || parseFloat(this.fontSize) || 24;
        const glyphes = graphemesTexte(texte);
        if (!glyphes.length) return;

        // Le calcul utilise exactement les mêmes métriques que l'AutoFit.
        const largeur = mesurerTexteAvecEspacement(contexte, texte, ratioActif, taille);
        const ecart = taille * ratioActif;
        const alignement = this.textHorizontalAlignment;
        const gauche = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        const droite = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        const largeurControle = Number(this._currentMeasure?.width) || 0;
        let x = Number(this._currentMeasure?.left) || 0;
        if (alignement === droite) x += largeurControle - largeur;
        else if (alignement !== gauche) x += (largeurControle - largeur) / 2;

        contexte.save();
        contexte.textAlign = "left";
        contexte.lineJoin = "round";
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            contexte.shadowColor = this.shadowColor;
            contexte.shadowBlur = this.shadowBlur;
            const echelle = Number(this.host?.idealRatio) || 1;
            contexte.shadowOffsetX = this.shadowOffsetX * echelle;
            contexte.shadowOffsetY = this.shadowOffsetY * echelle;
        }
        const origine = x;
        for (const glyphe of glyphes) {
            if (this.outlineWidth > 0) contexte.strokeText(glyphe, x, y);
            contexte.fillText(glyphe, x, y);
            x += contexte.measureText(glyphe).width + ecart;
        }
        // Préserver également le soulignement / barré natifs si utilisés.
        if (this.underline || this.lineThrough) {
            const largeurTrait = Math.max(1, Math.round(taille * 0.05));
            contexte.lineWidth = largeurTrait;
            contexte.strokeStyle = contexte.fillStyle;
            if (this.underline) {
                contexte.beginPath();
                contexte.moveTo(origine, y + 3);
                contexte.lineTo(origine + largeur, y + 3);
                contexte.stroke();
            }
            if (this.lineThrough) {
                contexte.beginPath();
                contexte.moveTo(origine, y - taille / 3);
                contexte.lineTo(origine + largeur, y - taille / 3);
                contexte.stroke();
            }
        }
        contexte.restore();
    };
    meta.renduTrackingGrasInstalle = true;
    textBlock._markAsDirty?.();
}
