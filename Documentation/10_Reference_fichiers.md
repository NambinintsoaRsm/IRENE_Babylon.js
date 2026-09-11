# Référence des fichiers JavaScript
Cette référence est générée à partir de la base V1 analysée. La colonne « Importé par » indique les dépendances statiques ES modules ; les appels dynamiques peuvent ne pas apparaître.

## Configuration
| Fichier | Rôle | Export principal | Importé par |
|---|---|---|---|
| `Configuration/accessibilite.js` | Valeurs appliquées par le mode Accessibilité d'ANNA. | `access` | `UseCases/accessibiliteUseCases/ToggleAccessUC.js` |
| `Configuration/catalogueModeles3D.js` | Catalogue de secours des modèles 3D livrés avec ANNA. | `catalogueModeles3D` | `Etat/etatApplication.js` |
| `Configuration/chemins.js` | Chemins applicatifs réellement consommés par le JavaScript ANNA. | `chemins` | `main.js` |
| `Configuration/constantesAnimation.js` | Paramètres temporels des animations de l'interface ANNA. | `constantesAnimation` | `Configuration/accessibilite.js`<br>`Etat/etatApplication.js` |
| `Configuration/constantesApparence.js` | Valeurs de référence des réglages d'apparence et des textures ANNA. | `constantesApparence` | `Configuration/profilParDefaut.js`<br>`Infrastructure/babylon/ServiceMateriauxBabylon.js`<br>`Presentation/controleurs/ControleurApparence.js`<br>`UseCases/accessibiliteUseCases/ToggleAccessUC.js`<br>`UseCases/apparenceUseCases/ChangerTailleMotifTextureUC.js`<br>`main.js` |
| `Configuration/constantesCamera.js` | Paramètres de référence de la caméra 3D ANNA. | `constantesCamera` | `Configuration/accessibilite.js`<br>`Configuration/profilParDefaut.js`<br>`Infrastructure/babylon/ServiceCameraBabylon.js`<br>`Infrastructure/babylon/ServiceNormalisationModeleBabylon.js`<br>`main.js` |
| `Configuration/constantesContours.js` | Configuration du module Contours de la V1 d'ANNA. | `constantesContours` | `Configuration/profilParDefaut.js`<br>`Domain/contours/ParametresContours.js`<br>`Infrastructure/babylon/ServiceCouleurContourAdaptativeBabylon.js`<br>`Infrastructure/postTraitements/PostTraitSilhouette.js`<br>`Presentation/controleurs/ControleurContours.js`<br>`main.js` |
| `Configuration/constantesEntropie.js` | Paramètres du service générique de parcours de vues par entropie. | `constantesEntropie` | `Infrastructure/babylon/ServiceEntropieVueBabylon.js` |
| `Configuration/constantesInterface.js` | Configuration visuelle de l'interface Babylon GUI d'ANNA. | `constantesInterface, obtenirThemeInterface` | `Configuration/profilParDefaut.js`<br>`Infrastructure/gui/ServiceAnimationGUI.js`<br>`Infrastructure/gui/ServiceListeModelesGUI.js`<br>`Infrastructure/gui/ServiceStyleInterfaceGUI.js`<br>`Presentation/controleurs/ControleurAccess.js`<br>`Presentation/controleurs/ControleurContours.js`<br>+1 autre(s) |
| `Configuration/constantesSaillance.js` | Paramètres de la recherche automatique de vue par saillance GMM. | `constantesSaillance` | `Infrastructure/babylon/ServiceSaillanceVueBabylon.js` |
| `Configuration/constantesSauvegarde.js` | Configuration de la sauvegarde du profil utilisateur ANNA. | `constantesSauvegarde` | `Infrastructure/stockage/StockageProfilLocal.js`<br>`Presentation/controleurs/ControleurProfil.js`<br>`main.js` |
| `Configuration/formulaireAvis.js` | Configuration technique de la fenêtre « Avis » d'ANNA. | `configurationFormulaireAvis` | `main.js` |
| `Configuration/profilParDefaut.js` | Profil initial utilisé lorsqu'aucune sauvegarde utilisateur n'est disponible. | `profilParDefaut` | `Etat/etatApplication.js` |
| `Configuration/questionnaireSatisfaction.js` | Structure et libellés du questionnaire de satisfaction ANNA. | `questionnaireSatisfactionANNA` | `Configuration/formulaireAvis.js` |

