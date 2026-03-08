<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Louis Astori - CV</title>
    <style>
        :root {
            --bg: #f2ede6;
            --panel: #fffdf9;
            --ink: #1f2925;
            --muted: #5b6d65;
            --line: #d7ddd6;
            --accent: #bf5b2c;
            --accent-dark: #94441f;
            --shadow: 0 18px 42px rgba(20, 29, 25, 0.08);
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            font-family: Arial, sans-serif;
            line-height: 1.5;
            color: var(--ink);
            background:
                radial-gradient(circle at top left, rgba(191, 91, 44, 0.12), transparent 28%),
                radial-gradient(circle at top right, rgba(49, 111, 86, 0.1), transparent 30%),
                var(--bg);
        }

        .page-shell {
            max-width: 1240px;
            margin: 0 auto;
            padding: 96px 20px 40px;
        }

        .layout {
            display: grid;
            grid-template-columns: 240px minmax(0, 1fr);
            gap: 22px;
            align-items: start;
        }

        .panel {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 24px;
            box-shadow: var(--shadow);
        }

        .summary {
            padding: 24px;
            position: sticky;
            top: 92px;
        }

        .action-list {
            display: grid;
            gap: 10px;
        }

        .btn {
            width: 100%;
            border: 0;
            border-radius: 14px;
            padding: 13px 16px;
            font-size: 0.96rem;
            font-weight: 700;
            cursor: pointer;
            transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
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
            background: #fff;
            color: var(--ink);
            border: 1px solid var(--line);
        }

        .preview-shell {
            padding: 18px;
        }

        .preview-topbar {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: center;
            margin-bottom: 18px;
            padding: 4px 2px 0;
        }

        .preview-title {
            margin: 0;
            font-size: 1rem;
            font-weight: 700;
        }

        .preview-subtitle {
            margin: 4px 0 0;
            color: var(--muted);
            font-size: 0.92rem;
        }

        .chip {
            display: inline-flex;
            align-items: center;
            border: 1px solid var(--line);
            border-radius: 999px;
            padding: 7px 11px;
            background: #fff;
            font-size: 0.82rem;
            font-weight: 700;
            color: var(--muted);
            white-space: nowrap;
        }

        .document-frame {
            padding: 28px;
            border: 1px solid var(--line);
            border-radius: 20px;
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(244, 240, 234, 0.88)),
                repeating-linear-gradient(
                    -45deg,
                    rgba(31, 41, 37, 0.02),
                    rgba(31, 41, 37, 0.02) 10px,
                    rgba(31, 41, 37, 0.04) 10px,
                    rgba(31, 41, 37, 0.04) 20px
                );
        }

        .document-button {
            display: block;
            width: 100%;
            padding: 0;
            border: 0;
            background: transparent;
            cursor: pointer;
        }

        .document-sheet {
            width: min(100%, 880px);
            margin: 0 auto;
            background: #fff;
            border-radius: 8px;
            box-shadow:
                0 18px 35px rgba(0, 0, 0, 0.12),
                0 0 0 1px rgba(18, 26, 22, 0.08);
            overflow: hidden;
            transition: transform 140ms ease, box-shadow 140ms ease;
        }

        .document-button:hover .document-sheet {
            transform: translateY(-2px);
            box-shadow:
                0 22px 42px rgba(0, 0, 0, 0.14),
                0 0 0 1px rgba(18, 26, 22, 0.08);
        }

        .document-sheet img {
            display: block;
            width: 100%;
            height: auto;
        }

        .document-caption {
            margin: 14px 0 0;
            text-align: center;
            color: var(--muted);
            font-size: 0.92rem;
        }

        @media (max-width: 980px) {
            .layout {
                grid-template-columns: 1fr;
            }

            .summary {
                position: static;
            }
        }

        @media (max-width: 640px) {
            .page-shell {
                padding-top: 88px;
            }

            .summary,
            .preview-shell {
                padding: 18px;
            }

            .document-frame {
                padding: 14px;
            }
        }
    </style>
</head>
<body>
    @php($cvUrl = asset('documents/cv-louis-astori-alternance.pdf'))
    @php($cvPreview = asset('img/cv.png'))

    @include('partials.navbar')

    <main class="page-shell" data-cv-url="{{ $cvUrl }}">
        <div class="layout">
            <aside class="panel summary">
                <div class="action-list">
                    <button type="button" class="btn btn-primary" data-action="open-pdf">Ouvrir le CV</button>
                    <button type="button" class="btn btn-secondary" data-action="download-pdf">Telecharger le PDF</button>
                </div>
            </aside>

            <section class="panel preview-shell">
                <div class="preview-topbar">
                    <div>
                        <p class="preview-title">Apercu du CV</p>
                        <p class="preview-subtitle">Presentation visuelle du document avant ouverture.</p>
                    </div>
                    <span class="chip">Document principal</span>
                </div>

                <div class="document-frame">
                    <button type="button" class="document-button" data-action="open-pdf" aria-label="Ouvrir le CV en PDF">
                        <div class="document-sheet">
                            <img src="{{ $cvPreview }}" alt="Apercu du CV de Louis Astori">
                        </div>
                    </button>
                    <p class="document-caption">Clique sur l'aperçu pour ouvrir le PDF.</p>
                </div>
            </section>
        </div>
    </main>

    <script>
        (() => {
            const shell = document.querySelector('[data-cv-url]');
            const openButtons = document.querySelectorAll('[data-action="open-pdf"]');
            const downloadButton = document.querySelector('[data-action="download-pdf"]');

            if (!shell) {
                return;
            }

            const cvUrl = shell.dataset.cvUrl;

            openButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    if (!cvUrl) {
                        return;
                    }

                    window.open(cvUrl, '_blank', 'noopener');
                });
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
