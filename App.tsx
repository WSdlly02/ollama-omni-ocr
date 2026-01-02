import React, { useState, useEffect } from 'react';
import { Sparkles, Settings } from 'lucide-react';
import { OcrStyle } from './types';
import ImageUploader from './components/ImageUploader';
import StyleSelector from './components/StyleSelector';
import ResultDisplay from './components/ResultDisplay';
import SettingsModal from './components/SettingsModal';
import { performOCR } from './ocrService';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState<OcrStyle>(OcrStyle.TEXT);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('ollama_base_url') || `${window.location.origin}/ollama/v1`);
  const [model, setModel] = useState(() => localStorage.getItem('ollama_model') || 'qwen3-vl:8b');

  // Persist settings
  useEffect(() => {
    localStorage.setItem('ollama_base_url', baseUrl);
    localStorage.setItem('ollama_model', model);
  }, [baseUrl, model]);

  const handleRecognize = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const ocrText = await performOCR(file, style, baseUrl, model, (text) => {
        setResult(text);
      });
      setResult(ocrText);
    } catch (err: any) {
      setError(err.message || "Failed to process image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
    // Reset result when new file is uploaded to avoid confusion
    if (newFile) {
        setResult(null);
        setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                <line x1="7" y1="12" x2="17" y2="12"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Ollama Omni-OCR
            </h1>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Input & Controls */}
          <div className="w-full lg:w-5/12 space-y-8">
            
            {/* 1. Upload */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">1</span>
                <h2 className="text-lg font-bold text-slate-800">Source Image</h2>
              </div>
              <ImageUploader 
                file={file} 
                setFile={handleFileChange} 
                disabled={isProcessing}
              />
            </section>

            {/* 2. Options */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">2</span>
                <h2 className="text-lg font-bold text-slate-800">Recognition Style</h2>
              </div>
              <StyleSelector 
                selectedStyle={style} 
                onSelect={setStyle} 
                disabled={isProcessing}
              />
            </section>

            {/* Action Button */}
            <button
              onClick={handleRecognize}
              disabled={!file || isProcessing}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform
                ${!file || isProcessing 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-indigo-500/30'
                }
              `}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Start Recognition
                </>
              )}
            </button>
          </div>

          {/* Right Column: Result */}
          <div className="w-full lg:w-7/12 flex flex-col">
             <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold">3</span>
                <h2 className="text-lg font-bold text-slate-800">Result</h2>
              </div>
            <div className="flex-grow">
              <ResultDisplay 
                result={result} 
                isLoading={isProcessing} 
                error={error} 
                onRetry={handleRecognize}
                selectedStyle={style}
              />
            </div>
          </div>

        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        baseUrl={baseUrl}
        setBaseUrl={setBaseUrl}
        model={model}
        setModel={setModel}
      />
    </div>
  );
};

export default App;
