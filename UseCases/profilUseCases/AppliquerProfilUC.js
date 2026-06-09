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
        this.etatApplication.contours.parametres = profil.contours;
        this.etatApplication.camera.parametres = profil.camera;

        this.etatApplication.profil.profilActuel = profil;

        if (this.etatApplication.modele3d && profil.modele3DId) {
            this.etatApplication.modele3d.modeleSelectionne = this.etatApplication.modele3d.modelesDisponibles.find(
                (modele) => modele.id === profil.modele3DId
            ) ?? null;
        }

        return profil;
    }
}