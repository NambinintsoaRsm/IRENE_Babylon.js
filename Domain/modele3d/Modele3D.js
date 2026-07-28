export class Modele3D {
    constructor({
                    id,
                    nom,
                    chemin,
                    type = "glb"
                } = {}) {
        this.id = id;
        this.nom = nom;
        this.chemin = chemin;
        this.type = String(type ?? "").toLowerCase();

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

        if (this.type !== "glb") {
            throw new Error("Le type du modèle 3D doit être 'glb'.");
        }

        const cheminSansParametres = this.chemin.split(/[?#]/, 1)[0].toLowerCase();

        if (!cheminSansParametres.endsWith(".glb")) {
            throw new Error("Seuls les fichiers GLB sont autorisés dans cette branche.");
        }
    }
}
