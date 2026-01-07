import React from 'react';
import { Image as ImageIcon, PenTool } from 'lucide-react';
import ImageUploader from './ImageUploader';
import HandwritingPad from './HandwritingPad';

interface InputPanelProps {
  inputMode: 'upload' | 'handwriting';
  setInputMode: (mode: 'upload' | 'handwriting') => void;
  file: File | null;
  setFile: (file: File | null) => void;
  isProcessing: boolean;
  isDarkMode?: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({
  inputMode,
  setInputMode,
  file,
  setFile,
  isProcessing,
  isDarkMode = false,
}) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold">1</span>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Source Input</h2>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => { setInputMode('upload'); setFile(null); }}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${inputMode === 'upload' 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}
            `}
          >
            <ImageIcon size={16} />
            <span>Upload</span>
          </button>
          <button
            onClick={() => { setInputMode('handwriting'); setFile(null); }}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${inputMode === 'handwriting' 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}
            `}
          >
            <PenTool size={16} />
            <span>Draw</span>
          </button>
        </div>
      </div>
      
      <div className="relative">
        {inputMode === 'upload' ? (
          <ImageUploader 
            file={file} 
            setFile={setFile} 
            disabled={isProcessing}
          />
        ) : (
          <HandwritingPad 
            onFileChange={setFile}
            disabled={isProcessing}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </section>
  );
};

export default InputPanel;
