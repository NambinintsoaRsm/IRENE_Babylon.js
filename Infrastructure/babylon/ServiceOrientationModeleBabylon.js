import {
    filtrerMeshesValides
} from "../../Util/BabylonUtils.js";

/**
 * Corrige l'orientation générale du modèle.
 *
 * Logique reprise de l'ancien app.js :
 * - Babylon considère Y comme axe vertical ;
 * - si Y est déjà l'axe dominant, on ne touche pas ;
 * - si Z est dominant, on redresse Z vers Y ;
 * - si X est dominant, on redresse X vers Y.
 */
export class ServiceOrientationModeleBabylon {
    corrigerOrientation(meshes = []) {
        if (!Array.isArray(meshes) || meshes.length === 0) {
            return null;
        }

        const racine = this.trouverRacineModele(meshes);

        if (!racine) {
            return null;
        }

        racine.rotation = BABYLON.Vector3.Zero();
        racine.scaling = new BABYLON.Vector3(1, 1, 1);

        racine.computeWorldMatrix(true);

        if (typeof racine.refreshBoundingInfo === "function") {
            racine.refreshBoundingInfo(true);
        }

        if (typeof racine.getHierarchyBoundingVectors !== "function") {
            return this.corrigerOrientationParMeshes(meshes);
        }

        const bounds = racine.getHierarchyBoundingVectors(true);
        const taille = bounds.max.subtract(bounds.min);

        const x = Math.abs(taille.x);
        const y = Math.abs(taille.y);
        const z = Math.abs(taille.z);

        console.log("Dimensions modèle :", { x, y, z });

        const yEstAxeVerticalPrincipal = y >= x && y >= z;

        if (yEstAxeVerticalPrincipal) {
            console.log("Orientation conservée : le modèle semble déjà vertical sur Y.");

            return {
                orientationModifiee: false,
                axeDominant: "Y",
                dimensions: { x, y, z }
            };
        }

        if (z > y && z >= x) {
            racine.rotation.x = -Math.PI / 2;
            console.log("Orientation corrigée : axe Z redressé vers Y.");

            racine.computeWorldMatrix(true);

            if (typeof racine.refreshBoundingInfo === "function") {
                racine.refreshBoundingInfo(true);
            }

            return {
                orientationModifiee: true,
                axeDominant: "Z",
                rotation: "x = -PI/2",
                dimensions: { x, y, z }
            };
        }

        if (x > y && x > z) {
            racine.rotation.z = Math.PI / 2;
            console.log("Orientation corrigée : axe X redressé vers Y.");

            racine.computeWorldMatrix(true);

            if (typeof racine.refreshBoundingInfo === "function") {
                racine.refreshBoundingInfo(true);
            }

            return {
                orientationModifiee: true,
                axeDominant: "X",
                rotation: "z = PI/2",
                dimensions: { x, y, z }
            };
        }

        return {
            orientationModifiee: false,
            axeDominant: "indetermine",
            dimensions: { x, y, z }
        };
    }

    trouverRacineModele(meshes) {
        const racineBabylon = meshes.find((mesh) => {
            return mesh && mesh.name === "__root__";
        });

        if (racineBabylon) {
            return racineBabylon;
        }

        const meshAvecHierarchie = meshes.find((mesh) => {
            return mesh && typeof mesh.getHierarchyBoundingVectors === "function";
        });

        if (meshAvecHierarchie) {
            return meshAvecHierarchie;
        }

        return meshes[0] ?? null;
    }

    corrigerOrientationParMeshes(meshes = []) {
        const meshesValides = filtrerMeshesValides(meshes);

        if (meshesValides.length === 0) {
            return null;
        }

        let min = null;
        let max = null;

        meshesValides.forEach((mesh) => {
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

        const x = Math.abs(taille.x);
        const y = Math.abs(taille.y);
        const z = Math.abs(taille.z);

        if (y >= x && y >= z) {
            return {
                orientationModifiee: false,
                axeDominant: "Y",
                dimensions: { x, y, z }
            };
        }

        if (z > y && z >= x) {
            meshesValides.forEach((mesh) => {
                mesh.rotation.x = -Math.PI / 2;
                mesh.computeWorldMatrix(true);
            });

            return {
                orientationModifiee: true,
                axeDominant: "Z",
                rotation: "x = -PI/2",
                dimensions: { x, y, z }
            };
        }

        if (x > y && x > z) {
            meshesValides.forEach((mesh) => {
                mesh.rotation.z = Math.PI / 2;
                mesh.computeWorldMatrix(true);
            });

            return {
                orientationModifiee: true,
                axeDominant: "X",
                rotation: "z = PI/2",
                dimensions: { x, y, z }
            };
        }

        return {
            orientationModifiee: false,
            axeDominant: "indetermine",
            dimensions: { x, y, z }
        };
    }
}