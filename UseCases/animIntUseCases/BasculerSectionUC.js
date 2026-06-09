export class BasculerSectionUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(nomSection) {
        if (typeof nomSection !== "string" || nomSection.trim() === "") {
            throw new Error("Nom de section invalide.");
        }

        const sections = this.etatApplication.animation.sections;

        if (!sections) {
            throw new Error("Sections introuvables.");
        }

        const section = sections[nomSection];

        if (!section) {
            throw new Error(`Section introuvable : ${nomSection}`);
        }

        section.basculer();

        return {
            nom: section.nom,
            estOuvert: section.estOuvert,
            hauteurOuverte: section.hauteurOuverte
        };
    }
}