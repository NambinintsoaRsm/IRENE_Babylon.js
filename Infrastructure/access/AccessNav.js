export class AccessNav {
    lire() {
        const contraste = this.lireContraste();
        const schemaCouleur = this.estActif("(prefers-color-scheme: dark)")
            ? "dark"
            : "light";

        return {
            reductionMouvement: this.estActif("(prefers-reduced-motion: reduce)"),
            contraste,
            schemaCouleur,
            couleursForcees: this.estActif("(forced-colors: active)"),
            transparenceReduite: this.estActif("(prefers-reduced-transparency: reduce)"),
            remPx: this.mesurerRemPx()
        };
    }

    lirePreferences() {
        return this.lire();
    }

    lirePreferencesCompletes() {
        return this.lire();
    }

    estActif(requete) {
        return window.matchMedia?.(requete).matches ?? false;
    }

    lireContraste() {
        if (this.estActif("(prefers-contrast: more)")) return "more";
        if (this.estActif("(prefers-contrast: less)")) return "less";
        if (this.estActif("(prefers-contrast: custom)")) return "custom";
        return "normal";
    }

    mesurerRemPx() {
        if (!document?.body) return 16;

        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.visibility = "hidden";
        div.style.pointerEvents = "none";
        div.style.width = "1rem";
        div.style.height = "1rem";

        document.body.appendChild(div);
        const largeur = div.getBoundingClientRect().width;
        div.remove();

        return Number.isFinite(largeur) && largeur > 0 ? largeur : 16;
    }
}
