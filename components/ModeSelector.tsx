import React from 'react';
import { motion } from 'framer-motion';
import { OcrMode } from '../types';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface ModeSelectorProps {
  mode: OcrMode;
  setMode: (mode: OcrMode) => void;
  disabled?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, setMode, disabled }) => {
  const options = [
    {
      id: OcrMode.STRICT,
      label: 'Strict',
      description: 'Faithful output, no hallucinations.',
      icon: ShieldCheck
    },
    {
      id: OcrMode.ENHANCE,
      label: 'Enhance',
      description: 'Fixes errors & ignores watermarks.',
      icon: Sparkles
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        Recognition Mode
      </h3>
      
      <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
        {options.map((option) => {
          const isSelected = mode === option.id;
          const IconComponent = option.icon;

          return (
            <button
              key={option.id}
              onClick={() => setMode(option.id)}
              disabled={disabled}
              className={`
                relative z-10 flex flex-col items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors duration-200
                ${isSelected 
                  ? 'text-indigo-700 dark:text-indigo-300' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {isSelected && (
                <motion.div
                  layoutId="mode-selector-bg"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  style={{ zIndex: -1 }}
                />
              )}
              
              <IconComponent size={20} strokeWidth={2.5} />
              <div className="text-center">
                <span className="block text-sm">{option.label}</span>
                <span className="block text-[10px] opacity-70 leading-tight mt-0.5 sm:block">
                  {option.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModeSelector;
