import { TypeContour } from "../../Domain/contours/TypeContour.js";
import { constantesContours } from "../../Configuration/constantesContours.js";
import { creerShaderMiseLumiereCouleursSiNecessaire } from "../shaders/ShaderMiseLumiereGradients.js";

export class PostTraitMiseLumiereCouleurs {
    creer(scene, camera, parametresContours) {
        const nomShader = creerShaderMiseLumiereCouleursSiNecessaire();

        const postProcess = new BABYLON.PostProcess(
            "PostTraitMiseLumiereCouleurs",
            nomShader.replace("PixelShader", ""),
            [
                "screenSize",
                "edgeWidth",
                "colorThreshold",
                "intensity",
                "minNeighborSupport"
            ],
            null,
            1.0,
            camera
        );

        postProcess.onApply = (effect) => {
            this.appliquerUniforms({ effect, scene, parametresContours });
        };

        return postProcess;
    }

    appliquerUniforms({ effect, scene, parametresContours }) {
        const config = constantesContours.miseLumiereGradients?.couleurs ?? {};
        const epaisseur = this.calculerEpaisseur(TypeContour.COULEUR, parametresContours?.epaisseur);

        effect.setFloat2("screenSize", scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight());
        effect.setFloat("edgeWidth", epaisseur);
        effect.setFloat("colorThreshold", this.lireNombre(config.seuilGradient, config.seuilHaut, 0.55));
        effect.setFloat("intensity", this.lireNombre(config.intensite, null, 0.18));
        effect.setFloat("minNeighborSupport", this.lireNombre(config.voisinsMin, config.voisinsFortsMin, 2));
    }

    lireNombre(valeurPrincipale, valeurSecours, defaut) {
        const principale = Number(valeurPrincipale);
        if (Number.isFinite(principale)) return principale;

        const secours = Number(valeurSecours);
        if (Number.isFinite(secours)) return secours;

        return defaut;
    }

    calculerEpaisseur(typeContour, epaisseurSlider) {
        const slider = constantesContours.epaisseurSlider;
        const config = constantesContours.epaisseursParType?.[typeContour];
        const valeur = Number(epaisseurSlider);
        const valeurSlider = Number.isFinite(valeur)
            ? Math.min(slider.max, Math.max(slider.min, valeur))
            : slider.defaut;

        if (!config) return valeurSlider;

        const progression = (valeurSlider - slider.min) / (slider.max - slider.min);
        const epaisseur = config.min + progression * (config.max - config.min);

        return Math.min(config.max, Math.max(config.min, epaisseur));
    }

    appliquer(etatApplication) {
        const scene = etatApplication?.scenes?.scene3D;
        const camera = etatApplication?.camera?.cameraBabylon;
        const parametres = etatApplication?.contours?.parametres;

        if (!scene || !camera || !parametres) {
            throw new Error("Impossible d'appliquer la mise en lumière des couleurs.");
        }

        if (!etatApplication.contours.postTraitMiseLumiereCouleurs) {
            etatApplication.contours.postTraitMiseLumiereCouleurs = this.creer(scene, camera, parametres);
        }

        return etatApplication.contours.postTraitMiseLumiereCouleurs;
    }

    supprimer(etatApplication) {
        const postProcess = etatApplication?.contours?.postTraitMiseLumiereCouleurs;
        if (postProcess?.dispose) postProcess.dispose();
        if (etatApplication?.contours) etatApplication.contours.postTraitMiseLumiereCouleurs = null;
    }
}