## Domain
| Fichier | Rôle | Export principal | Importé par |
|---|---|---|---|
| `Domain/animationInterface/EtatMenuLateral.js` | État métier minimal du menu latéral principal. | `EtatMenuLateral` | `Etat/etatApplication.js` |
| `Domain/animationInterface/ParametresAnimation.js` | Objet ou type métier `ParametresAnimation`. | `ParametresAnimation` | `Etat/etatApplication.js` |
| `Domain/apparence/ParametresApparence.js` | Objet de valeur des réglages d'apparence du rendu 3D. | `ParametresApparence` | `Configuration/profilParDefaut.js`<br>`Domain/profil/ProfilUtilisateur.js`<br>`Infrastructure/stockage/StockageProfilLocal.js`<br>`UseCases/accessibiliteUseCases/ToggleAccessUC.js`<br>`UseCases/apparenceUseCases/ReinitialiserApparenceUC.js` |
| `Domain/camera/ParametresCamera.js` | Objet de valeur des réglages de caméra ANNA. | `ParametresCamera` | `Configuration/profilParDefaut.js`<br>`Domain/profil/ProfilUtilisateur.js`<br>`Infrastructure/stockage/StockageProfilLocal.js` |
| `Domain/contours/ParametresContours.js` | État métier des contours de la V1. | `ParametresContours` | `Configuration/profilParDefaut.js`<br>`Domain/profil/ProfilUtilisateur.js`<br>`Infrastructure/stockage/StockageProfilLocal.js`<br>`UseCases/contoursUseCases/ReinitialiserContoursUC.js` |
| `Domain/contours/TypeContour.js` | Objet ou type métier `TypeContour`. | `TypeContour, estTypeContourValide` | `Configuration/constantesContours.js`<br>`Configuration/profilParDefaut.js`<br>`Domain/contours/ParametresContours.js`<br>`Infrastructure/postTraitements/PostTraitSilhouette.js`<br>`Infrastructure/stockage/StockageProfilLocal.js`<br>`Presentation/controleurs/ControleurContours.js`<br>+2 autre(s) |
| `Domain/enquete/ReponseEnquete.js` | Objet ou type métier `ReponseEnquete`. | `ReponseEnquete` | `UseCases/enqueteUseCases/EnregistrerReponseEnqueteUC.js` |
| `Domain/interface/ParametresInterface.js` | Objet de valeur des préférences de l'interface utilisateur. | `ParametresInterface` | `Configuration/profilParDefaut.js`<br>`Domain/profil/ProfilUtilisateur.js`<br>`Infrastructure/stockage/StockageProfilLocal.js`<br>`UseCases/accessibiliteUseCases/ToggleAccessUC.js`<br>`UseCases/interfaceUseCases/ChangerPoliceUC.js`<br>`UseCases/interfaceUseCases/ChangerTaillePoliceUC.js`<br>+1 autre(s) |
| `Domain/interface/PositionMenu.js` | Objet ou type métier `PositionMenu`. | `PositionMenu, estPositionMenuValide` | `Configuration/constantesInterface.js`<br>`Domain/interface/ParametresInterface.js`<br>`Infrastructure/gui/ServiceAnimationGUI.js`<br>`Infrastructure/gui/ServiceStyleInterfaceGUI.js`<br>`Presentation/controleurs/ControleurInterface.js`<br>`Presentation/controleurs/ControleurProfil.js`<br>+1 autre(s) |
| `Domain/interface/ThemeInterface.js` | Objet ou type métier `ThemeInterface`. | `ThemeInterface, estThemeInterfaceValide` | `Configuration/accessibilite.js`<br>`Configuration/constantesInterface.js`<br>`Domain/interface/ParametresInterface.js`<br>`Presentation/controleurs/ControleurInterface.js`<br>`UseCases/interfaceUseCases/ChangerThemeInterfaceUC.js` |
| `Domain/modele3d/EtatModele3D.js` | État de chargement et de sélection des modèles 3D. | `EtatModele3D` | `Etat/etatApplication.js` |
| `Domain/modele3d/Modele3D.js` | Description métier d'un modèle 3D disponible dans ANNA. | `Modele3D` | `Configuration/catalogueModeles3D.js`<br>`Infrastructure/modele3d/ServiceDetectionModeles3D.js` |
| `Domain/profil/ProfilUtilisateur.js` | Agrégat des préférences persistantes d'un utilisateur ANNA. | `ProfilUtilisateur` | `Configuration/profilParDefaut.js`<br>`Infrastructure/stockage/StockageProfilLocal.js`<br>`UseCases/profilUseCases/ReinitialiserProfilUC.js` |

