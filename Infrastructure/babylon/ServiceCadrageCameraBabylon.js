import {
    filtrerMeshesValides,
    calculerBornesMeshes
} from "../../Util/BabylonUtils.js";

/**
 * Cadre automatiquement la caméra autour du modèle chargé.
 *
 * Ce service évite que l’objet soit trop loin, trop proche,
 * ou hors champ après chargement.
 */
export class ServiceCadrageCameraBabylon {
    cadrer(camera, meshes, parametresCamera, facteurCadrage = 2.5) {
        if (!camera) {
            throw new Error("Caméra Babylon introuvable pour cadrer le modèle.");
        }

        const meshesValides = filtrerMeshesValides(meshes);

        if (meshesValides.length === 0) {
            throw new Error("Aucun mesh valide à cadrer.");
        }

        const infos = calculerBornesMeshes(meshesValides);

        if (!infos) {
            throw new Error("Impossible de calculer les bornes du modèle.");
        }

        camera.setTarget(infos.centre);

        const rayonCamera = this.calculerRayonCamera(
            infos.rayon,
            parametresCamera,
            facteurCadrage
        );

        camera.radius = rayonCamera;

        return {
            cible: {
                x: infos.centre.x,
                y: infos.centre.y,
                z: infos.centre.z
            },
            rayon: rayonCamera
        };
    }

    calculerRayonCamera(rayonModele, parametresCamera, facteurCadrage = 2.5) {
        let rayonCamera = rayonModele * facteurCadrage;

        if (parametresCamera) {
            rayonCamera = Math.max(rayonCamera, parametresCamera.distanceMin);
            rayonCamera = Math.min(rayonCamera, parametresCamera.distanceMax);
        }

        return rayonCamera;
    }
}