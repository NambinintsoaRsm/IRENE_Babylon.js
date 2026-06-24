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

        if (!mesh.metadata.etatMateriauOriginal) {
            mesh.metadata.etatMateriauOriginal = {
                useVertexColors: mesh.useVertexColors,
                hasVertexAlpha: mesh.hasVertexAlpha,
                visibility: mesh.visibility,
                isVisible: mesh.isVisible
            };
        }
    }

    corrigerMateriau(material) {
        if (!material) return;

        this.forcerMateriauOpaqueEtDoubleFace(material);
        this.ameliorerReactionLumiereMateriauGlb(material);

        if (material.subMaterials && Array.isArray(material.subMaterials)) {
            material.subMaterials.forEach((subMaterial) => {
                this.forcerMateriauOpaqueEtDoubleFace(subMaterial);
                this.ameliorerReactionLumiereMateriauGlb(subMaterial);
            });
        }
    }

    forcerMateriauOpaqueEtDoubleFace(material) {
        if (!material) return;

        material.backFaceCulling = false;
        material.alpha = 1;
        material.forceDepthWrite = true;
        material.needDepthPrePass = true;

        if (BABYLON?.Material?.MATERIAL_OPAQUE !== undefined) {
            material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
        }

        this.forcerTextureOpaque(material.albedoTexture);
        this.forcerTextureOpaque(material.diffuseTexture);
        this.forcerTextureOpaque(material.opacityTexture);
        this.forcerTextureOpaque(material.emissiveTexture);
    }

    forcerTextureOpaque(texture) {
        if (!texture) return;

        texture.hasAlpha = false;
        texture.getAlphaFromRGB = false;
    }

    ameliorerReactionLumiereMateriauGlb(material) {
        if (!material) return;

        // Les GLB importés par Babylon utilisent souvent des PBRMaterial.
        // Ces matériaux peuvent paraître fades avec les lumières simples de l'application,
        // surtout si la texture est déjà sombre ou très mate.
        const nomClasse = material.getClassName?.() ?? "";
        const estPBR = nomClasse.includes("PBR")
            || "metallic" in material
            || "roughness" in material
            || "directIntensity" in material;

        if (!estPBR) {
            this.ameliorerReactionLumiereMateriauStandard(material);
            return;
        }

        material.disableLighting = false;

        if ("metallic" in material) {
            material.metallic = 0;
        }

        if ("roughness" in material) {
            const roughnessActuelle = Number(material.roughness);
            material.roughness = Number.isFinite(roughnessActuelle)
                ? Math.min(Math.max(roughnessActuelle, 0.35), 0.62)
                : 0.5;
        }

        // Augmente l'effet des lumières directes sans transformer l'objet en matériau émissif.
        if ("directIntensity" in material) {
            material.directIntensity = 1.75;
        }

        // On garde une faible contribution environnementale pour éviter un rendu trop plat.
        if ("environmentIntensity" in material) {
            material.environmentIntensity = 0.45;
        }

        // Certains GLB ont une albedoColor grise qui multiplie la texture et l'assombrit.
        // Si une texture existe, on laisse la texture porter la couleur réelle du modèle.
        if (material.albedoTexture && "albedoColor" in material) {
            material.albedoColor = BABYLON.Color3.White();
        }

        if ("usePhysicalLightFalloff" in material) {
            material.usePhysicalLightFalloff = false;
        }

        if ("specularIntensity" in material) {
            material.specularIntensity = 0.35;
        }
    }

    ameliorerReactionLumiereMateriauStandard(material) {
        if (!material) return;

        material.disableLighting = false;

        if ("diffuseColor" in material && material.diffuseTexture) {
            material.diffuseColor = BABYLON.Color3.White();
        }

        if ("specularColor" in material) {
            material.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
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

            // Les textures de substitution doivent remplacer l'apparence du GLB.
            // On désactive donc les couleurs de vertex et l'alpha éventuel du modèle,
            // sinon le blanc du damier/rayures peut être teinté par la couleur originale.
            this.preparerMeshPourTextureSubstitution(mesh);

            if (typeTexture === "damier") {
                this.appliquerDamier(mesh, decalageMotif);
                return;
            }

            if (typeTexture === "rayures") {
                this.appliquerRayures(mesh, decalageMotif);
            }
        });
    }

    preparerMeshPourTextureSubstitution(mesh) {
        if (!mesh) return;

        if ("useVertexColors" in mesh) {
            mesh.useVertexColors = false;
        }

        if ("hasVertexAlpha" in mesh) {
            mesh.hasVertexAlpha = false;
        }

        mesh.visibility = 1;
        mesh.isVisible = true;
    }

    restaurerTextureOriginale(mesh) {
        if (!mesh?.metadata?.materiauOriginal) return;

        mesh.material = mesh.metadata.materiauOriginal;

        const etatOriginal = mesh.metadata.etatMateriauOriginal;

        if (etatOriginal) {
            if ("useVertexColors" in mesh) {
                mesh.useVertexColors = etatOriginal.useVertexColors;
            }

            if ("hasVertexAlpha" in mesh) {
                mesh.hasVertexAlpha = etatOriginal.hasVertexAlpha;
            }

            if (etatOriginal.visibility !== undefined) {
                mesh.visibility = etatOriginal.visibility;
            }

            if (etatOriginal.isVisible !== undefined) {
                mesh.isVisible = etatOriginal.isVisible;
            }
        }

        this.corrigerMateriau(mesh.material);
    }

    appliquerDamier(mesh, decalageMotif = 0) {
        const texture = this.creerTextureDamier(mesh, decalageMotif);
        mesh.material = this.creerMateriauSubstitution(mesh, "damier", texture);
    }

    appliquerRayures(mesh, decalageMotif = 0) {
        const texture = this.creerTextureRayures(mesh, decalageMotif);
        mesh.material = this.creerMateriauSubstitution(mesh, "rayures", texture);
    }

    creerTextureDamier(mesh, decalageMotif = 0) {
        const texture = this.creerTextureDynamique(mesh, "texture_damier");
        const context = texture.getContext();
        const largeurTexture = constantesApparence.textureMotif.texture.largeur;
        const hauteurTexture = constantesApparence.textureMotif.texture.hauteur;
        const tailleCase = this.calculerTailleDamier(decalageMotif);

        context.clearRect(0, 0, largeurTexture, hauteurTexture);

        for (let y = 0; y < hauteurTexture; y += tailleCase) {
            for (let x = 0; x < largeurTexture; x += tailleCase) {
                const pair = (Math.floor(x / tailleCase) + Math.floor(y / tailleCase)) % 2 === 0;
                context.fillStyle = pair ? "#FFFFFF" : "#000000";
                context.fillRect(x, y, tailleCase, tailleCase);
            }
        }

        texture.update(false);
        this.configurerTextureSubstitution(texture);

        return texture;
    }

    creerTextureRayures(mesh, decalageMotif = 0) {
        const texture = this.creerTextureDynamique(mesh, "texture_rayures");
        const context = texture.getContext();
        const largeurTexture = constantesApparence.textureMotif.texture.largeur;
        const hauteurTexture = constantesApparence.textureMotif.texture.hauteur;
        const largeurRayure = this.calculerLargeurRayure(decalageMotif);

        context.clearRect(0, 0, largeurTexture, hauteurTexture);

        for (let y = 0; y < hauteurTexture; y += largeurRayure) {
            const pair = Math.floor(y / largeurRayure) % 2 === 0;
            context.fillStyle = pair ? "#FFFFFF" : "#000000";
            context.fillRect(0, y, largeurTexture, largeurRayure);
        }

        texture.update(false);
        this.configurerTextureSubstitution(texture);

        return texture;
    }

    creerTextureDynamique(mesh, suffixe) {
        return new BABYLON.DynamicTexture(
            `${mesh.name}_${suffixe}`,
            {
                width: constantesApparence.textureMotif.texture.largeur,
                height: constantesApparence.textureMotif.texture.hauteur
            },
            mesh.getScene(),
            false
        );
    }

    configurerTextureSubstitution(texture) {
        if (!texture) return;

        texture.hasAlpha = false;
        texture.getAlphaFromRGB = false;
        texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
        texture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    }

    creerMateriauSubstitution(mesh, typeTexture, texture) {
        const material = new BABYLON.StandardMaterial(
            `${mesh.name}_${typeTexture}_noir_blanc`,
            mesh.getScene()
        );

        // Texture réellement substitutive : elle ne doit pas être multipliée
        // par la couleur marron/dorée ou les vertex colors du GLB.
        material.diffuseTexture = texture;
        material.emissiveTexture = texture;

        material.diffuseColor = BABYLON.Color3.White();
        material.emissiveColor = BABYLON.Color3.White();
        material.ambientColor = BABYLON.Color3.White();
        material.specularColor = BABYLON.Color3.Black();

        // On désactive l'influence de la lumière pour garder un vrai noir/blanc.
        // Sans ça, un éclairage chaud peut transformer le blanc en beige/orangé.
        material.disableLighting = true;

        material.alpha = 1;
        material.backFaceCulling = false;
        material.forceDepthWrite = true;
        material.needDepthPrePass = true;

        if (BABYLON?.Material?.MATERIAL_OPAQUE !== undefined) {
            material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
        }

        this.forcerTextureOpaque(material.diffuseTexture);
        this.forcerTextureOpaque(material.emissiveTexture);

        return material;
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
