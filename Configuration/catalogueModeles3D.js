import { Modele3D } from "../Domain/modele3d/Modele3D.js";

export const catalogueModeles3D = Object.freeze([
    // Modèles GLB utilisés pour les tests IRENE.
    // Les chemins restent relatifs pour éviter les erreurs au déploiement.
    new Modele3D({
        id: "pot",
        nom: "Pot",
        chemin: "assets/modeles/glb/pot.glb",
        type: "glb"
    }),

    new Modele3D({
        id: "pot_casse",
        nom: "Pot cassé",
        chemin: "assets/modeles/glb/pot_cassé.glb",
        type: "glb"
    })

    /*
    // Anciens modèles OBJ conservés en commentaire.
    // Ils peuvent être réactivés plus tard si besoin, mais l'onglet Modèles
    // utilise maintenant les fichiers GLB ci-dessus.

    ,new Modele3D({
        id: "objet1",
        nom: "objet 1",
        chemin: "assets/modeles/Objet-1/6005793941226.obj",
        type: "obj"
    })

    ,new Modele3D({
        id: "objet2",
        nom: "objet 2",
        chemin: "assets/modeles/Objet-2/60057107471833.obj",
        type: "obj"
    })
    */
]);
