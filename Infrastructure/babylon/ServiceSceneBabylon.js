/**
 * Regroupe les opérations techniques liées à la scène Babylon.
 *
 * Il sert notamment à nettoyer l'ancien modèle avant d'en charger un nouveau.
 */
export class ServiceSceneBabylon {
    supprimerMeshes(meshes = []) {
        if (!Array.isArray(meshes)) {
            throw new Error("La liste des meshes à supprimer est invalide.");
        }

        meshes.forEach((mesh) => {
            if (mesh && typeof mesh.dispose === "function") {
                mesh.dispose();
            }
        });
    }

    supprimerModeleActuel(etatModele3D) {
        if (!etatModele3D) {
            throw new Error("État du modèle 3D introuvable.");
        }

        this.supprimerMeshes(etatModele3D.meshesImportes);

        etatModele3D.viderModeleActuel();

        return etatModele3D;
    }

    trouverMeshesVisibles(meshes = []) {
        return meshes.filter((mesh) => {
            return mesh &&
                mesh.getTotalVertices &&
                mesh.getTotalVertices() > 0 &&
                mesh.isVisible !== false;
        });
    }
}