## Etat
| Fichier | Rôle | Export principal | Importé par |
|---|---|---|---|
| `Etat/etatApplication.js` | État partagé de l'application ANNA. | `etatApplication` | `main.js` |

## UseCases
| Fichier | Rôle | Export principal | Importé par |
|---|---|---|---|
| `UseCases/accessibiliteUseCases/ToggleAccessUC.js` | Cas d'utilisation d'activation/désactivation du mode Accessibilité. | `ToggleAccessUC` | `main.js` |
| `UseCases/animIntUseCases/BasculerMenuUC.js` | Cas d'utilisation `BasculerMenuUC`. | `BasculerMenuUC` | `main.js` |
| `UseCases/apparenceUseCases/ChangerContrasteUC.js` | Cas d'utilisation `ChangerContrasteUC`. | `ChangerContrasteUC` | `main.js` |
| `UseCases/apparenceUseCases/ChangerLuminositeUC.js` | Cas d'utilisation `ChangerLuminositeUC`. | `ChangerLuminositeUC` | `main.js` |
| `UseCases/apparenceUseCases/ChangerNetteteUC.js` | Cas d'utilisation `ChangerNetteteUC`. | `ChangerNetteteUC` | `main.js` |
| `UseCases/apparenceUseCases/ChangerSaturationUC.js` | Cas d'utilisation `ChangerSaturationUC`. | `ChangerSaturationUC` | `main.js` |
| `UseCases/apparenceUseCases/ChangerTailleMotifTextureUC.js` | Cas d'utilisation `ChangerTailleMotifTextureUC`. | `ChangerTailleMotifTextureUC` | `main.js` |
| `UseCases/apparenceUseCases/ChangerTextureUC.js` | Cas d'utilisation `ChangerTextureUC`. | `ChangerTextureUC` | `main.js` |
| `UseCases/apparenceUseCases/ReinitialiserApparenceUC.js` | Cas d'utilisation `ReinitialiserApparenceUC`. | `ReinitialiserApparenceUC` | `main.js` |
| `UseCases/cameraUseCases/ChangerVitesseCameraUC.js` | Cas d'utilisation `ChangerVitesseCameraUC`. | `ChangerVitesseCameraUC` | `main.js` |
| `UseCases/contoursUseCases/ActiverSilhouetteUC.js` | Cas d'utilisation `ActiverSilhouetteUC`. | `ActiverSilhouetteUC` | `main.js` |
| `UseCases/contoursUseCases/ChangerCouleurContourUC.js` | Cas d'utilisation `ChangerCouleurContourUC`. | `ChangerCouleurContourUC` | `main.js` |
| `UseCases/contoursUseCases/ChangerEpaisseurContourUC.js` | Cas d'utilisation `ChangerEpaisseurContourUC`. | `ChangerEpaisseurContourUC` | `main.js` |
| `UseCases/contoursUseCases/ChoisirCouleurContourAdaptativeUC.js` | Cas d'utilisation du choix automatique de couleur de silhouette. | `ChoisirCouleurContourAdaptativeUC` | `main.js` |
| `UseCases/contoursUseCases/DesactiverContoursUC.js` | Cas d'utilisation `DesactiverContoursUC`. | `DesactiverContoursUC` | `main.js` |
| `UseCases/contoursUseCases/ReinitialiserContoursUC.js` | Cas d'utilisation `ReinitialiserContoursUC`. | `ReinitialiserContoursUC` | `main.js` |
| `UseCases/enqueteUseCases/EnregistrerReponseEnqueteUC.js` | Cas d'utilisation `EnregistrerReponseEnqueteUC`. | `EnregistrerReponseEnqueteUC` | `main.js` |
| `UseCases/interfaceUseCases/ChangerBordureBoutonUC.js` | Cas d'utilisation `ChangerBordureBoutonUC`. | `ChangerBordureBoutonUC` | `main.js` |
| `UseCases/interfaceUseCases/ChangerBordureMenuUC.js` | Cas d'utilisation `ChangerBordureMenuUC`. | `ChangerBordureMenuUC` | `main.js` |
| `UseCases/interfaceUseCases/ChangerGrasUC.js` | Cas d'utilisation `ChangerGrasUC`. | `ChangerGrasUC` | `main.js` |
| `UseCases/interfaceUseCases/ChangerPoliceUC.js` | Cas d'utilisation `ChangerPoliceUC`. | `ChangerPoliceUC` | `main.js` |
| `UseCases/interfaceUseCases/ChangerPositionMenuUC.js` | Cas d'utilisation `ChangerPositionMenuUC`. | `ChangerPositionMenuUC` | `main.js` |
| `UseCases/interfaceUseCases/ChangerTaillePoliceUC.js` | Cas d'utilisation `ChangerTaillePoliceUC`. | `ChangerTaillePoliceUC` | `main.js` |
| `UseCases/interfaceUseCases/ChangerThemeInterfaceUC.js` | Cas d'utilisation `ChangerThemeInterfaceUC`. | `ChangerThemeInterfaceUC` | `main.js` |
| `UseCases/interfaceUseCases/ReinitialiserInterfaceUC.js` | Cas d'utilisation `ReinitialiserInterfaceUC`. | `ReinitialiserInterfaceUC` | `main.js` |
| `UseCases/modele3dUseCases/ChangerModeleActifUC.js` | Cas d'utilisation `ChangerModeleActifUC`. | `ChangerModeleActifUC` | `main.js` |
| `UseCases/modele3dUseCases/ChargerModeleUC.js` | Cas d'utilisation `ChargerModeleUC`. | `ChargerModeleUC` | `main.js` |
| `UseCases/modele3dUseCases/ListerModelesUC.js` | Cas d'utilisation fournissant le catalogue de modèles visible par la GUI. | `ListerModelesUC` | `main.js` |
| `UseCases/profilUseCases/AppliquerProfilUC.js` | Cas d'utilisation qui applique un ProfilUtilisateur à l'état partagé. | `AppliquerProfilUC` | `main.js` |
| `UseCases/profilUseCases/ChargerProfilLocalUC.js` | Cas d'utilisation `ChargerProfilLocalUC`. | `ChargerProfilLocalUC` | `main.js` |
| `UseCases/profilUseCases/ReinitialiserProfilUC.js` | Cas d'utilisation `ReinitialiserProfilUC`. | `ReinitialiserProfilUC` | `main.js` |
| `UseCases/profilUseCases/SauvegarderProfilLocalUC.js` | Cas d'utilisation `SauvegarderProfilLocalUC`. | `SauvegarderProfilLocalUC` | `main.js` |

