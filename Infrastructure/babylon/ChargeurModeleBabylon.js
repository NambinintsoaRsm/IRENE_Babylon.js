/**
 * Charge un modèle 3D dans la scène Babylon.
 *
 * Le modèle vient du catalogue Configuration/catalogueModeles3D.js.
 * Les chemins restent relatifs : ex. assets/modeles/glb/pot.glb.
 */
export class ChargeurModeleBabylon {
    async charger(scene, modele) {
        if (!scene) {
            throw new Error("Scène Babylon introuvable pour charger le modèle.");
        }

        if (!modele || !modele.chemin) {
            throw new Error("Modèle 3D invalide ou chemin manquant.");
        }

        const { dossier, fichier } = this.extraireDossierEtFichier(modele.chemin);

        // Babylon détecte le loader à partir de l'extension : .obj, .glb, .gltf, etc.
        // Les anciens OBJ restent donc possibles si on les remet dans le catalogue,
        // mais les modèles actifs sont maintenant les GLB.
        const resultat = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            dossier,
            fichier,
            scene
        );

        const meshesImportes = resultat.meshes ?? [];
        const meshActuel = meshesImportes.find((mesh) => mesh?.getTotalVertices?.() > 0)
            ?? meshesImportes[0]
            ?? null;

        return {
            modele,
            meshActuel,
            meshesImportes,
            resultat
        };
    }

    extraireDossierEtFichier(chemin) {
        const dernierSlash = chemin.lastIndexOf("/");

        if (dernierSlash === -1) {
            return {
                dossier: "",
                fichier: chemin
            };
        }

        return {
            dossier: chemin.substring(0, dernierSlash + 1),
            fichier: chemin.substring(dernierSlash + 1)
        };
    }
}
