# Projet Home Hub

Architecture revue pour une vieille tablette Android:

- le PC fait tourner un serveur local leger
- la tablette ouvre seulement une page web
- tous les acces aux APIs et aux secrets restent cote serveur

## 1) Nouvelle architecture

Le projet sert maintenant:

- une UI web statique tres legere depuis `web/`
- une API locale depuis `server/`
- le proxy `smartlife-proxy/` pour Tuya / SmartLife

Flux:

1. La tablette ouvre `http://<ip-du-pc>:3000`
2. Le serveur local agrege fitness, nutrition et lumieres
3. Le navigateur de la tablette ne voit jamais les tokens ni les URLs sensibles

## 2) Lancement local

Depuis `projetHome`:

```bash
copy .env.example .env
npm run start
```

URL locale:

- Dashboard web: `http://localhost:3000`

Si tu utilises SmartLife, lance aussi le proxy:

```bash
cd smartlife-proxy
npm install
copy .env.example .env
npm run start
```

## 3) Variables d environnement

Le serveur lit `.env` et accepte aussi les anciennes variables `EXPO_PUBLIC_*` en fallback.

Exemple:

```env
PORT=3000
DASHBOARD_REFRESH_INTERVAL_MS=60000

FITNESS_API_BASE_URL=http://127.0.0.1:8787
FITNESS_API_TOKEN=
FITNESS_LIMIT=8

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_MEALS_TABLE=meals
NUTRITION_LIMIT=20

HUE_BRIDGE_IP=
HUE_USERNAME=

SMARTLIFE_PROXY_BASE_URL=http://127.0.0.1:8080
SMARTLIFE_PROXY_TOKEN=

ARAMSMART_BASE_URL=
ARAMSMART_TOKEN=
```

## 4) API exposee par le hub local

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/dashboard?live=1`
- `POST /api/lights/:provider/:id/toggle`
- `POST /api/lights/:provider/:id/brightness`

Le frontend web consomme uniquement ces endpoints locaux.

## 5) Integrations

### Garmin + Strava

Le hub interroge `GET /api/overview` sur `FITNESS_API_BASE_URL`.

### Nutrition

Le hub interroge Supabase sur `GET /rest/v1/<table>` et calcule:

- calories aujourd hui
- calories 7 jours
- nombre d entrees
- moyenne kcal/repas

### Philips Hue

API locale Hue v1:

- `GET http://<bridge_ip>/api/<username>/lights`
- `PUT http://<bridge_ip>/api/<username>/lights/<id>/state`

### SmartLife

Le hub parle au proxy backend fourni dans `smartlife-proxy/`.

Contrat minimal:

- `GET /lights`
- `POST /lights/:id/toggle`
- `POST /lights/:id/brightness`

### AramSMART

Contrat attendu:

- `GET <base_url>/lights`
- `POST <base_url>/lights/:id/toggle`
- `POST <base_url>/lights/:id/brightness`

## 6) Commandes utiles

```bash
npm run start
npm run dev
npm run legacy:web
npm run typecheck
```

Les commandes Expo sont conservees en mode legacy si tu veux encore ouvrir l ancienne app.

## 7) Docker Compose

Depuis `projetHome`:

```bash
copy .env.docker.example .env.docker
copy smartlife-proxy/.env.example smartlife-proxy/.env
docker compose up --build
```

URLs locales:

- Hub local: `http://localhost:3000`
- SmartLife proxy: `http://localhost:8080`

Le `docker-compose.yml` surcharge automatiquement `SMARTLIFE_PROXY_BASE_URL` pour relier le hub au conteneur `smartlife-proxy`.

Si Docker Desktop affiche une erreur WSL/VirtualMachinePlatform, execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-enable-docker-prereqs.ps1
```

Puis redemarre Windows et relance `docker compose up --build`.
