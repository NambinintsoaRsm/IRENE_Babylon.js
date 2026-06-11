import {
    filtrerMeshesValides,
    calculerBornesMeshes
} from "../../Util/BabylonUtils.js";

/**
 * Normalise un modèle chargé.
 *
 * Le but est de centrer le modèle et de le ramener à une taille exploitable
 * sans fixer cette logique dans les use cases.
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
                facteurNormalisation: 1
            };
        }

        const facteur = tailleCible / tailleMax;

        meshesValides.forEach((mesh) => {
            mesh.position.subtractInPlace(infos.centre);
            mesh.scaling.scaleInPlace(facteur);
        });

        return {
            ...infos,
            facteurNormalisation: facteur
        };
    }
}