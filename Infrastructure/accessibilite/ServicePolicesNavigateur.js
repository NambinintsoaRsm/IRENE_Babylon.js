/**
 * Gère le chargement des polices côté navigateur.
 *
 * Ce service utilise l'API document.fonts quand elle est disponible.
 * Il permet d'attendre qu'une police soit réellement prête avant de l'appliquer
 * dans les textes Babylon GUI.
 */
export class ServicePolicesNavigateur {
    apiPolicesDisponible() {
        return typeof document !== "undefined" && !!document.fonts;
    }

    async chargerPolice({
                            nomPolice,
                            taille = "18px",
                            poids = "400",
                            style = "normal"
                        }) {
        if (typeof nomPolice !== "string" || nomPolice.trim() === "") {
            throw new Error("Nom de police invalide.");
        }

        if (!this.apiPolicesDisponible()) {
            return {
                police: nomPolice,
                chargee: false,
                apiDisponible: false
            };
        }

        const declarationPolice = `${style} ${poids} ${taille} "${nomPolice}"`;

        try {
            await document.fonts.load(declarationPolice);
            await document.fonts.ready;

            return {
                police: nomPolice,
                chargee: this.estPoliceChargee(nomPolice),
                apiDisponible: true
            };
        } catch (erreur) {
            return {
                police: nomPolice,
                chargee: false,
                apiDisponible: true,
                erreur
            };
        }
    }

    async chargerPolices(polices = []) {
        if (!Array.isArray(polices)) {
            throw new Error("Liste de polices invalide.");
        }

        const resultats = {};

        for (const police of polices) {
            // Babylon GUI dessine le texte dans un canvas. Si une variante
            // (notamment 700) n'est chargée qu'au premier affichage d'un label
            // très court comme l'indicateur de chargement, le premier rendu peut
            // être vide. On précharge donc explicitement les deux graisses
            // réellement utilisées par ANNA.
            const regular = await this.chargerPolice({
                nomPolice: police,
                poids: "400"
            });
            const bold = await this.chargerPolice({
                nomPolice: police,
                poids: "700"
            });

            resultats[police] = {
                ...regular,
                regular,
                bold,
                chargee: regular.chargee || bold.chargee
            };
        }

        return resultats;
    }

    async attendreToutesLesPolices() {
        if (!this.apiPolicesDisponible()) {
            return false;
        }

        await document.fonts.ready;
        return true;
    }

    estPoliceChargee(nomPolice) {
        if (!this.apiPolicesDisponible()) {
            return false;
        }

        if (typeof nomPolice !== "string" || nomPolice.trim() === "") {
            return false;
        }

        return document.fonts.check(`16px "${nomPolice}"`);
    }

    obtenirPoliceDisponible(nomPolice, policeSecours = "Arial") {
        if (this.estPoliceChargee(nomPolice)) {
            return nomPolice;
        }

        return policeSecours;
    }
}