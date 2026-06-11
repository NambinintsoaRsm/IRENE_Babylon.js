import { estTypeContourValide } from "./TypeContour.js";

export class ParametresContours {
    constructor({
        actif = false,
        typeActif = null,
        typesActifs = null,
        epaisseur = 1,
        seuil = 0.5,
        couleur = "#000000"
    } = {}) {
        const listeTypes = Array.isArray(typesActifs)
            ? typesActifs
            : (typeActif ? [typeActif] : []);

        this.typesActifs = [...new Set(listeTypes)].filter((type) => type !== null);
        this.actif = Boolean(actif || this.typesActifs.length > 0);
        this.typeActif = this.typesActifs.length > 0 ? this.typesActifs[this.typesActifs.length - 1] : null;
        this.epaisseur = epaisseur;
        this.seuil = seuil;
        this.couleur = couleur;

        this.valider();
    }

    valider() {
        if (typeof this.actif !== "boolean") {
            throw new Error("L'état actif des contours doit être un booléen.");
        }

        if (!Array.isArray(this.typesActifs)) {
            throw new Error("La liste des contours actifs est invalide.");
        }

        this.typesActifs.forEach((type) => {
            if (!estTypeContourValide(type)) {
                throw new Error(`Le type de contour '${type}' est invalide.`);
            }
        });

        if (this.typeActif !== null && !estTypeContourValide(this.typeActif)) {
            throw new Error(`Le type de contour '${this.typeActif}' est invalide.`);
        }

        if (!Number.isFinite(this.epaisseur) || this.epaisseur < 0) {
            throw new Error("L'épaisseur du contour est invalide.");
        }

        if (typeof this.couleur !== "string" || this.couleur.trim() === "") {
            throw new Error("La couleur du contour est invalide.");
        }
    }

    activer(typeContour) {
        if (!estTypeContourValide(typeContour)) {
            throw new Error(`Le type de contour '${typeContour}' est invalide.`);
        }

        if (!this.typesActifs.includes(typeContour)) {
            this.typesActifs.push(typeContour);
        }

        this.actif = this.typesActifs.length > 0;
        this.typeActif = typeContour;
    }

    desactiver(typeContour = null) {
        if (typeContour === null) {
            this.typesActifs = [];
            this.actif = false;
            this.typeActif = null;
            return;
        }

        if (!estTypeContourValide(typeContour)) {
            throw new Error(`Le type de contour '${typeContour}' est invalide.`);
        }

        this.typesActifs = this.typesActifs.filter((type) => type !== typeContour);
        this.actif = this.typesActifs.length > 0;
        this.typeActif = this.typesActifs.length > 0
            ? this.typesActifs[this.typesActifs.length - 1]
            : null;
    }

    basculer(typeContour) {
        if (this.estActif(typeContour)) {
            this.desactiver(typeContour);
        } else {
            this.activer(typeContour);
        }
    }

    estActif(typeContour) {
        return this.typesActifs.includes(typeContour);
    }

    changerEpaisseur(epaisseur) {
        if (!Number.isFinite(epaisseur) || epaisseur < 0) {
            throw new Error("L'épaisseur du contour est invalide.");
        }

        this.epaisseur = epaisseur;
    }

    changerSeuil(seuil) {
        this.seuil = seuil;
    }
}
