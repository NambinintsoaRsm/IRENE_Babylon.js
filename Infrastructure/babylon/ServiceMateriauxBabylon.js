/**
 * Gère les matériaux Babylon appliqués aux modèles.
 *
 * Les textures procédurales ne remplacent pas définitivement le matériau :
 * le matériau original est mémorisé pour pouvoir revenir à la texture de base.
 */
export class ServiceMateriauxBabylon {
    corrigerMateriaux(meshes = []) {
        meshes.forEach((mesh) => {
            if (!mesh || !mesh.material) return;

            this.memoriserMateriauOriginal(mesh);
            this.corrigerMateriau(mesh.material);
        });
    }

    memoriserMateriauOriginal(mesh) {
        if (!mesh || !mesh.material) return;

        mesh.metadata = mesh.metadata || {};

        if (!mesh.metadata.materiauOriginal) {
            mesh.metadata.materiauOriginal = mesh.material;
        }
    }

    corrigerMateriau(material) {
        if (!material) return;

        material.backFaceCulling = false;

        if (material.subMaterials && Array.isArray(material.subMaterials)) {
            material.subMaterials.forEach((subMaterial) => {
                if (subMaterial) subMaterial.backFaceCulling = false;
            });
        }
    }

    appliquerTextureProcedurale(meshes = [], typeTexture) {
        meshes.forEach((mesh) => {
            if (!mesh) return;

            this.memoriserMateriauOriginal(mesh);

            if (typeTexture === "originale") {
                this.restaurerTextureOriginale(mesh);
                return;
            }

            if (typeTexture === "damier") {
                this.appliquerDamier(mesh);
                return;
            }

            if (typeTexture === "rayures") {
                this.appliquerRayures(mesh);
            }
        });
    }

    restaurerTextureOriginale(mesh) {
        if (!mesh?.metadata?.materiauOriginal) return;

        mesh.material = mesh.metadata.materiauOriginal;
        this.corrigerMateriau(mesh.material);
    }

    appliquerDamier(mesh) {
        const material = new BABYLON.StandardMaterial(`${mesh.name}_damier`, mesh.getScene());
        const texture = new BABYLON.DynamicTexture(
            `${mesh.name}_texture_damier`,
            { width: 512, height: 512 },
            mesh.getScene(),
            false
        );

        const context = texture.getContext();
        const tailleCase = 24;

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
        const material = new BABYLON.StandardMaterial(`${mesh.name}_rayures`, mesh.getScene());
        const texture = new BABYLON.DynamicTexture(
            `${mesh.name}_texture_rayures`,
            { width: 512, height: 512 },
            mesh.getScene(),
            false
        );

        const context = texture.getContext();
        const largeurRayure = 12;

        for (let x = 0; x < 512; x += largeurRayure) {
            const pair = Math.floor(x / largeurRayure) % 2 === 0;
            context.fillStyle = pair ? "white" : "black";
            context.fillRect(0, x, 512, largeurRayure);
        }

        texture.update();
        material.diffuseTexture = texture;
        material.backFaceCulling = false;
        mesh.material = material;
    }
}
