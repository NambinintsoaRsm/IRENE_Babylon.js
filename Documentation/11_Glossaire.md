# Glossaire ANNA

| Terme | Définition dans le projet |
|---|---|
| ANNA | Application web de visualisation et d'aide à l'exploration de modèles 3D |
| ArcRotateCamera | Caméra orbitale Babylon.js utilisée pour la vue principale |
| Alpha | Angle horizontal de la caméra orbitale |
| Beta | Angle vertical de la caméra orbitale |
| Radius / rayon | Distance caméra-cible |
| Mesh | Maillage Babylon représentant tout ou partie d'un objet |
| Racine modèle | TransformNode commun utilisé pour orientation/normalisation |
| Bounding box | Boîte englobante du modèle |
| Depth buffer | Texture contenant la profondeur des fragments |
| Sobel | Opérateur de gradient utilisé pour détecter la silhouette |
| Silhouette | Contour V1 issu des ruptures de profondeur |
| Contour couleur | Ancien traitement V2 potentiel : détection d'arêtes depuis les couleurs du modèle ; à ne pas confondre avec la couleur du tracé |
| Couleur automatique | Choix V1 de la couleur d'affichage de la silhouette |
| OKLab | Espace perceptuel utilisé pour comparer les couleurs candidates |
| Saillance | Mesure visant à sélectionner une vue visuellement informative |
| Achanta | Méthode utilisée pour produire la carte de saillance en Lab |
| GMM | Ici : carte issue du mélange des gaussiennes centrées sur les pixels saillants |
| Entropie GMM | Entropie de la distribution générée par le GMM |
| Dispersion spatiale | Étalement des pixels saillants autour de leur barycentre |
| H × D | Score brut actuel de saillance |
| PostProcess | Traitement appliqué après rendu de la caméra Babylon |
| Shader | Programme GLSL exécuté sur GPU |
| RenderTargetTexture | Texture dans laquelle Babylon rend une caméra/scène hors écran |
| Loupe 3D | Caméra secondaire + RenderTargetTexture, et non crop 2D |
| GUI | Interface Babylon GUI chargée depuis JSON |
| Auto-fit | Ajustement automatique d'une taille de texte pour tenir dans son conteneur |
| Use Case | Action métier ciblée modifiant l'état |
| Contrôleur | Relie GUI, Use Cases et services techniques |
| Profil | Ensemble persistant des préférences |
| localStorage | Stockage navigateur du profil |
| Jeton de chargement | Numéro permettant d'invalider un ancien chargement asynchrone |
| V1 | Base épurée active |
| V2 | Future version pouvant réintégrer Relief/Contour couleur/Surbrillance |
