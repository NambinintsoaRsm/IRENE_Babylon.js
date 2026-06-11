import {
    supprimerMeshes,
    filtrerMeshesValides
} from "../../Util/BabylonUtils.js";

/**
 * Regroupe les opérations techniques liées à la scène Babylon.
 *
 * Il sert notamment à nettoyer l'ancien modèle avant d'en charger un nouveau
 * et à gérer les réglages propres à la scène 3D, comme la couleur de fond.
 */
export class ServiceSceneBabylon {
    supprimerMeshes(meshes = []) {
        supprimerMeshes(meshes);
    }

    supprimerModeleActuel(etatModele3D) {
        if (!etatModele3D) {
            throw new Error("État du modèle 3D introuvable.");
        }

        supprimerMeshes(etatModele3D.meshesImportes);
        etatModele3D.viderModeleActuel();

        return etatModele3D;
    }

    trouverMeshesVisibles(meshes = []) {
        return filtrerMeshesValides(meshes).filter((mesh) => mesh.isVisible !== false);
    }

    /**
     * Applique le thème de fond de scène.
     * 0   = clair / blanc
     * 50  = gris moyen
     * 100 = sombre / noir
     */
    appliquerFondSceneDepuisPourcentage(scene, valeur) {
        if (!scene) {
            return null;
        }

        const pourcentage = Math.max(0, Math.min(100, Number(valeur) || 0));
        const composante = 1 - pourcentage / 100;

        scene.clearColor = new BABYLON.Color4(
            composante,
            composante,
            composante,
            1
        );

        return {
            valeur: pourcentage,
            libelle: this.libelleFondScene(pourcentage),
            couleur: scene.clearColor
        };
    }

    libelleFondScene(valeur) {
        if (valeur <= 33) {
            return "Clair";
        }

        if (valeur >= 67) {
            return "Sombre";
        }

        return "Gris";
    }
}
