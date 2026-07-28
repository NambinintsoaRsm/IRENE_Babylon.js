import { Modele3D } from "../Domain/modele3d/Modele3D.js";

/**
 * Catalogue de secours utilisé uniquement si assets/modeles/modeles.json
 * n'est pas accessible. Cette branche publiée accepte exclusivement les GLB.
 *
 * Les fichiers GLB ne sont pas inclus dans l'archive de code : ils doivent
 * être déposés aux chemins indiqués ci-dessous ou déclarés dans modeles.json.
 */
export const catalogueModeles3D = Object.freeze([
    new Modele3D({
        id: "objet1",
        nom: "Objet 1",
        chemin: "assets/modeles/Objet-1/6005793941226.glb",
        type: "glb"
    }),

    new Modele3D({
        id: "objet2",
        nom: "Objet 2",
        chemin: "assets/modeles/Objet-2/60057107471833.glb",
        type: "glb"
    })
]);
