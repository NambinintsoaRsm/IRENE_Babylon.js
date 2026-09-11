/**
 * Gestion stable de l'interaction caméra / GUI.
 *
 * Règles :
 * - quand le pointeur est au-dessus d'une zone GUI visible, la caméra est détachée ;
 * - pendant le glissement d'un Slider, le verrou reste actif jusqu'au relâchement
 *   du pointeur, même si la souris sort momentanément du panneau ;
 * - après relâchement hors GUI, la caméra est rattachée normalement.
 */
export class ServiceBlocagePointeurGUI {
    constructor() {
        this.cameraBloquee = false;
        this.observateur = null;
        this.interactionGUIEnCours = false;
        this.cameraCourante = null;
        this.canvasCourant = null;
        this.gestionnairesRelachementInstallés = false;
        this.verrouForce = false;
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

        this.cameraCourante = camera;
        this.canvasCourant = canvas;

        controles.forEach((controle) => {
            this.bloquerInteractionsModele(controle);
            this.brancherVerrouillageSlidersRecursif(controle);
        });

        this.installerRelachementGlobal();

        if (this.observateur) {
            sceneGUI.onBeforeRenderObservable.remove(this.observateur);
            this.observateur = null;
        }

        this.observateur = sceneGUI.onBeforeRenderObservable.add(() => {
            const sourisSurGUI = controles.some((controle) =>
                this.sourisSurControleVisible(controle, sceneGUI)
            );
            const doitBloquer = this.verrouForce || sourisSurGUI || this.interactionGUIEnCours;

            if (doitBloquer && !this.cameraBloquee) {
                this.detacherCamera();
            }

            if (!doitBloquer && this.cameraBloquee) {
                this.rattacherCamera();
            }
        });
    }

    brancherVerrouillageSlidersRecursif(controle) {
        if (!controle) return;

        if (controle instanceof BABYLON.GUI.Slider || controle.className === "Slider") {
            this.brancherVerrouillageSlider(controle);
        }

        const enfants = Array.isArray(controle.children)
            ? controle.children
            : (Array.isArray(controle._children) ? controle._children : []);

        enfants.forEach((enfant) => this.brancherVerrouillageSlidersRecursif(enfant));
    }

    brancherVerrouillageSlider(slider) {
        slider.metadata = slider.metadata || {};

        if (slider.metadata.saotraVerrouillageCameraSliderInstalle === true) {
            return;
        }

        slider.metadata.saotraVerrouillageCameraSliderInstalle = true;
        slider.isPointerBlocker = true;
        slider.isHitTestVisible = true;

        slider.onPointerDownObservable?.add?.(() => {
            this.interactionGUIEnCours = true;
            this.detacherCamera();
        });

        slider.onPointerUpObservable?.add?.(() => {
            this.interactionGUIEnCours = false;
        });
    }

    installerRelachementGlobal() {
        if (this.gestionnairesRelachementInstallés || typeof window === "undefined") {
            return;
        }

        const relacher = () => {
            this.interactionGUIEnCours = false;
        };

        window.addEventListener("pointerup", relacher, true);
        window.addEventListener("mouseup", relacher, true);
        window.addEventListener("touchend", relacher, true);
        window.addEventListener("touchcancel", relacher, true);
        window.addEventListener("blur", relacher, true);

        this.gestionnairesRelachementInstallés = true;
    }

    definirVerrouForce(actif = true) {
        this.verrouForce = Boolean(actif);

        if (this.verrouForce) {
            this.detacherCamera();
            return;
        }

        if (!this.interactionGUIEnCours) {
            this.rattacherCamera();
        }
    }

    detacherCamera() {
        const camera = this.cameraCourante;
        const canvas = this.canvasCourant;
        if (!camera || this.cameraBloquee) return;

        camera.detachControl(canvas);
        this.cameraBloquee = true;
    }

    rattacherCamera() {
        const camera = this.cameraCourante;
        const canvas = this.canvasCourant;
        if (!camera || !canvas || !this.cameraBloquee) return;

        camera.attachControl(canvas, true);
        this.desactiverDeplacementClicDroit(camera, canvas);
        this.cameraBloquee = false;
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
