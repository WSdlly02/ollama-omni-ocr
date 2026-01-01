# Ollama Omni-OCR

This contains everything you need to run your app locally using Ollama.

## Run Locally

**Prerequisites:**
1. Node.js
2. [Ollama](https://ollama.com/) installed and running.
3. Pull the model: `ollama pull qwen3-vl:8b`

**Important: Configure Ollama for External Access (CORS)**

By default, Ollama only allows requests from localhost. To use this app (especially if accessing from a different device), you need to configure Ollama to allow Cross-Origin requests.

**Linux / macOS:**
```bash
OLLAMA_ORIGINS="*" OLLAMA_HOST="0.0.0.0" ollama serve
```

**Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="*"; $env:OLLAMA_HOST="0.0.0.0"; ollama serve
```

**Steps:**

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
3. Open the app in your browser.
4. The app is configured to use `/ollama` as the base URL, which is proxied to `http://localhost:11434` during development.

## Docker Deployment

You can also run the application using Docker. This setup includes Caddy as a web server with automatic HTTPS support.

### Build and Run

```bash
# Build the image
docker build -t ollama-omni-ocr .

# Run the container
# This will listen on all interfaces, allowing LAN access via IP or hostname
docker run -d \
  -p 80:80 \
  -p 443:443 \
  --add-host=host.docker.internal:host-gateway \
  -e OLLAMA_HOST=http://host.docker.internal:11434 \
  --name omni-ocr \
  ollama-omni-ocr
```

**Podman Users:**
```bash
podman run -d \
  -p 9080:80 \
  -p 9443:443 \
  --add-host=host.docker.internal:host-gateway \
  -e OLLAMA_HOST=http://host.docker.internal:11434 \
  --name omni-ocr \
  localhost/ollama-omni-ocr
```