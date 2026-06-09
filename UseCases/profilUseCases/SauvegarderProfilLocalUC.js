import { ProfilUtilisateur } from "../../Domain/profil/ProfilUtilisateur.js";

export class SauvegarderProfilLocalUC {
    constructor(etatApplication, stockageProfilLocal) {
        this.etatApplication = etatApplication;
        this.stockageProfilLocal = stockageProfilLocal;
    }

    executer() {
        if (!this.stockageProfilLocal) {
            throw new Error("Service de stockage du profil introuvable.");
        }

        const profil = new ProfilUtilisateur({
            interfaceUtilisateur: this.etatApplication.interface.parametres,
            apparence: this.etatApplication.apparence.parametres,
            contours: this.etatApplication.contours.parametres,
            camera: this.etatApplication.camera.parametres,
            modele3DId: this.etatApplication.modele3d?.modeleActuel?.id ?? null
        });

        this.stockageProfilLocal.sauvegarder(profil);

        this.etatApplication.profil.profilActuel = profil;

        return profil;
    }
}