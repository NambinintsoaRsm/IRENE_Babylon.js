/**
 * Fonctions utilitaires pour Babylon.js.
 */

export function creerVector3DepuisObjet(objet = { x: 0, y: 0, z: 0 }) {
    return new BABYLON.Vector3(
        objet.x ?? 0,
        objet.y ?? 0,
        objet.z ?? 0
    );
}

export function convertirVector3EnObjet(vector) {
    if (!vector) {
        return { x: 0, y: 0, z: 0 };
    }

    return {
        x: vector.x,
        y: vector.y,
        z: vector.z
    };
}

export function filtrerMeshesValides(meshes = []) {
    if (!Array.isArray(meshes)) {
        return [];
    }

    return meshes.filter((mesh) => {
        return mesh &&
            typeof mesh.getTotalVertices === "function" &&
            mesh.getTotalVertices() > 0;
    });
}

export function calculerBornesMeshes(meshes = []) {
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
    const centre = min.add(taille.scale(0.5));

    return {
        min,
        max,
        taille,
        centre,
        rayon: taille.length() / 2
    };
}

export function supprimerMeshes(meshes = []) {
    if (!Array.isArray(meshes)) {
        return;
    }

    meshes.forEach((mesh) => {
        if (mesh && typeof mesh.dispose === "function") {
            mesh.dispose();
        }
    });
}

export function appliquerBackFaceCulling(meshes = [], valeur = false) {
    if (!Array.isArray(meshes)) {
        return;
    }

    meshes.forEach((mesh) => {
        if (!mesh?.material) {
            return;
        }

        mesh.material.backFaceCulling = valeur;

        if (Array.isArray(mesh.material.subMaterials)) {
            mesh.material.subMaterials.forEach((subMaterial) => {
                if (subMaterial) {
                    subMaterial.backFaceCulling = valeur;
                }
            });
        }
    });
}