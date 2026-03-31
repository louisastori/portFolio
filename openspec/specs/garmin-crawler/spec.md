# Garmin Crawler Specification

## Requirements

### Requirement: Persistent Garmin Session Preparation
Le systeme doit permettre de preparer une session Garmin persistante afin d'eviter une re-authentification complete a chaque execution.

#### Scenario: Manual login preparation
Given l'utilisateur lance la commande de preparation de session
When Garmin demande une authentification
Then le navigateur doit rester ouvert assez longtemps pour permettre une connexion manuelle
And une execution ulterieure doit pouvoir reutiliser la session sauvegardee

#### Scenario: Reuse existing session
Given une session Garmin valide existe deja
When le crawler est relance
Then il doit reutiliser cette session
And il ne doit pas exiger une nouvelle authentification tant que la session reste valide

### Requirement: Export Daily Wellness Datasets
Le systeme doit exporter les donnees journalieres Garmin sur une plage de dates definie ou implicite.

#### Scenario: Default export window
Given aucune date n'est fournie en argument
When le crawler s'execute
Then il doit exporter une fenetre recente par defaut
And il doit produire les jeux de donnees quotidiens dans le dossier d'export courant

#### Scenario: Explicit date range
Given l'utilisateur fournit une date de debut et une date de fin valides
When le crawler s'execute
Then il doit exporter uniquement cette plage
And il doit rejeter une plage invalide ou inversee

### Requirement: Export Recent Activities
Le systeme doit recuperer une liste limitee d'activites recentes Garmin en respectant une borne de volume configurable.

#### Scenario: Activity limit respected
Given l'utilisateur fournit une limite d'activites
When le crawler collecte les activites recentes
Then il ne doit pas depasser cette limite
And il doit conserver les metadonnees utiles a l'analyse sportive

### Requirement: Optional Per-Activity Detail Export
Le systeme doit pouvoir recuperer les details par activite ou les ignorer selon le mode d'execution.

#### Scenario: Detailed export enabled
Given le mode detail est actif
When le crawler traite les activites recentes
Then il doit produire un fichier de details par lot d'execution
And ces details doivent contenir les informations necessaires aux analyses avancees

#### Scenario: Detailed export skipped
Given l'option de saut des details est active
When le crawler s'execute
Then il doit exporter les activites de base sans recuperer les details individuels

### Requirement: Timestamped Export Folders
Le systeme doit stocker chaque execution dans un dossier d'export distinct, sauf chemin de sortie explicite.

#### Scenario: Default output folder
Given aucun dossier de sortie n'est fourni
When le crawler termine une execution
Then il doit creer un dossier horodate sous `exports/`
And il doit y enregistrer tous les artefacts de cette execution

#### Scenario: Explicit output folder
Given l'utilisateur fournit un dossier de sortie
When le crawler termine une execution
Then il doit ecrire les artefacts dans ce dossier cible

### Requirement: Reusable Export Artifact Contract
Le systeme doit produire un lot d'artefacts JSON stable pour que `portfolio` et `projetHome` puissent reutiliser chaque execution sans conversion supplementaire.

#### Scenario: Successful crawl artifacts
Given une execution du crawler se termine correctement
When les fichiers d'export sont ecrits
Then le dossier courant doit contenir `metadata.json`, `profile.json`, `activities.json`, `activity-details.json`, `daily-summaries.json` et `sleep.json`
And `metadata.json` doit conserver le contexte utile de l'execution

### Requirement: Local Ollama Analysis Outputs
Le systeme doit pouvoir enrichir le dernier export Garmin avec une analyse sportive locale en texte brut via Ollama.

#### Scenario: Analysis on latest reusable export
Given au moins un export Garmin reutilisable existe
When le script d'analyse Ollama est execute
Then il doit selectionner le dernier export exploitable
And il doit ecrire `ollama-analysis.txt` et `ollama-analysis.json` dans ce dossier d'export
And la sortie JSON doit conserver le texte brut, le modele retenu et les `coachSignals` lorsqu'ils sont disponibles

#### Scenario: Dry-run analysis planning
Given l'utilisateur lance l'analyse avec `--dry-run`
When le script prepare son execution
Then il ne doit pas appeler Ollama
And il doit afficher un plan d'execution exploitable sans modifier les exports

### Requirement: Scheduled Local Operation
Le systeme doit pouvoir etre lance de maniere repetable dans un contexte local Windows avec logs pour le crawl nocturne et l'analyse Ollama differee.

#### Scenario: Nightly scheduled run
Given une tache planifiee locale declenche le crawler
When l'execution demarre sans interaction
Then les exports doivent etre produits dans un format reutilisable par les autres projets
And les erreurs doivent rester visibles dans les logs locaux

#### Scenario: Nightly Ollama scheduled run
Given une tache planifiee locale declenche l'analyse apres le crawl
When le runner d'analyse demarre
Then il doit demarrer `ollama serve` si l'API locale n'est pas deja disponible
And il doit executer l'analyse du dernier export Garmin
And il doit journaliser l'execution dans `logs/`

### Requirement: Nightly Workspace Automation Sequence
Le systeme doit documenter et supporter une sequence nocturne ordonnee pour mettre a jour le workspace, produire les exports Garmin, enrichir ces exports avec Ollama puis versionner les modifications generees.

#### Scenario: Nightly timeline reference
Given le workflow nocturne complet est configure sur la machine locale
When la sequence quotidienne s'execute
Then un `pull` du workspace doit etre lance a `23:45`
And le Garmin crawler doit etre lance a `00:00`
And l'analyse Ollama doit etre lancee a `00:15`
And un commit des dernieres modifications doit etre lance a `00:30`

#### Scenario: Ordered nightly steps
Given plusieurs etapes automatiques composent la nuit
When le workflow avance d'une etape a la suivante
Then chaque etape doit utiliser les sorties de l'etape precedente
And le commit final ne doit arriver qu'apres la collecte Garmin et l'analyse Ollama