## Infrastructure
| Fichier | Rôle | Export principal | Importé par |
|---|---|---|---|
| `Infrastructure/accessibilite/AccessNav.js` | Lecture des préférences d'accessibilité exposées par le navigateur. | `AccessNav` | `main.js` |
| `Infrastructure/accessibilite/ServicePolicesNavigateur.js` | Module d'infrastructure `ServicePolicesNavigateur`. | `ServicePolicesNavigateur` | `main.js` |
| `Infrastructure/babylon/BoucleRenduBabylon.js` | Service Babylon `BoucleRenduBabylon`. | `BoucleRenduBabylon` | `main.js` |
| `Infrastructure/babylon/ChargeurModeleBabylon.js` | Service Babylon `ChargeurModeleBabylon`. | `ChargeurModeleBabylon` | `main.js` |
| `Infrastructure/babylon/FabriqueMoteurBabylon.js` | Service Babylon `FabriqueMoteurBabylon`. | `FabriqueMoteurBabylon` | `main.js` |
| `Infrastructure/babylon/FabriqueScene3D.js` | Service Babylon `FabriqueScene3D`. | `FabriqueScene3D` | `main.js` |
| `Infrastructure/babylon/FabriqueSceneGUI.js` | Service Babylon `FabriqueSceneGUI`. | `FabriqueSceneGUI` | `main.js` |
| `Infrastructure/babylon/ServiceCadrageCameraBabylon.js` | Calcul de cadrage d'un ensemble de meshes avec ArcRotateCamera. | `ServiceCadrageCameraBabylon` | `main.js` |
| `Infrastructure/babylon/ServiceCameraBabylon.js` | Adaptateur Babylon.js pour la caméra principale. | `ServiceCameraBabylon` | `main.js` |
| `Infrastructure/babylon/ServiceCouleurContourAdaptativeBabylon.js` | Choix automatique de la couleur de la silhouette à partir du rendu courant. | `ServiceCouleurContourAdaptativeBabylon` | `main.js` |
| `Infrastructure/babylon/ServiceEntropieVueBabylon.js` | Moteur générique de parcours de points de vue autour d'un modèle. | `ServiceEntropieVueBabylon` | `Infrastructure/babylon/ServiceSaillanceVueBabylon.js` |
| `Infrastructure/babylon/ServiceLumiereBabylon.js` | Service Babylon `ServiceLumiereBabylon`. | `ServiceLumiereBabylon` | `main.js` |
| `Infrastructure/babylon/ServiceMateriauxBabylon.js` | Gestion des matériaux et textures alternatives des modèles 3D. | `ServiceMateriauxBabylon` | `main.js` |
| `Infrastructure/babylon/ServiceNormalisationModeleBabylon.js` | Service Babylon `ServiceNormalisationModeleBabylon`. | `ServiceNormalisationModeleBabylon` | `main.js` |
| `Infrastructure/babylon/ServiceOrientationModeleBabylon.js` | Correction prudente de l'orientation des modèles 3D importés. | `ServiceOrientationModeleBabylon` | `main.js` |
| `Infrastructure/babylon/ServiceSaillanceVueBabylon.js` | Sélection automatique de la vue initiale par saillance visuelle. | `ServiceSaillanceVueBabylon` | `main.js` |
| `Infrastructure/babylon/ServiceSceneBabylon.js` | Opérations techniques courantes sur la scène Babylon.js. | `ServiceSceneBabylon` | `main.js` |
| `Infrastructure/gui/ChargeurInterfaceGUI.js` | Service GUI `ChargeurInterfaceGUI`. | `ChargeurInterfaceGUI` | `main.js` |
| `Infrastructure/gui/RechercheControleGUI.js` | Service GUI `RechercheControleGUI`. | `RechercheControleGUI` | `main.js` |
| `Infrastructure/gui/ServiceAnimationGUI.js` | Gestion des animations et de la disposition dynamique de Babylon GUI. | `ServiceAnimationGUI` | `main.js` |
| `Infrastructure/gui/ServiceBlocagePointeurGUI.js` | Service GUI `ServiceBlocagePointeurGUI`. | `ServiceBlocagePointeurGUI` | `main.js` |
| `Infrastructure/gui/ServiceControlesSpeciauxGUI.js` | Correctifs ciblés pour des contrôles Babylon GUI nécessitant un rafraîchissement. | `ServiceControlesSpeciauxGUI` | `main.js` |
| `Infrastructure/gui/ServiceDimensionsGUI.js` | Lecture et mémorisation des dimensions de contrôles Babylon GUI. | `ServiceDimensionsGUI` | `main.js` |
| `Infrastructure/gui/ServiceListeModelesGUI.js` | Construction et mise à jour de la liste des modèles dans Babylon GUI. | `ServiceListeModelesGUI` | `main.js` |
| `Infrastructure/gui/ServiceStyleInterfaceGUI.js` | Application des thèmes et bordures sur Babylon GUI. | `ServiceStyleInterfaceGUI` | `main.js` |
| `Infrastructure/gui/ServiceTexteGUI.js` | Service GUI `ServiceTexteGUI`. | `ServiceTexteGUI` | `main.js` |
| `Infrastructure/gui/ServiceTexteResponsiveGUI.js` | Service GUI `ServiceTexteResponsiveGUI`. | `ServiceTexteResponsiveGUI` | `main.js` |
| `Infrastructure/loupe/ServiceLoupe3D.js` | Loupe 3D rendue par une caméra Babylon secondaire. | `ServiceLoupe3D` | `main.js` |
| `Infrastructure/modele3d/ServiceDetectionModeles3D.js` | Découverte des modèles 3D disponibles sans liste codée en dur. | `ServiceDetectionModeles3D` | `main.js` |
| `Infrastructure/postTraitements/PostTraitApparence.js` | Post-traitement Babylon de contraste, luminosité et saturation. | `PostTraitApparence` | `Infrastructure/loupe/ServiceLoupe3D.js`<br>`main.js` |
| `Infrastructure/postTraitements/PostTraitNettete.js` | Module d'infrastructure `PostTraitNettete`. | `PostTraitNettete` | `Infrastructure/loupe/ServiceLoupe3D.js`<br>`main.js` |
| `Infrastructure/postTraitements/PostTraitSilhouette.js` | Post-traitement V1 dédié exclusivement à la silhouette. | `PostTraitSilhouette` | `Infrastructure/loupe/ServiceLoupe3D.js`<br>`main.js` |
| `Infrastructure/shaders/ShaderApparence.js` | Module d'infrastructure `NOM_SHADER_APPARENCE`. | `NOM_SHADER_APPARENCE, creerShaderApparenceSiNecessaire` | `Infrastructure/postTraitements/PostTraitApparence.js` |
| `Infrastructure/shaders/ShaderSilhouette.js` | Enregistrement du shader GLSL utilisé par PostTraitSilhouette. | `creerShaderSilhouetteSiNecessaire` | `Infrastructure/postTraitements/PostTraitSilhouette.js` |
| `Infrastructure/stockage/StockageProfilLocal.js` | Sérialisation et persistance locale du profil utilisateur ANNA. | `StockageProfilLocal` | `main.js` |
| `Infrastructure/web/ServiceEnregistrementEnqueteHTTP.js` | Module d'infrastructure `ServiceEnregistrementEnqueteHTTP`. | `ServiceEnregistrementEnqueteHTTP` | `main.js` |
| `Infrastructure/web/ServiceFormulaireAvisHTML.js` | Intégration du questionnaire de satisfaction dans la page ANNA. | `ServiceFormulaireAvisHTML` | `main.js` |

