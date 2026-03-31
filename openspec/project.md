# Project Context

## Workspace Scope

Ce workspace contient trois projets relies mais distincts :

- `garmin crawler/` : collecte des donnees Garmin et production d'exports locaux
- `portfolio/` : site public statique de presentation et dashboard sport
- `projetHome/` : hub local leger pour une vieille tablette Android

## Spec Boundaries

Chaque projet a sa propre spec dans `openspec/specs/<capability>/spec.md`.

Le but est d'eviter une spec monolithique pour tout le workspace. Chaque spec doit rester centree sur un seul domaine fonctionnel.

## Cross-Project Dependencies

`garmin crawler` produit les exports sportifs bruts dans `exports/<timestamp>/` et alimente les deux autres projets.

`portfolio` transforme ces exports en fichiers statiques `garmin-summary.json` et `garmin-summary.js` dans `portfolio/assets/data/`.

`projetHome` lit directement les exports locaux du crawler pour construire sa partie sport cote serveur.

`garmin crawler/ollama-analyze.js` reutilise actuellement les helpers de synthese Garmin de `projetHome/server/services/garminSummary*` pour produire une analyse texte orientee dashboard.

## Nightly Operations Cadence

La cadence nocturne de reference du workspace suit cet enchainement :

- `23:45` : pull du workspace pour recuperer les derniers changements avant la collecte
- `00:00` : lancement du Garmin crawler
- `00:15` : lancement de l'analyse Ollama sur le dernier export
- `00:30` : commit des dernieres modifications generees par le cycle nocturne

## Authoring Conventions

Les specs de `openspec/specs/` decrivent ce qui doit etre vrai dans l'etat courant du code.

Les changements futurs devront etre proposes dans `openspec/changes/` plutot que modifies directement dans les specs courantes.

Le texte fonctionnel peut etre redige en francais, mais les entetes OpenSpec doivent rester au format :

- `### Requirement: ...`
- `#### Scenario: ...`

Chaque requirement doit rester testable et comporter au moins un scenario clair.

## Monorepo Guardrails

Une modification de `garmin crawler` peut impacter `portfolio` et `projetHome` si elle change le format des exports.

Une modification des helpers `projetHome/server/services/garminSummary*` peut impacter a la fois le dashboard tablette et l'analyse Ollama du crawler.

Une modification de `portfolio` ne doit pas casser l'hebergement statique du site.

Une modification de `portfolio` qui ajoute une dependance reseau runtime doit conserver un etat de repli lisible.

Une modification de `projetHome` ne doit pas reintroduire une architecture lourde cote tablette.
