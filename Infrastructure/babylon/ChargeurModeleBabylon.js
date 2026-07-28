/**
 * Charge un modèle GLB dans la scène Babylon.
 *
 * Cette branche de publication refuse volontairement les formats multi-fichiers
 * comme OBJ/MTL : un GLB regroupe géométrie, matériaux et textures dans un seul
 * fichier, ce qui simplifie le déploiement sur GitHub Pages.
 */
export class ChargeurModeleBabylon {
    async charger(scene, modele) {
        if (!scene) {
            throw new Error("Scène Babylon introuvable pour charger le modèle.");
        }

        if (!modele || !modele.chemin) {
            throw new Error("Modèle 3D invalide ou chemin manquant.");
        }

        this.verifierModeleGlb(modele);

        const { dossier, fichier } = this.extraireDossierEtFichier(modele.chemin);

        const resultat = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            dossier,
            fichier,
            scene,
            undefined,
            ".glb"
        );

        const meshesImportes = resultat.meshes ?? [];
        const racineModele = this.creerRacineModeleGlb(scene, resultat);
        const meshActuel = this.trouverMeshPrincipal(meshesImportes);

        if (!meshActuel) {
            throw new Error(`Le fichier GLB ne contient aucun mesh exploitable : ${modele.chemin}`);
        }

        return {
            modele,
            meshActuel,
            meshesImportes,
            resultat,
            racineModele
        };
    }

    creerRacineModeleGlb(scene, resultat) {
        const noeudsImportes = [
            ...(resultat.meshes ?? []),
            ...(resultat.transformNodes ?? [])
        ].filter(Boolean);

        const ensembleNoeuds = new Set(noeudsImportes);
        const noeudsRacines = noeudsImportes.filter((noeud) => {
            return !noeud.parent || !ensembleNoeuds.has(noeud.parent);
        });

        if (noeudsRacines.length === 0) {
            return null;
        }

        // Le loader glTF crée souvent une racine __root__ contenant la conversion
        // du repère glTF vers Babylon. On place une racine IRENE au-dessus au lieu
        // de réinitialiser __root__, afin de conserver cette conversion.
        const racine = new BABYLON.TransformNode("SaotraModeleRacine", scene);
        racine.metadata = {
            ...(racine.metadata ?? {}),
            saotraRacineModele: true,
            formatSource: "glb"
        };

        noeudsRacines.forEach((noeud) => {
            if (noeud === racine) {
                return;
            }

            if (typeof noeud.setParent === "function") {
                noeud.setParent(racine);
            } else {
                noeud.parent = racine;
            }
        });

        racine.computeWorldMatrix(true);
        return racine;
    }

    verifierModeleGlb(modele) {
        const type = String(modele.type ?? "").toLowerCase();
        const cheminSansParametres = String(modele.chemin).split(/[?#]/, 1)[0].toLowerCase();

        if (type !== "glb" || !cheminSansParametres.endsWith(".glb")) {
            throw new Error("Cette branche accepte uniquement les modèles au format GLB.");
        }
    }

    trouverMeshPrincipal(meshes = []) {
        return meshes.find((mesh) => {
            return mesh
                && mesh.name !== "__root__"
                && typeof mesh.getTotalVertices === "function"
                && mesh.getTotalVertices() > 0;
        }) ?? meshes.find((mesh) => {
            return mesh
                && typeof mesh.getTotalVertices === "function"
                && mesh.getTotalVertices() > 0;
        }) ?? null;
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
