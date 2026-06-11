/**
 * Branche la liste dynamique des modèles 3D et orchestre le chargement.
 */
export class ControleurModele3D {
    constructor({
        etatApplication,
        listerModelesUC,
        changerModeleActifUC,
        chargerModeleUC,
        supprimerModeleActuelUC = null,
        normaliserModeleUC = null,
        choisirVueEntropieUC = null,
        serviceListeModelesGUI,
        serviceSceneBabylon,
        chargeurModeleBabylon,
        serviceOrientationModeleBabylon = null,
        serviceNormalisationModeleBabylon,
        serviceCadrageCameraBabylon,
        serviceMateriauxBabylon,
        serviceCameraBabylon = null,
        serviceEntropieVueBabylon = null,
        constantesCamera = null
    }) {
        this.etatApplication = etatApplication;
        this.listerModelesUC = listerModelesUC;
        this.changerModeleActifUC = changerModeleActifUC;
        this.chargerModeleUC = chargerModeleUC;
        this.supprimerModeleActuelUC = supprimerModeleActuelUC;
        this.normaliserModeleUC = normaliserModeleUC;
        this.choisirVueEntropieUC = choisirVueEntropieUC;
        this.serviceListeModelesGUI = serviceListeModelesGUI;
        this.serviceSceneBabylon = serviceSceneBabylon;
        this.chargeurModeleBabylon = chargeurModeleBabylon;
        this.serviceOrientationModeleBabylon = serviceOrientationModeleBabylon;
        this.serviceNormalisationModeleBabylon = serviceNormalisationModeleBabylon;
        this.serviceCadrageCameraBabylon = serviceCadrageCameraBabylon;
        this.serviceMateriauxBabylon = serviceMateriauxBabylon;
        this.serviceCameraBabylon = serviceCameraBabylon;

        // Entropie volontairement désactivée pour le moment.
        this.serviceEntropieVueBabylon = null;

        this.constantesCamera = constantesCamera;
        this.indicateurChargement = null;
    }

    afficherListeModeles(conteneurListe) {
        if (!conteneurListe) {
            return;
        }

        const modeles = this.listerModelesUC.executer();

        this.serviceListeModelesGUI.afficherModeles({
            conteneurListe,
            modeles,
            etatApplication: this.etatApplication,
            callbackSelection: async (modele) => {
                await this.changerModele(modele.id);

                this.serviceListeModelesGUI.marquerModeleActif({
                    conteneurListe,
                    idModeleActif: modele.id,
                    etatApplication: this.etatApplication
                });
            }
        });
    }

    brancherBoutonsModelesExistants(boutons = []) {
        const modeles = this.listerModelesUC.executer();

        boutons.forEach(({ bouton, idModele }) => {
            if (!bouton) {
                return;
            }

            bouton.onPointerClickObservable.clear();
            bouton.onPointerClickObservable.add(async () => {
                const modele = modeles.find((m) => m.id === idModele);

                if (!modele) {
                    return;
                }

                await this.changerModele(idModele);
            });
        });
    }

    async changerModele(idModele) {
        this.afficherChargement("Chargement du modèle...");

        try {
            const { modeleSelectionne } = this.changerModeleActifUC.executer(idModele);

            this.serviceSceneBabylon.supprimerModeleActuel(this.etatApplication.modele3d);
            this.chargerModeleUC.executer(modeleSelectionne);

            const resultatChargement = await this.chargeurModeleBabylon.charger(
                this.etatApplication.scenes.scene3D,
                modeleSelectionne
            );

            this.etatApplication.modele3d.terminerChargement({
                modele: modeleSelectionne,
                meshActuel: resultatChargement.meshActuel,
                meshesImportes: resultatChargement.meshesImportes
            });

            const meshes = this.etatApplication.modele3d.meshesImportes;

            this.serviceMateriauxBabylon.corrigerMateriaux(meshes);

            if (this.serviceOrientationModeleBabylon) {
                this.serviceOrientationModeleBabylon.corrigerOrientation(meshes);
            }

            this.serviceNormalisationModeleBabylon.normaliser(
                meshes,
                this.constantesCamera?.tailleModeleNormalise ?? 2
            );

            this.appliquerVueInitialeModele(meshes);

            return this.etatApplication.modele3d;
        } catch (erreur) {
            this.etatApplication.modele3d.signalerErreurChargement(erreur);
            throw erreur;
        } finally {
            this.masquerChargement();
        }
    }

    appliquerVueInitialeModele(meshes) {
        const camera = this.etatApplication.camera.cameraBabylon;

        if (!camera) {
            return;
        }

        let resultat = null;

        // On utilise volontairement la même logique que le bouton Réinitialiser :
        // centre du modèle + alpha/beta de départ + radius selon taille du modèle.
        if (this.serviceCameraBabylon?.reinitialiserPositionDepuisMeshes) {
            resultat = this.serviceCameraBabylon.reinitialiserPositionDepuisMeshes(camera, meshes, {
                alpha: this.constantesCamera?.alphaInitial ?? Math.PI / 2,
                beta: this.constantesCamera?.betaInitial ?? Math.PI / 2.5,
                facteurCadrage: this.constantesCamera?.facteurCadrage ?? 3.0
            });
        }

        if (!resultat) {
            const cadrage = this.serviceCadrageCameraBabylon.cadrer(
                camera,
                meshes,
                this.etatApplication.camera.parametres,
                this.constantesCamera?.facteurCadrage ?? 3.0
            );

            resultat = {
                cible: cadrage.cible,
                rayon: cadrage.rayon,
                alpha: camera.alpha,
                beta: camera.beta,
                distanceMin: camera.lowerRadiusLimit,
                distanceMax: camera.upperRadiusLimit
            };
        }

        this.etatApplication.camera.parametres = this.etatApplication.camera.parametres.copierAvec({
            alpha: resultat.alpha,
            beta: resultat.beta,
            rayon: resultat.rayon,
            cible: resultat.cible,
            distanceMin: resultat.distanceMin,
            distanceMax: resultat.distanceMax
        });

        if (this.serviceCameraBabylon?.memoriserVueCouranteModele) {
            this.serviceCameraBabylon.memoriserVueCouranteModele(this.etatApplication);
        }
    }

    afficherChargement(message = "Chargement...") {
        const advancedTexture = this.etatApplication?.gui?.advancedTexture;

        if (!advancedTexture) {
            return;
        }

        if (this.indicateurChargement) {
            this.indicateurChargement.isVisible = true;

            const texte = this.indicateurChargement.children?.[0];

            if (texte) {
                texte.text = message;
            }

            return;
        }

        const fond = new BABYLON.GUI.Rectangle("IndicateurChargementModele");
        fond.width = "260px";
        fond.height = "56px";
        fond.cornerRadius = 6;
        fond.thickness = 1;
        fond.color = "#000000FF";
        fond.background = "#FFFFFFFF";
        fond.alpha = 0.95;
        fond.zIndex = 1000;
        fond.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        fond.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        fond.isPointerBlocker = false;

        const texte = new BABYLON.GUI.TextBlock("IndicateurChargementModeleTexte");
        texte.text = message;
        texte.color = "#000000FF";
        texte.fontSize = "20px";
        texte.fontFamily = "Arial";
        texte.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        texte.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        texte.metadata = texte.metadata || {};
        texte.metadata.texteDynamique = true;

        fond.addControl(texte);
        advancedTexture.addControl(fond);

        this.indicateurChargement = fond;
    }

    masquerChargement() {
        if (this.indicateurChargement) {
            this.indicateurChargement.isVisible = false;
        }
    }
}
