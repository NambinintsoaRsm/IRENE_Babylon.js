export class AppliquerProfilUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(profil) {
        if (!profil) {
            throw new Error("Profil invalide.");
        }

        if (!this.etatApplication.interface) {
            throw new Error("État interface introuvable.");
        }

        if (!this.etatApplication.apparence) {
            throw new Error("État apparence introuvable.");
        }

        if (!this.etatApplication.contours) {
            throw new Error("État contours introuvable.");
        }

        if (!this.etatApplication.camera) {
            throw new Error("État caméra introuvable.");
        }

        this.etatApplication.interface.parametres = profil.interfaceUtilisateur;
        this.etatApplication.apparence.parametres = profil.apparence;

        // On conserve l'objet ParametresContours déjà branché par les contrôleurs.
        // Sinon les sliders / boutons gardent une ancienne référence après restauration.
        if (this.etatApplication.contours.parametres) {
            Object.assign(this.etatApplication.contours.parametres, profil.contours);
        } else {
            this.etatApplication.contours.parametres = profil.contours;
        }

        this.etatApplication.camera.parametres = profil.camera;

        if (profil.miseLumiere) {
            const parametresMiseLumiere = this.etatApplication.contours.parametresMiseLumiere ?? {};
            Object.assign(parametresMiseLumiere, profil.miseLumiere.parametres ?? {});
            this.etatApplication.contours.parametresMiseLumiere = parametresMiseLumiere;

            this.etatApplication.contours.miseLumiereNormalesActif = Boolean(profil.miseLumiere.normalesActif);
            this.etatApplication.contours.miseLumiereCouleursActif = Boolean(profil.miseLumiere.couleursActif);
        }

        if (profil.lumiere) {
            this.etatApplication.lumiere = this.etatApplication.lumiere || {};
            this.etatApplication.lumiere.parametres = { ...profil.lumiere };
        }

        if (profil.accessibilite) {
            this.etatApplication.accessibilite = {
                ...(this.etatApplication.accessibilite ?? {}),
                ...profil.accessibilite,
                // On applique d'abord le profil normal. L'activation réelle de
                // l'accessibilité se fait ensuite dans main.js pour éviter que
                // ServiceTexteGUI agrandisse les textes avant que la sauvegarde
                // normale soit mémorisée.
                actif: false,
                actifProfilSauvegarde: Boolean(profil.accessibilite.actif)
            };
        }

        this.etatApplication.profil.profilActuel = profil;

        if (this.etatApplication.modele3d && profil.modele3DId) {
            const modelesDisponibles = this.etatApplication.modele3d.modelesDisponibles ?? [];
            const idSauvegarde = this.normaliserIdentifiant(profil.modele3DId);
            const modeleSauvegarde = modelesDisponibles.find((modele) => {
                return modele.id === profil.modele3DId
                    || this.normaliserIdentifiant(modele.id) === idSauvegarde
                    || this.normaliserIdentifiant(modele.nom) === idSauvegarde;
            });

            if (modeleSauvegarde) {
                this.etatApplication.modele3d.modeleSelectionne = modeleSauvegarde;
            } else {
                // Ne surtout pas remettre la sélection à null : cela cassait la
                // détection automatique quand une ancienne sauvegarde pointait
                // vers un modèle qui n'existe plus dans assets/modeles/.
                this.etatApplication.modele3d.modeleSelectionne =
                    this.etatApplication.modele3d.modeleSelectionne
                    ?? this.etatApplication.modele3d.modeleActuel
                    ?? modelesDisponibles[0]
                    ?? null;

                console.info("[Sauvegarde] Modèle sauvegardé introuvable dans la liste détectée. Sélection actuelle conservée.", {
                    modele3DId: profil.modele3DId,
                    modeleSelectionne: this.etatApplication.modele3d.modeleSelectionne?.id ?? null
                });
            }
        }

        return profil;
    }

    normaliserIdentifiant(valeur) {
        return String(valeur ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "");
    }
}
