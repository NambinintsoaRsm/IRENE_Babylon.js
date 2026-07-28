export class ServiceFormulaireAvisHTML {
    constructor({ configuration } = {}) {
        if (!configuration) {
            throw new Error("La configuration du formulaire d'avis est requise.");
        }

        this.configuration = configuration;
        this.camera = null;
        this.canvas = null;
        this.obtenirApparence = null;

        this.overlay = null;
        this.fenetre = null;
        this.titre = null;
        this.boutonFermer = null;
        this.iframe = null;
        this.message = null;

        this.elementFocusPrecedent = null;
        this.canvasAriaHiddenInitial = null;
        this.cameraEtaitAttachee = true;
        this.installe = false;
        this.ouvert = false;

        this._gererClicFond = this._gererClicFond.bind(this);
        this._gererTouche = this._gererTouche.bind(this);
        this._fermerDepuisBouton = this.fermer.bind(this);
    }

    installer({ camera, canvas, obtenirApparence } = {}) {
        if (typeof document === "undefined") return;

        this.camera = camera ?? this.camera;
        this.canvas = canvas ?? this.canvas;
        this.obtenirApparence = obtenirApparence ?? this.obtenirApparence;

        if (this.installe && this.overlay?.isConnected) return;

        document.getElementById("ireneFormulaireAvis")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "ireneFormulaireAvis";
        overlay.className = "irene-formulaire-avis";
        overlay.hidden = true;

        const fenetre = document.createElement("section");
        fenetre.className = "irene-formulaire-avis__fenetre";
        fenetre.setAttribute("role", "dialog");
        fenetre.setAttribute("aria-modal", "true");
        fenetre.setAttribute("aria-labelledby", "ireneFormulaireAvisTitre");

        const entete = document.createElement("header");
        entete.className = "irene-formulaire-avis__entete";

        const titre = document.createElement("h2");
        titre.id = "ireneFormulaireAvisTitre";
        titre.className = "irene-formulaire-avis__titre";
        titre.textContent = this.configuration.titreFenetre;

        const boutonFermer = document.createElement("button");
        boutonFermer.type = "button";
        boutonFermer.className = "irene-formulaire-avis__fermer";
        boutonFermer.textContent = this.configuration.texteBoutonFermer;
        boutonFermer.setAttribute("aria-label", "Fermer le formulaire de satisfaction");

        const contenu = document.createElement("div");
        contenu.className = "irene-formulaire-avis__contenu";

        const iframe = document.createElement("iframe");
        iframe.className = "irene-formulaire-avis__iframe";
        iframe.title = this.configuration.titreIframe;
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allow", "clipboard-write");
        iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");

        if (this.configuration.chargementDiffere !== false) {
            iframe.setAttribute("loading", "lazy");
        }

        const message = document.createElement("p");
        message.className = "irene-formulaire-avis__message";
        message.textContent = this.configuration.messageNonConfigure;
        message.hidden = true;

        entete.append(titre, boutonFermer);
        contenu.append(iframe, message);
        fenetre.append(entete, contenu);
        overlay.appendChild(fenetre);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.fenetre = fenetre;
        this.titre = titre;
        this.boutonFermer = boutonFermer;
        this.iframe = iframe;
        this.message = message;

        boutonFermer.addEventListener("click", this._fermerDepuisBouton);
        overlay.addEventListener("click", this._gererClicFond);
        window.addEventListener("keydown", this._gererTouche);

        this.installe = true;
    }

    ouvrir() {
        if (!this.configuration.actif) return;

        if (!this.installe) {
            this.installer({
                camera: this.camera,
                canvas: this.canvas,
                obtenirApparence: this.obtenirApparence
            });
        }

        if (!this.overlay) return;

        this._synchroniserApparence();
        this._synchroniserContenu();

        this.elementFocusPrecedent = document.activeElement;
        this.ouvert = true;
        this.overlay.hidden = false;

        this.cameraEtaitAttachee = Boolean(
            this.camera?.inputs?.attached &&
            Object.keys(this.camera.inputs.attached).length > 0
        );
        this.camera?.detachControl?.();

        if (this.canvas) {
            this.canvasAriaHiddenInitial = this.canvas.getAttribute("aria-hidden");
            this.canvas.setAttribute("aria-hidden", "true");
        }

        requestAnimationFrame(() => {
            if (this.ouvert) {
                this.boutonFermer?.focus?.();
            }
        });
    }

    fermer() {
        if (!this.overlay || !this.ouvert) return;

        this.ouvert = false;
        this.overlay.hidden = true;

        if (this.canvas) {
            if (this.canvasAriaHiddenInitial === null) {
                this.canvas.removeAttribute("aria-hidden");
            } else {
                this.canvas.setAttribute("aria-hidden", this.canvasAriaHiddenInitial);
            }
        }

        if (this.cameraEtaitAttachee && this.camera && this.canvas) {
            this.camera.attachControl?.(this.canvas, true);
        }

        const cibleFocus = this.elementFocusPrecedent;
        this.elementFocusPrecedent = null;

        if (cibleFocus && cibleFocus !== document.body && cibleFocus.focus) {
            cibleFocus.focus();
        } else {
            this.canvas?.focus?.();
        }
    }

    detruire() {
        this.fermer();

        this.boutonFermer?.removeEventListener("click", this._fermerDepuisBouton);
        this.overlay?.removeEventListener("click", this._gererClicFond);
        window.removeEventListener("keydown", this._gererTouche);
        this.overlay?.remove();

        this.overlay = null;
        this.fenetre = null;
        this.titre = null;
        this.boutonFermer = null;
        this.iframe = null;
        this.message = null;
        this.installe = false;
    }

    _synchroniserContenu() {
        const url = String(this.configuration.urlIntegration ?? "").trim();
        const configure = url !== "" && url !== "#" && !url.includes("URL_DE_TON_GOOGLE_FORM");

        if (!configure) {
            this.iframe.hidden = true;
            this.message.hidden = false;
            return;
        }

        this.message.hidden = true;
        this.iframe.hidden = false;

        const urlFinale = this._normaliserUrlIntegration(url);
        if (this.iframe.getAttribute("src") !== urlFinale) {
            this.iframe.setAttribute("src", urlFinale);
        }
    }

    _normaliserUrlIntegration(url) {
        try {
            const resultat = new URL(url, window.location.href);

            if (resultat.hostname.includes("docs.google.com") && !resultat.searchParams.has("embedded")) {
                resultat.searchParams.set("embedded", "true");
            }

            return resultat.toString();
        } catch (erreur) {
            console.warn("[Avis] URL du formulaire invalide.", erreur);
            return url;
        }
    }

    _synchroniserApparence() {
        const apparence = this.obtenirApparence?.() ?? {};
        const police = String(apparence.police || "Arial").replace(/["']/g, "").trim();
        const pilePolice = police.toLowerCase() === "arial"
            ? "Arial, sans-serif"
            : `"${police}", Arial, sans-serif`;

        const variation = Number(apparence.taillePolice) || 0;
        const echelle = Math.max(0.8, Math.min(1.5, 1 + variation / 100));

        this.overlay.style.setProperty("--irene-avis-police", pilePolice);
        this.overlay.style.setProperty("--irene-avis-poids", apparence.gras ? "700" : "400");
        this.overlay.style.setProperty("--irene-avis-taille-titre", `${Math.round(28 * echelle)}px`);
        this.overlay.style.setProperty("--irene-avis-taille-bouton", `${Math.round(21 * echelle)}px`);
        this.overlay.style.setProperty("--irene-avis-taille-message", `${Math.round(20 * echelle)}px`);
        this.overlay.style.setProperty("--irene-avis-fond", apparence.fond ?? "#ffffff");
        this.overlay.style.setProperty("--irene-avis-texte", apparence.texte ?? "#000000");
        this.overlay.style.setProperty("--irene-avis-bordure", apparence.bordure ?? "#000000");
        this.overlay.style.setProperty("--irene-avis-bouton-fond", apparence.boutonFond ?? "#000000");
        this.overlay.style.setProperty("--irene-avis-bouton-texte", apparence.boutonTexte ?? "#ffffff");
    }

    _gererClicFond(event) {
        if (
            this.configuration.fermerEnCliquantSurLeFond !== false &&
            event.target === this.overlay
        ) {
            this.fermer();
        }
    }

    _gererTouche(event) {
        if (
            this.ouvert &&
            this.configuration.fermerAvecEchap !== false &&
            event.key === "Escape"
        ) {
            event.preventDefault();
            this.fermer();
        }
    }
}
