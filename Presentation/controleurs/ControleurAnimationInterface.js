/**
 * Branche les interactions liées au menu, aux accordéons principaux
 * et aux panneaux secondaires de l'interface.
 */
export class ControleurAnimationInterface {
    constructor({
        etatApplication,
        basculerMenuUC,
        basculerSectionUC = null,
        fermerSectionsUC = null,
        serviceAnimationGUI,
        serviceDimensionsGUI,
        serviceBlocagePointeurGUI = null,
        bloquerCameraUC = null,
        debloquerCameraUC = null,
        serviceCameraBabylon = null,
        serviceControlesSpeciauxGUI = null
    }) {
        this.etatApplication = etatApplication;
        this.basculerMenuUC = basculerMenuUC;
        this.basculerSectionUC = basculerSectionUC;
        this.fermerSectionsUC = fermerSectionsUC;
        this.serviceAnimationGUI = serviceAnimationGUI;
        this.serviceDimensionsGUI = serviceDimensionsGUI;
        this.serviceBlocagePointeurGUI = serviceBlocagePointeurGUI;
        this.bloquerCameraUC = bloquerCameraUC;
        this.debloquerCameraUC = debloquerCameraUC;
        this.serviceCameraBabylon = serviceCameraBabylon;
        this.serviceControlesSpeciauxGUI = serviceControlesSpeciauxGUI;

        this.dropdownsPrincipaux = [];
        this.panneauxSecondaires = [];
    }

    initialiserMenu({ menuRect, flecheRect, flecheText }) {
        this.serviceDimensionsGUI?.memoriserMenu(
            this.etatApplication,
            menuRect,
            flecheRect
        );

        this.serviceAnimationGUI.initialiserMenu({
            etatApplication: this.etatApplication,
            menuRect,
            flecheRect,
            flecheText
        });
    }

    brancherMenu({ boutonFleche, menuRect, flecheRect, flecheText }) {
        if (!boutonFleche) return;

        this.initialiserMenu({ menuRect, flecheRect, flecheText });

        boutonFleche.onPointerClickObservable.clear();
        boutonFleche.onPointerClickObservable.add(() => {
            const etatMenu = this.basculerMenuUC.executer();

            // Quand on ferme/replie le menu latéral, on ferme aussi tout panneau actif :
            // accordéon principal, panneau Police/Menu/Contours/Texture/Lumière/Modèles, etc.
            if (etatMenu?.estOuvert === false || this.etatApplication.animation.menuLateral.estOuvert === false) {
                this.fermerTouteInterfaceActive();
            }

            this.serviceAnimationGUI.basculerMenu({
                etatApplication: this.etatApplication,
                menuRect,
                flecheRect,
                flecheText
            });

            this.serviceControlesSpeciauxGUI?.signalerChangementDisposition(
                this.etatApplication
            );
        });
    }

    brancherAccordeonsPrincipaux(dropdowns = []) {
        this.dropdownsPrincipaux = dropdowns.filter((dropdown) => dropdown?.rect);
        this.serviceAnimationGUI.brancherAccordeonsExclusifs(this.dropdownsPrincipaux);
    }

    brancherPanneauxSecondaires(panneauxConfig = []) {
        this.panneauxSecondaires = panneauxConfig.map((config) => config.panneau).filter(Boolean);
        this.serviceAnimationGUI.initialiserPanneauxSecondaires(this.panneauxSecondaires);

        panneauxConfig.forEach(({ bouton, panneau, retour }) => {
            if (bouton && panneau) {
                bouton.onPointerClickObservable.clear();
                bouton.onPointerClickObservable.add(() => {
                    // Un seul panneau secondaire visible à la fois.
                    // On ferme aussi les accordéons principaux pour éviter les menus superposés.
                    this.serviceAnimationGUI.fermerTousAccordeons(this.dropdownsPrincipaux);
                    this.serviceAnimationGUI.ouvrirPanneauSecondaire(
                        panneau,
                        this.panneauxSecondaires.filter((p) => p !== panneau)
                    );

                    this.serviceControlesSpeciauxGUI?.signalerChangementDisposition(
                        this.etatApplication
                    );
                });
            }

            if (retour && panneau) {
                retour.onPointerClickObservable.clear();
                retour.onPointerClickObservable.add(() => {
                    this.serviceAnimationGUI.fermerPanneauSecondaire(panneau);

                    this.serviceControlesSpeciauxGUI?.signalerChangementDisposition(
                        this.etatApplication
                    );
                });
            }
        });
    }

    fermerTouteInterfaceActive() {
        this.serviceAnimationGUI.fermerTouteInterfaceActive({
            dropdowns: this.dropdownsPrincipaux,
            panneaux: this.panneauxSecondaires
        });
    }

    brancherSection({ nomSection, boutonSection, controleSection, texteFleche }) {
        if (!boutonSection || !controleSection || !this.basculerSectionUC) return;

        this.serviceDimensionsGUI?.memoriserDimensionSection(
            this.etatApplication,
            nomSection,
            controleSection
        );

        this.serviceAnimationGUI.fermerSectionGUI(controleSection, texteFleche);

        boutonSection.onPointerClickObservable.clear();
        boutonSection.onPointerClickObservable.add(() => {
            this.basculerSectionUC.executer(nomSection);
            const hauteurInitiale = this.etatApplication.gui.dimensionsInitiales.sections[nomSection]?.hauteur;

            this.serviceAnimationGUI.basculerSection({
                section: this.etatApplication.animation.sections[nomSection],
                controleSection,
                texteFleche,
                hauteurInitiale
            });
        });
    }

    brancherBlocageInterface(controlesInterface = []) {
        if (!this.serviceBlocagePointeurGUI) return;

        this.serviceBlocagePointeurGUI.brancherZones({
            camera: this.etatApplication.camera.cameraBabylon,
            canvas: this.etatApplication.canvas,
            sceneGUI: this.etatApplication.scenes.sceneGUI,
            controles: controlesInterface.filter(Boolean)
        });
    }
}
