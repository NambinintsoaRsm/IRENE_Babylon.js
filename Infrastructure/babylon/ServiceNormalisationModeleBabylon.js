import {
    filtrerMeshesValides,
    calculerBornesMeshes,
    creerOuTrouverRacineModeleSaotra
} from "../../Util/BabylonUtils.js";

/**
 * Normalise un modèle chargé.
 *
 * Pour les OBJ composés de plusieurs meshes, la normalisation doit être
 * appliquée à une racine commune. Cela évite de déplacer/scaler les morceaux
 * séparément, ce qui peut éclater le modèle.
 */
export class ServiceNormalisationModeleBabylon {
    normaliser(meshes, tailleCible = 2) {
        const meshesValides = filtrerMeshesValides(meshes);

        if (meshesValides.length === 0) {
            throw new Error("Aucun mesh valide à normaliser.");
        }

        const infos = calculerBornesMeshes(meshesValides);

        if (!infos) {
            throw new Error("Impossible de calculer les bornes du modèle.");
        }

        const tailleMax = Math.max(
            infos.taille.x,
            infos.taille.y,
            infos.taille.z
        );

        if (tailleMax <= 0) {
            return {
                ...infos,
                facteurNormalisation: 1,
                racineNormalisation: null
            };
        }

        const facteur = tailleCible / tailleMax;
        const racine = creerOuTrouverRacineModeleSaotra(meshes, {
            nom: "SaotraModeleRacine"
        });

        if (!racine) {
            throw new Error("Impossible de créer la racine commune du modèle.");
        }

        // On conserve l'orientation déjà appliquée à la racine.
        // La translation est calculée dans le repère monde après orientation.
        racine.scaling = new BABYLON.Vector3(facteur, facteur, facteur);
        racine.position = infos.centre.scale(-facteur);
        racine.computeWorldMatrix(true);

        meshesValides.forEach((mesh) => {
            mesh.computeWorldMatrix(true);
        });

        return {
            ...infos,
            facteurNormalisation: facteur,
            racineNormalisation: racine
        };
    }
}
