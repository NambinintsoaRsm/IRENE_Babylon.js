/**
 * Lance la boucle de rendu Babylon.
 *
 * Cette boucle rend la scène 3D en continu.
 */
export class BoucleRenduBabylon {
    lancer(moteur, scene) {
        if (!moteur) {
            throw new Error("Moteur Babylon introuvable pour lancer la boucle de rendu.");
        }

        if (!scene) {
            throw new Error("Scène Babylon introuvable pour lancer la boucle de rendu.");
        }

        moteur.runRenderLoop(() => {
            scene.render();
        });
    }

    gererRedimensionnement(moteur) {
        if (!moteur) {
            throw new Error("Moteur Babylon introuvable pour gérer le redimensionnement.");
        }

        window.addEventListener("resize", () => {
            moteur.resize();
        });
    }
}