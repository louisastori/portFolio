<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Louis Astori - CV</title>
    <style>
        :root {
            --bg: #f5f1ea;
            --panel: #ffffff;
            --ink: #1d2a24;
            --muted: #52645b;
            --line: #d9e1da;
            --accent: #c8551b;
            --accent-dark: #8f3d13;
            --shadow: 0 18px 40px rgba(29, 42, 36, 0.08);
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: var(--ink);
            background:
                radial-gradient(circle at top left, rgba(200, 85, 27, 0.12), transparent 30%),
                radial-gradient(circle at top right, rgba(41, 111, 84, 0.12), transparent 32%),
                var(--bg);
        }

        .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 96px 20px 40px;
        }

        .panel {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 24px;
            box-shadow: var(--shadow);
            overflow: hidden;
        }

        .hero {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: center;
            padding: 28px;
            border-bottom: 1px solid var(--line);
            background: linear-gradient(135deg, rgba(200, 85, 27, 0.08), rgba(41, 111, 84, 0.08));
        }

        .eyebrow {
            margin: 0 0 8px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 0.78rem;
            font-weight: 700;
            color: var(--accent);
        }

        h1 {
            margin: 0;
            font-size: clamp(1.8rem, 4vw, 2.6rem);
            line-height: 1.05;
        }

        .intro {
            margin: 12px 0 0;
            max-width: 60ch;
            color: var(--muted);
        }

        .actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 16px;
            border-radius: 999px;
            text-decoration: none;
            font-weight: 700;
            transition: transform 120ms ease, opacity 120ms ease, background 120ms ease;
        }

        .btn:hover {
            transform: translateY(-1px);
        }

        .btn-primary {
            background: var(--accent);
            color: #fff;
        }

        .btn-primary:hover {
            background: var(--accent-dark);
        }

        .btn-secondary {
            border: 1px solid var(--line);
            color: var(--ink);
            background: #fff;
        }

        .viewer-shell {
            padding: 20px;
        }

        .viewer {
            width: 100%;
            height: min(78vh, 1100px);
            border: 1px solid var(--line);
            border-radius: 18px;
            background: #f3f5f4;
        }

        .helper {
            margin: 14px 4px 0;
            color: var(--muted);
            font-size: 0.92rem;
        }

        @media (max-width: 800px) {
            .hero {
                flex-direction: column;
                align-items: flex-start;
            }

            .viewer {
                height: 70vh;
            }
        }
    </style>
</head>
<body>
    @php($cvUrl = asset('documents/cv-louis-astori-alternance.pdf'))

    @include('partials.navbar')

    <main class="container">
        <section class="panel" data-cv-url="{{ $cvUrl }}">
            <div class="hero">
                <div>
                    <p class="eyebrow">CV</p>
                    <h1>CV alternance Louis Astori</h1>
                    <p class="intro">
                        Version PDF accessible directement depuis le portfolio, avec ouverture dans le navigateur
                        et telechargement en un clic.
                    </p>
                </div>
                <div class="actions">
                    <button type="button" class="btn btn-primary" data-action="open-pdf">Ouvrir le PDF</button>
                    <button type="button" class="btn btn-secondary" data-action="download-pdf">Telecharger</button>
                </div>
            </div>

            <div class="viewer-shell">
                <iframe
                    class="viewer"
                    data-role="pdf-viewer"
                    title="CV Louis Astori"
                ></iframe>
                <p class="helper">
                    Si l'aperçu PDF ne s'affiche pas sur ton appareil, utilise le bouton "Ouvrir le PDF".
                </p>
            </div>
        </section>
    </main>

    <script>
        (() => {
            const panel = document.querySelector('[data-cv-url]');
            const viewer = document.querySelector('[data-role="pdf-viewer"]');
            const openButton = document.querySelector('[data-action="open-pdf"]');
            const downloadButton = document.querySelector('[data-action="download-pdf"]');

            if (!panel) {
                return;
            }

            const cvUrl = panel.dataset.cvUrl;

            if (viewer && cvUrl) {
                viewer.src = cvUrl;
            }

            openButton?.addEventListener('click', () => {
                if (!cvUrl) {
                    return;
                }

                window.open(cvUrl, '_blank', 'noopener');
            });

            downloadButton?.addEventListener('click', () => {
                if (!cvUrl) {
                    return;
                }

                const link = document.createElement('a');
                link.href = cvUrl;
                link.download = 'cv-louis-astori-alternance.pdf';
                document.body.appendChild(link);
                link.click();
                link.remove();
            });
        })();
    </script>

</body>
</html>
