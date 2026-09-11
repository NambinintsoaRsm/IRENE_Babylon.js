/**
 * @file Contrôleur de navigation entre les panneaux de l'interface.
 *
 * Rôle : connecter les boutons de niveau principal et secondaire à
 * ServiceAnimationGUI sans dupliquer les règles d'animation dans main.js.
 */
/**
 * Branche les interactions liées au menu, aux accordéons principaux,
 * aux accordéons imbriqués et aux panneaux secondaires de l'interface.
 */
export class ControleurAnimationInterface {
    constructor({
        etatApplication,
        basculerMenuUC,
        serviceAnimationGUI,
        serviceDimensionsGUI,
        serviceBlocagePointeurGUI = null,
        serviceCameraBabylon = null,
        serviceControlesSpeciauxGUI = null
    }) {
        this.etatApplication = etatApplication;
        this.basculerMenuUC = basculerMenuUC;
        this.serviceAnimationGUI = serviceAnimationGUI;
        this.serviceDimensionsGUI = serviceDimensionsGUI;
        this.serviceBlocagePointeurGUI = serviceBlocagePointeurGUI;
        this.serviceCameraBabylon = serviceCameraBabylon;
        this.serviceControlesSpeciauxGUI = serviceControlesSpeciauxGUI;

        this.dropdownsPrincipaux = [];
        this.dropdownsImbriques = [];
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
            // accordéons principaux et imbriqués, panneaux Police/Menu/Contours/Texture/Lumière, etc.
            if (etatMenu?.estOuvert === false || this.etatApplication.animation.menuLateral.estOuvert === false) {
                this.fermerTouteInterfaceActive();
            }

            this.serviceAnimationGUI.basculerMenu({
                etatApplication: this.etatApplication,
                menuRect,
                flecheRect,
                flecheText
            });

            this.signalerChangementDisposition();
        });
    }

    /**
     * Niveau 1 : Fichier / Configurations / Outils.
     * Un seul volet principal peut être ouvert à la fois.
     * Changer de volet principal referme également tout accordéon imbriqué.
     */
    brancherAccordeonsPrincipaux(dropdowns = []) {
        this.dropdownsPrincipaux = dropdowns.filter((dropdown) => dropdown?.rect);
        this.serviceAnimationGUI.initialiserAccordeons(this.dropdownsPrincipaux);

        this.dropdownsPrincipaux.forEach((dropdown) => {
            const { bouton, rect, fleche, hauteur } = dropdown;
            if (!bouton || !rect) return;

            bouton.onPointerClickObservable.clear();
            bouton.onPointerClickObservable.add(() => {
                const doitOuvrir = !rect.metadata?.estOuvert;

                // Règle d'exclusivité globale : si on change de volet principal,
                // aucun sous-accordéon de l'ancien volet ne reste mémorisé comme ouvert.
                this.serviceAnimationGUI.fermerTousAccordeons(this.dropdownsImbriques);
                this.serviceAnimationGUI.fermerTousPanneauxSecondaires(this.panneauxSecondaires);

                this.dropdownsPrincipaux.forEach((autre) => {
                    if (autre.rect && autre.rect !== rect) {
                        this.serviceAnimationGUI.fermerAccordeon(autre.rect, autre.fleche);
                    }
                });

                if (doitOuvrir) {
                    this.serviceAnimationGUI.ouvrirAccordeon(rect, fleche, hauteur);
                } else {
                    this.serviceAnimationGUI.fermerAccordeon(rect, fleche);
                }

                this.signalerChangementDisposition();
            });
        });
    }

    /**
     * Niveau 2 : accordéons contenus dans un volet principal.
     * Dans la GUI actuelle, Réglages est imbriqué dans Outils.
     * Son ouverture ne ferme pas son parent Outils, mais les accordéons
     * imbriqués restent exclusifs entre eux.
     */
    brancherAccordeonsImbriques(dropdowns = []) {
        this.dropdownsImbriques = dropdowns.filter((dropdown) => dropdown?.rect);
        this.serviceAnimationGUI.initialiserAccordeons(this.dropdownsImbriques);

        this.dropdownsImbriques.forEach((dropdown) => {
            const { bouton, rect, fleche, hauteur } = dropdown;
            if (!bouton || !rect) return;

            bouton.onPointerClickObservable.clear();
            bouton.onPointerClickObservable.add(() => {
                const doitOuvrir = !rect.metadata?.estOuvert;

                this.serviceAnimationGUI.fermerTousPanneauxSecondaires(this.panneauxSecondaires);

                this.dropdownsImbriques.forEach((autre) => {
                    if (autre.rect && autre.rect !== rect) {
                        this.serviceAnimationGUI.fermerAccordeon(autre.rect, autre.fleche);
                    }
                });

                if (doitOuvrir) {
                    this.serviceAnimationGUI.ouvrirAccordeon(rect, fleche, hauteur);
                } else {
                    this.serviceAnimationGUI.fermerAccordeon(rect, fleche);
                }

                // Réglages est imbriqué dans Outils : le parent grandit/rétrécit
                // en même temps, sans conserver une hauteur fixe inutile.
                this.serviceAnimationGUI.synchroniserHauteurOutils?.({ animer: true });

                this.signalerChangementDisposition();
            });
        });
    }

    brancherPanneauxSecondaires(panneauxConfig = []) {
        this.panneauxSecondaires = panneauxConfig.map((config) => config.panneau).filter(Boolean);
        this.serviceAnimationGUI.initialiserPanneauxSecondaires(this.panneauxSecondaires);

        panneauxConfig.forEach(({ bouton, panneau, retour }) => {
            if (bouton && panneau) {
                bouton.onPointerClickObservable.clear();
                bouton.onPointerClickObservable.add(() => {
                    // Un seul panneau secondaire visible à la fois.
                    // Avant de l'afficher on referme tous les accordéons, y compris
                    // Réglages qui est désormais imbriqué dans Outils.
                    this.serviceAnimationGUI.fermerTousAccordeons(this.dropdownsImbriques);
                    this.serviceAnimationGUI.fermerTousAccordeons(this.dropdownsPrincipaux);
                    this.serviceAnimationGUI.ouvrirPanneauSecondaire(
                        panneau,
                        this.panneauxSecondaires.filter((p) => p !== panneau)
                    );

                    this.signalerChangementDisposition();
                });
            }

            if (retour && panneau) {
                retour.onPointerClickObservable.clear();
                retour.onPointerClickObservable.add(() => {
                    this.serviceAnimationGUI.fermerPanneauSecondaire(panneau);
                    this.signalerChangementDisposition();
                });
            }
        });
    }

    fermerTouteInterfaceActive() {
        this.serviceAnimationGUI.fermerTouteInterfaceActive({
            dropdowns: [
                ...this.dropdownsPrincipaux,
                ...this.dropdownsImbriques
            ],
            panneaux: this.panneauxSecondaires
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

    signalerChangementDisposition() {
        this.serviceControlesSpeciauxGUI?.signalerChangementDisposition(
            this.etatApplication
        );
    }
}
