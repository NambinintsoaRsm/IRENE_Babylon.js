/**
 * Détermine quelles listes déroulées conservent une palette fixe.
 * Les boutons déclencheurs (ex. PlcDropBtn) ne sont jamais recolorés ici :
 * ils restent sous la responsabilité du thème actif.
 *
 * Utiliser les noms des CONTENEURS de liste, pas ceux des boutons.
 */
export const configurationDropdownGUI = Object.freeze({
    couleursFixes: Object.freeze({
        actif: true,
        mode: "inclusion", // "inclusion" ou "exclusion"
        nomsInclus: Object.freeze(["PlcTyPoScrollV"]),
        nomsExclus: Object.freeze([]),
        couleurs: Object.freeze({
            fondListe: "#f5f5f5",
            fondOption: "#f5f5f5",
            fondOptionSelectionnee: "#474747FF",
            texteOption: "#000000FF",
            bordureOption: "#777777FF"
        })
    })
});
