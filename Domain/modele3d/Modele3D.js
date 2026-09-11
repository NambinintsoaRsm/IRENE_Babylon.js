/**
 * @file Description métier d'un modèle 3D disponible dans ANNA.
 *
 * Rôle : fournir un identifiant stable, un nom d'affichage et les chemins de
 * chargement sans dépendre du moteur Babylon.js.
 *
 * Utilisation : ServiceDetectionModeles3D construit ces objets ; la liste GUI et
 * ChargeurModeleBabylon les consomment ensuite.
 */
export class Modele3D {
    constructor({
                    id,
                    nom,
                    chemin,
                    type = "obj"
                } = {}) {
        this.id = id;
        this.nom = nom;
        this.chemin = chemin;
        this.type = type;

        this.valider();
    }

    valider() {
        if (typeof this.id !== "string" || this.id.trim() === "") {
            throw new Error("L'identifiant du modèle 3D est invalide.");
        }

        if (typeof this.nom !== "string" || this.nom.trim() === "") {
            throw new Error("Le nom du modèle 3D est invalide.");
        }

        if (typeof this.chemin !== "string" || this.chemin.trim() === "") {
            throw new Error("Le chemin du modèle 3D est invalide.");
        }

        if (this.type !== "obj") {
            throw new Error("Le type du modèle 3D doit être 'obj'.");
        }
    }
}