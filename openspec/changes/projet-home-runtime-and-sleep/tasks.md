# Tasks

- [ ] Verifier l etat reel d `Ollama` cote service, cote modele charge et cote endpoint du hub pour comprendre pourquoi l assistant ne repond plus.
- [ ] Confirmer que la page ou la carte assistant de `projetHome` consomme bien le meme endpoint local que le service `Ollama` attendu.
- [ ] Corriger ou documenter la panne `Ollama` jusqu a retrouver une reponse exploitable depuis l interface tablette.
- [ ] Evaluer si `H2O Flow` peut etre expose au meme endroit fonctionnel qu `Ollama` sans ajouter une deuxieme surface IA confuse.
- [ ] Supprimer `H2O Flow` du hub, de la supervision et de l interface si cette cohabitation n est pas possible ou n apporte pas de valeur claire.
- [ ] Identifier la source de temperature disponible pour la chambre et verifier si une mesure exploitable est deja remontee par `projetHome`.
- [ ] Ajouter un suivi de temperature cible autour de `18 C` pour la chambre tant que l utilisateur est encore actif dans la soiree.
- [ ] Ajouter une cible plus basse autour de `12 C` juste avant le coucher avec un message d aide concret pour ajuster la piece, par exemple en ouvrant la fenetre.
- [ ] Definir comment la tablette detecte l absence d interaction, avec un delai d inactivite configurable.
- [ ] Automatiser une mise en veille ou un ecran repos quand aucune interaction n est detectee, puis un reveil propre au prochain contact.
