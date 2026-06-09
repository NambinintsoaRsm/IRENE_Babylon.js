/**
 * Mesure approximativement la taille réelle d'un texte dans le navigateur.
 *
 * Cette méthode crée un élément HTML invisible avec les mêmes paramètres
 * que le texte affiché dans Babylon GUI, puis mesure sa taille avec
 * getBoundingClientRect().
 *
 * Elle est utile pour comparer la place prise par différentes polices
 * comme OpenDyslexic, Luciole, Liberation ou Tiresias.
 */
export class ServiceMesureTexteNavigateur {
    mesurerTexte({
                     texte,
                     police,
                     taillePolice = "18px",
                     poidsPolice = "400",
                     stylePolice = "normal",
                     espacementLettres = "normal"
                 }) {
        if (typeof texte !== "string") {
            throw new Error("Texte invalide pour la mesure.");
        }

        if (typeof police !== "string" || police.trim() === "") {
            throw new Error("Police invalide pour la mesure.");
        }

        if (typeof document === "undefined" || !document.body) {
            throw new Error("Document HTML indisponible pour mesurer le texte.");
        }

        const element = document.createElement("span");

        element.textContent = texte;

        element.style.position = "absolute";
        element.style.visibility = "hidden";
        element.style.whiteSpace = "pre";
        element.style.left = "-9999px";
        element.style.top = "-9999px";
        element.style.pointerEvents = "none";

        element.style.fontFamily = `"${police}"`;
        element.style.fontSize = this.normaliserTaillePolice(taillePolice);
        element.style.fontWeight = String(poidsPolice);
        element.style.fontStyle = stylePolice;
        element.style.letterSpacing = espacementLettres;

        document.body.appendChild(element);

        const rectangle = element.getBoundingClientRect();

        document.body.removeChild(element);

        const ratio = window.devicePixelRatio || 1;

        return {
            largeur: rectangle.width,
            hauteur: rectangle.height,
            devicePixelRatio: ratio,
            largeurPhysiqueApprox: rectangle.width * ratio,
            hauteurPhysiqueApprox: rectangle.height * ratio
        };
    }

    normaliserTaillePolice(taillePolice) {
        if (typeof taillePolice === "number") {
            return `${taillePolice}px`;
        }

        if (typeof taillePolice === "string" && taillePolice.trim() !== "") {
            return taillePolice;
        }

        return "18px";
    }

    mesurerControleTexte(textBlock) {
        if (!textBlock) {
            throw new Error("TextBlock introuvable pour mesurer le texte.");
        }

        return this.mesurerTexte({
            texte: textBlock.text ?? "",
            police: textBlock.fontFamily ?? "Arial",
            taillePolice: textBlock.fontSize ?? "18px",
            poidsPolice: textBlock.fontWeight ?? "400",
            stylePolice: textBlock.fontStyle ?? "normal"
        });
    }

    comparerPolices({
                        texte,
                        polices,
                        taillePolice = "18px",
                        poidsPolice = "400"
                    }) {
        if (!Array.isArray(polices)) {
            throw new Error("Liste de polices invalide.");
        }

        const resultats = {};

        polices.forEach((police) => {
            resultats[police] = this.mesurerTexte({
                texte,
                police,
                taillePolice,
                poidsPolice
            });
        });

        return resultats;
    }

    trouverPoliceLaPlusCompacte({
                                    texte,
                                    polices,
                                    taillePolice = "18px",
                                    poidsPolice = "400"
                                }) {
        const mesures = this.comparerPolices({
            texte,
            polices,
            taillePolice,
            poidsPolice
        });

        let meilleurePolice = null;
        let largeurMin = Infinity;

        Object.entries(mesures).forEach(([police, mesure]) => {
            if (mesure.largeur < largeurMin) {
                largeurMin = mesure.largeur;
                meilleurePolice = police;
            }
        });

        return {
            police: meilleurePolice,
            largeur: largeurMin,
            mesures
        };
    }
}