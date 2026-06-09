import { constantesInterface } from "../../Configuration/constantesInterface.js";
import { obtenirThemeInterface } from "../../Configuration/constantesInterface.js";

/**
 * Gère l'affichage dynamique de la liste des modèles 3D.
 *
 * Le nombre d'objets n'est pas fixé dans l'interface.
 * Les boutons sont créés à partir du catalogue des modèles disponibles.
 *
 * Les dimensions, couleurs et styles ne sont pas codés en dur ici :
 * ils viennent de Configuration/constantesInterface.js.
 */
export class ServiceListeModelesGUI {
    viderListe(conteneurListe) {
        if (!conteneurListe?.children) {
            return;
        }

        const enfants = [...conteneurListe.children];

        enfants.forEach((enfant) => {
            conteneurListe.removeControl(enfant);
        });
    }

    afficherModeles({
                        conteneurListe,
                        modeles,
                        etatApplication,
                        callbackSelection
                    }) {
        if (!conteneurListe) {
            throw new Error("Conteneur de liste des modèles introuvable.");
        }

        if (!Array.isArray(modeles)) {
            throw new Error("Liste des modèles invalide.");
        }

        this.viderListe(conteneurListe);

        modeles.forEach((modele) => {
            const estActif = this.estModeleActif(modele, etatApplication);
            const bouton = this.creerBoutonModele({
                modele,
                etatApplication,
                estActif
            });

            bouton.onPointerClickObservable.add(() => {
                if (typeof callbackSelection === "function") {
                    callbackSelection(modele);
                }
            });

            conteneurListe.addControl(bouton);
        });
    }

    creerBoutonModele({ modele, etatApplication, estActif = false }) {
        if (!modele) {
            throw new Error("Modèle invalide pour créer un bouton.");
        }

        const bouton = BABYLON.GUI.Button.CreateSimpleButton(
            `ModeleBtn_${modele.id}`,
            modele.nom
        );

        this.appliquerStyleBoutonModele({
            bouton,
            etatApplication,
            estActif
        });

        return bouton;
    }

    appliquerStyleBoutonModele({ bouton, etatApplication, estActif = false }) {
        if (!bouton) {
            return;
        }

        const style = constantesInterface.stylesComposants.boutonModele;
        const styleActif = constantesInterface.stylesComposants.boutonModeleActif;

        const themeActif = etatApplication?.interface?.parametres?.theme;
        const theme = obtenirThemeInterface(themeActif);

        bouton.width = style.largeur;
        bouton.height = style.hauteur;
        bouton.thickness = style.epaisseurBordure;

        bouton.paddingTop = style.paddingHaut;
        bouton.paddingBottom = style.paddingBas;

        bouton.background = estActif
            ? styleActif.couleurFond
            : theme.boutonFond ?? style.couleurFond;

        bouton.color = estActif
            ? styleActif.couleurBordure
            : theme.boutonBordure ?? style.couleurBordure;

        if (bouton.textBlock) {
            bouton.textBlock.color = estActif
                ? styleActif.couleurTexte
                : theme.boutonTexte ?? style.couleurTexte;

            bouton.textBlock.fontSize = style.fontSize;
            bouton.textBlock.fontWeight = style.fontWeight;

            if (style.alignementTexte === "gauche") {
                bouton.textBlock.textHorizontalAlignment =
                    BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            }

            if (style.alignementTexte === "centre") {
                bouton.textBlock.textHorizontalAlignment =
                    BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
            }

            bouton.textBlock.paddingLeft = style.paddingTexteGauche;
        }
    }

    marquerModeleActif({
                           conteneurListe,
                           idModeleActif,
                           etatApplication
                       }) {
        if (!conteneurListe?.children) {
            return;
        }

        conteneurListe.children.forEach((controle) => {
            if (!controle?.name?.startsWith("ModeleBtn_")) {
                return;
            }

            const idModele = controle.name.replace("ModeleBtn_", "");
            const estActif = idModele === idModeleActif;

            this.appliquerStyleBoutonModele({
                bouton: controle,
                etatApplication,
                estActif
            });
        });
    }

    estModeleActif(modele, etatApplication) {
        if (!modele || !etatApplication?.modele3d) {
            return false;
        }

        const modeleActuelId = etatApplication.modele3d.modeleActuel?.id;
        const modeleSelectionneId = etatApplication.modele3d.modeleSelectionne?.id;

        return modele.id === modeleActuelId || modele.id === modeleSelectionneId;
    }
}