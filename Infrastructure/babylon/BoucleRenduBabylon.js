/**
 * Lance la boucle de rendu Babylon.
 *
 * La scène 3D est rendue en premier.
 * La scène GUI est rendue ensuite, séparément, pour que les post-traitements
 * 3D n'affectent jamais les menus.
 */
export class BoucleRenduBabylon {
    lancer(moteur, scene3D, sceneGUI = null, sceneContoursCouleur = null, doitRendreContoursCouleur = null) {
        if (!moteur) {
            throw new Error("Moteur Babylon introuvable pour lancer la boucle de rendu.");
        }

        if (!scene3D) {
            throw new Error("Scène 3D introuvable pour lancer la boucle de rendu.");
        }

        moteur.runRenderLoop(() => {
            scene3D.render();

            if (sceneContoursCouleur && typeof doitRendreContoursCouleur === "function" && doitRendreContoursCouleur()) {
                sceneContoursCouleur.render();
            }

            if (sceneGUI) {
                sceneGUI.render();
            }
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
