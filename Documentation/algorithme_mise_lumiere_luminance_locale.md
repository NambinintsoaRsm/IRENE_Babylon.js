# Algorithme de test — mise en lumière locale des zones de fort gradient

## Objectif

L'objectif est de tester une amélioration des contours basés sur les **normales** et sur les **couleurs** sans remplacer le fonctionnement déjà existant des contours. L'idée n'est pas de tracer une nouvelle ligne colorée, mais de renforcer légèrement la luminance locale sur les zones où le modèle présente une rupture visuelle importante.

Cette fonctionnalité est activée avec deux boutons de test :

```txt
ContLumNormBtn  → mise en lumière des forts gradients de normales
ContLumCoulBtn  → mise en lumière des forts gradients de couleurs
```

Les boutons fonctionnent en activation/désactivation et permettent de tester cette approche sans modifier définitivement les autres traitements.

## Rappel de la préconisation

La remarque principale était que les contours issus des gradients de normales ou de couleurs ne doivent pas produire uniquement des points isolés. Même si un pixel possède un gradient fort, il n'est pas forcément utile visuellement s'il est seul. Pour une personne malvoyante, des points dispersés peuvent être difficiles à interpréter et peuvent même gêner la compréhension de la forme.

L'idée à retenir est donc la suivante :

```txt
pixel isolé de fort gradient → on l'ignore ou on le réduit
zone continue de fort gradient → on la conserve et on la met en valeur
```

La mise en valeur doit rester légère et ne pas changer la couleur globale de l'objet. Le principe conseillé est donc d'augmenter localement la luminance des zones retenues, plutôt que de dessiner un trait coloré par-dessus le rendu.

## Principe général

Le traitement se fait en post-traitement, après le rendu de la scène 3D. Pour chaque pixel affiché, on regarde s'il appartient à une zone de fort gradient.

Deux cas sont testés :

- **gradient de normales** : permet de repérer les ruptures d'orientation de surface, donc des zones liées au relief ;
- **gradient de couleurs** : permet de repérer les ruptures de couleur ou de texture visibles dans le rendu.

Ensuite, le programme vérifie si le pixel détecté a une continuité locale avec ses voisins. Si le pixel semble isolé, il n'est pas fortement renforcé. Si le pixel appartient à une petite ligne ou à une zone cohérente, sa luminance est augmentée.

## Calcul du gradient pour les normales

Pour les normales, on utilise la texture de normales produite par Babylon.js. Chaque normale est d'abord ramenée dans l'intervalle habituel des vecteurs 3D :

```txt
normale = normaleRGB × 2 - 1
```

Ensuite, pour chaque pixel, on compare la normale centrale avec les normales voisines :

```txt
droite, gauche, haut, bas
```

Le gradient local correspond à la plus grande différence observée :

```txt
gradientNormale = max(
    distance(normaleCentre, normaleDroite),
    distance(normaleCentre, normaleGauche),
    distance(normaleCentre, normaleHaut),
    distance(normaleCentre, normaleBas)
)
```

Si cette valeur dépasse un seuil, le pixel est considéré comme un candidat potentiel pour la mise en lumière.

## Calcul du gradient pour les couleurs

Pour les couleurs, on utilise l'image rendue. On compare les pixels voisins horizontalement et verticalement :

```txt
gradientX = couleurDroite - couleurGauche
gradientY = couleurHaut - couleurBas
```

Puis on calcule une magnitude globale :

```txt
gradientCouleur = √(gradientX² + gradientY²)
```

Dans le code, comme les couleurs sont composées de trois canaux RGB, cette magnitude est calculée sur les composantes rouge, verte et bleue.

## Seuillage

Chaque gradient est comparé à un seuil :

```txt
si gradient < seuil → pixel non retenu
si gradient ≥ seuil → pixel candidat
```

Pour éviter une coupure trop brutale, le shader utilise une transition progressive autour du seuil avec `smoothstep`. Cela permet d'obtenir un masque plus doux, entre 0 et 1, au lieu d'avoir uniquement un résultat binaire.

## Filtrage des pixels isolés

Après le seuillage, le programme regarde les 8 voisins autour du pixel :

```txt
haut, bas, gauche, droite,
haut-gauche, haut-droite,
bas-gauche, bas-droite
```

On calcule un support local :

```txt
support = nombre ou intensité des voisins également détectés
```

Si le support est trop faible, le pixel est considéré comme isolé et il est fortement réduit. Le traitement cherche aussi une continuité par paires opposées :

```txt
gauche + droite
haut + bas
haut-gauche + bas-droite
haut-droite + bas-gauche
```

Cette vérification permet de conserver un pixel situé entre deux voisins forts, afin de combler de petites coupures dans une ligne de gradient.

## Masque de mise en lumière

Le résultat du filtrage donne un masque local :

```txt
masque = 0 → aucune mise en lumière
masque proche de 1 → mise en lumière forte
```

