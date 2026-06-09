/**
 * Lit les préférences d'accessibilité disponibles dans le navigateur.
 *
 * Ce service ne modifie pas directement l'interface.
 * Il retourne seulement des informations que l'application pourra utiliser :
 * - mode sombre ou clair ;
 * - réduction des animations ;
 * - contraste élevé ;
 * - couleurs forcées ;
 * - devicePixelRatio.
 */
export class ServiceAccessibiliteNavigateur {
    matchMediaDisponible() {
        return typeof window !== "undefined" && typeof window.matchMedia === "function";
    }

    correspondA(requeteMedia) {
        if (!this.matchMediaDisponible()) {
            return false;
        }

        return window.matchMedia(requeteMedia).matches;
    }

    prefereModeSombre() {
        return this.correspondA("(prefers-color-scheme: dark)");
    }

    prefereModeClair() {
        return this.correspondA("(prefers-color-scheme: light)");
    }

    detecterModeCouleur() {
        if (this.prefereModeSombre()) {
            return "sombre";
        }

        if (this.prefereModeClair()) {
            return "clair";
        }

        return "inconnu";
    }

    prefereAnimationsReduites() {
        return this.correspondA("(prefers-reduced-motion: reduce)");
    }

    prefereContrasteEleve() {
        return this.correspondA("(prefers-contrast: more)");
    }

    couleursForceesActives() {
        return this.correspondA("(forced-colors: active)");
    }

    obtenirDevicePixelRatio() {
        if (typeof window === "undefined") {
            return 1;
        }

        return window.devicePixelRatio || 1;
    }

    lirePreferences() {
        const modeCouleur = this.detecterModeCouleur();

        return {
            modeCouleur,
            modeSombre: modeCouleur === "sombre",
            modeClair: modeCouleur === "clair",
            animationsReduites: this.prefereAnimationsReduites(),
            contrasteEleve: this.prefereContrasteEleve(),
            couleursForcees: this.couleursForceesActives(),
            devicePixelRatio: this.obtenirDevicePixelRatio()
        };
    }

    ecouterChangementsPreferences(callback) {
        if (typeof callback !== "function") {
            throw new Error("Callback invalide pour écouter les préférences navigateur.");
        }

        if (!this.matchMediaDisponible()) {
            return [];
        }

        const medias = [
            window.matchMedia("(prefers-color-scheme: dark)"),
            window.matchMedia("(prefers-color-scheme: light)"),
            window.matchMedia("(prefers-reduced-motion: reduce)"),
            window.matchMedia("(prefers-contrast: more)"),
            window.matchMedia("(forced-colors: active)")
        ];

        const listener = () => {
            callback(this.lirePreferences());
        };

        medias.forEach((media) => {
            if (typeof media.addEventListener === "function") {
                media.addEventListener("change", listener);
            } else if (typeof media.addListener === "function") {
                media.addListener(listener);
            }
        });

        return medias.map((media) => {
            return () => {
                if (typeof media.removeEventListener === "function") {
                    media.removeEventListener("change", listener);
                } else if (typeof media.removeListener === "function") {
                    media.removeListener(listener);
                }
            };
        });
    }
}