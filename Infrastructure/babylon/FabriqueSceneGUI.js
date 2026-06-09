/**
 * Crée la texture GUI Babylon utilisée pour afficher l'interface.
 *
 * Le contenu réel de l’interface sera chargé depuis le fichier JSON
 * par ChargeurInterfaceGUI.
 * Dû au fait que les post traitement agis sur le rednu de la scène, donc on sépare les scènes.
 */
export class FabriqueSceneGUI {
    creer(scene) {
        if (!scene) {
            throw new Error("Scène Babylon introuvable pour créer la GUI.");
        }

        return BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
            "InterfaceUtilisateur",
            true,
            scene
        );
    }
}