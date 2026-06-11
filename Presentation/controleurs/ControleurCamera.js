/**
 * Contrôleur des actions caméra : vitesse, dropdown zoom et réinitialisations.
 */
export class ControleurCamera {
    constructor({
        etatApplication,
        changerVitesseCameraUC,
        reinitialiserCameraUC,
        serviceCameraBabylon
    }) {
        this.etatApplication = etatApplication;
        this.changerVitesseCameraUC = changerVitesseCameraUC;
        this.reinitialiserCameraUC = reinitialiserCameraUC;
        this.serviceCameraBabylon = serviceCameraBabylon;
    }

    brancherDepuisNomsGUI(nomsCamera = {}) {
        this.brancherDropdownZoom({
            boutonZoom: this.obtenir("ZoomBtn"),
            flecheZoom: this.obtenir("ZoomBtnDropTxt"),
            boutonReinitialiser: this.obtenir(nomsCamera.zoomReinitBtn || "ZoomReintBtn"),
            boutonReinitialiserZoom: this.obtenir(nomsCamera.reinitZoomBtn || "ReintZoomsBtn"),
            boutonReinitialiserPosition: this.obtenir(nomsCamera.reinitPositionBtn || "ReintPosBtn")
        });
    }

    brancherDropdownZoom({
        boutonZoom,
        flecheZoom,
        boutonReinitialiser,
        boutonReinitialiserZoom = null,
        boutonReinitialiserPosition = null
    }) {
        if (!boutonZoom || !boutonReinitialiser) {
            return;
        }

        boutonReinitialiser.metadata = boutonReinitialiser.metadata || {};
        boutonReinitialiser.metadata.hauteurOuverte = boutonReinitialiser.height || "60px";
        boutonReinitialiser.isVisible = false;
        boutonReinitialiser.height = "0px";

        if (flecheZoom) {
            flecheZoom.text = "▶";
        }

        boutonZoom.onPointerClickObservable.clear();
        boutonZoom.onPointerClickObservable.add(() => {
            const doitOuvrir = !boutonReinitialiser.isVisible;

            boutonReinitialiser.isVisible = doitOuvrir;
            boutonReinitialiser.height = doitOuvrir ? boutonReinitialiser.metadata.hauteurOuverte : "0px";

            if (flecheZoom) {
                flecheZoom.text = doitOuvrir ? "▼" : "▶";
            }
        });

        boutonReinitialiser.onPointerClickObservable.clear();
        boutonReinitialiser.onPointerClickObservable.add(() => {
            this.reinitialiserZoomEtPositionDepuisModele();
            this.fermerDropdownZoom(boutonReinitialiser, flecheZoom);
        });

        if (boutonReinitialiserZoom) {
            boutonReinitialiserZoom.onPointerClickObservable.clear();
            boutonReinitialiserZoom.onPointerClickObservable.add(() => {
                this.reinitialiserZoomDepuisModele();
                this.fermerDropdownZoom(boutonReinitialiser, flecheZoom);
            });
        }

        if (boutonReinitialiserPosition) {
            boutonReinitialiserPosition.onPointerClickObservable.clear();
            boutonReinitialiserPosition.onPointerClickObservable.add(() => {
                this.reinitialiserPositionDepuisModele();
                this.fermerDropdownZoom(boutonReinitialiser, flecheZoom);
            });
        }
    }

    fermerDropdownZoom(boutonReinitialiser, flecheZoom) {
        if (boutonReinitialiser) {
            boutonReinitialiser.isVisible = false;
            boutonReinitialiser.height = "0px";
        }

        if (flecheZoom) {
            flecheZoom.text = "▶";
        }
    }

    reinitialiserZoomDepuisModele() {
        const camera = this.etatApplication.camera.cameraBabylon;
        const meshes = this.etatApplication.modele3d?.meshesImportes ?? [];
        const resultat = this.serviceCameraBabylon.reinitialiserZoomDepuisMeshes(camera, meshes);

        if (resultat) {
            this.mettreAJourParametresCamera(resultat);
        }
    }

    reinitialiserPositionDepuisModele() {
        const camera = this.etatApplication.camera.cameraBabylon;
        const meshes = this.etatApplication.modele3d?.meshesImportes ?? [];
        const resultat = this.serviceCameraBabylon.reinitialiserPositionDepuisMeshes(camera, meshes);

        if (resultat) {
            this.mettreAJourParametresCamera(resultat);
        }
    }

    reinitialiserZoomEtPositionDepuisModele() {
        const camera = this.etatApplication.camera.cameraBabylon;
        const meshes = this.etatApplication.modele3d?.meshesImportes ?? [];
        const resultat = this.serviceCameraBabylon.reinitialiserZoomEtPositionDepuisMeshes(camera, meshes);

        if (resultat) {
            this.mettreAJourParametresCamera(resultat);
        }
    }

    mettreAJourParametresCamera(resultat) {
        this.etatApplication.camera.parametres = this.etatApplication.camera.parametres.copierAvec({
            alpha: resultat.alpha,
            beta: resultat.beta,
            rayon: resultat.rayon,
            cible: resultat.cible,
            distanceMin: resultat.distanceMin,
            distanceMax: resultat.distanceMax,
            wheelPrecision: resultat.wheelPrecision ?? this.etatApplication.camera.parametres.wheelPrecision,
            sensibiliteRotation: resultat.sensibiliteRotation ?? this.etatApplication.camera.parametres.sensibiliteRotation
        });
    }

    brancherSliderVitesse(slider) {
        if (!slider) {
            return;
        }

        slider.onValueChangedObservable.clear();
        slider.onValueChangedObservable.add((valeur) => {
            const parametres = this.changerVitesseCameraUC.executer({
                sensibiliteRotation: valeur,
                wheelPrecision: valeur
            });

            this.serviceCameraBabylon.appliquerParametres(
                this.etatApplication.camera.cameraBabylon,
                parametres
            );
        });
    }

    brancherReinitialisation(bouton) {
        if (!bouton) {
            return;
        }

        bouton.onPointerClickObservable.clear();
        bouton.onPointerClickObservable.add(() => {
            this.reinitialiserZoomEtPositionDepuisModele();
        });
    }

    obtenir(nom) {
        return nom ? this.etatApplication.gui.controles[nom] ?? null : null;
    }
}
