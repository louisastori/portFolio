# Projet Home Hub Specification

## Requirements

### Requirement: Lightweight Tablet Architecture
Le systeme doit deplacer la charge applicative principale sur un ordinateur local afin que la tablette n'affiche qu'une interface web legere.

#### Scenario: Old tablet display mode
Given une vieille tablette Android accede au systeme
When elle ouvre l'URL locale du hub
Then elle doit charger une interface web legere
And elle ne doit pas embarquer les integrations lourdes ni les secrets applicatifs

### Requirement: Local Dashboard Aggregation
Le systeme doit agreger les donnees sport, fitness, nutrition et lumieres dans un snapshot unique accessible localement.

#### Scenario: Dashboard snapshot
Given le hub local est demarre
When un client appelle l'API dashboard
Then il doit recevoir un snapshot unique contenant les donnees disponibles par domaine
And le snapshot doit inclure des warnings lorsque certaines integrations ne repondent pas

### Requirement: Server-Side Secret Isolation
Le systeme doit conserver tous les tokens, URLs sensibles et identifiants cote serveur.

#### Scenario: Tablet browser access
Given la tablette consomme uniquement l'interface web du hub
When elle interagit avec le dashboard
Then elle ne doit utiliser que des endpoints locaux exposes par le hub
And elle ne doit jamais voir les secrets des integrations tierces

### Requirement: Local Sport Rendering From Garmin Exports
Le systeme doit construire sa partie sport a partir des exports Garmin locaux pour eviter une dependance forte a une API distante.

#### Scenario: Garmin exports present
Given les exports du `garmin crawler` sont presents dans le workspace
When le hub construit le resume sport
Then il doit afficher les indicateurs, tendances, activites detaillees et cartes sportives a partir de ces exports

#### Scenario: Garmin exports missing
Given les exports Garmin sont absents ou invalides
When le dashboard est demande
Then le hub doit remonter un warning sport explicite
And l'interface web doit rester chargeable

### Requirement: Local Light Control API
Le systeme doit fournir une API locale unifiee pour piloter les lumieres supportees, y compris les integrations Hue, SmartLife et AramSMART lorsque leurs configurations sont presentes.

#### Scenario: Toggle and brightness control
Given une integration lumiere est configuree
When le frontend appelle les endpoints locaux de pilotage
Then le hub doit pouvoir changer l'etat d'alimentation et la luminosite de l'appareil cible

#### Scenario: Color-capable light control
Given une lumiere supporte la couleur
When le frontend envoie une couleur hexadecimale valide
Then le hub doit appliquer cette couleur a l'appareil cible via le provider correspondant

#### Scenario: Aggregated light snapshot
Given plusieurs providers lumiere sont configures ou partiellement disponibles
When le dashboard agrege l'etat des lumieres
Then il doit reunir les appareils disponibles dans une vue unique
And il doit remonter des warnings par provider lorsqu'un connecteur echoue

### Requirement: Partial Degradation
Le systeme doit continuer a servir le dashboard meme si une ou plusieurs integrations amont sont indisponibles.

#### Scenario: Upstream service failure
Given une source de donnees externe echoue
When le dashboard est regenere
Then le hub doit renvoyer les autres donnees disponibles
And il doit decrire la panne dans la liste des warnings au lieu d'abandonner toute la reponse

### Requirement: Default Local Web Runtime
Le systeme doit privilegier l'execution du hub web local comme mode principal tout en preservant les scripts legacy existants.

#### Scenario: Default project start
Given l'utilisateur lance le projet par sa commande principale
When le processus demarre
Then il doit servir le hub web local
And les anciens scripts Expo doivent rester disponibles comme mode legacy separe

### Requirement: Local Ollama Assistant
Le systeme doit exposer un assistant Ollama local connecte au contexte sport du dashboard pour discuter, briefer et relire les tendances depuis la tablette.

#### Scenario: Context-grounded local chat
Given le hub local est demarre et les donnees sport sont disponibles
When le frontend appelle l'endpoint local de chat Ollama
Then le serveur doit transmettre une conversation contextualisee par les donnees sport du dashboard
And la tablette ne doit appeler qu'un endpoint local du hub

#### Scenario: Automatic brief and alert cards
Given le dashboard principal se charge sur la tablette
When le contexte sport est disponible
Then l'interface doit pouvoir afficher un brief automatique, des alertes intelligentes et une memoire courte de la journee
And ces cartes doivent rester utilisables meme si l'utilisateur n'envoie pas encore de message libre

#### Scenario: Voice and voice-input helpers
Given le navigateur tablette expose la synthese vocale ou la reconnaissance vocale
When l'utilisateur active la voix ou le bouton parler
Then le chat doit pouvoir lire les reponses a voix haute et accepter une transcription vocale locale quand elle est disponible

### Requirement: Solar Sleep Planning View
Le systeme doit exposer une page locale dediee au sommeil et au lever du soleil pour comparer le rythme de sommeil de l'utilisateur avec le soleil a Bordeaux.

