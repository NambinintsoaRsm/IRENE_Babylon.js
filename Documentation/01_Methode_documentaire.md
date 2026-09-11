# Méthode documentaire retenue

## Objectif

L'objectif n'est pas de commenter chaque ligne, mais de rendre le projet navigable pour une personne qui le reprend : comprendre **ce que fait le code, comment il fonctionne, comment l'utiliser et comment les éléments s'articulent**.

## Références utilisées comme modèles

### IBM - Code documentation

IBM distingue notamment la documentation de bas niveau, la documentation de haut niveau, la documentation interne et la documentation externe. IBM recommande aussi de documenter les décisions de conception, de rester clair et concis et de maintenir documentation et code ensemble.

Référence :
- https://www.ibm.com/fr-fr/think/topics/code-documentation

Application dans ANNA :
- **bas niveau** : JSDoc et commentaires ciblés dans le code ;
- **haut niveau** : architecture, responsabilités, flux et algorithmes ;
- **interne** : constantes, maintenance, conventions et décisions ;
- **externe** : déploiement, API et usage des fichiers.

### Diátaxis

Diátaxis sépare quatre besoins documentaires :
- **tutorial** : apprendre ;
- **how-to** : accomplir une tâche ;
- **reference** : consulter une information précise ;
- **explanation** : comprendre pourquoi et comment.

Référence :
- https://www.diataxis.fr/start-here/

Application dans ce dossier :
- explications : architecture et algorithmes ;
- guides : checklist de reprise, maintenance et déploiement ;
- références : fichiers et constantes.

### arc42

arc42 propose notamment :
- la **Building Block View** pour la décomposition statique ;
- la **Runtime View** pour les scénarios d'exécution ;
- la **Deployment View** pour le déploiement ;
- les décisions, risques et concepts transverses.

Références :
- https://arc42.org/overview/
- https://docs.arc42.org/section-5/
- https://docs.arc42.org/section-6/
- https://docs.arc42.org/section-7/

Cette documentation reprend ces idées de façon allégée, adaptée à la taille d'ANNA.

### C4 Model

C4 propose plusieurs niveaux de zoom : contexte, conteneurs, composants et code. Pour ANNA, les vues **contexte**, **conteneurs** et **composants** suffisent.

Référence :
- https://c4model.com/

### JSDoc

JSDoc est utilisé dans le code pour documenter les fichiers, classes et méthodes publiques non triviales.

Référence :
- https://jsdoc.app/

La convention interne du projet reste :
- `Documentation/Convention_commentaires_ANNA.md`.

### ADR / MADR

Les décisions structurantes sont séparées du code sous forme d'Architecture Decision Records : contexte, décision, conséquences et éléments à préserver.

Référence :
- https://adr.github.io/madr/

## Principe de rédaction

Un bon commentaire ou document ANNA doit répondre, selon le cas, à ces questions :

1. **Pourquoi ce module existe-t-il ?**
2. **Qui l'appelle ?**
3. **Que modifie-t-il ?**
4. **De quelles données dépend-il ?**
5. **Quelles contraintes ne faut-il pas casser ?**
6. **Quels paramètres sont empiriques ?**
7. **Comment tester qu'une modification est correcte ?**

## Ce qui n'est volontairement pas documenté ligne par ligne

Les getters, setters évidents, validations triviales et opérations JavaScript explicites ne sont pas paraphrasés. Une documentation trop abondante peut masquer la logique importante.
