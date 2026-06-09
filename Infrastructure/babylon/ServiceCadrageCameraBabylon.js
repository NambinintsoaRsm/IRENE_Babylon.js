/**
 * Cadre automatiquement la caméra autour du modèle chargé.
 *
 * Ce service évite que l’objet soit trop loin, trop proche,
 * ou hors champ après chargement.
 */
export class ServiceCadrageCameraBabylon {
    cadrer(camera, meshes, parametresCamera) {
        if (!camera) {
            throw new Error("Caméra Babylon introuvable pour cadrer le modèle.");
        }

        const meshesValides = this.filtrerMeshesValides(meshes);

        if (meshesValides.length === 0) {
            throw new Error("Aucun mesh valide à cadrer.");
        }

        const { centre, rayonModele } = this.calculerCentreEtRayon(meshesValides);

        camera.setTarget(centre);

        const rayonCamera = this.calculerRayonCamera(rayonModele, parametresCamera);

        camera.radius = rayonCamera;

        return {
            cible: {
                x: centre.x,
                y: centre.y,
                z: centre.z
            },
            rayon: rayonCamera
        };
    }

    filtrerMeshesValides(meshes = []) {
        return meshes.filter((mesh) => {
            return mesh &&
                mesh.getTotalVertices &&
                mesh.getTotalVertices() > 0;
        });
    }

    calculerCentreEtRayon(meshes) {
        let min = null;
        let max = null;

        meshes.forEach((mesh) => {
            mesh.computeWorldMatrix(true);

            const boundingInfo = mesh.getBoundingInfo();
            const minimum = boundingInfo.boundingBox.minimumWorld;
            const maximum = boundingInfo.boundingBox.maximumWorld;

            if (!min) {
                min = minimum.clone();
                max = maximum.clone();
            } else {
                min = BABYLON.Vector3.Minimize(min, minimum);
                max = BABYLON.Vector3.Maximize(max, maximum);
            }
        });

        const taille = max.subtract(min);
        const centre = min.add(taille.scale(0.5));
        const rayonModele = taille.length() / 2;

        return {
            centre,
            rayonModele
        };
    }

    calculerRayonCamera(rayonModele, parametresCamera) {
        const facteurCadrage = 2.5;
        let rayonCamera = rayonModele * facteurCadrage;

        if (parametresCamera) {
            rayonCamera = Math.max(rayonCamera, parametresCamera.distanceMin);
            rayonCamera = Math.min(rayonCamera, parametresCamera.distanceMax);
        }

        return rayonCamera;
    }
}