## Presentation
| Fichier | Rôle | Export principal | Importé par |
|---|---|---|---|
| `Presentation/controleurs/ControleurAccess.js` | Contrôleur de présentation du panneau Accessibilité. | `ControleurAccess` | `main.js` |
| `Presentation/controleurs/ControleurAnimationInterface.js` | Contrôleur de navigation entre les panneaux de l'interface. | `ControleurAnimationInterface` | `main.js` |
| `Presentation/controleurs/ControleurApparence.js` | Contrôleur des réglages visuels appliqués à la scène 3D. | `ControleurApparence` | `main.js` |
| `Presentation/controleurs/ControleurAvis.js` | Contrôleur du bouton Avis et du questionnaire de satisfaction. | `ControleurAvis` | `main.js` |
| `Presentation/controleurs/ControleurCamera.js` | Contrôleur des interactions caméra exposées par l'interface. | `ControleurCamera` | `main.js` |
| `Presentation/controleurs/ControleurContours.js` | Contrôleur du menu Contours de la V1. | `ControleurContours` | `main.js` |
| `Presentation/controleurs/ControleurInterface.js` | Contrôleur des paramètres de configuration de l'interface. | `ControleurInterface` | `main.js` |
| `Presentation/controleurs/ControleurLumiere.js` | Contrôleur du menu Lumières. | `ControleurLumiere` | `main.js` |
| `Presentation/controleurs/ControleurModele3D.js` | Orchestration de la liste, du chargement et de la vue initiale des modèles 3D. | `ControleurModele3D` | `main.js` |
| `Presentation/controleurs/ControleurProfil.js` | Orchestration du chargement et des sauvegardes du profil utilisateur. | `ControleurProfil` | `main.js` |

