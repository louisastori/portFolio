# SmartLife Proxy (Tuya Cloud)

Node/Express proxy to control SmartLife devices from the tablet app without exposing Tuya secrets in the mobile client.

## Features

- `GET /health`
- `GET /lights`
- `POST /lights/:id/toggle` body `{ "on": true|false }`
- `POST /lights/:id/brightness` body `{ "brightness": 0..100 }`
- Tuya request signing (`HMAC-SHA256`)
- Bearer auth with `PROXY_TOKEN`
- Allow-list of device ids (`TUYA_DEVICE_IDS`)
- Lightweight cache for `GET /lights`

## Quick Start

```bash
cd smartlife-proxy
npm install
cp .env.example .env
npm run start
```

## Docker

```bash
docker build -t smartlife-proxy .
docker run --rm -p 8080:8080 --env-file .env smartlife-proxy
```

## Environment

```env
PORT=8080
PROXY_TOKEN=replace_me

TUYA_CLIENT_ID=
TUYA_CLIENT_SECRET=
TUYA_REGION=eu
TUYA_API_HOST=
TUYA_DEVICE_IDS=device_id_1,device_id_2
TUYA_DEVICE_NAMES={"device_id_1":"Salon","device_id_2":"Desk"}

SMARTLIFE_SWITCH_CODE=switch_led
SMARTLIFE_BRIGHTNESS_CODE=bright_value_v2
SMARTLIFE_BRIGHTNESS_MIN=10
SMARTLIFE_BRIGHTNESS_MAX=1000
```

Notes:
- `TUYA_API_HOST` is optional. If empty, host is inferred from `TUYA_REGION`.
- `TUYA_DEVICE_IDS` is mandatory and works as an allow-list.
- `PROXY_TOKEN` must match `EXPO_PUBLIC_SMARTLIFE_PROXY_TOKEN` in the tablet app.

## API Usage

```bash
curl http://localhost:8080/health
```

```bash
curl -H "Authorization: Bearer replace_me" \
  http://localhost:8080/lights
```

```bash
curl -X POST \
  -H "Authorization: Bearer replace_me" \
  -H "Content-Type: application/json" \
  -d "{\"on\":true}" \
  http://localhost:8080/lights/<device_id>/toggle
```

```bash
curl -X POST \
  -H "Authorization: Bearer replace_me" \
  -H "Content-Type: application/json" \
  -d "{\"brightness\":65}" \
  http://localhost:8080/lights/<device_id>/brightness
```

## Deploy

Any Node host works (Railway, Render, Fly.io, VPS).

Required runtime vars:
- `PROXY_TOKEN`
- `TUYA_CLIENT_ID`
- `TUYA_CLIENT_SECRET`
- `TUYA_DEVICE_IDS`

Expose only HTTPS URL and keep `PROXY_TOKEN` secret.

## Deploy In 5 Minutes

### Render

1. Push this folder to GitHub.
2. In Render, create a new `Web Service` from the repo.
3. Keep root on this folder and deploy using `render.yaml`.
4. Fill secret env vars in Render:
   - `TUYA_CLIENT_ID`
   - `TUYA_CLIENT_SECRET`
   - `TUYA_DEVICE_IDS`
   - optional `TUYA_API_HOST`, `TUYA_DEVICE_NAMES`
5. Copy the generated `PROXY_TOKEN` value.
6. In tablet app `.env`, set:
   - `EXPO_PUBLIC_SMARTLIFE_PROXY_BASE_URL=https://<your-render-url>`
   - `EXPO_PUBLIC_SMARTLIFE_PROXY_TOKEN=<PROXY_TOKEN>`

### Railway

1. Push this folder to GitHub.
2. Create a Railway project and link the repo service.
3. Railway auto-detects Node and uses `railway.toml`.
4. Add env vars:
   - `PROXY_TOKEN`
   - `TUYA_CLIENT_ID`
   - `TUYA_CLIENT_SECRET`
   - `TUYA_DEVICE_IDS`
   - optional `TUYA_REGION`, `TUYA_API_HOST`, `TUYA_DEVICE_NAMES`
5. Deploy and verify:
   - `GET /health` (public)
   - `GET /lights` with `Authorization: Bearer <PROXY_TOKEN>`
