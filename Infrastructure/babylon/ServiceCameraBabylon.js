/**
 * Gère la caméra Babylon.
 *
 * Il applique les paramètres du domaine vers une ArcRotateCamera Babylon :
 * position, cible, vitesse, molette, limites de distance et blocage.
 */
export class ServiceCameraBabylon {
    creerCamera(scene, canvas, parametresCamera) {
        if (!scene) {
            throw new Error("Scène Babylon introuvable pour créer la caméra.");
        }

        if (!canvas) {
            throw new Error("Canvas introuvable pour attacher la caméra.");
        }

        if (!parametresCamera) {
            throw new Error("Paramètres caméra introuvables.");
        }

        const cible = new BABYLON.Vector3(
            parametresCamera.cible.x,
            parametresCamera.cible.y,
            parametresCamera.cible.z
        );

        const camera = new BABYLON.ArcRotateCamera(
            "CameraPrincipale",
            parametresCamera.alpha,
            parametresCamera.beta,
            parametresCamera.rayon,
            cible,
            scene
        );

        camera.attachControl(canvas, true);

        this.appliquerParametres(camera, parametresCamera);

        return camera;
    }

    appliquerParametres(camera, parametresCamera) {
        if (!camera) {
            throw new Error("Caméra Babylon introuvable.");
        }

        if (!parametresCamera) {
            throw new Error("Paramètres caméra introuvables.");
        }

        camera.alpha = parametresCamera.alpha;
        camera.beta = parametresCamera.beta;
        camera.radius = parametresCamera.rayon;

        camera.target = new BABYLON.Vector3(
            parametresCamera.cible.x,
            parametresCamera.cible.y,
            parametresCamera.cible.z
        );

        camera.wheelPrecision = parametresCamera.wheelPrecision;

        camera.angularSensibilityX = parametresCamera.sensibiliteRotation;
        camera.angularSensibilityY = parametresCamera.sensibiliteRotation;

        camera.lowerRadiusLimit = parametresCamera.distanceMin;
        camera.upperRadiusLimit = parametresCamera.distanceMax;

        return camera;
    }

    memoriserPositionInitiale(etatApplication) {
        const camera = etatApplication.camera.cameraBabylon;

        if (!camera) {
            throw new Error("Caméra Babylon introuvable.");
        }

        etatApplication.camera.positionInitiale = {
            alpha: camera.alpha,
            beta: camera.beta,
            rayon: camera.radius
        };

        etatApplication.camera.cibleInitiale = {
            x: camera.target.x,
            y: camera.target.y,
            z: camera.target.z
        };

        etatApplication.camera.rayonInitial = camera.radius;
    }

    reinitialiserCamera(camera, parametresCamera) {
        return this.appliquerParametres(camera, parametresCamera);
    }

    bloquer(camera) {
        if (!camera) {
            throw new Error("Caméra Babylon introuvable.");
        }

        camera.detachControl();
    }

    debloquer(camera, canvas) {
        if (!camera) {
            throw new Error("Caméra Babylon introuvable.");
        }

        if (!canvas) {
            throw new Error("Canvas introuvable pour débloquer la caméra.");
        }

        camera.attachControl(canvas, true);
    }
}