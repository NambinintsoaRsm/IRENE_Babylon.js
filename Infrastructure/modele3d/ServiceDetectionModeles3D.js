import { Modele3D } from "../../Domain/modele3d/Modele3D.js";

/**
 * Détecte les modèles OBJ disponibles dans assets/modeles/.
 *
 * Principe attendu :
 * assets/modeles/
 *   NomDuModele/
 *     fichier.obj
 *     fichier.mtl
 *     textures...
 *
 * Le nom affiché dans l'interface est le nom du dossier.
 *
 * Limite navigateur : un navigateur ne peut pas lire directement le disque du serveur.
 * La détection automatique fonctionne si le serveur expose l'index des dossiers
 * (ex. python -m http.server en local). Pour un hébergement sans index de dossier,
 * le service tente aussi de lire un manifeste optionnel assets/modeles/modeles.json,
 * puis revient au catalogue de secours.
 */
export class ServiceDetectionModeles3D {
    constructor({
                    dossierModeles = "assets/modeles/",
                    fichiersManifest = ["modeles.json", "manifest.json"],
                    extensions = ["obj"],
                    profondeurRecherche = 2
                } = {}) {
        this.dossierModeles = this.normaliserDossier(dossierModeles);
        this.fichiersManifest = fichiersManifest;
        this.extensions = extensions.map((extension) => extension.toLowerCase());
        this.profondeurRecherche = Math.max(0, Number(profondeurRecherche) || 0);
    }

    async detecterModeles() {
        const depuisManifest = await this.detecterDepuisManifest();

        if (depuisManifest.length > 0) {
            return depuisManifest;
        }

        const dossiers = await this.detecterDossiersDepuisIndex();
        const modeles = [];

        for (const dossier of dossiers) {
            const fichiersObj = await this.detecterObjDepuisDossier(dossier, this.profondeurRecherche);
            const fichierObj = fichiersObj[0];

            if (!fichierObj) {
                // Ce cas est normal pour des dossiers techniques comme glb/ ou textures/.
                // On évite donc de bloquer la détection des autres modèles.
                console.info(`[Modèles 3D] Dossier ignoré, aucun OBJ détecté : ${dossier.nom}.`);
                continue;
            }

            modeles.push(this.creerModeleDepuisDossier({
                dossier,
                fichier: fichierObj
            }));
        }

        return modeles.sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
    }

    async detecterDepuisManifest() {
        for (const nomFichier of this.fichiersManifest) {
            const url = `${this.dossierModeles}${nomFichier}`;
            const donnees = await this.lireJson(url);

            if (!donnees) {
                continue;
            }

            const entrees = Array.isArray(donnees)
                ? donnees
                : donnees.modeles ?? donnees.models ?? [];

            if (!Array.isArray(entrees)) {
                continue;
            }

            const modeles = entrees
                .map((entree) => this.creerModeleDepuisManifest(entree))
                .filter(Boolean);

            if (modeles.length > 0) {
                console.info(`[Modèles 3D] ${modeles.length} modèle(s) détecté(s) depuis ${url}.`);
                return modeles;
            }
        }

        return [];
    }

    async detecterDossiersDepuisIndex() {
        const html = await this.lireTexte(this.dossierModeles);

        if (!html) {
            return [];
        }

        const liens = this.extraireLiensDepuisHtml(html, this.dossierModeles);

        return liens
            .filter((lien) => lien.estDossier)
            .filter((lien) => !this.estLienTechnique(lien.nom))
            .map((lien) => ({
                nom: this.nettoyerNomDossier(lien.nom),
                chemin: this.normaliserDossier(lien.urlRelative)
            }))
            .filter((dossier, index, liste) => {
                return dossier.nom && liste.findIndex((item) => item.chemin === dossier.chemin) === index;
            });
    }

    async detecterObjDepuisDossier(dossier, profondeurRestante = 0, dossiersVisites = new Set()) {
        const cheminDossier = this.normaliserDossier(dossier.chemin);

        if (dossiersVisites.has(cheminDossier)) {
            return [];
        }

        dossiersVisites.add(cheminDossier);

        const html = await this.lireTexte(cheminDossier);

        if (!html) {
            return [];
        }

        const liens = this.extraireLiensDepuisHtml(html, cheminDossier);

        const fichiersDirects = liens
            .filter((lien) => !lien.estDossier)
            .filter((lien) => this.estFichierModele(lien.nom))
            .map((lien) => ({
                nom: lien.nom,
                chemin: lien.urlRelative
            }));

        if (fichiersDirects.length > 0 || profondeurRestante <= 0) {
            return fichiersDirects.sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base" }));
        }

        const fichiersDansSousDossiers = [];
        const sousDossiers = liens
            .filter((lien) => lien.estDossier)
            .filter((lien) => !this.estLienTechnique(lien.nom));

        for (const sousDossier of sousDossiers) {
            const fichiers = await this.detecterObjDepuisDossier({
                nom: sousDossier.nom,
                chemin: sousDossier.urlRelative
            }, profondeurRestante - 1, dossiersVisites);

            fichiersDansSousDossiers.push(...fichiers);
        }

        return fichiersDansSousDossiers.sort((a, b) => a.chemin.localeCompare(b.chemin, "fr", { sensitivity: "base" }));
    }

    creerModeleDepuisDossier({ dossier, fichier }) {
        return new Modele3D({
            id: this.creerIdDepuisNom(dossier.nom),
            nom: dossier.nom,
            chemin: fichier.chemin,
            type: "obj"
        });
    }

