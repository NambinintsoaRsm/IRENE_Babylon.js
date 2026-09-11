# Maintenance de la V1 et évolution vers une V2

## 1. Règle principale

Une modification de V1 ne doit pas dégrader une fonctionnalité validée pour simplifier une expérimentation future.

Avant toute évolution :
1. conserver une archive de la base stable ;
2. modifier un périmètre restreint ;
3. tester ;
4. seulement ensuite continuer.

## 2. Zones stables à préserver

### Chargement interactif

`ControleurModele3D` cède la main au navigateur. Ne pas réintroduire un traitement CPU long synchrone dans la chaîne de chargement.

### Modèle visible

Ne pas remettre un `layerMask` temporaire qui peut laisser le modèle invisible si l'utilisateur interagit pendant l'analyse.

### Vue de saillance

La vue calculée est mémorisée par modèle pendant la session.

### Silhouette V1

`PostTraitSilhouette` ne doit dépendre que du depth buffer.

### Sauvegarde

Manuelle et automatique partagent la même source de vérité.

### Accessibilité

Les réglages temporaires ne doivent pas écraser les réglages normaux.

## 3. Réintégration future des contours V2

Fonctions archivées :
- Relief/normales ;
- contour issu de variations de couleur ;
- surbrillance.

Architecture recommandée :

```text
ControleurContours
├── PostTraitSilhouette       [V1 stable]
├── PostTraitRelief           [V2]
├── PostTraitContoursCouleur  [V2]
└── PostTraitSurbrillance     [V2 éventuelle]
```

À éviter :

```text
un unique shader/post-process géant
silhouette + relief + couleur + surbrillance
```

La séparation limite les régressions.

## 4. Points de dette technique à surveiller

### Gros fichiers

Les fichiers suivants concentrent beaucoup de responsabilités :
- `main.js` ;
- `ServiceLoupe3D.js` ;
- `ServiceSaillanceVueBabylon.js` ;
- `ServiceAnimationGUI.js`.

Ils peuvent être découpés plus tard, mais ce chantier doit être séparé d'un changement fonctionnel.

### Tests automatisés

La base repose encore surtout sur des tests manuels. Une prochaine étape utile serait :
- tests unitaires des objets Domain ;
- tests des formules de score ;
- tests des sérialisations profil ;
- tests du parsing/détection de modèles ;
- tests de non-régression sur shaders lorsque possible.

### Paramètres empiriques

Plusieurs seuils sont documentés comme empiriques. Ils doivent être modifiés sur la base de campagnes de tests, pas d'un seul modèle.

## 5. Quand créer un ADR

Créer un ADR quand une décision :
- change l'architecture ;
- ajoute une dépendance importante ;
- remplace un algorithme ;
- change le format de sauvegarde ;
- modifie le principe de déploiement ;
- change la séparation V1/V2.

## 6. Matrice minimale de non-régression

### Démarrage
- GUI visible ;
- modèle initial visible ;
- profil restauré.

### Modèles
- liste ;
- changement ;
- interaction pendant chargement ;
- saillance ;
- re-clic = retour vue mémorisée.

### Interface
- thèmes ;
- polices ;
- OpenDys ;
- taille ;
- gras ;
- gauche/droite ;
- flèches.

### Réglages
- netteté ;
- contraste ;
- luminosité ;
- saturation ;
- réinitialisation.

### Contours
- silhouette ;
- 3 épaisseurs ;
- couleur manuelle ;
- automatique.

### Texture
- originale ;
- damiers ;
- rayures ;
- taille.

### Lumière
- principale ;
- haute ;
- basse ;
- tournante ;
- Espace ;
- température ;
- intensité.

### Loupe
- activation ;
- mouvement ;
- effets locaux ;
- silhouette.

### Profil
- sauvegarde auto ;
- sauvegarde manuelle ;
- confirmation ;
- restauration.

### Accessibilité
- activation ;
- désactivation ;
- restauration exacte.

### Questionnaire
- affichage ;
- validation ;
- POST ;
- CSV.
