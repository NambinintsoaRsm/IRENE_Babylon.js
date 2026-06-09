/**
 * Crée la scène principale 3D.
 *
 * Cette scène contient le modèle, la caméra, les lumières
 * et les traitements visuels liés au rendu 3D.
 */
export class FabriqueScene3D {
    creer(moteur) {
        if (!moteur) {
            throw new Error("Moteur Babylon introuvable pour créer la scène 3D.");
        }

        const scene = new BABYLON.Scene(moteur);

        scene.clearColor = new BABYLON.Color4(1, 1, 1, 1);

        return scene;
    }
}