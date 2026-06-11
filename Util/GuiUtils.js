/**
 * Fonctions utilitaires générales pour Babylon GUI.
 *
 * Ces fonctions évitent de répéter les mêmes vérifications
 * dans les services GUI et les contrôleurs.
 */
export function estControleValide(controle) {
    return !!controle;
}

export function estBouton(controle) {
    return controle?.className === "Button";
}

export function estTextBlock(controle) {
    return controle?.className === "TextBlock";
}

export function estSlider(controle) {
    return controle?.className === "Slider";
}

export function estRectangle(controle) {
    return controle?.className === "Rectangle";
}

export function parcourirControles(controle, callback) {
    if (!controle || typeof callback !== "function") {
        return;
    }

    callback(controle);

    if (Array.isArray(controle.children)) {
        controle.children.forEach((enfant) => {
            parcourirControles(enfant, callback);
        });
    }
}

export function trouverEnfantParType(controle, className) {
    if (!controle?.children) {
        return null;
    }

    return controle.children.find((enfant) => enfant.className === className) ?? null;
}

export function trouverTextBlockDansBouton(bouton) {
    return trouverEnfantParType(bouton, "TextBlock");
}

export function appliquerVisibilite(controle, estVisible) {
    if (!controle) {
        return;
    }

    controle.isVisible = Boolean(estVisible);
}

export function viderConteneur(conteneur) {
    if (!conteneur?.children) {
        return;
    }

    const enfants = [...conteneur.children];

    enfants.forEach((enfant) => {
        conteneur.removeControl(enfant);
    });
}