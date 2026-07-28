import { TypeContour } from "../Domain/contours/TypeContour.js";
import { parametresContourCouleur } from "./parametresContourCouleur.js";

export const constantesContours = Object.freeze({
    // Défaut légèrement plus visible au premier affichage.
    epaisseurDefaut: 2,
    couleurDefaut: "#000000",

    epaisseurSlider: Object.freeze({
        min: 1,
        max: 2,
        defaut: 1,
        step: 1
    }),

    /**
     * Réglages visuels par type de contour.
     *
     * Le slider utilisateur reste commun et va de 1 à 2.
     * Ensuite, chaque type convertit cette valeur en épaisseur réellement appliquée :
     * - Silhouette : conserve son amplitude visuelle propre.
     * - Relief : conserve son amplitude visuelle propre.
     * - Couleur : 1 à 2 ; le shader calcule un seul masque pour alléger le rendu.
     */
    epaisseursParType: Object.freeze({
        [TypeContour.SILHOUETTE]: Object.freeze({
            min: 1,
            max: 3,
            renfortBase: 0.35
        }),

        [TypeContour.RELIEF]: Object.freeze({
            // Relief un peu plus large au minimum : le chaînage nettoie le bruit,
            // donc on peut élargir légèrement le trait utile sans ajouter de points parasites.
            min: 1.30,
            max: 2.35
        }),

        [TypeContour.COULEUR]: Object.freeze({
            // Le contour couleur utilise deux positions du slider.
            // L'épaisseur réelle est pilotée dans parametresContourCouleur.js.
            min: 1,
            max: 2
        })
    }),


    chaineNormales: Object.freeze({
        // Avec le vrai Canny, cette valeur ne représente plus une grande
        // longueur arbitraire : elle pilote surtout la portée de l’hystérésis.
        // Des valeurs trop hautes reconnectent trop de bruit sur les scans 3D.
        min: 3,
        max: 8,
        defaut: 5,
        step: 1
    }),

    /**
     * Réglages du vrai Canny appliqué au contour Relief.
     *
     * Pipeline scène principale :
     * 1. gradient des normales ;
     * 2. suppression des non-maxima ;
     * 3. double seuil ;
     * 4. hystérésis itérative ;
     * 5. composition + épaisseur.
     *
     * La loupe n’utilise pas encore ce pipeline.
     */
    reliefCanny: Object.freeze({
        actif: true,

        // Seuils assouplis : le préfiltrage + la validation de longueur
        // nettoient le bruit, donc on peut récupérer davantage de reliefs internes.
        seuilFaible: 0.35,
        seuilFort: 0.58,

        prefiltrageNormales: Object.freeze({
            actif: true,

            // Croix 5 échantillons : centre + gauche/droite/haut/bas.
            // Rayon 1 = léger et peu coûteux.
            rayon: 1.0,

            // Le centre reste dominant pour ne pas gommer les vraies cassures.
            poidsCentre: 2.0,

            // Plus haut = on protège davantage les arêtes franches.
            // Plus bas = on lisse plus fort les normales bruitées.
            seuilConservationAretes: 0.72
        }),

        gradientMultiEchelle: Object.freeze({
            actif: true,

            // Deuxième lecture plus large : aide à retrouver les bosses/creux
            // qui ne sont pas assez forts à l'échelle 1 pixel.
            rayonMoyen: 2.0,

            // La moyenne échelle renforce le relief, sans remplacer totalement
            // le gradient local. Monter vers 1.0 récupère plus de reliefs.
            poidsMoyen: 0.65
        }),

        iterationsHysteresis: 4,
        toleranceNonMaximum: 0.88,
        voisinsDiagonaux: false,

        fermeture: Object.freeze({
            actif: true,
            rayon: 1,
            diagonales: false,
            exigerDeuxVoisinsOpposes: true
        }),

        nettoyageLongueur: Object.freeze({
            actif: true,
            // Un peu moins strict pour éviter que les reliefs internes soient
            // supprimés comme des fragments alors qu'ils aident à lire le volume.
            longueurMin: 5,
            rayonMax: 8,
            trousMax: 2,
            exigerDeuxCotes: false,
            testerDiagonales: true,
            seuilMasque: 0.5
        }),

        nettoyageVoisinage: Object.freeze({
            actif: true,
            voisinsMin: 2,
            diagonales: true
        })
    }),
    // Tous les réglages du contour couleur sont regroupés dans :
    // Configuration/parametresContourCouleur.js
    contourCouleurPerceptuel: parametresContourCouleur,

    seuils: Object.freeze({
        [TypeContour.SILHOUETTE]: 0.00009,
        // Le relief basé sur les normales est volontairement filtré plus fort :
        // on évite les points isolés qui bruitent l'information.
        [TypeContour.RELIEF]: 0.35,
        // Compatibilité avec les anciens appels ; le nouveau shader utilise
        // contourCouleurPerceptuel.seuils.faible et .fort.
        [TypeContour.COULEUR]: 0.045
    }),


    /**
     * Test de mise en lumière locale des gradients.
     *
     * Mise en lumière locale utilisée par les presets Contours.
     * L'ancienne interface Highlight avec sliders n'est plus affichée :
     * ces valeurs restent uniquement des paramètres internes de preset.
     */
    miseLumiereGradients: Object.freeze({
        normales: Object.freeze({
            // Seuil abaissé : le masque normal détecte davantage de reliefs,
            // ce qui rend le Highlight visible sur plus de modèles.
            seuilGradient: 0.4,
            intensite: 0.9,
            // Filtrage anti-sparkles : le highlight doit suivre les reliefs
            // continus, pas les points isolés.
            voisinsMin: 2,

            // Rendu natif pour éviter un masque trop mou quand la largeur augmente.
            ratioRendu: 1.0
        }),

        couleurs: Object.freeze({
            // Les seuils et le chaînage sont lus dans contourCouleurPerceptuel.
            intensite: 0.9
        }),

        animation: Object.freeze({
            intervalleSecondes: Object.freeze({
                min: 1,
                max: 4,
                // Le slider Fréquence représente directement la durée du clignotement en secondes.
                // Le preset doit donc donner 3 secondes, et non une fréquence convertie en 2 secondes.
                defaut: 3,
                step: 1
            }),

            frequence: Object.freeze({
                // Valeur affichée par le slider : plus elle augmente, plus le clignotement est rapide.
                min: 1,
                max: 4,
                defaut: 3,
                step: 1
            }),

            /**
             * Le slider reste simple côté interface : 0 à 100.
             * Il est ensuite converti en légère variation HSL autour d'une valeur de base.
             * Cela évite les effets extrêmes noir/blanc.
             */
            luminancePourcentage: Object.freeze({
                // Paramètre interne de preset : le slider manuel n'est plus affiché.
                min: 1,

                max: 8,
                defaut: 1,
                step: 0.001,

                // Plage progressive pour éviter un changement trop brutal.
                // deltaMin = effet léger au minimum.
                // deltaMax = effet fort mais pas brûlé au maximum.
                deltaMin: 0.02,
                deltaMax: 0.20,
                deltaDefaut: 0.06
            }),

            /**
             * La largeur n'est pas un tracé de contour.
             * Elle élargit seulement le masque de pixels affectés autour des gradients.
             */
            largeur: Object.freeze({
                min: 1,
                // Paramètre interne de preset : le slider manuel n'est plus affiché.
                // La valeur par défaut/preset reste positionnée comme sur
                // la dernière version fonctionnelle validée.
                max: 10,
                defaut: 6,
                step: 1
            }),

            /**
             * Sens de la variation de luminance utilisée par le highlight.
             *  1 = éclaircir localement les crêtes/ruptures de relief.
             * -1 = assombrir localement les crêtes/ruptures de relief.
             *
             * Ce sens est surtout utilisé par les presets clair/sombre.
             */
            sensLuminance: Object.freeze({
                eclaircir: 1,
                assombrir: -1,
                defaut: 1
            }),

            clignotement: Object.freeze({
                // 0 = le highlight peut vraiment disparaître pendant le clignotement,
                // ce qui rend l'effet plus marqué sans augmenter le coût du shader.
                facteurMinimal: 0.0
            }),

            securiteLuminosite: Object.freeze({
                minLightness: 0.08,
                maxLightness: 0.995
            })
        })
    }),

    /**
     * Presets Contours intégrant le highlight.
     * L'interface manuelle du highlight a été retirée ; ces presets restent
     * le point d'entrée principal pour appliquer la mise en lumière.
     */
    presetsContours: Object.freeze({
        sombre: Object.freeze({
            nom: "sombre",
            contourReliefActif: false,
            highlightNormalesActif: true,
            frequence: 3,
            largeur: 6,
            luminance: "max",
            sensLuminance: 1,
            fondScene: 100,
            luminositeScene: -0.10
        }),

        clair: Object.freeze({
            nom: "clair",
            contourReliefActif: false,
            highlightNormalesActif: true,
            frequence: 3,
            largeur: 6,
            luminance: "max",
            sensLuminance: -1,
            fondScene: 0,
            luminositeScene: 0.10
        })
    }),

    /**
     * Réglages du bouton de test "couleur optimale" pour la silhouette.
     *
     * La couleur n'est plus choisie dans une palette fixe : le service génère
     * des candidats RGB et les compare uniquement aux pixels proches de la
     * silhouette, côté objet et côté fond.
     */
    couleurOptimaleSilhouette: Object.freeze({
        debugConsole: true,

        analyseLocale: Object.freeze({
            // Rayon de voisinage pour détecter si un pixel objet touche le fond.
            rayonVoisinageSilhouette: 1,

            // Rayon de la bande analysée autour de la silhouette.
            rayonBandeContour: 2,

            // Échantillonnage pour limiter le coût du calcul. 1 = tous les pixels.
            pasEchantillonnageContour: 2,

            // Seuil utilisé si la profondeur est disponible.
            seuilDifferenceProfondeurFond: 0.0005,

            // Seuil de secours si la profondeur n'est pas lisible.
            seuilDifferenceCouleurFondRgb: 24,

            // Nombre maximal de pixels conservés dans chaque bande locale.
            maxPixelsAnalyse: 6000,

            // Regroupement des couleurs locales proches.
            tailleQuantification: 16,
            nombreCouleursLocales: 18
        }),

        generationCouleurs: Object.freeze({
            // 32 donne environ 729 candidats RGB + quelques couleurs extrêmes.
            pasRgb: 32
        }),

        seuilsSelection: Object.freeze({
            contrasteLocalMinimal: 3,
            distanceOklabMinimale: 0.10
        }),

        poids: Object.freeze({
            pireContrasteLocal: 14,
            contrasteObjetMoyen: 3,
            contrasteFondMoyen: 5,
            pireDistanceLocale: 18,
            distanceObjetMoyenne: 4,
            distanceFondMoyenne: 6,
            facteurDistanceOklab: 10
        })
    })
});
