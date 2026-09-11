# Algorithmes 3D et aides visuelles

Ce document décrit les traitements réellement actifs dans ANNA V1.

---

## 1. Correction automatique de l'orientation

### Fichier

`Infrastructure/babylon/ServiceOrientationModeleBabylon.js`

### But

Éviter qu'un objet importé soit couché ou sur le mauvais axe vertical, tout en restant **prudent** : une décision ambiguë conserve l'orientation importée.

### Étapes

1. créer ou retrouver une racine commune au modèle ;
2. remettre cette racine à une transformation neutre ;
3. extraire un échantillon de points du modèle ;
4. tester virtuellement cinq orientations :
   - conserver ;
   - X -90° ;
   - X +90° ;
   - Z +90° ;
   - Z -90° ;
5. calculer pour chaque candidat :
   - solidité de la base ;
   - sections extrêmes ;
   - verticalité ;
   - position du centre ;
   - pénalité si le haut paraît plus solide que la base ;
6. comparer le meilleur candidat à l'orientation importée et au second candidat ;
7. appliquer la rotation uniquement si elle domine suffisamment.

### Score

Forme actuelle :

```text
score =
  2.1 × scoreBase
+ 1.2 × scoreSectionsExtremes
+ 0.55 × scoreVerticalite
+ 0.45 × scoreCentre
+ bonusConserver
- penaliteTopPlusSolide
```

`bonusConserver = 0.035`.

### Conditions de changement

Le meilleur candidat n'est appliqué que si :
- score >= `0.08` ;
- gain sur "conserver" >= `0.10` ;
- ratio meilleur/second >= `1.18`.

### Conséquence

L'algorithme préfère un faux négatif (ne pas redresser) à un faux positif (tourner un modèle déjà correct).

---

## 2. Normalisation d'échelle et centrage

### Fichier

`Infrastructure/babylon/ServiceNormalisationModeleBabylon.js`

### But

Réduire les écarts d'échelle entre des modèles issus de sources différentes.

### Calcul

On calcule la boîte englobante et :

```text
tailleMax = max(tailleX, tailleY, tailleZ)
facteur = tailleCible / tailleMax
```

avec `tailleCible = 2`.

La transformation est appliquée à une racine commune :

```text
scaling = (facteur, facteur, facteur)
position = -centre × facteur
```

Cela évite de déplacer séparément les morceaux d'un OBJ multi-mesh.

---

## 3. Recherche de la meilleure vue par saillance GMM

### Fichiers

- `ServiceSaillanceVueBabylon.js`
- `ServiceEntropieVueBabylon.js`
- `Configuration/constantesSaillance.js`

### Pourquoi `ServiceEntropieVueBabylon` existe encore

La fonction Entropie n'est pas exposée dans l'interface V1, mais ce service fournit le moteur générique :
- parcours sphérique ;
- caméra d'analyse ;
- rendu hors écran ;
- lecture des pixels ;
- comparaison des vues.

`ServiceSaillanceVueBabylon` en hérite.

### Parcours

- alpha : pas de 30° sur un tour complet = 12 positions ;
- beta : `[0, 20, 45, 70, 90, 110, 135, 160, 180]` = 9 positions.

Soit jusqu'à :

```text
12 × 9 = 108 vues
```

### Cadrage d'analyse

La caméra d'analyse cherche à faire occuper environ **80 %** de l'image par l'objet.

Le rendu d'analyse utilise une résolution fixe carrée de **384 × 384**, indépendante de la taille du canvas visible.

### Recadrage

Le rendu est recadré autour de l'objet pour éviter qu'une grande zone de fond domine le score.

La zone finale cherche également une occupation d'environ 80 %.

### Carte de saillance

1. redimensionnement de la zone utile à une carte max de **96 px** sur son grand côté ;
2. flou gaussien 3×3, sigma 3 ;
3. conversion RGB -> Lab ;
4. calcul de la moyenne Lab globale ;
5. pour chaque pixel :

```text
SM = (L - meanL)^2 + (a - meanA)^2 + (b - meanB)^2
```

6. normalisation de la carte entre 0 et 1.

### Sélection des pixels saillants

```text
T = moyenne(SM) + écartType(SM)
```

Un pixel est saillant si :

```text
SM > T
```

Le nombre est plafonné à **900** pixels; les plus saillants sont conservés.

### GMM

Chaque pixel saillant contribue par une gaussienne.

Paramètres actifs :

```text
lambda = largeurCarte / 2
sigma = max(lambda × poidsSaillance, 1)
rayonInfluence = 3 × sigma
```

Le calcul est découpé par lots et rend la main au navigateur tous les 32 pixels saillants pour préserver la réactivité de l'interface.

### Entropie du GMM

Après normalisation de la carte GMM en distribution :

```text
H = -Σ p_i log2(p_i)
```

### Dispersion spatiale

On calcule le barycentre pondéré des pixels saillants puis la dispersion quadratique autour de ce barycentre :

```text
D = sqrt( Σ poids_i × distance_i² / Σ poids_i )
```

### Score final

```text
Score = H × D
```

Le classement automatique utilise actuellement le **score brut**.

### Stabilité

