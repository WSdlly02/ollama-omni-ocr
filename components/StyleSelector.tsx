import React from 'react';
import { OCR_OPTIONS } from '../constants';
import { OcrStyle } from '../types';
import { 
  Type, 
  FileText, 
  Sigma, 
  Table, 
  Braces, 
  Eye, 
  CheckCircle2,
  LucideIcon
} from 'lucide-react';

interface StyleSelectorProps {
  selectedStyle: OcrStyle;
  onSelect: (style: OcrStyle) => void;
  disabled?: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Type,
  FileText,
  Sigma,
  Table,
  Braces,
  Eye
};

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelect, disabled }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        Output Style
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {OCR_OPTIONS.map((option) => {
          // Dynamic icon rendering
          const IconComponent = iconMap[option.iconName] || FileText;
          const isSelected = selectedStyle === option.id;

          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              disabled={disabled}
              className={`
                relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${isSelected 
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className={`mb-3 p-2 rounded-lg 
                ${isSelected 
                  ? 'bg-indigo-200 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                <IconComponent size={20} />
              </div>
              <span className="font-semibold text-sm block mb-1">{option.label}</span>
              <span className="text-xs opacity-80 leading-tight">{option.description}</span>
              
              {isSelected && (
                <div className="absolute top-3 right-3 text-indigo-600 dark:text-indigo-400">
                  <CheckCircle2 size={18} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StyleSelector;