Le masque est aussi légèrement élargi aux voisins proches afin d'obtenir une continuité visuelle plus douce. Cela correspond au réglage d'épaisseur : plus l'épaisseur est grande, plus la zone autour de la crête est légèrement éclaircie.

## Augmentation locale de la luminance

La couleur d'origine du pixel est conservée. On ne remplace pas la couleur par une couleur de contour. On augmente seulement sa clarté locale avec un facteur multiplicatif :

```txt
facteur = 1 + intensite × masque
couleurFinale = couleurOriginale × facteur
```

La valeur est ensuite bornée pour rester dans l'intervalle affichable :

```txt
couleurFinale = clamp(couleurFinale, 0, 1)
```

Ainsi, la teinte globale de l'objet est conservée, mais les zones de rupture deviennent légèrement plus visibles.

## Paramètres utilisés

Les paramètres sont configurés dans `Configuration/constantesContours.js`.

### Normales

```js
normales: {
    seuilGradient: 0.12,
    intensite: 0.28,
    voisinsMin: 2
}
```

- `seuilGradient` : niveau minimal de rupture de normale pour détecter une zone.
- `intensite` : force de l'éclaircissement local.
- `voisinsMin` : support minimal attendu autour du pixel pour éviter les points isolés.

### Couleurs

```js
couleurs: {
    seuilGradient: 0.05,
    intensite: 1.0,
    voisinsMin: 0
}
```

- `seuilGradient` : niveau minimal de rupture de couleur.
- `intensite` : force de l'éclaircissement local.
- `voisinsMin` : nombre minimal de voisins détectés. Pour les couleurs, le test est moins strict car le gradient couleur est parfois plus difficile à rendre visible.

## Pseudo-code

```txt
Début
    Si le bouton de test normales est activé
        utiliser le rendu de la scène et la texture de normales
    Fin Si

    Si le bouton de test couleurs est activé
        utiliser le rendu de la scène
    Fin Si

    Pour chaque pixel de l'image
        lire la couleur originale du pixel

        Si test normales
            lire la normale du pixel central
            lire les normales gauche, droite, haut, bas
            calculer le gradient de normales
            comparer le gradient au seuil des normales
        Fin Si

        Si test couleurs
            lire les couleurs gauche, droite, haut, bas
            calculer le gradient de couleurs
            comparer le gradient au seuil des couleurs
        Fin Si

        vérifier les 8 voisins autour du pixel
        calculer le support local
        vérifier s'il existe une continuité par paires opposées

        Si le pixel est isolé
            réduire ou annuler le masque de mise en lumière
        Sinon
            conserver le pixel comme zone de gradient utile
        Fin Si

        élargir légèrement le masque aux pixels voisins selon l'épaisseur
        calculer le facteur de luminance : 1 + intensite × masque
        appliquer ce facteur à la couleur originale
        borner la couleur finale entre 0 et 1
    Fin Pour
Fin
```

## Différence avec un vrai Canny

Une version plus avancée pourrait être inspirée de Canny : suppression des non-maxima, double seuil, chaînage des pixels faibles connectés à des pixels forts, puis conservation uniquement des lignes suffisamment longues.

Cette piste est intéressante, mais elle est plus coûteuse en temps réel dans le navigateur. Pour le moment, la version retenue est donc une version plus légère :

```txt
gradient + seuil + filtrage local + continuité locale + augmentation de luminance
```

Elle permet de tester l'idée principale sans alourdir trop fortement le rendu.

## Limites actuelles

Cette version ne réalise pas encore un vrai chaînage global des lignes de crête. Elle vérifie seulement une continuité locale autour de chaque pixel. Cela permet déjà de limiter les points isolés, mais ne garantit pas encore que toutes les zones retenues correspondent à de longues lignes continues.

Le bouton basé sur les normales donne actuellement un résultat plus visible que celui basé sur les couleurs. Cela peut s'expliquer par le fait que les ruptures de normales correspondent souvent à des changements de relief plus nets, tandis que les ruptures de couleur peuvent être plus dépendantes de la texture, de l'éclairage et de la luminance locale.

## Évolution possible

Les améliorations possibles sont :

1. ajouter un vrai chaînage des pixels connectés ;
2. supprimer les groupes trop petits ;
3. conserver uniquement les lignes ou zones suffisamment longues ;
4. tester une version inspirée de Canny, mais optimisée pour le temps réel ;
5. adapter séparément les paramètres selon le type d'objet, la texture et l'éclairage.

## Résumé

Le traitement de mise en lumière locale cherche à améliorer la lisibilité des contours relief et couleur sans ajouter de couleur artificielle. Il détecte les zones de fort gradient, évite autant que possible les points isolés, puis augmente légèrement la luminance locale des zones retenues. L'objectif est de faire ressortir les ruptures importantes de l'objet tout en conservant son rendu global.
