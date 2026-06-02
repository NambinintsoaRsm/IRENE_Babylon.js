import { estTypeContourValide } from "./TypeContour.js";

export class ParametresContours {
    constructor({
                    actif = false,
                    typeActif = null,
                    epaisseur = 1,
                    seuil = 0.5,
                    couleur = "#000000"
                } = {}) {
        this.actif = actif;
        this.typeActif = typeActif;
        this.epaisseur = epaisseur;
        this.seuil = seuil;
        this.couleur = couleur;

        this.valider();
    }

    valider() {
        if (typeof this.actif !== "boolean") {
            throw new Error("L'état actif des contours doit être un booléen.");
        }

        if (this.typeActif !== null && !estTypeContourValide(this.typeActif)) {
            throw new Error(`Le type de contour '${this.typeActif}' est invalide.`);
        }

        if (!Number.isFinite(this.epaisseur) || this.epaisseur < 0) {
            throw new Error("L'épaisseur du contour est invalide.");
        }

        if (!Number.isFinite(this.seuil) || this.seuil < 0) {
            throw new Error("Le seuil du contour est invalide.");
        }

        if (typeof this.couleur !== "string" || this.couleur.trim() === "") {
            throw new Error("La couleur du contour est invalide.");
        }
    }

    activer(typeContour) {
        if (!estTypeContourValide(typeContour)) {
            throw new Error(`Le type de contour '${typeContour}' est invalide.`);
        }

        this.actif = true;
        this.typeActif = typeContour;
    }

    desactiver() {
        this.actif = false;
        this.typeActif = null;
    }

    changerEpaisseur(epaisseur) {
        if (!Number.isFinite(epaisseur) || epaisseur < 0) {
            throw new Error("L'épaisseur du contour est invalide.");
        }

        this.epaisseur = epaisseur;
    }

    changerSeuil(seuil) {
        if (!Number.isFinite(seuil) || seuil < 0) {
            throw new Error("Le seuil du contour est invalide.");
        }

        this.seuil = seuil;
    }
}