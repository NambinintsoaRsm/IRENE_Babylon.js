import { ProfilUtilisateur } from "../Domain/profil/ProfilUtilisateur.js";

import { ParametresInterface } from "../Domain/interface/ParametresInterface.js";
import { ParametresApparence } from "../Domain/apparence/ParametresApparence.js";
import { ParametresContours } from "../Domain/contours/ParametresContours.js";
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
        textureActive: constantesApparence.textureDefaut
    }),

    contours: new ParametresContours({
        actif: false,
        typeActif: null,
        epaisseur: constantesContours.epaisseurDefaut,
        seuil: constantesContours.seuils,
        couleur: constantesContours.couleurDefaut
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