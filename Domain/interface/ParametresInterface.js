import { PositionMenu, estPositionMenuValide } from "./PositionMenu.js";
import { ThemeInterface, estThemeInterfaceValide } from "./ThemeInterface.js";

export class ParametresInterface {

    constructor({
                    police = "OpenDyslexic",
                    taillePolice = 1,
                    gras = false,
                    theme = ThemeInterface.BLANC,
                    positionMenu = PositionMenu.DROITE,
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
            throw new Error("La police de l'interface est invalide.");
        }

        if (!Number.isFinite(this.taillePolice) || this.taillePolice < 0) {
            throw new Error("La taille de police est invalide.");
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