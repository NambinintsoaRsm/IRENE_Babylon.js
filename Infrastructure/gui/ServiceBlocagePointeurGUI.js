/**
 * Gestion stable de l'interaction caméra / GUI.
 *
 * Reprise de l'esprit de app.js :
 * - les zones GUI deviennent pointerBlocker ;
 * - à chaque frame on vérifie si le pointeur est sur une zone GUI visible ;
 * - si oui, on détache la caméra ;
 * - sinon, on la rattache.
 *
 * Cette méthode évite que la caméra réagisse pendant le déplacement d'un slider.
 */
export class ServiceBlocagePointeurGUI {
    constructor() {
        this.cameraBloquee = false;
        this.observateur = null;
    }

    brancherZones({
        camera,
        canvas,
        sceneGUI,
        controles = []
    }) {
        if (!camera || !canvas || !sceneGUI || !Array.isArray(controles)) {
            return;
        }

        controles.forEach((controle) => this.bloquerInteractionsModele(controle));

        if (this.observateur) {
            sceneGUI.onBeforeRenderObservable.remove(this.observateur);
            this.observateur = null;
        }

        this.observateur = sceneGUI.onBeforeRenderObservable.add(() => {
            const sourisSurGUI = controles.some((controle) => this.sourisSurControleVisible(controle, sceneGUI));

            if (sourisSurGUI && !this.cameraBloquee) {
                camera.detachControl(canvas);
                this.cameraBloquee = true;
            }

            if (!sourisSurGUI && this.cameraBloquee) {
                camera.attachControl(canvas, true);
                this.desactiverDeplacementClicDroit(camera, canvas);
                this.cameraBloquee = false;
            }
        });
    }

    desactiverDeplacementClicDroit(camera, canvas = null) {
        if (!camera) return;

        camera.panningSensibility = 0;

        if (typeof BABYLON !== "undefined" && BABYLON.Vector3) {
            camera.panningAxis = BABYLON.Vector3.Zero();
        }

        const pointeurs = camera.inputs?.attached?.pointers;
        if (pointeurs) {
            pointeurs.buttons = [0];
            pointeurs.panningSensibility = 0;
        }

        if (canvas && !canvas.__saotraClicDroitDesactive) {
            canvas.addEventListener("contextmenu", (evenement) => evenement.preventDefault());
            canvas.__saotraClicDroitDesactive = true;
        }
    }

    bloquerInteractionsModele(controle) {
        if (!controle) return;
        controle.isPointerBlocker = true;
        controle.isHitTestVisible = true;
    }

    sourisSurControleVisible(controle, sceneGUI) {
        if (!controle || !controle.isVisible) return false;

        const mesure = controle._currentMeasure;
        if (!mesure) return false;

        const x = sceneGUI.pointerX;
        const y = sceneGUI.pointerY;

        if (x === undefined || y === undefined) return false;

        return x >= mesure.left &&
            x <= mesure.left + mesure.width &&
            y >= mesure.top &&
            y <= mesure.top + mesure.height;
    }
}
