/**
 * @file Catalogue de secours des modèles 3D livrés avec ANNA.
 *
 * La liste dynamique est normalement obtenue par ServiceDetectionModeles3D.
 * Ce catalogue reste volontairement petit : il fournit des modèles connus si
 * l'API PHP, le manifeste ou l'index de dossier n'est pas disponible.
 *
 * Pour ajouter un secours, renseigner un identifiant stable, un libellé, le
 * chemin relatif depuis index.html et le type de fichier accepté par Babylon.
 */
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
