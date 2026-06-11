/**
 * Crée une scène Babylon séparée pour la GUI.
 *
 * Important : la GUI ne doit pas être dans scene3D, sinon les post-traitements
 * de la caméra 3D peuvent aussi modifier l'interface.
 */
export class FabriqueSceneGUI {
    creerScene(moteur) {
        if (!moteur) {
            throw new Error("Moteur Babylon introuvable pour créer la scène GUI.");
        }

        const scene = new BABYLON.Scene(moteur);
        scene.autoClear = false;
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

        const cameraGUI = new BABYLON.FreeCamera(
            "CameraGUI",
            new BABYLON.Vector3(0, 0, -10),
            scene
        );

        scene.activeCamera = cameraGUI;

        return scene;
    }

    creerTexture(sceneGUI) {
        if (!sceneGUI) {
            throw new Error("Scène GUI introuvable pour créer l'interface.");
        }

        return BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
            "InterfaceUtilisateur",
            true,
            sceneGUI
        );
    }

    /**
     * Compatibilité avec l'ancien appel creer(scene).
     * À éviter dans le nouveau main.js, car il faut appeler creerScene + creerTexture.
     */
    creer(sceneGUI) {
        return this.creerTexture(sceneGUI);
    }
}
