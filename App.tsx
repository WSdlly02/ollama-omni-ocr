import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Settings, Square } from 'lucide-react';
import { OcrStyle, OcrMode } from './types';
import InputPanel, { type InputMode } from './components/InputPanel';
import StyleSelector from './components/StyleSelector';
import ModeSelector from './components/ModeSelector';
import ResultDisplay from './components/ResultDisplay';
import SettingsModal from './components/SettingsModal';
import { performOCR } from './ocrService';
import { isResultContextStale, type ResultContext } from './resultFreshness';
import { parseStoredChoice } from './preferences';
import { validateOllamaSettings, type OllamaSettings, type Theme } from './settings';

const OCR_STYLES = Object.values(OcrStyle);
const OCR_MODES = Object.values(OcrMode);
const INPUT_MODES: InputMode[] = ['upload', 'camera', 'handwriting'];
const THEMES: Theme[] = ['system', 'light', 'dark'];

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [resultContext, setResultContext] = useState<ResultContext | null>(null);
  const [sourceRevision, setSourceRevision] = useState(0);
  const [isResultIncomplete, setIsResultIncomplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreservingPreviousResult, setIsPreservingPreviousResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem('ollama_base_url') || `${window.location.origin}/ollama/v1`);
  const [model, setModel] = useState(() => localStorage.getItem('ollama_model') || 'qwen3-vl:8b-instruct');
  const [style, setStyle] = useState<OcrStyle>(() =>
    parseStoredChoice(localStorage.getItem('ocr_style'), OCR_STYLES, OcrStyle.TEXT));
  const [mode, setMode] = useState<OcrMode>(() =>
    parseStoredChoice(localStorage.getItem('ocr_mode'), OCR_MODES, OcrMode.STRICT));
  const [inputMode, setInputMode] = useState<InputMode>(() =>
    parseStoredChoice(localStorage.getItem('input_mode'), INPUT_MODES, 'upload'));
  const [theme, setTheme] = useState<Theme>(() =>
    parseStoredChoice(localStorage.getItem('theme'), THEMES, 'system'));
  const [systemPreferDark, setSystemPreferDark] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  // Persist settings
  useEffect(() => {
    localStorage.setItem('ollama_base_url', baseUrl);
    localStorage.setItem('ollama_model', model);
    localStorage.setItem('ocr_style', style);
    localStorage.setItem('ocr_mode', mode);
    localStorage.setItem('input_mode', inputMode);
    localStorage.setItem('theme', theme);
  }, [baseUrl, model, style, mode, inputMode, theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPreferDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Derived dark mode state
  const isDarkMode = theme === 'dark' || (theme === 'system' && systemPreferDark);

  // Apply theme class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const handleRecognize = async () => {
    if (!file) return;

    const validatedSettings = validateOllamaSettings({ baseUrl, model, theme });
    if (!validatedSettings.value) {
      setError("OCR settings are invalid. Review the highlighted fields and save them before retrying.");
      setIsSettingsOpen(true);
      return;
    }
    const effectiveBaseUrl = validatedSettings.value.baseUrl;
    const effectiveModel = validatedSettings.value.model;
    if (effectiveBaseUrl !== baseUrl) setBaseUrl(effectiveBaseUrl);
    if (effectiveModel !== model) setModel(effectiveModel);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    abortControllerRef.current = controller;
    const requestContext: ResultContext = {
      sourceRevision,
      style,
      mode,
      baseUrl: effectiveBaseUrl,
      model: effectiveModel,
    };

    setIsProcessing(true);
    setIsPreservingPreviousResult(result !== null);
    setError(null);

    try {
      const ocrText = await performOCR(file, effectiveBaseUrl, effectiveModel, style, mode, (text) => {
        if (requestIdRef.current !== requestId || text.length === 0) return;
        setResult(text);
        setResultContext(requestContext);
        setIsResultIncomplete(true);
        setIsPreservingPreviousResult(false);
      }, controller.signal);

      if (requestIdRef.current !== requestId) return;
      if (ocrText.length === 0) {
        throw new Error("The model returned an empty result.");
      }
      setResult(ocrText);
      setResultContext(requestContext);
      setIsResultIncomplete(false);
    } catch (err: unknown) {
      if (requestIdRef.current !== requestId || controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Failed to process image.");
    } finally {
      if (requestIdRef.current === requestId) {
        setIsProcessing(false);
        setIsPreservingPreviousResult(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    requestIdRef.current += 1;
    setIsProcessing(false);
    setIsPreservingPreviousResult(false);
  };

  const handleFileChange = useCallback((newFile: File | null) => {
    setFile(newFile);
    setSourceRevision((revision) => revision + 1);
    setError(null);
    // Deliberately keep the previous result. ResultDisplay marks it as stale
    // until recognition succeeds for this new source/configuration.
  }, []);

  const handleSaveSettings = useCallback((settings: OllamaSettings) => {
    setBaseUrl(settings.baseUrl);
    setModel(settings.model);
    setTheme(settings.theme);
  }, []);

  const isResultStale = result !== null && isResultContextStale(resultContext, {
    hasSource: file !== null,
    sourceRevision,
    style,
    mode,
    baseUrl,
    model,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-200">
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
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ollama Omni-OCR
            </h1>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 rounded-lg transition-all"
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
          <div className="w-full lg:w-5/12 lg:h-[calc(100vh-8rem)] lg:sticky lg:top-24 flex flex-col min-w-0">
            <div className="flex-grow overflow-y-auto pr-2 space-y-8 pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              
              {/* 1. Upload / Handwriting (Managed by InputPanel) */}
              <InputPanel 
                inputMode={inputMode}
                setInputMode={setInputMode}
                file={file}
                setFile={handleFileChange}
                isProcessing={isProcessing}
                isDarkMode={isDarkMode}
              />

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={isProcessing ? handleCancel : handleRecognize}
                  disabled={!file && !isProcessing}
                  className={`
                    w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform
                    ${!file && !isProcessing
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                      : isProcessing
                      ? 'bg-slate-700 text-white hover:bg-slate-800 active:scale-[0.98] shadow-slate-500/20'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-500/20'
                    }
                  `}
                >
                  {isProcessing ? (
                    <>
                      <Square size={18} fill="currentColor" />
                      Cancel Recognition
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Start Recognition
                    </>
                  )}
                </button>
              </div>

              {/* 2. Options */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold">2</span>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Configuration</h2>
                </div>
                <div className="space-y-6">
                  <StyleSelector 
                    selectedStyle={style} 
                    onSelect={setStyle} 
                    disabled={isProcessing}
                  />
                  <ModeSelector
                    mode={mode}
                    setMode={setMode}
                    disabled={isProcessing}
                  />
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="w-full lg:w-7/12 flex flex-col min-w-0">
             <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold">3</span>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Result</h2>
              </div>
            <div className="flex-grow">
              <ResultDisplay 
                result={result} 
                isLoading={isProcessing} 
                error={error} 
                onRetry={handleRecognize}
                selectedStyle={style}
                isDarkMode={isDarkMode}
                isStale={isResultStale}
                isIncomplete={isResultIncomplete}
                isPreservingPreviousResult={isPreservingPreviousResult}
              />
            </div>
          </div>

        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        baseUrl={baseUrl}
        model={model}
        theme={theme}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;
