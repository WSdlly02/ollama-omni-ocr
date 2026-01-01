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
4. Click the **Settings** icon (top right) to configure your Ollama URL (e.g., `http://<your-server-ip>:11434`) and Model name if needed.
