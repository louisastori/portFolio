<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400"></a></p>

<p align="center">
<a href="https://travis-ci.org/laravel/framework"><img src="https://travis-ci.org/laravel/framework.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## Performance Lab (Garmin + Strava + Nutrition)

This project now includes a live portfolio dashboard at:

- `/performance` (web page)
- `/api/performance/live` (JSON snapshot endpoint)

### Required environment variables

```env
FITNESS_API_BASE_URL=https://<your-worker-or-function-url>
FITNESS_API_TOKEN=
FITNESS_API_TIMEOUT=10
FITNESS_API_LIMIT=8

SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_MEALS_TABLE=meals
NUTRITION_API_TIMEOUT=10
NUTRITION_API_LIMIT=20
```

### What is displayed

- Fitness metrics and activities from your Garmin/Strava bridge (`/api/overview`).
- Nutrition metrics and recent meals from Supabase table `meals`.
- Connection status and live warnings for missing/failed integrations.
- Raw JSON snapshot to prove API integration quality during demos.

## GitHub Pages + Backend Hosting

Use this split architecture:

- Frontend static portfolio on GitHub Pages (`dist/`).
- Backend/API on Render or Railway (Laravel API or Node proxy).

Workflows added in this repository:

- `.github/workflows/deploy-pages.yml`: deploys `dist/` to GitHub Pages.
- `.github/workflows/refresh-performance-json.yml`: fetches backend snapshot, updates `dist/data/performance-live.json`, and deploys GitHub Pages on a schedule.

### GitHub setup

1. In GitHub repository settings, enable Pages:
   - Source: GitHub Actions.
2. Add repository secrets:
   - `BACKEND_SNAPSHOT_URL`: full backend endpoint (example: `https://your-api.onrender.com/api/performance/live`).
   - `SNAPSHOT_AUTH_BEARER` (optional): bearer token if your backend endpoint is protected.
3. Trigger workflow manually once:
   - Actions -> `Refresh Performance JSON` -> `Run workflow`.

### Schedule (12h vs 24h)

By default, refresh runs every 12 hours:

```yaml
- cron: "0 */12 * * *"
```

If you prefer once every 24 hours, edit `.github/workflows/refresh-performance-json.yml` and replace with:

```yaml
- cron: "0 3 * * *"
```

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains over 1500 video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the Laravel [Patreon page](https://patreon.com/taylorotwell).

### Premium Partners

- **[Vehikl](https://vehikl.com/)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Cubet Techno Labs](https://cubettech.com)**
- **[Cyber-Duck](https://cyber-duck.co.uk)**
- **[Many](https://www.many.co.uk)**
- **[Webdock, Fast VPS Hosting](https://www.webdock.io/en)**
- **[DevSquad](https://devsquad.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel/)**
- **[OP.GG](https://op.gg)**
- **[WebReinvent](https://webreinvent.com/?utm_source=laravel&utm_medium=github&utm_campaign=patreon-sponsors)**
- **[Lendio](https://lendio.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
