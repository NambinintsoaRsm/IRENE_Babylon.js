/**
 * @file Paramètres des éclairages Babylon d'ANNA.
 *
 * Les valeurs sont centralisées ici afin d'éviter de disperser dans le service
 * Babylon les directions, intensités et seuils de suivi de la caméra.
 */
export const constantesLumiere = Object.freeze({
    typeDefaut: "principale",

    intensite: Object.freeze({
        minimum: 0.2,
        maximum: 2.5,
        pas: 0.1,
        defaut: 1.2
    }),

    temperature: Object.freeze({
        minimum: 0,
        maximum: 100,
        pas: 1,
        defaut: 50
    }),

    principale: Object.freeze({
        // Une base faible reste active avec les spots afin d'éviter que les
        // zones non directement éclairées deviennent complètement noires.
        facteurAmbiantAvecSpot: 0.35,
        direction: Object.freeze({ x: 0, y: 1, z: 0 })
    }),

    directionnelle: Object.freeze({
        // Direction des rayons lumineux dans le repère de référence.
        // Spot haut : source au-dessus, rayons vers le bas.
        // Spot bas  : source en-dessous, rayons vers le haut.
        directionsReference: Object.freeze({
            haut: Object.freeze({ x: 0, y: -1, z: 0 }),
            bas: Object.freeze({ x: 0, y: 1, z: 0 })
        }),
        distancePosition: 8
    }),

    tournante: Object.freeze({
        facteurVitesse: 0.35,
        composanteVerticale: -0.7,
        directionInitiale: Object.freeze({ x: -1, y: -0.7, z: 0 })
    }),

    /**
     * ANNA manipule une ArcRotateCamera : l'objet reste physiquement fixe.
     * Pour Haut/Bas, on compense ce choix technique en faisant évoluer la
     * direction effective du spot comme si l'objet tournait réellement sous
     * une lumière fixe dans la scène.
     */
    suiviOrientationCamera: Object.freeze({
        actif: true,
        epsilonAngle: 0.00001,
        debug: true,
        delaiLogMs: 180
    })
});
