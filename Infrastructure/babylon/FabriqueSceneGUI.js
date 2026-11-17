import { configurationResolutionGUI } from "../../Configuration/configurationResolutionGUI.js";

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

    creerTexture(sceneGUI, nom = "InterfaceUtilisateur") {
        if (!sceneGUI) {
            throw new Error("Scène GUI introuvable pour créer l'interface.");
        }

        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
            nom,
            true,
            sceneGUI
        );

        advancedTexture.idealWidth = configurationResolutionGUI.idealWidth;
        advancedTexture.idealHeight = configurationResolutionGUI.idealHeight;
        advancedTexture.useSmallestIdeal = configurationResolutionGUI.useSmallestIdeal;

        return advancedTexture;
    }

    /**
     * Compatibilité avec l'ancien appel creer(scene).
     * À éviter dans le nouveau main.js, car il faut appeler creerScene + creerTexture.
     */
    creer(sceneGUI) {
        return this.creerTexture(sceneGUI);
    }
}