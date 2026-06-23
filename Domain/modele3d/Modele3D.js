const TYPES_MODELES_AUTORISES = Object.freeze(["obj", "glb", "gltf"]);

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

        // Ancienne règle : seuls les OBJ étaient acceptés.
        // if (this.type !== "obj") {
        //     throw new Error("Le type du modèle 3D doit être 'obj'.");
        // }

        // Nouvelle règle : on garde OBJ possible, mais on autorise aussi GLB/GLTF
        // pour les modèles Babylon plus simples à déployer avec textures intégrées.
        if (!TYPES_MODELES_AUTORISES.includes(this.type)) {
            throw new Error(`Le type du modèle 3D doit être l'un de : ${TYPES_MODELES_AUTORISES.join(", ")}.`);
        }
    }
}
