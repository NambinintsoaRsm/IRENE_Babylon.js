/**
 * Crée la scène principale 3D.
 *
 * La scène démarre uniquement avec la lumière principale.
 * Les lumières Haut / Bas / Tournante sont ajoutées ensuite par ServiceLumiereBabylon.
 */
export class FabriqueScene3D {
    creer(moteur) {
        if (!moteur) {
            throw new Error("Moteur Babylon introuvable pour créer la scène 3D.");
        }

        const scene = new BABYLON.Scene(moteur);
        scene.clearColor = new BABYLON.Color4(1, 1, 1, 1);

        this.creerLumieresParDefaut(scene);

        return scene;
    }

    creerLumieresParDefaut(scene) {
        const lumierePrincipale = new BABYLON.HemisphericLight(
            "LumierePrincipale",
            new BABYLON.Vector3(0, 1, 0),
            scene
        );

        lumierePrincipale.intensity = 1.2;
        lumierePrincipale.diffuse = new BABYLON.Color3(1, 1, 1);
        lumierePrincipale.groundColor = new BABYLON.Color3(0.55, 0.55, 0.55);
        lumierePrincipale.specular = new BABYLON.Color3(0.1, 0.1, 0.1);

        scene.metadata = scene.metadata || {};
        scene.metadata.lumieres = {
            lumierePrincipale,
            lumiereAmbiante: lumierePrincipale,
            lumiereDirectionnelle: null,
            typeActif: "principale"
        };
    }
}
