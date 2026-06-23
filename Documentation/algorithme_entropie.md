# Algorithme de vue optimale par entropie

## Principe général

On place virtuellement la caméra sur une sphère autour de l'objet. La caméra regarde toujours le centre de l'objet. On parcourt plusieurs angles horizontaux et verticaux. Pour chaque position, on rend l'image avec les paramètres courants, on lit les pixels et on calcule un score d'entropie à partir de la luminance des pixels.

## Distances utilisées

On calcule d'abord la boîte englobante de l'objet. Cela donne :

- le centre de l'objet ;
- ses dimensions ;
- un rayon approximatif de l'objet.

La distance caméra-centre correspond au rayon de la sphère d'observation :

```txt
rayonRecherche = max(rayonObjet × 3, 1,5)
```

Cette distance reste la même pour toutes les vues analysées afin que les scores soient comparables.

## Angles parcourus

Deux angles sont utilisés, comme pour une caméra orbitale Babylon.js :

- `alpha` : rotation horizontale autour de l'objet ;
- `beta` : angle vertical permettant de regarder l'objet de haut en bas.

Paramètres utilisés pour le test :

alpha : de 0° à 330° avec un pas de 30°
beta  : 20°, 45°, 70°, 90°, 110°, 135°, 160°


Cela donne :

12 angles alpha × 7 angles beta = 84 vues analysées

On évite les valeurs `0°` et `180°` pour `beta`, car elles placeraient la caméra exactement sur les pôles, ce qui peut créer des cas particuliers avec la caméra.

## Calcul de l'entropie

Pour chaque vue :

1. on rend la scène 3D ;
2. on lit les pixels du rendu ;
3. on transforme chaque pixel en niveau de gris avec la formule :

```txt
gris = 0,299 × R + 0,587 × G + 0,114 × B
```

4. on construit un histogramme des niveaux de gris, de 0 à 255 ;
5. on calcule l'entropie de Shannon :

```txt
H = - somme(p_i × log2(p_i))
```

avec `p_i` la proportion de pixels appartenant à la classe de gris `i`.

L'entropie brute est ensuite normalisée entre 0 et 1 :

```txt
score = H / log2(256)
```

## Pseudo-code

```txt
Début
    récupérer le ou les meshes qui composent l'objet
    calculer la boîte englobante de l'objet
    calculer le centre de l'objet
    calculer le rayon de l'objet
    fixer la distance caméra-centre = max(rayonObjet × 3, 1,5)

    conserver les post-traitements, textures et réglages actuellement actifs

    Pour chaque beta dans [20, 45, 70, 90, 110, 135, 160]
        Pour alpha allant de 0 à 330 par pas de 30
            placer la caméra à la position (alpha, beta, distance)
            orienter la caméra vers le centre de l'objet
            rendre la scène
            lire les pixels de l'image rendue
            convertir les pixels en niveaux de gris
            construire l'histogramme des niveaux de gris
            calculer l'entropie de Shannon
            normaliser l'entropie entre 0 et 1
            enregistrer alpha, beta, distance et score
        Fin Pour
    Fin Pour

    choisir la vue avec le score le plus élevé
    replacer la caméra sur cette vue
Fin
```

## Export CSV

Le fichier CSV contient une ligne par vue analysée. Les colonnes principales sont :

```txt
index
alpha_degres
beta_degres
distance_camera_centre
rayon_objet
score_entropie_normalise
entropie_brute_bits
contraste_normalise_diagnostic
pixels_analyses
```

## Notes : 
le fichier CSV utilise des points virgules comme séparateur. Si jamais le tableau que vous voyez ne s'affiche pas correctement, assurez vous d'utiliser les points virgules comme séparateur dans le fichier.
