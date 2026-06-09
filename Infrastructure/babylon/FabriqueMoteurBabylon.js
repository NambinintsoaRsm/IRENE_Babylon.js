/**
 * Crée le moteur Babylon à partir du canvas HTML.
 *
 * Ce fichier ne contient pas de logique métier.
 * Il encapsule seulement la création technique du moteur Babylon.
 */
export class FabriqueMoteurBabylon {
    creer(canvas) {
        if (!canvas) {
            throw new Error("Canvas introuvable pour créer le moteur Babylon.");
        }

        return new BABYLON.Engine(canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true
        });
    }
}