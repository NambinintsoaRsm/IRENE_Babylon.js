/**
 * @file Gestion des matériaux et textures alternatives des modèles 3D.
 *
 * Rôle : mémoriser les matériaux d'origine puis appliquer/restaurer les textures
 * procédurales de la V1 (damiers et rayures) sans perdre l'état initial du modèle.
 *
 * Utilisation : ControleurApparence et ControleurProfil appellent ce service lors
 * d'un changement de texture ou de la restauration d'un profil.
 */
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
        if (!mesh || !mesh.material) return;

        const modifierMateriau = (material) => {
            if (!material) return;

            // PBR
            if (material.albedoTexture) {
                material.albedoTexture = null;
                material.albedoColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            }

            // StandardMaterial
           else if (material.diffuseTexture) {
                material.diffuseTexture = null;
                material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            }

            material.backFaceCulling = false;
        };

        if (mesh.material.subMaterials) {
            mesh.material.subMaterials.forEach(modifierMateriau);
        } else {
            modifierMateriau(mesh.material);
        }
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
