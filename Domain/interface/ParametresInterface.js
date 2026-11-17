/**
 * @file Objet de valeur des préférences de l'interface utilisateur.
 *
 * Rôle : regrouper police, taille, gras, thème, position du menu et épaisseurs de
 * bordures sans dépendre de Babylon GUI.
 *
 * Utilisation : les Use Cases remplacent l'instance courante par copierAvec() ;
 * ServiceTexteGUI et ServiceStyleInterfaceGUI traduisent ensuite ces paramètres.
 */
import { estPositionMenuValide } from "./PositionMenu.js";
import { estThemeInterfaceValide } from "./ThemeInterface.js";

export class ParametresInterface {
    constructor({
        police = "Luciole",
        taillePolice = 1,
        gras = false,
        theme = "blanc",
        positionMenu = "droite",
        tailleBorduresMenu = 1,
        tailleBorduresBoutons = 1
    } = {}) {
        this.police = police;
        this.taillePolice = taillePolice;
        this.gras = gras;
        this.theme = theme;
        this.positionMenu = positionMenu;
        this.tailleBorduresMenu = tailleBorduresMenu;
        this.tailleBorduresBoutons = tailleBorduresBoutons;

        this.valider();
    }

    valider() {
        if (typeof this.police !== "string" || this.police.trim() === "") {
            throw new Error("La police d'interface est invalide.");
        }

        // Niveau entier 1 à 6, sans dépendance à Babylon.js.
        if (!Number.isInteger(this.taillePolice) || this.taillePolice < 1 || this.taillePolice > 6) {
            throw new Error("Le niveau de taille de police doit être compris entre 1 et 6.");
        }

        if (typeof this.gras !== "boolean") {
            throw new Error("Le paramètre gras doit être un booléen.");
        }

        if (!estThemeInterfaceValide(this.theme)) {
            throw new Error(`Le thème d'interface '${this.theme}' est invalide.`);
        }

        if (!estPositionMenuValide(this.positionMenu)) {
            throw new Error(`La position du menu '${this.positionMenu}' est invalide.`);
        }

        if (!Number.isFinite(this.tailleBorduresMenu) || this.tailleBorduresMenu < 0) {
            throw new Error("La taille des bordures du menu est invalide.");
        }

        if (!Number.isFinite(this.tailleBorduresBoutons) || this.tailleBorduresBoutons < 0) {
            throw new Error("La taille des bordures des boutons est invalide.");
        }
    }

    copierAvec(nouveauxParametres = {}) {
        return new ParametresInterface({
            police: nouveauxParametres.police ?? this.police,
            taillePolice: nouveauxParametres.taillePolice ?? this.taillePolice,
            gras: nouveauxParametres.gras ?? this.gras,
            theme: nouveauxParametres.theme ?? this.theme,
            positionMenu: nouveauxParametres.positionMenu ?? this.positionMenu,
            tailleBorduresMenu: nouveauxParametres.tailleBorduresMenu ?? this.tailleBorduresMenu,
            tailleBorduresBoutons: nouveauxParametres.tailleBorduresBoutons ?? this.tailleBorduresBoutons
        });
    }
}
