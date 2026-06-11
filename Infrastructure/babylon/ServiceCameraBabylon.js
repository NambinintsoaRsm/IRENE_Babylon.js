import { constantesCamera } from "../../Configuration/constantesCamera.js";
import {
    filtrerMeshesValides,
    calculerBornesMeshes
} from "../../Util/BabylonUtils.js";

/**
 * Gère la caméra Babylon.
 *
 * Rappels Babylon :
 * - wheelPrecision : plus la valeur est grande, plus le zoom molette est lent ;
 * - angularSensibilityX/Y : plus la valeur est grande, plus la rotation est lente ;
 * - lowerRadiusLimit : empêche de traverser l'objet ;
 * - upperRadiusLimit : empêche de partir trop loin.
 */
export class ServiceCameraBabylon {
    creerCamera(scene, canvas, parametresCamera) {
        if (!scene) throw new Error("Scène Babylon introuvable pour créer la caméra.");
        if (!canvas) throw new Error("Canvas introuvable pour attacher la caméra.");
        if (!parametresCamera) throw new Error("Paramètres caméra introuvables.");

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
        if (!camera) throw new Error("Caméra Babylon introuvable.");
        if (!parametresCamera) throw new Error("Paramètres caméra introuvables.");

        camera.alpha = parametresCamera.alpha;
        camera.beta = parametresCamera.beta;
        camera.radius = parametresCamera.rayon;

        camera.setTarget(new BABYLON.Vector3(
            parametresCamera.cible.x,
            parametresCamera.cible.y,
            parametresCamera.cible.z
        ));

        camera.wheelPrecision = parametresCamera.wheelPrecision ?? constantesCamera.wheelPrecision;
        camera.angularSensibilityX = parametresCamera.sensibiliteRotation ?? constantesCamera.sensibiliteRotation;
        camera.angularSensibilityY = parametresCamera.sensibiliteRotation ?? constantesCamera.sensibiliteRotation;
        camera.lowerRadiusLimit = parametresCamera.distanceMin ?? constantesCamera.distanceMin;
        camera.upperRadiusLimit = parametresCamera.distanceMax ?? constantesCamera.distanceMax;

        return camera;
    }

    memoriserPositionInitiale(etatApplication) {
        this.memoriserVueCouranteModele(etatApplication);
    }

    memoriserVueCouranteModele(etatApplication) {
        const camera = etatApplication.camera.cameraBabylon;
        if (!camera) return;

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

    reinitialiserZoomDepuisMeshes(camera, meshes, facteurCadrage = constantesCamera.facteurCadrage) {
        const infos = this.calculerInfosMeshes(meshes);
        if (!camera || !infos) return null;

        const rayon = this.calculerRayonCamera(infos, facteurCadrage);

        camera.setTarget(infos.centre);
        camera.radius = rayon;
        this.appliquerLimitesDepuisInfos(camera, infos);
        this.appliquerSensibiliteStable(camera);

        return this.creerResultatCamera(camera, infos.centre);
    }

    reinitialiserPositionDepuisMeshes(camera, meshes, {
        alpha = constantesCamera.alphaInitial,
        beta = constantesCamera.betaInitial,
        facteurCadrage = constantesCamera.facteurCadrage
    } = {}) {
        const infos = this.calculerInfosMeshes(meshes);
        if (!camera || !infos) return null;

        const rayon = this.calculerRayonCamera(infos, facteurCadrage);

        camera.alpha = alpha;
        camera.beta = beta;
        camera.setTarget(infos.centre);
        camera.radius = rayon;
        this.appliquerLimitesDepuisInfos(camera, infos);
        this.appliquerSensibiliteStable(camera);

        return this.creerResultatCamera(camera, infos.centre);
    }

    reinitialiserZoomEtPositionDepuisMeshes(camera, meshes, options = {}) {
        return this.reinitialiserPositionDepuisMeshes(camera, meshes, options);
    }

    calculerInfosMeshes(meshes = []) {
        const meshesValides = filtrerMeshesValides(meshes);
        if (meshesValides.length === 0) return null;
        return calculerBornesMeshes(meshesValides);
    }

    calculerRayonCamera(infos, facteurCadrage) {
        const rayonObjet = Math.max(Number(infos.rayon) || 0, 0.5);
        return Math.max(rayonObjet * facteurCadrage, 1.2);
    }

    appliquerLimitesDepuisInfos(camera, infos, constantesCamera = {}) {
        const rayonObjet = Math.max(Number(infos.rayon) || 0.5, 0.5);

        const multiplicateurDistanceMin = constantesCamera.multiplicateurDistanceMin ?? 1.9;
        const distanceMinAbsolue = constantesCamera.distanceMinAbsolue ?? 1.5;

        const multiplicateurDistanceMax = constantesCamera.multiplicateurDistanceMax ?? 5.2;
        const distanceMaxAbsolue = constantesCamera.distanceMaxAbsolue ?? 5;

        camera.lowerRadiusLimit = Math.max(
            rayonObjet * multiplicateurDistanceMin,
            distanceMinAbsolue
        );

        camera.upperRadiusLimit = Math.max(
            rayonObjet * multiplicateurDistanceMax,
            distanceMaxAbsolue
        );

        if (camera.radius < camera.lowerRadiusLimit) {
            camera.radius = camera.lowerRadiusLimit;
        }

        if (camera.radius > camera.upperRadiusLimit) {
            camera.radius = camera.upperRadiusLimit;
        }
    }

    appliquerSensibiliteStable(camera) {
        camera.wheelPrecision = constantesCamera.wheelPrecision;
        camera.angularSensibilityX = constantesCamera.sensibiliteRotation;
        camera.angularSensibilityY = constantesCamera.sensibiliteRotation;
    }

    creerResultatCamera(camera, cible) {
        return {
            cible: this.vectorVersObjet(cible),
            rayon: camera.radius,
            alpha: camera.alpha,
            beta: camera.beta,
            distanceMin: camera.lowerRadiusLimit,
            distanceMax: camera.upperRadiusLimit,
            wheelPrecision: camera.wheelPrecision,
            sensibiliteRotation: camera.angularSensibilityX
        };
    }

    vectorVersObjet(vector) {
        return { x: vector.x, y: vector.y, z: vector.z };
    }

    bloquer(camera) {
        if (!camera) throw new Error("Caméra Babylon introuvable.");
        camera.detachControl();
    }

    debloquer(camera, canvas) {
        if (!camera) throw new Error("Caméra Babylon introuvable.");
        if (!canvas) throw new Error("Canvas introuvable pour débloquer la caméra.");
        camera.attachControl(canvas, true);
    }
}
