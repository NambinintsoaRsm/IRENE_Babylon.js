/**
 * @file Post-traitement V1 dédié exclusivement à la silhouette.
 *
 * Rôle : détecter les discontinuités de profondeur du depth buffer et dessiner le
 * contour avec l'épaisseur/couleur configurées par l'utilisateur.
 *
 * Utilisation : ControleurContours crée/supprime ce post-traitement selon l'état de
 * la silhouette. Les anciens calculs Relief/Couleur ne doivent pas être réintroduits
 * dans ce fichier : ils devront rester des modules séparés en V2.
 */
import { TypeContour } from "../../Domain/contours/TypeContour.js";
import { constantesContours } from "../../Configuration/constantesContours.js";
import { couleurHexaVersRgb01 } from "../../Util/CouleurUtils.js";
import { creerShaderSilhouetteSiNecessaire } from "../shaders/ShaderSilhouette.js";

/**
 * Post-traitement V1 de la silhouette.
 *
 * Il dépend uniquement du depth buffer. Aucun rendu de normales, aucun gradient
 * de couleur et aucune surbrillance ne sont créés dans cette classe.
 */
export class PostTraitSilhouette {
    creer(scene, camera, parametresContours) {
        if (!scene || !camera || !parametresContours) {
            throw new Error("Impossible de créer le post-traitement de silhouette.");
        }

        const nomShader = creerShaderSilhouetteSiNecessaire();
        const depthRenderer = scene.enableDepthRenderer(camera);
        const depthMap = depthRenderer?.getDepthMap?.() ?? null;

        const postProcess = new BABYLON.PostProcess(
            "PostTraitSilhouette",
            nomShader.replace("PixelShader", ""),
            ["screenSize", "edgeWidth", "actif", "depthThreshold", "contourColor"],
            ["depthSampler"],
            1.0,
            camera
        );

        postProcess.onApply = (effect) => {
            effect.setTexture("depthSampler", depthMap);

            const taille = this.obtenirTailleRendu(postProcess, scene, camera);
            effect.setFloat2("screenSize", taille.largeur, taille.hauteur);

            const actif = this.estSilhouetteActive(parametresContours);
            effect.setFloat("actif", actif ? 1.0 : 0.0);
            effect.setFloat("edgeWidth", this.calculerEpaisseur(parametresContours.epaisseur));
            effect.setFloat(
                "depthThreshold",
                Number(parametresContours.seuil) || constantesContours.seuils[TypeContour.SILHOUETTE]
            );

            const couleur = couleurHexaVersRgb01(parametresContours.couleur);
            effect.setFloat3("contourColor", couleur.r, couleur.g, couleur.b);
        };

        return { postProcess, depthRenderer };
    }

    appliquer(etatApplication) {
        const scene = etatApplication?.scenes?.scene3D;
        const camera = etatApplication?.camera?.cameraBabylon;
        const parametres = etatApplication?.contours?.parametres;

        if (!scene || !camera || !parametres) {
            throw new Error("Impossible d'appliquer la silhouette.");
        }

        if (!etatApplication.contours.postTraitementSilhouette) {
            etatApplication.contours.postTraitementSilhouette = this.creer(scene, camera, parametres);
        }

        return etatApplication.contours.postTraitementSilhouette;
    }

    supprimer(etatApplication) {
        const conteneur = etatApplication?.contours?.postTraitementSilhouette;
        if (!conteneur) return;

        try {
            conteneur.postProcess?.dispose?.();
        } catch (_) {
        }

        try {
            conteneur.depthRenderer?.dispose?.();
        } catch (_) {
        }

        etatApplication.contours.postTraitementSilhouette = null;
    }

    estSilhouetteActive(parametresContours) {
        if (!parametresContours?.actif) return false;
        if (typeof parametresContours.estActif === "function") {
            return parametresContours.estActif(TypeContour.SILHOUETTE);
        }
        return Array.isArray(parametresContours.typesActifs)
            ? parametresContours.typesActifs.includes(TypeContour.SILHOUETTE)
            : parametresContours.typeActif === TypeContour.SILHOUETTE;
    }

    calculerEpaisseur(epaisseurDemandee) {
        const slider = constantesContours.epaisseurSlider;
        const regle = constantesContours.epaisseursParType[TypeContour.SILHOUETTE];
        const valeur = Math.min(
            slider.max,
            Math.max(slider.min, Number(epaisseurDemandee) || slider.defaut)
        );

        const renforcee = valeur <= slider.min
            ? valeur + Number(regle.renfortBase ?? 0)
            : valeur;

        return Math.min(regle.max, Math.max(regle.min, renforcee));
    }

    obtenirTailleRendu(postProcess, scene, camera) {
        const tailleLoupe = camera?.metadata?.annaLoupe3D?.renderSize;
        if (tailleLoupe) {
            const largeur = Number(tailleLoupe.largeur);
            const hauteur = Number(tailleLoupe.hauteur);
            if (largeur > 0 && hauteur > 0) {
                return { largeur, hauteur };
            }
        }

        const largeurPP = Number(postProcess?.width);
        const hauteurPP = Number(postProcess?.height);
        if (largeurPP > 0 && hauteurPP > 0) {
            return { largeur: largeurPP, hauteur: hauteurPP };
        }

        const moteur = scene?.getEngine?.();
        return {
            largeur: Math.max(1, Number(moteur?.getRenderWidth?.()) || 1),
            hauteur: Math.max(1, Number(moteur?.getRenderHeight?.()) || 1)
        };
    }
}
