export class FermerSectionsUC {
    constructor(etatApplication) {
        this.etatApplication = etatApplication;
    }

    executer(sectionsAIgnorer = []) {
        if (!Array.isArray(sectionsAIgnorer)) {
            throw new Error("La liste des sections à ignorer est invalide.");
        }

        const sections = this.etatApplication.animation.sections;

        if (!sections) {
            throw new Error("Sections introuvables.");
        }

        const sectionsFermees = [];

        Object.keys(sections).forEach((nomSection) => {
            if (sectionsAIgnorer.includes(nomSection)) {
                return;
            }

            sections[nomSection].fermer();
            sectionsFermees.push(nomSection);
        });

        return {
            sectionsFermees
        };
    }
}