    creerModeleDepuisManifest(entree) {
        if (!entree || typeof entree !== "object") {
            return null;
        }

        const dossier = entree.dossier ?? entree.folder ?? entree.nom ?? entree.name;
        const fichier = entree.fichier ?? entree.file ?? null;
        const chemin = entree.chemin ?? entree.path ?? null;

        if (chemin) {
            const nomDossier = entree.nom ?? entree.name ?? this.nomDossierDepuisChemin(chemin);

            return new Modele3D({
                id: entree.id ?? this.creerIdDepuisNom(nomDossier),
                nom: nomDossier,
                chemin,
                type: "obj"
            });
        }

        if (!dossier || !fichier) {
            return null;
        }

        const nomDossier = this.nettoyerNomDossier(dossier);
        const cheminModele = `${this.dossierModeles}${this.encoderSegmentUrl(nomDossier)}/${this.encoderSegmentUrl(fichier)}`;

        return new Modele3D({
            id: entree.id ?? this.creerIdDepuisNom(nomDossier),
            nom: entree.nom ?? entree.name ?? nomDossier,
            chemin: cheminModele,
            type: "obj"
        });
    }

    extraireLiensDepuisHtml(html, dossierBase) {
        if (typeof DOMParser !== "undefined") {
            const documentHtml = new DOMParser().parseFromString(html, "text/html");
            return Array.from(documentHtml.querySelectorAll("a[href]"))
                .map((ancre) => this.creerLienDepuisHref(ancre.getAttribute("href"), dossierBase))
                .filter(Boolean);
        }

        return Array.from(html.matchAll(/href=["']([^"']+)["']/gi))
            .map((correspondance) => this.creerLienDepuisHref(correspondance[1], dossierBase))
            .filter(Boolean);
    }

    creerLienDepuisHref(href, dossierBase) {
        if (!href || href.startsWith("?") || href.startsWith("#")) {
            return null;
        }

        let url;

        try {
            const base = new URL(dossierBase, window.location.href);
            url = new URL(href, base);
        } catch (_erreur) {
            return null;
        }

        const origineCourante = window.location.origin;

        if (url.origin !== origineCourante) {
            return null;
        }

        const dossierPageCourant = this.normaliserDossierPage(window.location.pathname);
        const cheminComplet = url.pathname.replace(/^\/+/, "");
        const urlRelative = cheminComplet.startsWith(dossierPageCourant)
            ? cheminComplet.substring(dossierPageCourant.length)
            : cheminComplet;

        const dossierBaseRelative = this.obtenirDossierBaseRelatif(dossierBase, dossierPageCourant);

        if (!urlRelative.startsWith(this.dossierModeles) || !urlRelative.startsWith(dossierBaseRelative)) {
            return null;
        }

        const estDossier = href.endsWith("/") || url.pathname.endsWith("/");
        const segments = urlRelative.split("/").filter(Boolean);
        const nom = this.decoderSegmentUrl(segments.at(-1) ?? "");

        return {
            nom,
            urlRelative: estDossier ? this.normaliserDossier(urlRelative) : urlRelative,
            estDossier
        };
    }

    estLienTechnique(nom) {
        const valeur = String(nom ?? "").trim();
        return valeur === "" || valeur === "." || valeur === ".." || valeur.startsWith(".");
    }

    estFichierModele(nom) {
        const extension = String(nom ?? "").split(".").pop()?.toLowerCase();
        return this.extensions.includes(extension);
    }

    nomDossierDepuisChemin(chemin) {
        const morceaux = String(chemin).split("/").filter(Boolean);
        return this.nettoyerNomDossier(morceaux.length >= 2 ? morceaux.at(-2) : morceaux.at(-1));
    }

    nettoyerNomDossier(nom) {
        return this.decoderSegmentUrl(String(nom ?? "").replace(/\/+$/g, "").trim());
    }

    creerIdDepuisNom(nom) {
        return this.nettoyerNomDossier(nom)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "modele";
    }

    normaliserDossier(chemin) {
        const valeur = String(chemin ?? "").trim();
        return valeur.endsWith("/") ? valeur : `${valeur}/`;
    }

    normaliserDossierPage(chemin) {
        const valeur = String(chemin ?? "/");
        const dossier = valeur.endsWith("/")
            ? valeur
            : valeur.substring(0, valeur.lastIndexOf("/") + 1);

        return dossier.replace(/^\/+/, "");
    }

    obtenirDossierBaseRelatif(dossierBase, dossierPageCourant) {
        try {
            const baseUrl = new URL(this.normaliserDossier(dossierBase), window.location.href);
            const cheminBaseComplet = baseUrl.pathname.replace(/^\/+/, "");
            const cheminBaseRelatif = cheminBaseComplet.startsWith(dossierPageCourant)
                ? cheminBaseComplet.substring(dossierPageCourant.length)
                : cheminBaseComplet;

            return this.normaliserDossier(cheminBaseRelatif);
        } catch (_erreur) {
            return this.normaliserDossier(dossierBase);
        }
    }

    encoderSegmentUrl(segment) {
        return encodeURIComponent(String(segment ?? "")).replace(/%2F/gi, "/");
    }

    decoderSegmentUrl(segment) {
        try {
            return decodeURIComponent(String(segment ?? ""));
        } catch (_erreur) {
            return String(segment ?? "");
        }
    }

    async lireTexte(url) {
        try {
            const reponse = await fetch(url, { cache: "no-store" });

            if (!reponse.ok) {
                return null;
            }

            return await reponse.text();
        } catch (_erreur) {
            return null;
        }
    }

    async lireJson(url) {
        try {
            const reponse = await fetch(url, { cache: "no-store" });

            if (!reponse.ok) {
                return null;
            }

            return await reponse.json();
        } catch (_erreur) {
            return null;
        }
    }
}