#### Scenario: Sleep and sunrise page
Given le hub dispose des exports Garmin sommeil recents
When l'utilisateur ouvre la page locale sommeil soleil
Then la page doit afficher le lever du soleil a Bordeaux pour la date cible
And elle doit afficher l'heure de reveil recente de l'utilisateur
And elle doit calculer une heure de coucher cible pour se reveiller en meme temps que le soleil a partir du besoin de sommeil moyen

#### Scenario: Missing sleep data
Given les exports sommeil sont absents ou incomplets
When la page sommeil soleil est ouverte
Then elle doit rester chargeable
And elle doit signaler clairement qu'il manque des donnees pour calculer le reveil et le coucher cible

### Requirement: Bedtime Reminder And Blackout Mode
Le systeme doit piloter un mode repos tablette base sur le plan sommeil soleil avec rappel vocal avant coucher et ecran noir au moment du coucher.

#### Scenario: Pre-bedtime voice reminder
Given un plan coucher / soleil exploitable est disponible
When l'heure de rappel avant coucher est atteinte
Then la tablette doit annoncer vocalement que le coucher approche
And le message doit rappeler comment faire baisser la temperature de la chambre au maximum avec les donnees actuellement disponibles

#### Scenario: Bedtime blackout until touch
Given la fenetre de coucher est active
When le mode nuit est autorise par les reglages locaux
Then l'interface doit passer en ecran noir
And elle ne doit se reveiller qu'au contact avant de pouvoir repartir en veille noire

### Requirement: Future Sunrise Automation Planning
Le systeme doit reserver un emplacement fonctionnel et documentaire pour une future automatisation des volets au lever du soleil.

#### Scenario: Planned sunrise shutter automation
Given la page sommeil soleil est affichee
When l'automatisation des volets n'est pas encore branchee
Then l'interface doit presenter un etat futur explicite pour l'ouverture des volets au lever du soleil

### Requirement: Future Sleep Temperature Monitoring
Le systeme doit reserver un emplacement fonctionnel et documentaire pour une future visualisation de la temperature de la chambre en lien avec la qualite du sommeil.

#### Scenario: Planned bedroom temperature rendering
Given aucune source temperature n'est encore configuree
When la page sommeil soleil est affichee
Then l'interface doit indiquer qu'un rendu temperature est prevu
And elle doit expliciter que cette mesure servira a expliquer un mauvais sommeil quand la chambre est trop chaude

### Requirement: Local Tablet Settings Panel
Le systeme doit exposer une zone de parametres locale pour ajuster les details d affichage, de voix, de rappel coucher et de mode nuit directement depuis la tablette.

#### Scenario: Adjusting assistant voice and display
Given l utilisateur ouvre le dashboard principal sur la tablette
When il modifie les parametres de lecture vocale, de vitesse de voix, de pause ou de mode lisible
Then les reglages doivent etre appliques immediatement dans l interface
And ils doivent etre conserves localement pour les ouvertures suivantes

#### Scenario: Adjusting bedtime reminder and blackout
Given un plan coucher / soleil est disponible
When l utilisateur change l avance du rappel vocal, active ou desactive le rappel, ou change la veille noire
Then le hub web doit recalculer le comportement de nuit avec ces nouveaux reglages
And la tablette doit respecter ces choix sans reconfiguration manuelle du serveur

#### Scenario: Previewing rest states
Given l utilisateur veut verifier le rendu des modes repos
When il utilise les boutons de previsualisation depuis les parametres
Then il doit pouvoir forcer l ecran de veille normal ou le mode nuit noir sans attendre l horaire automatique
And un contact ecran doit permettre de revenir au dashboard

### Requirement: Life Goal Display
Le systeme doit proposer une zone locale compacte pour afficher un cap principal et une feuille de route multi-objectifs directement sur le dashboard tablette.

#### Scenario: Defining a life goal locally
Given l utilisateur ouvre le dashboard principal
When il renseigne un objectif, un horizon, des dates optionnelles et des jalons
Then le dashboard doit afficher ce cap dans une carte dediee compacte
And l edition detaillee doit rester disponible dans un panneau local replie

#### Scenario: Preserving the life goal on the tablet
Given un objectif de vie a deja ete renseigne
When la page est rechargee plus tard sur la meme tablette
Then l objectif et sa duree doivent etre relus depuis le stockage local
And l utilisateur doit pouvoir les modifier ou les effacer sans changer la configuration serveur

#### Scenario: Displaying a multi-year roadmap
Given l utilisateur veut afficher plusieurs caps de vie sur differents horizons
When il renseigne plusieurs jalons avec un titre, un horizon et une note
Then le dashboard doit afficher une feuille de route multi-objectifs lisible
And il doit permettre de melanger des jalons sportifs, professionnels, voyages et style de vie dans la meme vue
