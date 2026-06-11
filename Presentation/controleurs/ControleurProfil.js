/**
 * Branche les actions liées au profil local.
 *
 * Le profil est local au navigateur.
 * Il permet de sauvegarder et recharger les réglages.
 */
export class ControleurProfil {
    constructor({
                    etatApplication,
                    chargerProfilLocalUC,
                    sauvegarderProfilLocalUC,
                    appliquerProfilUC,
                    reinitialiserProfilUC,
                    serviceStyleInterfaceGUI,
                    serviceTexteGUI,
                    serviceCameraBabylon,
                    postTraitApparence = null,
                    postTraitNettete = null,
                    postTraitContProfNorm = null,
                    postTraitContoursCouleur = null
                }) {
        this.etatApplication = etatApplication;

        this.chargerProfilLocalUC = chargerProfilLocalUC;
        this.sauvegarderProfilLocalUC = sauvegarderProfilLocalUC;
        this.appliquerProfilUC = appliquerProfilUC;
        this.reinitialiserProfilUC = reinitialiserProfilUC;

        this.serviceStyleInterfaceGUI = serviceStyleInterfaceGUI;
        this.serviceTexteGUI = serviceTexteGUI;
        this.serviceCameraBabylon = serviceCameraBabylon;

        this.postTraitApparence = postTraitApparence;
        this.postTraitNettete = postTraitNettete;
        this.postTraitContProfNorm = postTraitContProfNorm;
        this.postTraitContoursCouleur = postTraitContoursCouleur;
    }

    chargerProfilAuDemarrage() {
        const profil = this.chargerProfilLocalUC.executer();

        if (!profil) {
            return null;
        }

        this.appliquerProfilUC.executer(profil);
        this.appliquerEffetsVisuels();

        return profil;
    }

    brancherSauvegarde(bouton) {
        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.add(() => {
            this.sauvegarderProfilLocalUC.executer();
        });
    }

    brancherReinitialisation(bouton) {
        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.add(() => {
            this.reinitialiserProfilUC.executer();
            this.appliquerEffetsVisuels();
        });
    }

    appliquerEffetsVisuels() {
        this.serviceStyleInterfaceGUI.appliquerTheme(this.etatApplication);
        this.serviceTexteGUI.appliquerParametresTexte(this.etatApplication);

        if (this.etatApplication.camera.cameraBabylon) {
            this.serviceCameraBabylon.appliquerParametres(
                this.etatApplication.camera.cameraBabylon,
                this.etatApplication.camera.parametres
            );
        }

        if (this.postTraitApparence) {
            this.postTraitApparence.appliquer(this.etatApplication);
        }

        if (this.postTraitNettete) {
            this.postTraitNettete.appliquer(this.etatApplication);
        }

        if (this.postTraitContProfNorm) {
            this.postTraitContProfNorm.appliquer(this.etatApplication);
        }

        if (this.postTraitContoursCouleur) {
            this.postTraitContoursCouleur.appliquer(this.etatApplication);
        }
    }
}