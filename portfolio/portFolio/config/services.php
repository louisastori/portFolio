<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'fitness_api' => [
        'base_url' => env('FITNESS_API_BASE_URL'),
        'token' => env('FITNESS_API_TOKEN'),
        'timeout' => env('FITNESS_API_TIMEOUT', 10),
        'limit' => env('FITNESS_API_LIMIT', 8),
    ],

    'nutrition_api' => [
        'base_url' => env('SUPABASE_URL'),
        'api_key' => env('SUPABASE_ANON_KEY'),
        'table' => env('SUPABASE_MEALS_TABLE', 'meals'),
        'timeout' => env('NUTRITION_API_TIMEOUT', 10),
        'limit' => env('NUTRITION_API_LIMIT', 20),
    ],

    'garmin_crawler' => [
        'exports_path' => env(
            'GARMIN_CRAWLER_EXPORTS_PATH',
            dirname(base_path(), 2) . DIRECTORY_SEPARATOR . 'garmin crawler' . DIRECTORY_SEPARATOR . 'exports'
        ),
    ],

    'ollama' => [
        'enabled' => env('OLLAMA_ENABLED', true),
        'base_url' => env('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
        'model' => env('OLLAMA_MODEL', 'gemma3:4b'),
        'timeout' => env('OLLAMA_TIMEOUT', 90),
        'cache_ttl' => env('OLLAMA_CACHE_TTL', 1800),
    ],

];
