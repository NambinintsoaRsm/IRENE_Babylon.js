/**
 * @file Profil initial utilisé lorsqu'aucune sauvegarde utilisateur n'est disponible.
 *
 * Ce fichier assemble les valeurs de Configuration/*.js dans les objets métier.
 * Il ne doit pas contenir de nombres magiques : toute valeur réglable doit venir
 * d'un fichier de constantes afin que le profil et l'interface restent cohérents.
 */
import { ProfilUtilisateur } from "../Domain/profil/ProfilUtilisateur.js";

import { ParametresInterface } from "../Domain/interface/ParametresInterface.js";
import { ParametresApparence } from "../Domain/apparence/ParametresApparence.js";
import { ParametresContours } from "../Domain/contours/ParametresContours.js";
import { TypeContour } from "../Domain/contours/TypeContour.js";
import { ParametresCamera } from "../Domain/camera/ParametresCamera.js";

import { constantesInterface } from "./constantesInterface.js";
import { constantesApparence } from "./constantesApparence.js";
import { constantesContours } from "./constantesContours.js";
import { constantesCamera } from "./constantesCamera.js";

export const profilParDefaut = new ProfilUtilisateur({
    interfaceUtilisateur: new ParametresInterface({
        police: constantesInterface.policeDefaut,
        taillePolice: constantesInterface.taillePoliceDefaut,
        gras: constantesInterface.grasDefaut,
        theme: constantesInterface.themeDefaut,
        positionMenu: constantesInterface.positionMenuDefaut,
        tailleBorduresMenu: constantesInterface.tailleBorduresMenuDefaut,
        tailleBorduresBoutons: constantesInterface.tailleBorduresBoutonsDefaut
    }),

    apparence: new ParametresApparence({
        contraste: constantesApparence.contraste.defaut,
        luminosite: constantesApparence.luminosite.defaut,
        saturation: constantesApparence.saturation.defaut,
        nettete: constantesApparence.nettete.defaut,
        textureActive: constantesApparence.textureDefaut,
        textureMotifTaille: constantesApparence.textureMotif.slider.defaut,
        fondScene: 0
    }),

    // V1 : seul le contour de silhouette est exposé.
    // La structure typesActifs/typeActif reste générique afin de pouvoir
    // réintroduire d'autres types de contours dans une V2 sans migration lourde.
    contours: new ParametresContours({
        actif: false,
        typeActif: null,
        typesActifs: [],
        epaisseur: constantesContours.epaisseurDefaut,
        seuil: constantesContours.seuils[TypeContour.SILHOUETTE],
        couleur: constantesContours.couleurDefaut,
        couleurAutomatiqueActive: true,
        couleurManuelleChoisie: false
    }),

    camera: new ParametresCamera({
        alpha: constantesCamera.alphaInitial,
        beta: constantesCamera.betaInitial,
        rayon: constantesCamera.rayonInitial,
        cible: constantesCamera.cibleInitiale,
        zoom: constantesCamera.zoomInitial,
        wheelPrecision: constantesCamera.wheelPrecision,
        sensibiliteRotation: constantesCamera.sensibiliteRotation,
        distanceMin: constantesCamera.distanceMin,
        distanceMax: constantesCamera.distanceMax,
        estBloquee: false
    }),

    modele3DId: null
});
