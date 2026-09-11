# Flux d'exécution (Runtime View)

## 1. Démarrage

```mermaid
sequenceDiagram
    participant Page
    participant Main as main.js
    participant Babylon
    participant GUI
    participant Profil
    participant Modeles

    Page->>Main: charge module
    Main->>Babylon: crée moteur + scène + caméra
    Main->>GUI: charge guiTexture.json
    Main->>Main: instancie services / UC / contrôleurs
    Main->>Profil: chargerProfilAuDemarrage()
    Profil-->>Main: profil ou null
    Main->>GUI: applique thème / texte / état
    Main->>Modeles: détecte et charge modèle initial
    Modeles->>Babylon: orientation + normalisation + cadrage
    Modeles->>Babylon: saillance hors écran
    Main->>Babylon: boucle de rendu
```

## 2. Changement de modèle

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant C as ControleurModele3D
    participant L as ChargeurModeleBabylon
    participant O as Orientation
    participant N as Normalisation
    participant S as Saillance
    participant UI as Navigateur/GUI

    U->>C: clic modèle
    C->>C: incrémente jeton
    C->>UI: affiche "Chargement"
    C->>UI: yield
    C->>L: ImportMeshAsync
    L-->>C: meshes
    C->>UI: yield
    C->>O: corrigerOrientation(meshes)
    C->>N: normaliser(meshes)
    C->>C: cadrage + texture
    C->>UI: attend plusieurs frames
    C->>S: recherche meilleure vue
    loop calcul lourd
        S->>UI: yield périodique
    end
    S-->>C: alpha/beta/score
    C->>C: mémorise vue
    C->>UI: masque label
```

### Pourquoi le jeton est nécessaire

Si l'utilisateur choisit B avant la fin du chargement de A :
- A devient obsolète ;
- ses meshes sont détruits ;
- A ne peut plus modifier caméra ou état ;
- seul B finalise le pipeline.

## 3. Recliquer sur le même modèle

Si une vue de saillance a déjà été calculée pendant la session, un nouveau clic sur le même modèle restaure cette vue au lieu de relancer toute l'analyse.

## 4. Modification d'un réglage visuel

Exemple contraste :

```text
Slider GUI
 -> ControleurApparence
 -> ChangerContrasteUC
 -> ParametresApparence
 -> PostTraitApparence
 -> shader Babylon
```

## 5. Activation de la silhouette

```text
Bouton Silhouette
 -> ControleurContours
 -> ActiverSilhouetteUC
 -> ParametresContours
 -> PostTraitSilhouette
 -> ShaderSilhouette
 -> depth buffer
```

## 6. Couleur automatique

```text
Bouton Choix automatique
 -> ControleurContours
 -> ChoisirCouleurContourAdaptativeUC
 -> capture sans contour
 -> analyse objet/fond
 -> génération candidats
 -> score contraste + OKLab
 -> couleur choisie
 -> ParametresContours
 -> silhouette mise à jour
```

## 7. Sauvegarde manuelle

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant P as ControleurProfil
    participant UC as SauvegarderProfilLocalUC
    participant S as StockageProfilLocal
    participant LS as localStorage
    participant GUI

    U->>P: clic Enregistrer
    P->>UC: executer()
    UC->>S: sauvegarderDepuisEtat()
    S->>LS: setItem()
    P->>GUI: affiche SauveRect
    P->>GUI: masque après délai configuré
```

## 8. Sauvegarde automatique

Elle écrit le **même profil** que la sauvegarde manuelle, mais sans message. Les déclencheurs incluent notamment les événements de sortie/visibilité branchés dans `ControleurProfil`.

## 9. Accessibilité

```mermaid
sequenceDiagram
    participant U
    participant C as ControleurAccess
    participant T as ToggleAccessUC
    participant N as AccessNav
    participant E as etatApplication
    participant GUI

    U->>C: active Accessibilité
    C->>T: executer()
    T->>N: lire préférences navigateur
    T->>E: sauvegarde réglages avant activation
    T->>E: applique profil temporaire
    T->>GUI: thème / texte / bordures / mouvements
    U->>C: désactive
    C->>T: executer()
    T->>E: restaure sauvegarde précédente
    T->>GUI: re-synchronise interface
```

## 10. Lumière tournante

La touche Espace ne prend le contrôle que si :
- la lumière tournante est active ;
- le focus n'est pas dans une saisie texte.

Sinon, le comportement clavier normal est préservé.
