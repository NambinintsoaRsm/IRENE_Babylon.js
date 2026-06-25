import { ParametresInterface } from "../interface/ParametresInterface.js";
import { ParametresApparence } from "../apparence/ParametresApparence.js";
import { ParametresContours } from "../contours/ParametresContours.js";
import { ParametresCamera } from "../camera/ParametresCamera.js";

export class ProfilUtilisateur {
    constructor({
                    interfaceUtilisateur = new ParametresInterface(),
                    apparence = new ParametresApparence(),
                    contours = new ParametresContours(),
                    camera = new ParametresCamera(),
                    modele3DId = null,
                    lumiere = null,
                    miseLumiere = null,
                    fondScene = null,
                    accessibilite = null,
                    dateSauvegarde = null,
                    versionSauvegarde = 1
                } = {}) {
        this.interfaceUtilisateur = interfaceUtilisateur;
        this.apparence = apparence;
        this.contours = contours;
        this.camera = camera;
        this.modele3DId = modele3DId;

        // Sections extensibles : elles permettent d'ajouter plus tard les
        // préférences navigateur/OS sans casser le format de sauvegarde.
        this.lumiere = lumiere;
        this.miseLumiere = miseLumiere;
        this.fondScene = fondScene;
        this.accessibilite = accessibilite;
        this.dateSauvegarde = dateSauvegarde;
        this.versionSauvegarde = versionSauvegarde;

        this.valider();
    }

    valider() {
        if (!(this.interfaceUtilisateur instanceof ParametresInterface)) {
            throw new Error("Les paramètres d'interface du profil sont invalides.");
        }

        if (!(this.apparence instanceof ParametresApparence)) {
            throw new Error("Les paramètres d'apparence du profil sont invalides.");
        }

        if (!(this.contours instanceof ParametresContours)) {
            throw new Error("Les paramètres de contours du profil sont invalides.");
        }

        if (!(this.camera instanceof ParametresCamera)) {
            throw new Error("Les paramètres de caméra du profil sont invalides.");
        }

        if (this.modele3DId !== null && typeof this.modele3DId !== "string") {
            throw new Error("L'identifiant du modèle 3D du profil est invalide.");
        }
    }

    copierAvec(nouveauxParametres = {}) {
        return new ProfilUtilisateur({
            interfaceUtilisateur: nouveauxParametres.interfaceUtilisateur ?? this.interfaceUtilisateur,
            apparence: nouveauxParametres.apparence ?? this.apparence,
            contours: nouveauxParametres.contours ?? this.contours,
            camera: nouveauxParametres.camera ?? this.camera,
            modele3DId: nouveauxParametres.modele3DId ?? this.modele3DId,
            lumiere: nouveauxParametres.lumiere ?? this.lumiere,
            miseLumiere: nouveauxParametres.miseLumiere ?? this.miseLumiere,
            fondScene: nouveauxParametres.fondScene ?? this.fondScene,
            accessibilite: nouveauxParametres.accessibilite ?? this.accessibilite,
            dateSauvegarde: nouveauxParametres.dateSauvegarde ?? this.dateSauvegarde,
            versionSauvegarde: nouveauxParametres.versionSauvegarde ?? this.versionSauvegarde
        });
    }
}