Deux scores très proches sont considérés équivalents avec une tolérance relative de `0.0075`. Dans ce cas, l'ordre fixe du parcours évite un changement de vue dû à un faible bruit de rendu.

---

## 4. Silhouette par profondeur

### Fichiers

- `PostTraitSilhouette.js`
- `ShaderSilhouette.js`

### Entrée

Babylon `DepthRenderer` fournit une texture de profondeur.

### Détection

Le shader applique un Sobel 3×3 :

```text
G = sqrt(Gx² + Gy²)
```

La détection est calculée à trois rayons d'échantillonnage :
- 1 ;
- 2 ;
- 3 pixels relatifs.

Le seuil V1 est :

```text
depthThreshold = 0.00009
```

### Épaisseur

Trois niveaux GUI :
- 1 : fin, envoyé comme environ 1.35 ;
- 2 : moyen ;
- 3 : épais.

Le renfort du niveau 1 évite un trait trop faible sur certaines résolutions.

### Sortie

```text
couleurFinale = mix(couleurOriginale, couleurContour, masque)
```

La V1 ne calcule ici :
- ni normales ;
- ni gradients couleur ;
- ni surbrillance.

---

## 5. Choix automatique de la couleur de silhouette

### Fichier

`ServiceCouleurContourAdaptativeBabylon.js`

### But

Choisir une couleur qui reste perceptible à la fois contre :
- l'objet ;
- le fond.

### Pipeline

1. capturer le rendu **sans contour** ;
2. lire le depth buffer si disponible ;
3. identifier les pixels objet/fond ;
4. repérer une bande locale autour de la silhouette ;
5. regrouper les couleurs dominantes ;
6. générer des couleurs candidates ;
7. évaluer chaque candidat ;
8. appliquer le meilleur candidat respectant les seuils ;
9. fallback noir/blanc si nécessaire.

### Échantillonnage local

Valeurs principales :
- voisinage silhouette : 1 ;
- bande contour : 2 ;
- un pixel sur 2 ;
- maximum 6000 pixels ;
- quantification RGB : pas 16 ;
- 18 couleurs dominantes max par zone.

### Candidats

Grille RGB par pas de **32**, complétée par quelques couleurs saturées.

### Critères

Deux familles :
- **contraste de luminance** ;
- **distance perceptuelle OKLab**.

Seuils :
- contraste local minimal : `3` ;
- distance OKLab minimale : `0.10`.

Le score pondère fortement le **pire cas local**, afin d'éviter une couleur excellente sur une zone mais illisible sur une autre.

---

## 6. Apparence : contraste, luminosité, saturation, netteté

### Contraste / luminosité / saturation

`PostTraitApparence` utilise un shader personnalisé et met à jour trois uniforms.

Plages :
- contraste : 0.5 à 2.5 ;
- luminosité : -0.4 à +0.4 ;
- saturation : 0 à 2.

### Netteté

`PostTraitNettete` utilise le post-process Babylon dédié au renforcement d'arêtes.

Plage :
- 0 à 2.

---

## 7. Textures procédurales

### Fichier

`ServiceMateriauxBabylon.js`

Deux remplacements V1 :
- damiers ;
- rayures.

Les textures sont générées avec `BABYLON.DynamicTexture` en **512 × 512**.

Damiers :
- taille base 24 px ;
- variation 4 px par pas ;
- minimum 4 px.

Rayures :
- largeur base 12 px ;
- variation 2 px par pas ;
- minimum 2 px.

---

## 8. Lumières

### Fichier

`ServiceLumiereBabylon.js`

ANNA maintient :
- une lumière hémisphérique principale ;
- une lumière directionnelle pour haute/basse/tournante.

Modes :
- principale ;
- haute ;
- basse ;
- tournante.

Quand une lumière directionnelle est active, la principale reste à une intensité réduite (`35 %`) pour conserver un minimum de lisibilité.

La lumière tournante met à jour sa direction au cours du temps. La touche Espace permet de figer/reprendre cette rotation.

---

## 9. Loupe 3D

### Fichier

`ServiceLoupe3D.js`

La loupe n'agrandit pas une portion 2D du canvas.

Elle crée :
1. une caméra secondaire ;
2. une cible calculée sous le pointeur ;
3. un FOV réduit pour le zoom ;
4. une `RenderTargetTexture` ;
5. une composition circulaire dans la caméra principale.

Valeurs par défaut :
- diamètre : 450 ;
- zoom : 6 ;
- texture loupe : 512 ;
- lissage cible : 0.35.

La caméra secondaire reste à une position cohérente avec la caméra principale; le zoom vient principalement du FOV.

Les post-traitements V1 peuvent être dupliqués sur la caméra loupe :
- apparence ;
- netteté ;
- silhouette.

---

## 10. Principe général de performance

Les opérations GPU restent dans les post-process/shaders lorsque possible.

Les opérations CPU lourdes (GMM notamment) :
- réduisent la résolution analysée ;
- plafonnent le nombre d'échantillons ;
- cèdent périodiquement la main au navigateur.

Le but est de préserver le comportement validé : **l'interface reste utilisable pendant le chargement et la recherche de vue**.
