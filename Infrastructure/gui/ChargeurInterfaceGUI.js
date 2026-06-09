/**
 * Charge l'interface Babylon GUI depuis un fichier JSON.
 *
 * Ce service ne crée pas les composants manuellement.
 * Il charge le fichier guiTexture.json conçu avec l'éditeur GUI.
 */
export class ChargeurInterfaceGUI {
    async chargerDepuisJson(advancedTexture, cheminJson) {
        if (!advancedTexture) {
            throw new Error("AdvancedDynamicTexture introuvable.");
        }

        if (typeof cheminJson !== "string" || cheminJson.trim() === "") {
            throw new Error("Chemin du fichier GUI invalide.");
        }

        const reponse = await fetch(cheminJson);

        if (!reponse.ok) {
            throw new Error(`Impossible de charger l'interface GUI : ${cheminJson}`);
        }

        const contenuJson = await reponse.json();

        advancedTexture.parseSerializedObject(contenuJson);

        return advancedTexture;
    }
}