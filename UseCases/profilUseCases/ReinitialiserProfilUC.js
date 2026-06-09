import { ProfilUtilisateur } from "../../Domain/profil/ProfilUtilisateur.js";

export class ReinitialiserProfilUC {
    constructor(etatApplication, profilParDefaut = null) {
        this.etatApplication = etatApplication;
        this.profilParDefaut = profilParDefaut;
    }

    executer() {
        const profil = this.profilParDefaut ?? new ProfilUtilisateur();

        this.etatApplication.interface.parametres = profil.interfaceUtilisateur;
        this.etatApplication.apparence.parametres = profil.apparence;
        this.etatApplication.contours.parametres = profil.contours;
        this.etatApplication.camera.parametres = profil.camera;

        if (this.etatApplication.modele3d) {
            this.etatApplication.modele3d.modeleSelectionne = null;
        }

        this.etatApplication.profil.profilActuel = profil;

        return profil;
    }
}