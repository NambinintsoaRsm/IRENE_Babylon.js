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
        id: "Pot",
        nom: "Pot",
        chemin: "assets/modeles/pot/pot.glb",
        type: "glb"
    }),

    new Modele3D(
        {
           id: "Pot cassé",
           nom: "Pot cassé",
            chemin: "assets/modeles/pot_casse/pot_cassé.glb",
            type:"glb"
        })
]);
