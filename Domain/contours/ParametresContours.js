/**
 * @file État métier des contours de la V1.
 *
 * Rôle : conserver l'activation de la silhouette, son épaisseur, son seuil et sa
 * couleur manuelle ou automatique. La structure typesActifs est volontairement
 * conservée pour permettre la réintégration de nouveaux types de contours en V2.
 *
 * Utilisation : ControleurContours modifie cette classe via les Use Cases et
 * PostTraitSilhouette lit ensuite les valeurs pour configurer le shader.
 */
import { estTypeContourValide, TypeContour } from "./TypeContour.js";
import { constantesContours } from "../../Configuration/constantesContours.js";

/**
 * Paramètres du contour de silhouette.
 *
 * La structure typesActifs/typeActif est volontairement conservée sous une
 * forme générique afin de faciliter l'ajout de nouveaux types de contours en V2,
 * sans réécrire la sauvegarde ni les contrôleurs.
 */
export class ParametresContours {
    constructor({
        actif = false,
        typeActif = null,
        typesActifs = null,
        epaisseur = constantesContours.epaisseurDefaut,
        seuil = constantesContours.seuils[TypeContour.SILHOUETTE],
        couleur = constantesContours.couleurDefaut,
        couleurAutomatiqueActive = true,
        couleurManuelleChoisie = false,
        couleurAutomatiqueCalculee = null,
        signatureCouleurAutomatique = null
    } = {}) {
        const listeTypes = Array.isArray(typesActifs)
            ? typesActifs
            : (typeActif ? [typeActif] : []);

        this.typesActifs = [...new Set(listeTypes)].filter(estTypeContourValide);
        this.actif = Boolean(actif && this.typesActifs.length > 0);
        this.typeActif = this.typesActifs.length > 0
            ? this.typesActifs[this.typesActifs.length - 1]
            : null;

        this.epaisseur = Number.isFinite(Number(epaisseur))
            ? Number(epaisseur)
            : constantesContours.epaisseurDefaut;
        this.seuil = Number.isFinite(Number(seuil))
            ? Number(seuil)
            : constantesContours.seuils[TypeContour.SILHOUETTE];
        this.couleur = couleur;
        this.couleurAutomatiqueActive = Boolean(couleurAutomatiqueActive);
        this.couleurManuelleChoisie = Boolean(couleurManuelleChoisie);
        this.couleurAutomatiqueCalculee = couleurAutomatiqueCalculee;
        this.signatureCouleurAutomatique = signatureCouleurAutomatique;

        this.valider();
    }

    valider() {
        if (typeof this.actif !== "boolean") {
            throw new Error("L'état actif du contour doit être un booléen.");
        }

        if (!Array.isArray(this.typesActifs) || this.typesActifs.some((type) => !estTypeContourValide(type))) {
            throw new Error("La liste des contours actifs est invalide.");
        }

        if (this.typeActif !== null && !estTypeContourValide(this.typeActif)) {
            throw new Error(`Le type de contour '${this.typeActif}' est invalide.`);
        }

        if (!Number.isFinite(this.epaisseur) || this.epaisseur < 0) {
            throw new Error("L'épaisseur du contour est invalide.");
        }

        if (!Number.isFinite(this.seuil) || this.seuil < 0) {
            throw new Error("Le seuil de silhouette est invalide.");
        }

        if (typeof this.couleur !== "string" || this.couleur.trim() === "") {
            throw new Error("La couleur du contour est invalide.");
        }

        if (this.couleurAutomatiqueCalculee !== null && typeof this.couleurAutomatiqueCalculee !== "string") {
            throw new Error("La couleur automatique calculée est invalide.");
        }

        if (this.signatureCouleurAutomatique !== null && typeof this.signatureCouleurAutomatique !== "string") {
            throw new Error("La signature de couleur automatique est invalide.");
        }
    }

    activer(typeContour = TypeContour.SILHOUETTE) {
        if (!estTypeContourValide(typeContour)) {
            throw new Error(`Le type de contour '${typeContour}' est invalide.`);
        }

        if (!this.typesActifs.includes(typeContour)) {
            this.typesActifs.push(typeContour);
        }

        this.actif = true;
        this.typeActif = typeContour;
    }

    desactiver(typeContour = null) {
        if (typeContour === null) {
            this.typesActifs = [];
        } else {
            if (!estTypeContourValide(typeContour)) {
                throw new Error(`Le type de contour '${typeContour}' est invalide.`);
            }
            this.typesActifs = this.typesActifs.filter((type) => type !== typeContour);
        }

        this.actif = this.typesActifs.length > 0;
        this.typeActif = this.actif ? this.typesActifs[this.typesActifs.length - 1] : null;
    }

    basculer(typeContour = TypeContour.SILHOUETTE) {
        if (this.estActif(typeContour)) {
            this.desactiver(typeContour);
        } else {
            this.activer(typeContour);
        }
    }

    estActif(typeContour = TypeContour.SILHOUETTE) {
        return this.actif && this.typesActifs.includes(typeContour);
    }

    changerEpaisseur(epaisseur) {
        const valeur = Number(epaisseur);
        if (!Number.isFinite(valeur) || valeur < 0) {
            throw new Error("L'épaisseur du contour est invalide.");
        }
        this.epaisseur = valeur;
    }

    changerSeuil(seuil) {
        const valeur = Number(seuil);
        if (!Number.isFinite(valeur) || valeur < 0) {
            throw new Error("Le seuil de silhouette est invalide.");
        }
        this.seuil = valeur;
    }

    choisirCouleurManuelle(couleur) {
        this.couleur = couleur;
        this.couleurAutomatiqueActive = false;
        this.couleurManuelleChoisie = true;
    }

    choisirCouleurAutomatique(couleur) {
        this.couleur = couleur;
        this.couleurAutomatiqueCalculee = couleur;
        this.signatureCouleurAutomatique = null;
        this.couleurAutomatiqueActive = true;
        this.couleurManuelleChoisie = false;
    }

    activerCouleurAutomatique(active = true) {
        this.couleurAutomatiqueActive = Boolean(active);
        if (this.couleurAutomatiqueActive) {
            this.couleurManuelleChoisie = false;
        }
    }
}
