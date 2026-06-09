/**
 * Service prévu pour choisir une vue intéressante du modèle.
 * TODO : calcul de l'entropie à intégrer
 */
export class ServiceEntropieVueBabylon {
    choisirVue(camera, meshes) {
        if (!camera) {
            throw new Error("Caméra Babylon introuvable pour choisir une vue.");
        }

        if (!Array.isArray(meshes) || meshes.length === 0) {
            throw new Error("Aucun modèle disponible pour choisir une vue.");
        }

        return {
            alpha: camera.alpha,
            beta: camera.beta,
            rayon: camera.radius
        };
    }
}