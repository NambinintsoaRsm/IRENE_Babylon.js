# GUI, accessibilité et sauvegarde

## 1. Structure du menu

Niveau principal :

```text
Fichier
Configurations
Outils
```

Sous-panneaux principaux :
- Fichier -> Ouvrir / Enregistrer ;
- Configurations -> Polices / Menus / Scène ;
- Outils -> Réglages / Contours / Textures / Lumières.

Les accordéons principaux sont exclusifs : ouvrir l'un ferme les autres.

## 2. Réglages

Réglages contient :
- Netteté ;
- Contraste ;
- Luminosité ;
- Saturation ;
- Réinitialiser.

Les boutons flottants du bas sont masqués dans les panneaux secondaires selon la logique de layout courante afin de préserver l'espace utile.

## 3. Texte

### `ServiceTexteGUI`

Applique :
- famille de police ;
- taille ;
- gras ;
- adaptations spécifiques nécessaires aux contrôles dynamiques.

### `ServiceTexteResponsiveGUI`

Ajuste la taille lorsqu'un label ne tient pas dans son conteneur.

Le service doit éviter les recalculs inutiles : les variations de police, surtout OpenDyslexic, modifient fortement les métriques de texte.

## 4. Mode Accessibilité

### Lecture navigateur

`AccessNav` lit notamment :
- préférence de contraste ;
- schéma clair/sombre ;
- réduction des mouvements ;
- couleurs forcées ;
- taille de `rem`.

### Activation

`ToggleAccessUC` :
1. sauvegarde l'état standard courant ;
2. lit les préférences navigateur ;
3. applique un profil temporaire ;
4. adapte mouvements, interface, apparence et fond ;
5. ajuste le texte ;
6. synchronise les contrôles.

### Désactivation

Le Use Case :
1. désactive d'abord le flag Accessibilité ;
2. nettoie les métadonnées texte temporaires ;
3. restaure la sauvegarde précédente ;
4. réapplique le style normal ;
5. relance l'auto-fit.

Cette séquence est importante : si l'état restait actif pendant la restauration, le moteur texte pourrait réappliquer immédiatement la taille accessibilité.

## 5. Sauvegarde du profil

### Source de vérité

Une seule clé principale :

```text
anna_reglages_utilisateur
```

Ancienne clé de migration :

```text
anna_profil_utilisateur
```

### Contenu

Le profil persiste :
- interface ;
- apparence ;
- contours ;
- caméra ;
- lumière ;
- fond ;
- état Accessibilité ;
- modèle 3D ;
- version et date.

### Sauvegarde manuelle et automatique

Les deux passent par la même infrastructure :

```text
SauvegarderProfilLocalUC
 -> StockageProfilLocal
 -> localStorage
```

Différence :
- automatique : silencieuse ;
- manuelle : affiche `SauveRect`.

### Confirmation

Configurée dans `Configuration/constantesSauvegarde.js` :

```text
durée = 2500 ms
texte = "Configurations sauvegardées"
```

Le rectangle suit la position du menu et ne doit pas capturer les clics.

## 6. Accessibilité active et sauvegarde

Lorsque l'accessibilité temporaire est active, le stockage ne doit pas écraser les préférences normales par les valeurs temporaires.

`StockageProfilLocal` utilise donc la sauvegarde "avant activation" pour les réglages normaux, tout en conservant le booléen indiquant que le mode Accessibilité était actif.

## 7. Format versionné

Le stockage est sérialisé en JSON avec une version. La lecture normalise notamment les anciens contours pour qu'un profil provenant d'une version avec Relief/Couleur ne casse pas la V1 silhouette-only.
