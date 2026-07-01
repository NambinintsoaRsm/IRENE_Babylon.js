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

    const racinesModele = new Set();
    const noeudsSansRacine = [];

    meshes.forEach((mesh) => {
        if (!mesh || typeof mesh.dispose !== "function") {
            return;
        }

        const racine = trouverRacineModeleSaotra(mesh);

        if (racine) {
            racinesModele.add(racine);
        } else {
            noeudsSansRacine.push(mesh);
        }
    });

    // Si les meshes sont rattachés à une racine commune, on supprime la racine.
    // Cela évite de laisser un TransformNode vide dans la scène.
    racinesModele.forEach((racine) => {
        if (racine && typeof racine.dispose === "function") {
            racine.dispose();
        }
    });

    noeudsSansRacine.forEach((mesh) => {
        if (mesh && typeof mesh.dispose === "function") {
            mesh.dispose();
        }
    });
}

export function trouverRacineModeleSaotra(noeud) {
    let courant = noeud;

    while (courant) {
        if (courant.metadata?.saotraRacineModele === true) {
            return courant;
        }

        courant = courant.parent ?? null;
    }

    return null;
}


export function creerOuTrouverRacineModeleSaotra(noeuds = [], options = {}) {
    const nom = options.nom ?? "SaotraModeleRacine";

    if (!Array.isArray(noeuds) || noeuds.length === 0) {
        return null;
    }

    const racineExistante = trouverRacineExistanteDansListe(noeuds);

    if (racineExistante) {
        racineExistante.metadata = {
            ...(racineExistante.metadata ?? {}),
            saotraRacineModele: true
        };

        return racineExistante;
    }

    const meshesValides = filtrerMeshesValides(noeuds);

    if (meshesValides.length === 0) {
        return null;
    }

    const scene = meshesValides[0]?.getScene?.() ?? null;
    const racine = new BABYLON.TransformNode(nom, scene);

    racine.metadata = {
        ...(racine.metadata ?? {}),
        saotraRacineModele: true
    };

    racine.position = BABYLON.Vector3.Zero();
    racine.scaling = BABYLON.Vector3.One();
    racine.rotation = BABYLON.Vector3.Zero();
    racine.rotationQuaternion = null;

    meshesValides.forEach((mesh) => {
        if (!mesh || mesh === racine || mesh.parent === racine) {
            return;
        }

        // setParent conserve la position absolue au moment du rattachement.
        // Ainsi, l'objet reste visuellement identique, mais les futures rotations
        // et normalisations s'appliquent à l'ensemble du modèle.
        if (typeof mesh.setParent === "function") {
            mesh.setParent(racine);
        } else {
            mesh.parent = racine;
        }
    });

    racine.computeWorldMatrix(true);
    meshesValides.forEach((mesh) => mesh.computeWorldMatrix?.(true));

    return racine;
}

function trouverRacineExistanteDansListe(noeuds = []) {
    for (const noeud of noeuds) {
        const racineSaotra = trouverRacineModeleSaotra(noeud);

        if (racineSaotra) {
            return racineSaotra;
        }
    }

    const racineBabylon = noeuds.find((noeud) => {
        return noeud && noeud.name === "__root__";
    });

    if (racineBabylon) {
        return racineBabylon;
    }

    return null;
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