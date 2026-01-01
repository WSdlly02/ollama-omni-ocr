import React, { useState } from 'react';
import { Copy, Check, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { OcrStyle } from '../types';

interface ResultDisplayProps {
  result: string | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  selectedStyle: OcrStyle;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isLoading, error, onRetry, selectedStyle }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-result-${Date.now()}.${selectedStyle === 'json' ? 'json' : selectedStyle === 'md' ? 'md' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-red-50 rounded-2xl border border-red-100 text-center">
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-red-900 mb-2">Recognition Failed</h3>
        <p className="text-red-700 mb-6 max-w-sm">{error}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200">
        <div className="relative w-16 h-16 mb-6">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Analyzing Image...</h3>
        <p className="text-slate-500 animate-pulse">Detecting content and formatting</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
        <div className="mb-4 opacity-50">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                <rect x="9" y="9" width="6" height="6"></rect>
                <line x1="9" y1="1" x2="9" y2="4"></line>
                <line x1="15" y1="1" x2="15" y2="4"></line>
                <line x1="9" y1="20" x2="9" y2="23"></line>
                <line x1="15" y1="20" x2="15" y2="23"></line>
                <line x1="20" y1="9" x2="23" y2="9"></line>
                <line x1="20" y1="14" x2="23" y2="14"></line>
                <line x1="1" y1="9" x2="4" y2="9"></line>
                <line x1="1" y1="14" x2="4" y2="14"></line>
            </svg>
        </div>
        <p>Results will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Recognition Result
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all"
            title="Download"
          >
            <Download size={18} />
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              copied 
                ? 'bg-green-100 text-green-700' 
                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <div className="flex-grow relative">
        <textarea
          readOnly
          value={result}
          className="w-full h-full min-h-[400px] p-4 text-sm font-mono text-slate-700 bg-white resize-none focus:outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default ResultDisplay;
