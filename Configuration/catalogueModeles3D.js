import { Modele3D } from "../Domain/modele3d/Modele3D.js";

export const catalogueModeles3D = Object.freeze([
    new Modele3D({
        id: "objet1",
        nom: "Objet 1",
        chemin: "assets/modeles/objet-1/6005793941226.obj",
        type: "obj"
    }),

    new Modele3D({
        id: "objet2",
        nom: "Objet 2",
        chemin: "assets/modeles/objet-2/60057107471833.obj",
        type: "obj"
    })
]);