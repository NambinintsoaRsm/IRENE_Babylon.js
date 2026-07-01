import {
    filtrerMeshesValides,
    calculerBornesMeshes,
    creerOuTrouverRacineModeleSaotra
} from "../../Util/BabylonUtils.js";

/**
 * Corrige l'orientation générale du modèle.
 *
 * Point important pour les OBJ composés de plusieurs morceaux :
 * l'orientation ne doit jamais être appliquée mesh par mesh.
 * Sinon chaque partie tourne autour de son propre pivot, ce qui donne
 * l'impression que le modèle est séparé / éclaté.
 *
 * On crée donc une racine commune avant toute rotation, puis on applique
 * la correction d'orientation à cette racine.
 */
export class ServiceOrientationModeleBabylon {
    corrigerOrientation(meshes = []) {
        const meshesValides = filtrerMeshesValides(meshes);

        if (meshesValides.length === 0) {
            return null;
        }

        const racine = creerOuTrouverRacineModeleSaotra(meshes, {
            nom: "SaotraModeleRacine"
        });

        if (!racine) {
            return null;
        }

        racine.rotation = BABYLON.Vector3.Zero();
        racine.rotationQuaternion = null;
        racine.scaling = BABYLON.Vector3.One();
        racine.position = BABYLON.Vector3.Zero();
        racine.computeWorldMatrix(true);

        const infos = calculerBornesMeshes(meshesValides);

        if (!infos) {
            return null;
        }

        const x = Math.abs(infos.taille.x);
        const y = Math.abs(infos.taille.y);
        const z = Math.abs(infos.taille.z);

        console.log("Dimensions modèle :", { x, y, z });

        if (y >= x && y >= z) {
            console.log("Orientation conservée : le modèle semble déjà vertical sur Y.");

            return {
                orientationModifiee: false,
                axeDominant: "Y",
                dimensions: { x, y, z },
                racine
            };
        }

        if (z > y && z >= x) {
            racine.rotation.x = -Math.PI / 2;
            racine.computeWorldMatrix(true);
            this.rafraichirMatricesEnfants(meshesValides);
            console.log("Orientation corrigée : axe Z redressé vers Y sur la racine du modèle.");

            return {
                orientationModifiee: true,
                axeDominant: "Z",
                rotation: "racine.x = -PI/2",
                dimensions: { x, y, z },
                racine
            };
        }

        if (x > y && x > z) {
            racine.rotation.z = Math.PI / 2;
            racine.computeWorldMatrix(true);
            this.rafraichirMatricesEnfants(meshesValides);
            console.log("Orientation corrigée : axe X redressé vers Y sur la racine du modèle.");

            return {
                orientationModifiee: true,
                axeDominant: "X",
                rotation: "racine.z = PI/2",
                dimensions: { x, y, z },
                racine
            };
        }

        return {
            orientationModifiee: false,
            axeDominant: "indetermine",
            dimensions: { x, y, z },
            racine
        };
    }

    rafraichirMatricesEnfants(meshes = []) {
        meshes.forEach((mesh) => {
            if (mesh && typeof mesh.computeWorldMatrix === "function") {
                mesh.computeWorldMatrix(true);
            }
        });
    }
}
