/**
 * Charge un modèle 3D dans la scène Babylon.
 *
 * Le modèle vient du catalogue Configuration/catalogueModeles3D.js.
 */
export class ChargeurModeleBabylon {
    async charger(scene, modele) {
        if (!scene) {
            throw new Error("Scène Babylon introuvable pour charger le modèle.");
        }

        if (!modele || !modele.chemin) {
            throw new Error("Modèle 3D invalide ou chemin manquant.");
        }

        const { dossier, fichier } = this.extraireDossierEtFichier(modele.chemin);

        const resultat = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            dossier,
            fichier,
            scene
        );

        const meshesImportes = resultat.meshes ?? [];
        const meshActuel = meshesImportes[0] ?? null;

        return {
            modele,
            meshActuel,
            meshesImportes,
            resultat
        };
    }

    extraireDossierEtFichier(chemin) {
        const cheminEncode = this.encoderCheminUrl(chemin);
        const dernierSlash = cheminEncode.lastIndexOf("/");

        if (dernierSlash === -1) {
            return {
                dossier: "",
                fichier: cheminEncode
            };
        }

        return {
            dossier: cheminEncode.substring(0, dernierSlash + 1),
            fichier: cheminEncode.substring(dernierSlash + 1)
        };
    }

    encoderCheminUrl(chemin) {
        const texte = String(chemin ?? "").trim().normalize("NFC");
        if (!texte) return texte;

        return texte
            .split("/")
            .map((segment, index) => {
                if (segment === "" || (index === 0 && /^[a-zA-Z][a-zA-Z0-9+.-]*:$/.test(segment))) {
                    return segment;
                }

                try {
                    return encodeURIComponent(decodeURIComponent(segment));
                } catch (_erreur) {
                    return encodeURIComponent(segment);
                }
            })
            .join("/");
    }
}