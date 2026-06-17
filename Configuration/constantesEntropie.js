/**
 * Paramètres de test pour la recherche de vue par entropie.
 *
 * Objectif du test : comparer les vues en conservant l'état visuel courant
 * de la scène. Les post-traitements et les textures actuellement appliqués
 * ne sont pas désactivés automatiquement ; ils peuvent être modifiés
 * manuellement pour réaliser plusieurs séries de tests comparables.
 */
export const constantesEntropie = Object.freeze({
    parcoursSpherique: Object.freeze({
        // Tour horizontal complet : 0°, 30°, 60°, ..., 330°.
        pasAlphaDegres: 30,

        // Angle vertical Babylon autour de l'objet.
        // 0° correspond presque à une vue du dessus,
        // 90° correspond à une vue de face/côté,
        // 180° correspond presque à une vue du dessous.
        // On évite 0° et 180° exacts pour ne pas placer la caméra sur les pôles.
        betasDegres: Object.freeze([20, 45, 70, 90, 110, 135, 160]),

        // Distance caméra-centre de l'objet = rayon de la sphère d'observation.
        // rayonRecherche = max(rayonObjet * facteurRayonObjet, distanceMinimale)
        facteurRayonObjet: 3,
        distanceMinimale: 1.5
    }),

    analyseImage: Object.freeze({
        // On analyse la zone centrale du rendu pour éviter que les menus/fonds larges
        // dominent trop l'histogramme. La scène GUI n'est pas incluse dans le rendu 3D.
        margeZoneCentrale: 0.12,

        // Plus la valeur est grande, plus on lit de pixels.
        // 220 garde un calcul raisonnable pour un test en navigateur.
        resolutionAnalyse: 220,

        // Histogramme de luminance 8 bits : valeurs 0 à 255.
        nombreClassesHistogramme: 256
    }),

    modeAnalyse: Object.freeze({
        // Par défaut, on conserve l'état courant de la scène.
        // Pour un test strictement sur l'objet brut, ces deux valeurs peuvent être passées à true.
        desactiverPostTraitements: false,
        restaurerMateriauxOriginauxPendantAnalyse: false
    }),

    // Alias conservé pour compatibilité avec le service si une ancienne version l'utilise.
    modeObjetBase: Object.freeze({
        desactiverPostTraitements: false,
        restaurerMateriauxOriginauxPendantAnalyse: false
    }),

    exportCsv: Object.freeze({
        actif: true,
        nomFichier: "entropie_vues.csv"
    })
});
