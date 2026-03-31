# Portfolio Specification

## Requirements

### Requirement: Public Static Portfolio
Le systeme doit exposer un portfolio public statique presentant le profil, les competences, les experiences, les preuves et les projets sans backend applicatif dedie.

#### Scenario: Direct static hosting
Given le site est servi comme simple contenu statique
When un visiteur ouvre `index.html`
Then les sections principales du portfolio doivent etre accessibles sans backend applicatif
And la navigation doit rester fonctionnelle sur desktop et mobile

### Requirement: Responsive Navigation And Sections
Le systeme doit fournir une navigation claire vers les sections du portfolio et un comportement adapte au mobile.

#### Scenario: Mobile navigation
Given un visiteur consulte le site sur un petit ecran
When il ouvre le menu mobile
Then il doit pouvoir atteindre les sections principales sans perte de contenu

### Requirement: Resume, Proofs And Contact Access
Le systeme doit rendre directement accessibles les preuves BTS, le CV et la zone de contact depuis le portfolio principal.

#### Scenario: Browsing supporting material
Given un visiteur parcourt le portfolio principal
When il consulte les sections documentaires
Then il doit pouvoir atteindre les preuves BTS, ouvrir le CV PDF et acceder a la zone de contact sans quitter le site

### Requirement: Live GitHub Projects With Fallback
Le systeme doit afficher les projets GitHub recents quand l'API est disponible tout en gardant un etat de repli local lisible.

#### Scenario: GitHub API available
Given l'API GitHub est joignable
When le portfolio charge la section projets
Then il doit recuperer les depots recents et les afficher dynamiquement

#### Scenario: GitHub API unavailable
Given l'API GitHub echoue ou retourne une erreur
When la section projets se charge
Then le portfolio doit afficher des cartes de repli locales plutot qu'une zone vide

### Requirement: Sport Dashboard Entry Point
Le systeme doit exposer une page sport distincte depuis le portfolio principal.

#### Scenario: Sport page access
Given un visiteur consulte le portfolio principal
When il suit l'entree vers la partie sport
Then il doit atteindre une page dediee au suivi sportif
And cette page doit rester reliee au portfolio principal

#### Scenario: Sport page sections
Given un visiteur ouvre `sport.html`
When la page se charge
Then il doit pouvoir naviguer entre les sections `Vue globale`, `Charge`, `Sommeil`, `Bien-etre` et `Activites`

### Requirement: Garmin Summary Rendering
Le systeme doit afficher un resume sportif genere a partir des donnees Garmin preparees localement, a la fois dans le portfolio principal et dans la page sport dediee.

#### Scenario: Summary available
Given un fichier de synthese Garmin valide est disponible dans les assets
When la page sport ou le bloc sport du portfolio se charge
Then le site doit afficher les indicateurs sportifs, les activites recentes et les lectures de recuperation

#### Scenario: Summary missing
Given aucun fichier de synthese Garmin exploitable n'est disponible
When la page sport se charge
Then le site doit afficher un etat de repli lisible plutot qu'une page cassee

### Requirement: Generated Garmin Data Pipeline
Le systeme doit pouvoir transformer les exports du crawler en donnees statiques consommables par le site.

#### Scenario: Summary generation
Given des exports Garmin locaux existent dans le workspace
When le script de synthese est execute
Then il doit produire `garmin-summary.json` et `garmin-summary.js` dans `portfolio/assets/data/`
And `garmin-summary.js` doit exposer `window.__GARMIN_SUMMARY__` pour le frontend statique

### Requirement: Presentation-Oriented Experience
Le systeme doit mettre en avant les preuves, le parcours et les projets dans une experience visuelle coherente avec l'identite du portfolio.

#### Scenario: Project and proof browsing
Given un visiteur parcourt le site
When il consulte les projets et preuves presentes
Then il doit comprendre rapidement le profil, le parcours et les realisations mises en avant

#### Scenario: Motion-enhanced presentation
Given les assets front de presentation sont charges
When le visiteur parcourt le portfolio principal
Then les animations et transitions doivent enrichir la lecture
And elles ne doivent pas etre necessaires pour comprendre le contenu si elles ne se declenchent pas
