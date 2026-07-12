# Ollama Omni-OCR

A local-first OCR web application powered by an Ollama vision model. Images stay on the configured Ollama path: the browser converts the input to a data URL and streams an OpenAI-compatible request to Ollama.

## Features

- Upload, paste, drag-and-drop, camera capture, and handwriting input.
- Plain text, Markdown, LaTeX, table, JSON, and visual-description output.
- Strict transcription, enhanced cleanup, and transcription-plus-solver modes.
- Streaming output with Markdown, math, JSON, and code preview.
- Previous results are preserved when input or settings change and clearly marked as stale.
- Light, dark, and system themes.
- Configurable Ollama Base URL and model, with an in-app connection/model test.

## How it works

```text
Browser input
  -> image data URL
  -> OpenAI-compatible /v1 request
  -> Ollama vision model
  -> streamed result preview
```

There is no application backend or database. In development and in the supplied container, `/ollama/*` is a same-origin reverse proxy to Ollama.

## Requirements

- Node.js 24 is recommended. The project tests use Node's built-in TypeScript stripping.
- Ollama installed and running.
- A vision-capable model, by default:

```bash
ollama pull qwen3-vl:8b-instruct
```

## Local development

Install dependencies and start Vite:

```bash
npm ci
npm run dev
```

Open `https://localhost:3000`. Vite uses a local self-signed certificate because camera and clipboard features require a secure browser context. You may need to accept the certificate warning once.

The default Base URL is:

```text
https://localhost:3000/ollama/v1
```

Vite proxies that path to `http://localhost:11434/v1`, so the default local setup does **not** require permissive Ollama CORS settings.

Use Settings → Test Connection to verify both the endpoint and the configured model before running OCR.

## Direct or remote Ollama access

Prefer the same-origin `/ollama/v1` proxy. If you deliberately configure the browser to call Ollama directly on another origin, Ollama must listen on a reachable interface and allow the exact web-app origin.

For example, adapt the host and origin to your network:

```bash
OLLAMA_HOST="0.0.0.0:11434" \
OLLAMA_ORIGINS="https://ocr.example.local" \
ollama serve
```

Avoid `OLLAMA_ORIGINS="*"` on shared or untrusted networks. Ollama does not provide application-level authorization for this project, so network and reverse-proxy access controls remain the operator's responsibility.

## Docker deployment

Build the image:

```bash
docker build -t ollama-omni-ocr .
```

Run it with access to Ollama on the host:

```bash
docker run -d \
  -p 443:443 \
  --add-host=host.docker.internal:host-gateway \
  -e OLLAMA_HOST=http://host.docker.internal:11434 \
  --name omni-ocr \
  ollama-omni-ocr
```

Then open `https://<host-or-ip>`. Caddy uses its internal CA, so clients must accept or trust the generated certificate.

For Podman:

```bash
podman run -d \
  -p 9443:443 \
  --add-host=host.docker.internal:host-gateway \
  -e OLLAMA_HOST=http://host.docker.internal:11434 \
  --name omni-ocr \
  localhost/ollama-omni-ocr
```

The container's `/ollama` endpoint is same-origin only from a browser perspective; the supplied Caddy configuration no longer emits wildcard CORS headers. It is not an authentication boundary. Restrict port exposure or add authentication in an upstream reverse proxy when deploying outside a trusted network.

## Development checks

```bash
npm run typecheck
npm test
npm run build
```

The GitHub Actions workflow runs `npm ci`, type checking, unit tests, and the production build before publishing the multi-architecture container image.

## Project structure

```text
App.tsx                         application/session state
ocrService.ts                  Ollama requests and connection testing
ollamaErrors.ts                actionable Ollama error classification
constants.ts                   OCR modes, styles, and prompts
components/InputPanel.tsx      upload/camera/handwriting routing
components/ResultDisplay.tsx   streamed raw and rendered output
components/SettingsModal.tsx   validated settings draft and connection test
components/handwriting/        stroke model, history, and toolbar
tests/                          pure-logic regression tests
Caddyfile                       HTTPS static serving and Ollama proxy
```

## Troubleshooting

- **Cannot reach Ollama**: confirm `ollama serve` is running and test the Base URL from Settings.
- **Endpoint not found**: the OpenAI-compatible Base URL normally ends in `/v1`.
- **Model is not installed**: run the `ollama pull <model>` command shown by the app.
- **Request timed out**: the model may still be loading or the machine may be under memory pressure.
- **Camera unavailable**: use HTTPS, grant browser permission, and confirm the device has a camera.
- **Old result warning**: the input, mode, model, or endpoint changed after that result was produced. The old output is intentionally retained until a new recognition succeeds.
