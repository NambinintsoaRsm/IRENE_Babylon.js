import { constantesApparence } from "../../Configuration/constantesApparence.js";

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

    appliquerTextureProcedurale(meshes = [], typeTexture, options = {}) {
        const decalageMotif = Number(options.decalageMotif ?? 0);

        meshes.forEach((mesh) => {
            if (!mesh) return;

            this.memoriserMateriauOriginal(mesh);

            if (typeTexture === "originale" || typeTexture === null) {
                this.restaurerTextureOriginale(mesh);
                return;
            }

            if (typeTexture === "damier") {
                this.appliquerDamier(mesh, decalageMotif);
                return;
            }

            if (typeTexture === "rayures") {
                this.appliquerRayures(mesh, decalageMotif);
            }
        });
    }

    restaurerTextureOriginale(mesh) {
        if (!mesh?.metadata?.materiauOriginal) return;

        mesh.material = mesh.metadata.materiauOriginal;
        this.corrigerMateriau(mesh.material);
    }

    appliquerDamier(mesh, decalageMotif = 0) {
        const material = new BABYLON.StandardMaterial(`${mesh.name}_damier`, mesh.getScene());
        const texture = new BABYLON.DynamicTexture(
            `${mesh.name}_texture_damier`,
            {
                width: constantesApparence.textureMotif.texture.largeur,
                height: constantesApparence.textureMotif.texture.hauteur
            },
            mesh.getScene(),
            false
        );

        const context = texture.getContext();
        const largeurTexture = constantesApparence.textureMotif.texture.largeur;
        const hauteurTexture = constantesApparence.textureMotif.texture.hauteur;
        const tailleCase = this.calculerTailleDamier(decalageMotif);

        for (let y = 0; y < hauteurTexture; y += tailleCase) {
            for (let x = 0; x < largeurTexture; x += tailleCase) {
                const pair = (Math.floor(x / tailleCase) + Math.floor(y / tailleCase)) % 2 === 0;
                context.fillStyle = pair ? "white" : "black";
                context.fillRect(x, y, tailleCase, tailleCase);
            }
        }

        texture.update();
        material.diffuseTexture = texture;
        material.backFaceCulling = false;
        mesh.material = material;
    }

    appliquerRayures(mesh, decalageMotif = 0) {
        const material = new BABYLON.StandardMaterial(`${mesh.name}_rayures`, mesh.getScene());
        const texture = new BABYLON.DynamicTexture(
            `${mesh.name}_texture_rayures`,
            {
                width: constantesApparence.textureMotif.texture.largeur,
                height: constantesApparence.textureMotif.texture.hauteur
            },
            mesh.getScene(),
            false
        );

        const context = texture.getContext();
        const largeurTexture = constantesApparence.textureMotif.texture.largeur;
        const hauteurTexture = constantesApparence.textureMotif.texture.hauteur;
        const largeurRayure = this.calculerLargeurRayure(decalageMotif);

        for (let y = 0; y < hauteurTexture; y += largeurRayure) {
            const pair = Math.floor(y / largeurRayure) % 2 === 0;
            context.fillStyle = pair ? "white" : "black";
            context.fillRect(0, y, largeurTexture, largeurRayure);
        }

        texture.update();
        material.diffuseTexture = texture;
        material.backFaceCulling = false;
        mesh.material = material;
    }

    calculerTailleDamier(decalageMotif = 0) {
        const config = constantesApparence.textureMotif.damier;
        return Math.max(
            config.tailleMin,
            config.tailleBase + Number(decalageMotif) * config.pas
        );
    }

    calculerLargeurRayure(decalageMotif = 0) {
        const config = constantesApparence.textureMotif.rayures;
        return Math.max(
            config.largeurMin,
            config.largeurBase + Number(decalageMotif) * config.pas
        );
    }
}
