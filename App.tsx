import React, { useState } from 'react';
import { Scan, Sparkles } from 'lucide-react';
import { OcrStyle } from './types';
import ImageUploader from './components/ImageUploader';
import StyleSelector from './components/StyleSelector';
import ResultDisplay from './components/ResultDisplay';
import { performOCR } from './ocrService';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState<OcrStyle>(OcrStyle.TEXT);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecognize = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const ocrText = await performOCR(file, style);
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
              <Scan size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Gemini Omni-OCR
            </h1>
          </div>
          <a 
            href="#" 
            className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors hidden sm:block"
          >
            Powered by Gemini 3 Flash
          </a>
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
    </div>
  );
};

export default App;