## Util
| Fichier | Rôle | Export principal | Importé par |
|---|---|---|---|
| `Util/BabylonUtils.js` | Utilitaires `creerVector3DepuisObjet`. | `creerVector3DepuisObjet, convertirVector3EnObjet, filtrerMeshesValides, calculerBornesMeshes, supprimerMeshes, trouverRacineModeleANNA, creerOuTrouverRacineModeleANNA, appliquerBackFaceCulling` | `Infrastructure/babylon/ServiceCadrageCameraBabylon.js`<br>`Infrastructure/babylon/ServiceCameraBabylon.js`<br>`Infrastructure/babylon/ServiceNormalisationModeleBabylon.js`<br>`Infrastructure/babylon/ServiceOrientationModeleBabylon.js`<br>`Infrastructure/babylon/ServiceSceneBabylon.js` |
| `Util/CouleurUtils.js` | Utilitaires `estCouleurHexa`. | `estCouleurHexa, normaliserCouleurHexa, versHexa, inverserCouleurHexa, couleurHexaVersRgb01, couleurRgb01VersHexa, couleurHexaVersRgb255, couleurRgb255VersHexa, couleurBabylonVersRgb255, distanceRgb, luminanceRelative, contrasteLuminance, rgb255VersOklab, distanceOklab` | `Infrastructure/babylon/ServiceCouleurContourAdaptativeBabylon.js`<br>`Infrastructure/postTraitements/PostTraitSilhouette.js` |
| `Util/GuiUtils.js` | Utilitaires `estControleValide`. | `estControleValide, estBouton, estTextBlock, estSlider, estRectangle, parcourirControles, trouverEnfantParType, trouverTextBlockDansBouton, appliquerVisibilite, viderConteneur` | `Infrastructure/gui/ServiceListeModelesGUI.js` |
| `Util/ValeurCssUtils.js` | Utilitaires `lireNombreDepuisValeurCss`. | `lireNombreDepuisValeurCss, obtenirUniteCss, estValeurPourcentage, estValeurPixel, reconstruireValeurCss, garderUniteCss` | `Infrastructure/gui/ServiceAnimationGUI.js`<br>`Infrastructure/gui/ServiceDimensionsGUI.js` |
