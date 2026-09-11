# Responsabilités des modules - qui fait quoi ?

## Vue rapide

| Élément | Responsabilité |
|---|---|
| `main.js` | Composition et initialisation |
| `Etat/etatApplication.js` | État courant partagé |
| `Domain/*` | Modèles métier et validation |
| `UseCases/*` | Actions métier ciblées |
| `Presentation/controleurs/*` | Branchement GUI et orchestration |
| `Infrastructure/babylon/*` | Scène, caméra, modèles et algorithmes 3D |
| `Infrastructure/gui/*` | Layout, texte, styles et contrôles Babylon GUI |
| `Infrastructure/postTraitements/*` | Post-process visuels |
| `Infrastructure/shaders/*` | GLSL |
| `Infrastructure/stockage/*` | Profil local |
| `Infrastructure/web/*` | Questionnaire côté navigateur |
| `api/*` | Endpoints PHP |

## Contrôleurs principaux

### `ControleurModele3D`

Orchestre :
1. sélection ;
2. suppression de l'ancien modèle ;
3. import ;
4. correction matériaux ;
5. orientation ;
6. normalisation ;
7. cadrage ;
8. texture sauvegardée ;
9. attente de stabilité ;
10. saillance ;
11. mémorisation de la vue.

Il utilise un **jeton de chargement** : un ancien chargement ne peut pas écraser le résultat d'une sélection plus récente.

### `ControleurInterface`

Gère :
- polices ;
- taille et gras ;
- thème ;
- position du menu ;
- bordures ;
- scène ;
- textures et sous-panneaux liés à l'interface.

### `ControleurApparence`

Gère :
- netteté ;
- contraste ;
- luminosité ;
- saturation ;
- synchronisation des valeurs avec les post-traitements.

### `ControleurContours`

Gère la V1 des contours :
- silhouette ON/OFF ;
- épaisseur ;
- couleur manuelle ;
- couleur automatique ;
- réinitialisation.

### `ControleurCamera`

Gère les actions caméra exposées par la GUI :
- retour/cadrage ;
- navigation ;
- paramètres de vitesse lorsque branchés.

### `ControleurLumiere`

Gère :
- type de lumière ;
- température ;
- intensité ;
- rotation ;
- pause/reprise par espace ;
- restauration depuis sauvegarde.

### `ControleurProfil`

Gère :
- chargement du profil au démarrage ;
- sauvegarde immédiate ;
- sauvegarde automatique ;
- confirmation visuelle de sauvegarde manuelle ;
- réapplication des effets après restauration.

### `ControleurAccess`

Gère le panneau Accessibilité et délègue le changement de mode à `ToggleAccessUC`.

### `ControleurAvis`

Ouvre et pilote le questionnaire de satisfaction.

### `ControleurAnimationInterface`

Gère les transitions du menu :
- menu latéral ;
- accordéons principaux ;
- accordéon Réglages ;
- panneaux secondaires ;
- flèches.

## Services Babylon importants

| Service | Rôle |
|---|---|
| `ChargeurModeleBabylon` | Import Babylon d'un OBJ |
| `ServiceSceneBabylon` | Fond de scène et nettoyage |
| `ServiceCameraBabylon` | ArcRotateCamera et limites |
| `ServiceCadrageCameraBabylon` | Cadrage à partir des bornes |
| `ServiceOrientationModeleBabylon` | Orientation prudente |
| `ServiceNormalisationModeleBabylon` | Échelle homogène |
| `ServiceSaillanceVueBabylon` | Vue initiale par saillance GMM |
| `ServiceEntropieVueBabylon` | Moteur générique de parcours de vues |
| `ServiceMateriauxBabylon` | Matériaux, damiers, rayures |
| `ServiceLumiereBabylon` | Lumières |
| `ServiceCouleurContourAdaptativeBabylon` | Couleur automatique de silhouette |

## Services GUI importants

| Service | Rôle |
|---|---|
| `ChargeurInterfaceGUI` | Charge `guiTexture.json` |
| `RechercheControleGUI` | Recherche les contrôles par nom |
| `ServiceAnimationGUI` | Layout et animations |
| `ServiceStyleInterfaceGUI` | Thèmes et bordures |
| `ServiceTexteGUI` | Police, taille, gras |
| `ServiceTexteResponsiveGUI` | Auto-fit ciblé |
| `ServiceListeModelesGUI` | Boutons dynamiques de modèles |
| `ServiceControlesSpeciauxGUI` | Contrôles nécessitant un traitement spécifique |
| `ServiceBlocagePointeurGUI` | Gestion du blocage pointeur |

## Règle de dépendance

Une fonctionnalité devrait suivre autant que possible :

```text
GUI
 -> Controleur
 -> Use Case
 -> Etat / Domain
 -> Service technique
```

Le contrôleur peut orchestrer plusieurs services lorsque la fonctionnalité est transversale, mais les règles algorithmiques restent dans les services spécialisés.
