/**
 * Gère les dropdowns personnalisés de l'interface.
 *
 * Quand l'utilisateur choisit une option, le texte du bouton principal
 * est remplacé par la valeur choisie, puis la liste est refermée.
 */
export class ServiceDropdownGUI {
    basculerListe(liste) {
        if (!liste) {
            throw new Error("Liste déroulante introuvable.");
        }

        liste.isVisible = !liste.isVisible;

        return liste.isVisible;
    }

    ouvrirListe(liste) {
        if (!liste) {
            throw new Error("Liste déroulante introuvable.");
        }

        liste.isVisible = true;
    }

    fermerListe(liste) {
        if (!liste) {
            return;
        }

        liste.isVisible = false;
    }

    mettreAJourTexteSelection(textBlockSelection, nouvelleValeur) {
        if (!textBlockSelection) {
            throw new Error("Texte de sélection du dropdown introuvable.");
        }

        textBlockSelection.text = nouvelleValeur;
    }

    selectionnerOption({
                           valeur,
                           textBlockSelection,
                           liste,
                           callbackSelection = null
                       }) {
        if (typeof valeur !== "string" || valeur.trim() === "") {
            throw new Error("Valeur de dropdown invalide.");
        }

        this.mettreAJourTexteSelection(textBlockSelection, valeur);
        this.fermerListe(liste);

        if (typeof callbackSelection === "function") {
            callbackSelection(valeur);
        }

        return valeur;
    }

    brancherOption({
                       boutonOption,
                       valeur,
                       textBlockSelection,
                       liste,
                       callbackSelection
                   }) {
        if (!boutonOption) {
            throw new Error("Bouton option introuvable.");
        }

        boutonOption.onPointerClickObservable.add(() => {
            this.selectionnerOption({
                valeur,
                textBlockSelection,
                liste,
                callbackSelection
            });
        });
    }
}