# Checklist pour reprendre le projet ANNA

## Parcours de lecture conseillé

### 1. Comprendre l'objectif

Lire :
- `README.md`
- `02_Architecture_et_contexte.md`

### 2. Comprendre le code

Lire :
- `03_Responsabilites_modules.md`
- `main.js`
- `Etat/etatApplication.js`

### 3. Comprendre le chargement 3D

Lire dans cet ordre :
1. `ControleurModele3D.js`
2. `ChargeurModeleBabylon.js`
3. `ServiceOrientationModeleBabylon.js`
4. `ServiceNormalisationModeleBabylon.js`
5. `ServiceCameraBabylon.js`
6. `ServiceSaillanceVueBabylon.js`
7. `ServiceEntropieVueBabylon.js`

### 4. Comprendre les aides visuelles

- `ControleurApparence.js`
- `PostTraitApparence.js`
- `PostTraitNettete.js`
- `ControleurContours.js`
- `PostTraitSilhouette.js`
- `ShaderSilhouette.js`
- `ServiceCouleurContourAdaptativeBabylon.js`
- `ServiceMateriauxBabylon.js`
- `ServiceLumiereBabylon.js`
- `ServiceLoupe3D.js`

### 5. Comprendre l'interface

- `ServiceAnimationGUI.js`
- `ServiceStyleInterfaceGUI.js`
- `ServiceTexteGUI.js`
- `ServiceTexteResponsiveGUI.js`
- `ControleurInterface.js`
- `ControleurAccess.js`

### 6. Comprendre la persistance

- `ProfilUtilisateur.js`
- `StockageProfilLocal.js`
- `ControleurProfil.js`
- `ToggleAccessUC.js`

## Avant de modifier une fonctionnalité

- identifier son contrôleur ;
- identifier son Use Case ;
- identifier son état métier ;
- identifier son service technique ;
- identifier ses constantes ;
- rechercher si la loupe duplique le même traitement ;
- rechercher si la sauvegarde persiste le paramètre.

## Avant un commit important

```text
[ ] JavaScript syntaxiquement valide
[ ] PHP syntaxiquement valide
[ ] aucun import cassé
[ ] application démarre
[ ] modèle visible
[ ] chargement interactif
[ ] profil sauvegardé/restauré
[ ] GUI gauche/droite
[ ] OpenDys testé
[ ] silhouette + 3 épaisseurs
[ ] loupe
[ ] accessibilité
```

## Quand on ne comprend pas une constante

Ne pas la supprimer ou la modifier immédiatement.

Procédure :
1. rechercher ses usages ;
2. vérifier si elle est exposée dans la GUI ;
3. vérifier si elle affecte une formule ;
4. comparer plusieurs modèles ;
5. documenter le résultat.

## Pour une future V2

Commencer par `09_Maintenance_evolution_V2.md` et les ADR.
