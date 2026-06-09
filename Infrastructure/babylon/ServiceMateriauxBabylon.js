/**
 * Gère les matériaux Babylon appliqués aux modèles.
 *
 * Il permet notamment de corriger l'effet de transparence ou de creux
 * en désactivant le backFaceCulling sur les matériaux.
 */
export class ServiceMateriauxBabylon {
    corrigerMateriaux(meshes = []) {
        meshes.forEach((mesh) => {
            if (!mesh || !mesh.material) {
                return;
            }

            this.corrigerMateriau(mesh.material);
        });
    }

    corrigerMateriau(material) {
        if (!material) {
            return;
        }

        material.backFaceCulling = false;

        if (material.subMaterials && Array.isArray(material.subMaterials)) {
            material.subMaterials.forEach((subMaterial) => {
                if (subMaterial) {
                    subMaterial.backFaceCulling = false;
                }
            });
        }
    }

    appliquerTextureProcedurale(meshes = [], typeTexture) {
        if (!typeTexture) {
            return;
        }

        meshes.forEach((mesh) => {
            if (!mesh) {
                return;
            }

            if (typeTexture === "damier") {
                this.appliquerDamier(mesh);
            }

            if (typeTexture === "rayures") {
                this.appliquerRayures(mesh);
            }
        });
    }

    appliquerDamier(mesh) {
        const material = new BABYLON.StandardMaterial(
            `${mesh.name}_damier`,
            mesh.getScene()
        );

        const texture = new BABYLON.DynamicTexture(
            `${mesh.name}_texture_damier`,
            { width: 512, height: 512 },
            mesh.getScene(),
            false
        );

        const context = texture.getContext();
        const tailleCase = 64;

        for (let y = 0; y < 512; y += tailleCase) {
            for (let x = 0; x < 512; x += tailleCase) {
                const pair = ((x / tailleCase) + (y / tailleCase)) % 2 === 0;
                context.fillStyle = pair ? "white" : "black";
                context.fillRect(x, y, tailleCase, tailleCase);
            }
        }

        texture.update();

        material.diffuseTexture = texture;
        material.backFaceCulling = false;

        mesh.material = material;
    }

    appliquerRayures(mesh) {
        const material = new BABYLON.StandardMaterial(
            `${mesh.name}_rayures`,
            mesh.getScene()
        );

        const texture = new BABYLON.DynamicTexture(
            `${mesh.name}_texture_rayures`,
            { width: 512, height: 512 },
            mesh.getScene(),
            false
        );

        const context = texture.getContext();
        const largeurRayure = 48;

        for (let x = 0; x < 512; x += largeurRayure) {
            const pair = Math.floor(x / largeurRayure) % 2 === 0;
            context.fillStyle = pair ? "white" : "black";
            context.fillRect(x, 0, largeurRayure, 512);
        }

        texture.update();

        material.diffuseTexture = texture;
        material.backFaceCulling = false;

        mesh.material = material;
    }
}