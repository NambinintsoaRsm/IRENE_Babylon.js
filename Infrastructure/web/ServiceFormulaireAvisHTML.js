export class ServiceFormulaireAvisHTML {
    constructor({ configuration } = {}) {
        if (!configuration) {
            throw new Error("La configuration du formulaire d'avis est requise.");
        }

        this.configuration = configuration;
        this.camera = null;
        this.canvas = null;
        this.obtenirApparence = null;
        this.onSoumission = null;

        this.overlay = null;
        this.fenetre = null;
        this.titre = null;
        this.boutonFermer = null;
        this.conteneurSurvey = null;
        this.message = null;

        this.survey = null;
        this.dernieresReponses = null;
        this.initialisationEnCours = null;

        this.elementFocusPrecedent = null;
        this.canvasAriaHiddenInitial = null;
        this.cameraEtaitAttachee = true;
        this.installe = false;
        this.ouvert = false;

        this._gererClicFond = this._gererClicFond.bind(this);
        this._gererTouche = this._gererTouche.bind(this);
        this._fermerDepuisBouton = this.fermer.bind(this);
    }

    installer({ camera, canvas, obtenirApparence, onSoumission } = {}) {
        if (typeof document === "undefined") return;

        this.camera = camera ?? this.camera;
        this.canvas = canvas ?? this.canvas;
        this.obtenirApparence = obtenirApparence ?? this.obtenirApparence;
        if (typeof onSoumission === "function") {
            this.onSoumission = onSoumission;
        }

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
        boutonFermer.setAttribute("aria-label", "Fermer le questionnaire de satisfaction");

        const contenu = document.createElement("div");
        contenu.className = "irene-formulaire-avis__contenu";

        const conteneurSurvey = document.createElement("div");
        conteneurSurvey.className = "irene-formulaire-avis__survey anna-questionnaire";
        conteneurSurvey.setAttribute("aria-live", "polite");

        const message = document.createElement("p");
        message.className = "irene-formulaire-avis__message";
        message.textContent = this.configuration.messageModuleIndisponible;
        message.hidden = true;

        entete.append(titre, boutonFermer);
        contenu.append(conteneurSurvey, message);
        fenetre.append(entete, contenu);
        overlay.appendChild(fenetre);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.fenetre = fenetre;
        this.titre = titre;
        this.boutonFermer = boutonFermer;
        this.conteneurSurvey = conteneurSurvey;
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
                obtenirApparence: this.obtenirApparence,
                onSoumission: this.onSoumission
            });
        }

        if (!this.overlay) return;

        this._synchroniserApparence();
        this._initialiserQuestionnaireSiNecessaire().catch((erreur) => {
            console.error("[Avis] Impossible d'initialiser le questionnaire.", erreur);
            if (this.conteneurSurvey) this.conteneurSurvey.hidden = true;
            if (this.message) {
                this.message.textContent = this.configuration.messageModuleIndisponible;
                this.message.hidden = false;
            }
        });

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

        this.survey?.dispose?.();
        this.overlay?.remove();

        this.overlay = null;
        this.fenetre = null;
        this.titre = null;
        this.boutonFermer = null;
        this.conteneurSurvey = null;
        this.message = null;
        this.survey = null;
        this.dernieresReponses = null;
        this.initialisationEnCours = null;
        this.installe = false;
    }

    async _initialiserQuestionnaireSiNecessaire() {
        if (this.survey) return this.survey;
        if (this.initialisationEnCours) return this.initialisationEnCours;

        this.initialisationEnCours = (async () => {
            if (this.conteneurSurvey) this.conteneurSurvey.hidden = true;
            if (this.message) {
                this.message.textContent = "Chargement du questionnaire…";
                this.message.hidden = false;
            }

            await this._chargerSurveyJSSiNecessaire();

            const SurveyJS = globalThis.Survey;
            if (!SurveyJS?.Model) {
                throw new Error("SurveyJS n'est pas disponible après son chargement.");
            }

            if (this.message) this.message.hidden = true;
            if (this.conteneurSurvey) this.conteneurSurvey.hidden = false;

            this.survey = new SurveyJS.Model(this.configuration.questionnaire);

            this.survey.onComplete.add((sender) => {
                const reponses = sender.data ?? {};

                // Une copie structurée reste disponible en mémoire pour le débogage,
                // mais l'enregistrement réel est délégué au contrôleur.
                this.dernieresReponses = this._construireExport(reponses);

                if (typeof this.onSoumission === "function") {
                    Promise.resolve(this.onSoumission(reponses))
                        .then((resultat) => {
                            if (resultat?.ok) {
                                console.info(
                                    "[Enquête] Réponse enregistrée.",
                                    {
                                        sauvegardeServeur: resultat.sauvegardeServeur,
                                        emailEnvoye: resultat.emailEnvoye,
                                        identifiant: resultat.identifiant
                                    }
                                );
                            } else if (resultat) {
                                console.warn("[Enquête]", resultat.message);
                            }
                        })
                        .catch((erreur) => {
                            console.error("[Enquête] Erreur pendant la soumission.", erreur);
                        });
                }

                // Aucun second écran de remerciement : la dernière page du
                // questionnaire contient déjà le message prévu par les encadrants.
                this.fermer();
            });

            this.survey.onCurrentPageChanged.add(() => {
                requestAnimationFrame(() => {
                    this.conteneurSurvey?.scrollTo?.({ top: 0, behavior: "smooth" });
                    this._synchroniserNavigationSurveyJS();
                });
            });

            this.survey.render(this.conteneurSurvey);
            requestAnimationFrame(() => this._synchroniserNavigationSurveyJS());
            return this.survey;
        })();

        try {
            return await this.initialisationEnCours;
        } finally {
            this.initialisationEnCours = null;
        }
    }

    async _chargerSurveyJSSiNecessaire() {
        if (globalThis.Survey?.Model) return;

        const ressources = this.configuration.ressourcesSurveyJS ?? {};
        await this._chargerFeuilleStyle(ressources.css, "anna-surveyjs-css");
        await this._chargerScript(ressources.core, "anna-surveyjs-core");
        await this._chargerScript(ressources.ui, "anna-surveyjs-ui");
    }

    _chargerFeuilleStyle(url, id) {
        const adresse = String(url ?? "").trim();
        if (!adresse) return Promise.reject(new Error("URL CSS SurveyJS manquante."));

        if (document.getElementById(id)) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const lien = document.createElement("link");
            lien.id = id;
            lien.rel = "stylesheet";
            lien.href = adresse;
            lien.addEventListener("load", () => resolve(), { once: true });
            lien.addEventListener(
                "error",
                () => reject(new Error(`Impossible de charger ${adresse}`)),
                { once: true }
            );
            document.head.appendChild(lien);
        });
    }

    _chargerScript(url, id) {
        const adresse = String(url ?? "").trim();
        if (!adresse) return Promise.reject(new Error("URL JavaScript SurveyJS manquante."));

        const existant = document.getElementById(id);
        if (existant?.dataset?.annaCharge === "true") return Promise.resolve();

        return new Promise((resolve, reject) => {
            const script = existant ?? document.createElement("script");

            const terminer = () => {
                script.dataset.annaCharge = "true";
                resolve();
            };

            script.addEventListener("load", terminer, { once: true });
            script.addEventListener(
                "error",
                () => reject(new Error(`Impossible de charger ${adresse}`)),
                { once: true }
            );

            if (!existant) {
                script.id = id;
                script.src = adresse;
                script.async = true;
                document.head.appendChild(script);
            }
        });
    }

    _construireExport(reponses) {
        return {
            questionnaire: "ANNA – Enquête de satisfaction",
            anonyme: true,
            dateEnvoi: new Date().toISOString(),
            reponses
        };
    }

    _synchroniserApparence() {
        if (!this.overlay) return;

        const apparence = this.obtenirApparence?.() ?? {};
        const police = String(apparence.police || "Arial").replace(/["']/g, "").trim();
        const pilePolice = police.toLowerCase() === "arial"
            ? "Arial, sans-serif"
            : `"${police}", Arial, sans-serif`;

        // taillePolice reste la variation relative utilisée par ANNA.
        // La taille de référence du formulaire est exprimée en rem et non en pixels.
        const variation = Number(apparence.taillePolice) || 0;
        const echelle = Math.max(0.8, Math.min(1.6, 1 + variation / 100));
        const tailleBaseRem = Math.max(1, Math.min(2, 1.25 * echelle));

        const definir = (nom, valeur, secours) => {
            this.overlay.style.setProperty(nom, String(valeur || secours));
        };

        definir("--irene-avis-police", pilePolice, "Arial, sans-serif");
        definir("--irene-avis-poids", apparence.gras ? "700" : "400", "400");
        definir("--irene-avis-echelle", String(echelle), "1");
        definir(
            "--irene-avis-taille-formulaire",
            `clamp(1rem, ${tailleBaseRem.toFixed(3)}rem, 2rem)`,
            "1.25rem"
        );

        // Taille propre au texte des boutons de navigation.
        // Elle suit la taille courante d'ANNA tout en restant modifiable depuis le CSS.
        definir(
            "--irene-avis-taille-navigation",
            `${(tailleBaseRem * 1.25).toFixed(3)}rem`,
            "1.563rem"
        );

        // SurveyJS possède ses propres jetons typographiques. On les synchronise
        // explicitement avec ANNA afin que les boutons et leurs contenus internes
        // utilisent réellement la police et la taille choisies dans l'interface.
        definir("--sjs-font-family", pilePolice, "Arial, sans-serif");
        definir(
            "--sjs-font-size",
            `clamp(1rem, ${tailleBaseRem.toFixed(3)}rem, 2rem)`,
            "1.25rem"
        );

        // Couleurs du thème courant d'ANNA.
        definir("--irene-avis-fond", apparence.fond, "#ffffff");
        definir("--irene-avis-fond-page", apparence.fondSecondaire, apparence.fond || "#ededed");
        definir("--irene-avis-fond-secondaire", apparence.fondSection, apparence.fondSecondaire || apparence.fond || "#f5f5f5");
        definir("--irene-avis-texte", apparence.texte, "#111111");
        definir("--irene-avis-texte-secondaire", apparence.texteSecondaire, apparence.texte || "#333333");
        definir("--irene-avis-bordure", apparence.bordure, "#202020");
        definir("--irene-avis-bordure-douce", apparence.bordure, "#777777");

        // Boutons de navigation = mêmes contrastes que les boutons ANNA.
        definir("--irene-avis-bouton-fond", apparence.boutonFond, apparence.fond || "#ffffff");
        definir("--irene-avis-bouton-texte", apparence.boutonTexte, apparence.texte || "#111111");
        definir("--irene-avis-bouton-bordure", apparence.boutonBordure, apparence.bordure || "#202020");

        // État sélectionné / focus fort = palette active déjà définie dans ANNA.
        definir("--irene-avis-selection", apparence.boutonActifFond, apparence.texte || "#111111");
        definir("--irene-avis-selection-texte", apparence.boutonActifTexte, apparence.fond || "#ffffff");
        definir("--irene-avis-selection-bordure", apparence.boutonActifBordure, apparence.bordure || "#202020");
        definir("--irene-avis-focus", apparence.bordure, apparence.texte || "#111111");

        // SurveyJS utilise plusieurs variantes de fond en plus de la couleur
        // primaire. Sans ce pont complet, sa teinte vert clair par défaut peut
        // réapparaître sur certains états avec un texte blanc en thème sombre.
        definir("--sjs-primary-backcolor", apparence.boutonFond, apparence.fond || "#ffffff");
        definir("--sjs-primary-forecolor", apparence.boutonTexte, apparence.texte || "#111111");
        definir("--sjs-primary-forecolor-light", apparence.boutonTexte, apparence.texte || "#111111");
        definir("--sjs-primary-backcolor-light", apparence.fondSection, apparence.fondSecondaire || apparence.fond || "#f5f5f5");
        definir("--sjs-primary-backcolor-dark", apparence.boutonActifFond, apparence.texte || "#111111");

        definir("--sjs-general-backcolor", apparence.fond, "#ffffff");
        definir("--sjs-general-backcolor-dark", apparence.fondSecondaire, apparence.fond || "#ededed");
        definir("--sjs-general-backcolor-dim", apparence.fondSecondaire, apparence.fond || "#ededed");
        definir("--sjs-general-backcolor-dim-light", apparence.fondSection, apparence.fondSecondaire || apparence.fond || "#f5f5f5");
        definir("--sjs-general-backcolor-dim-dark", apparence.fondSecondaire, apparence.fond || "#ededed");
        definir("--sjs-general-forecolor", apparence.texte, "#111111");
        definir("--sjs-general-forecolor-light", apparence.texteSecondaire, apparence.texte || "#333333");
        definir("--sjs-general-dim-forecolor", apparence.texte, "#111111");
        definir("--sjs-general-dim-forecolor-light", apparence.texteSecondaire, apparence.texte || "#333333");

        definir("--sjs-border-default", apparence.boutonBordure, apparence.bordure || "#202020");
        definir("--sjs-border-light", apparence.bordure, "#777777");
        definir("--sjs-border-inside", apparence.bordure, "#777777");

        definir("--sjs-special-green", apparence.boutonActifFond, apparence.texte || "#111111");
        definir("--sjs-special-green-light", apparence.fondSection, apparence.fondSecondaire || apparence.fond || "#f5f5f5");
        definir("--sjs-special-green-forecolor", apparence.boutonActifTexte, apparence.fond || "#ffffff");

        requestAnimationFrame(() => this._synchroniserNavigationSurveyJS());
    }

    _synchroniserNavigationSurveyJS() {
        if (!this.conteneurSurvey || !this.overlay) return;

        const styleOverlay = getComputedStyle(this.overlay);
        const police = styleOverlay.getPropertyValue("--irene-avis-police").trim() || "Arial, sans-serif";
        const taille = styleOverlay.getPropertyValue("--irene-avis-taille-navigation").trim() || "1.563rem";

        const pied = this.conteneurSurvey.querySelector(".sd-footer.sd-body__navigation");
        if (pied) {
            pied.style.setProperty("display", "flex", "important");
            pied.style.setProperty("align-items", "center", "important");
            pied.style.setProperty("justify-content", "flex-end", "important");
            pied.style.setProperty("gap", "3%", "important");
            pied.style.setProperty("width", "100%", "important");
        }

        const boutons = this.conteneurSurvey.querySelectorAll(
            ".sd-navigation__prev-btn, .sd-navigation__next-btn, .sd-navigation__complete-btn"
        );

        boutons.forEach((bouton) => {
            const elements = [bouton, ...bouton.querySelectorAll("*")];
            elements.forEach((element) => {
                element.style?.setProperty?.("font-family", police, "important");
                element.style?.setProperty?.("font-size", taille, "important");
                element.style?.setProperty?.("font-weight", "700", "important");
            });
        });
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
