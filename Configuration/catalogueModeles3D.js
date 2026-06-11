import { Modele3D } from "../Domain/modele3d/Modele3D.js";

export const catalogueModeles3D = Object.freeze([
    new Modele3D({
        id: "objet1",
        nom: "objet 1",
        chemin: "assets/modeles/Objet-1/6005793941226.obj",
        type: "obj"
    }),

    new Modele3D({
        id: "objet2",
        nom: "objet 2",
        chemin: "assets/modeles/Objet-2/60057107471833.obj",
        type: "obj"
    })
]);