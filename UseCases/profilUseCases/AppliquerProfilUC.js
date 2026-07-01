export class AppliquerProfilUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(profil) {
        if (!profil) {
            throw new Error("Profil invalide.");
        }

        if (!this.etatApplication.interface) {
            throw new Error("État interface introuvable.");
        }

        if (!this.etatApplication.apparence) {
            throw new Error("État apparence introuvable.");
        }

        if (!this.etatApplication.contours) {
            throw new Error("État contours introuvable.");
        }

        if (!this.etatApplication.camera) {
            throw new Error("État caméra introuvable.");
        }

        this.etatApplication.interface.parametres = profil.interfaceUtilisateur;
        this.etatApplication.apparence.parametres = profil.apparence;

        // On conserve l'objet ParametresContours déjà branché par les contrôleurs.
        // Sinon les sliders / boutons gardent une ancienne référence après restauration.
        if (this.etatApplication.contours.parametres) {
            Object.assign(this.etatApplication.contours.parametres, profil.contours);
        } else {
            this.etatApplication.contours.parametres = profil.contours;
        }

        this.etatApplication.camera.parametres = profil.camera;

        if (profil.miseLumiere) {
            const parametresMiseLumiere = this.etatApplication.contours.parametresMiseLumiere ?? {};
            Object.assign(parametresMiseLumiere, profil.miseLumiere.parametres ?? {});
            this.etatApplication.contours.parametresMiseLumiere = parametresMiseLumiere;

            this.etatApplication.contours.miseLumiereNormalesActif = Boolean(profil.miseLumiere.normalesActif);
            this.etatApplication.contours.miseLumiereCouleursActif = Boolean(profil.miseLumiere.couleursActif);
        }

        if (profil.lumiere) {
            this.etatApplication.lumiere = this.etatApplication.lumiere || {};
            this.etatApplication.lumiere.parametres = { ...profil.lumiere };
        }

        if (profil.accessibilite) {
            this.etatApplication.accessibilite = {
                ...(this.etatApplication.accessibilite ?? {}),
                ...profil.accessibilite
            };
        }

        this.etatApplication.profil.profilActuel = profil;

        if (this.etatApplication.modele3d && profil.modele3DId) {
            this.etatApplication.modele3d.modeleSelectionne = this.etatApplication.modele3d.modelesDisponibles.find(
                (modele) => modele.id === profil.modele3DId
            ) ?? null;
        }

        return profil;
    }
}
