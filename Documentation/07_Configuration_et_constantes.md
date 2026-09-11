# Configuration et constantes

## Principe

Les fichiers `Configuration/*.js` sont la première destination lorsqu'une valeur doit être réglée.

Ne pas dupliquer une constante dans :
- un contrôleur ;
- un Use Case ;
- un shader ;
- `main.js`.

## Cartographie

| Fichier | Contenu |
|---|---|
| `constantesAnimation.js` | Durées du menu et des accordéons |
| `constantesApparence.js` | Bornes apparence et motifs |
| `constantesCamera.js` | Caméra, cadrage et normalisation |
| `constantesContours.js` | Silhouette et couleur automatique |
| `constantesInterface.js` | Thèmes, flèches et styles dynamiques |
| `constantesSaillance.js` | Parcours, GMM et score |
| `constantesSauvegarde.js` | Clés et confirmation |
| `accessibilite.js` | Profils temporaires Accessibilité |
| `chemins.js` | Ressources dynamiques |
| `catalogueModeles3D.js` | Catalogue de secours |
| `formulaireAvis.js` | Configuration questionnaire |
| `questionnaireSatisfaction.js` | Contenu du questionnaire |
| `profilParDefaut.js` | Assemblage du profil initial |

## Caméra

Valeurs principales :

| Constante | Valeur | Effet |
|---|---:|---|
| `alphaInitial` | PI/2 | angle horizontal de secours |
| `betaInitial` | PI/2.5 | angle vertical de secours |
| `wheelPrecision` | 150 | plus haut = zoom molette plus lent |
| `sensibiliteRotation` | 3100 | plus haut = rotation plus lente |
| `facteurCadrage` | 3.0 | espace autour du modèle |
| `tailleModeleNormalise` | 2 | taille max après normalisation |
| `multiplicateurDistanceMin` | 1.47 | limite proche relative |
| `multiplicateurDistanceMax` | 5.2 | limite éloignée relative |

## Apparence

| Réglage | Min | Défaut | Max |
|---|---:|---:|---:|
| Netteté | 0 | 0 | 2 |
| Contraste | 0.5 | 1 | 2.5 |
| Luminosité | -0.4 | 0 | 0.4 |
| Saturation | 0 | 1 | 2 |

## Silhouette

| Paramètre | Valeur |
|---|---:|
| épaisseur slider min | 1 |
| épaisseur slider défaut | 2 |
| épaisseur slider max | 3 |
| seuil profondeur | 0.00009 |
| renfort niveau 1 | +0.35 |

## Saillance

### Parcours

```text
pas alpha = 30°
betas = 0,20,45,70,90,110,135,160,180
occupation image cible = 80 %
```

### Analyse

```text
rendu hors écran = 384
carte max = 96
gaussien = 3×3, sigma 3
seuil = moyenne + 1×écart type
pixels saillants max = 900
lambda GMM = W/2
```

### Sélection

```text
score = H × D
tolérance relative = 0.0075
```

## Sauvegarde

```text
cleProfil = anna_reglages_utilisateur
dureeAffichageConfirmation = 2500 ms
```

## Accessibilité

Le fichier `accessibilite.js` contient des profils empiriques.

Exemple "more" :
- contraste 1.25 ;
- netteté 1.2 ;
- saturation 1.1 ;
- bordure menu 4 ;
- bordure bouton 3 ;
- fond scène 80.

Ces profils ne sont pas présentés comme des normes médicales : ce sont des valeurs applicatives à tester avec les utilisateurs.

## Checklist avant modification d'une constante

1. rechercher tous ses usages ;
2. identifier son unité ;
3. comprendre si elle change CPU, GPU ou UX ;
4. tester au moins plusieurs modèles si elle touche caméra/saillance ;
5. mettre à jour le commentaire de la constante ;
6. mettre à jour ce document si la valeur est structurante.
