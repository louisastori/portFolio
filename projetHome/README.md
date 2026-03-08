# Projet Home Tablet

Application tablette (Expo React Native) qui centralise:

- Donnees sport Garmin + Strava (via ton API bridge)
- Donnees nutrition (Supabase table `meals`)
- Pilotage lumieres SmartLife, Philips Hue, AramSMART

## 1) Installation

```bash
npm install
cp .env.example .env
npm run start
```

## 2) Variables d environnement

Renseigne `.env`:

```env
EXPO_PUBLIC_FITNESS_API_BASE_URL=http://127.0.0.1:8787
EXPO_PUBLIC_FITNESS_API_TOKEN=
EXPO_PUBLIC_FITNESS_LIMIT=8

EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_MEALS_TABLE=meals
EXPO_PUBLIC_NUTRITION_LIMIT=20

EXPO_PUBLIC_HUE_BRIDGE_IP=
EXPO_PUBLIC_HUE_USERNAME=

EXPO_PUBLIC_SMARTLIFE_PROXY_BASE_URL=
EXPO_PUBLIC_SMARTLIFE_PROXY_TOKEN=

EXPO_PUBLIC_ARAMSMART_BASE_URL=
EXPO_PUBLIC_ARAMSMART_TOKEN=
```

## 3) Integrations

### Garmin + Strava

L app interroge `GET /api/overview` sur `EXPO_PUBLIC_FITNESS_API_BASE_URL`.

### Nutrition

L app interroge `GET /rest/v1/<table>` sur Supabase et calcule:

- Calories aujourd hui
- Calories 7 jours
- Nombre d entrees
- Moyenne kcal/repas

### Philips Hue

API locale Hue v1:

- `GET http://<bridge_ip>/api/<username>/lights`
- `PUT http://<bridge_ip>/api/<username>/lights/<id>/state`

### SmartLife

Cette app utilise un proxy backend pour SmartLife (recommande pour ne pas exposer les secrets cloud).

Proxy fourni dans ce repo:

- dossier: `smartlife-proxy`
- lancement: `cd smartlife-proxy && npm install && cp .env.example .env && npm run start`

Contrat proxy minimal:

- `GET /lights` -> `[{ id, name, isOn, brightness }]`
- `POST /lights/:id/toggle` body `{ on: boolean }`
- `POST /lights/:id/brightness` body `{ brightness: 0..100 }`

### AramSMART

Contrat attendu:

- `GET <base_url>/lights`
- `POST <base_url>/lights/:id/toggle`
- `POST <base_url>/lights/:id/brightness`

## 4) Commandes utiles

```bash
npm run start
npm run android
npm run web
npm run typecheck
```

## 5) Docker Compose (app + SmartLife proxy)

Depuis `projetHome`:

```bash
cp .env.docker.example .env.docker
cp smartlife-proxy/.env.example smartlife-proxy/.env
docker compose up --build
```

URLs locales:

- App web Expo: `http://localhost:19006`
- SmartLife proxy: `http://localhost:8080`

Pense a renseigner dans `smartlife-proxy/.env`:

- `PROXY_TOKEN`
- `TUYA_CLIENT_ID`
- `TUYA_CLIENT_SECRET`
- `TUYA_DEVICE_IDS`

Si Docker Desktop affiche une erreur WSL/VirtualMachinePlatform, execute:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run-enable-docker-prereqs.ps1
```

Puis redemarre Windows et relance `docker compose up --build`.
