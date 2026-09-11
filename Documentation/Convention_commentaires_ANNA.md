# Convention de commentaires du code ANNA

## Objectif

Les commentaires doivent aider une personne qui reprend le projet à comprendre **pourquoi** un élément existe, **où il est utilisé** et **quelles contraintes doivent être préservées**. Ils ne doivent pas paraphraser chaque ligne de JavaScript.

## 1. En-tête de fichier

Les fichiers structurants utilisent un bloc JSDoc `@file` :

```js
/**
 * @file Rôle court du fichier.
 *
 * Rôle : responsabilité principale.
 * Utilisation : qui appelle ce module et dans quel moment du pipeline.
 * Contrainte : règle importante à ne pas casser, si nécessaire.
 */
```

L'en-tête décrit la responsabilité actuelle de la V1, pas l'historique des correctifs.

## 2. Classes et fonctions publiques

Une fonction publique non triviale est documentée avec JSDoc lorsqu'un appelant doit connaître un contrat :

```js
/**
 * Charge un modèle et prépare sa vue initiale.
 *
 * @param {string} idModele Identifiant du modèle.
 * @returns {Promise<Object|null>} État après chargement.
 */
```

Les getters, setters évidents ou fonctions privées très courtes ne nécessitent pas de commentaire systématique.

## 3. Commenter le « pourquoi »

À privilégier :

- pourquoi une valeur ou une stratégie est conservée ;
- pourquoi une opération est asynchrone ;
- pourquoi une vérification est nécessaire ;
- quelle contrainte UX/accessibilité est protégée ;
- quelle dépendance rend un fichier encore nécessaire.

À éviter :

```js
// Incrémente i de 1
i += 1;
```

## 4. Constantes

Une constante métier ou empirique doit préciser, lorsque l'information est connue :

1. son unité ;
2. l'effet d'une valeur plus haute/basse ;
3. la raison de la valeur actuelle ;
4. le risque d'une modification.

Si la valeur provient seulement de la base stable et qu'aucune justification expérimentale n'est documentée, écrire explicitement **« valeur empirique conservée depuis la base stable »** au lieu d'inventer une raison.

## 5. Historique et compatibilité

Éviter les commentaires du type « ancien patch », « correction V7 », etc. Le dépôt Git ou les archives servent à l'historique. Un commentaire historique ne reste que s'il explique une contrainte toujours valable.

Exemple valable :

> `ServiceEntropieVueBabylon` reste nécessaire même si Entropie n'est plus visible dans la V1, car `ServiceSaillanceVueBabylon` en hérite pour réutiliser le parcours sphérique.

## 6. V1 et future V2 Contours

Les commentaires de la V1 doivent éviter de mélanger :

- **Choix automatique de couleur** : fonction V1 qui choisit la couleur d'affichage de la silhouette ;
- **Contour couleur** : ancien traitement qui détectait des ruptures à partir des gradients de couleur et qui est archivé pour une V2.

Relief, contour couleur et surbrillance devront revenir sous forme de modules séparés, sans réintroduire leurs calculs dans `PostTraitSilhouette.js`.

## 7. Langue et style

- commentaires techniques en français, cohérents avec les noms du projet ;
- phrases courtes et précises ;
- JSDoc pour les contrats publics ;
- commentaires `//` pour une décision locale ou une contrainte ponctuelle ;
- pas de commentaire décoratif ou redondant.
