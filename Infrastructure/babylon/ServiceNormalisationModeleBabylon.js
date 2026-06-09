/**
 * Normalise un modèle chargé.
 *
 * Le but est de centrer le modèle et de le ramener à une taille exploitable
 * sans fixer cette logique dans les use cases.
 */
export class ServiceNormalisationModeleBabylon {
    normaliser(meshes, tailleCible = 2) {
        const meshesValides = this.filtrerMeshesValides(meshes);

        if (meshesValides.length === 0) {
            throw new Error("Aucun mesh valide à normaliser.");
        }

        const infos = this.calculerBornes(meshesValides);

        const tailleMax = Math.max(
            infos.taille.x,
            infos.taille.y,
            infos.taille.z
        );

        if (tailleMax <= 0) {
            return infos;
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

    filtrerMeshesValides(meshes = []) {
        return meshes.filter((mesh) => {
            return mesh &&
                mesh.getTotalVertices &&
                mesh.getTotalVertices() > 0;
        });
    }

    calculerBornes(meshes) {
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

        return {
            min,
            max,
            taille,
            centre
        };
    }
}