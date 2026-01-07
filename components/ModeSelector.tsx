import React from 'react';
import { Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { OcrMode } from '../types';

interface ModeSelectorProps {
  mode: OcrMode;
  setMode: (mode: OcrMode) => void;
  disabled?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, setMode, disabled }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        Recognition Mode
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMode(OcrMode.STRICT)}
          disabled={disabled}
          className={`
            relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-left
            ${mode === OcrMode.STRICT
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className={`mb-3 p-2 rounded-lg ${mode === OcrMode.STRICT 
            ? 'bg-indigo-200 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
          >
            <Shield size={20} />
          </div>
          <span className="font-semibold text-sm block mb-1">Strict</span>
          <span className="text-xs opacity-80 leading-tight">Faithful output, no hallucinations</span>
          
          {mode === OcrMode.STRICT && (
            <div className="absolute top-3 right-3 text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 size={18} />
            </div>
          )}
        </button>

        <button
          onClick={() => setMode(OcrMode.ENHANCE)}
          disabled={disabled}
          className={`
            relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-left
            ${mode === OcrMode.ENHANCE
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className={`mb-3 p-2 rounded-lg 
            ${mode === OcrMode.ENHANCE 
              ? 'bg-indigo-200 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}
          >
            <Sparkles size={20} />
          </div>
          <span className="font-semibold text-sm block mb-1">Enhance</span>
          <span className="text-xs opacity-80 leading-tight">Fix & ignore watermarks</span>
          
          {mode === OcrMode.ENHANCE && (
            <div className="absolute top-3 right-3 text-indigo-600 dark:text-indigo-400">
              <CheckCircle2 size={18} />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default ModeSelector;
