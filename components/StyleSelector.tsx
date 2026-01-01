import React from 'react';
import { OCR_OPTIONS } from '../constants';
import { OcrStyle } from '../types';
import * as LucideIcons from 'lucide-react';

interface StyleSelectorProps {
  selectedStyle: OcrStyle;
  onSelect: (style: OcrStyle) => void;
  disabled?: boolean;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelect, disabled }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
        Output Style
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {OCR_OPTIONS.map((option) => {
          // Dynamic icon rendering
          const IconComponent = (LucideIcons as any)[option.iconName] || LucideIcons.FileText;
          const isSelected = selectedStyle === option.id;

          return (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              disabled={disabled}
              className={`
                relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${isSelected 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className={`mb-3 p-2 rounded-lg ${isSelected ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                <IconComponent size={20} />
              </div>
              <span className="font-semibold text-sm block mb-1">{option.label}</span>
              <span className="text-xs opacity-80 leading-tight">{option.description}</span>
              
              {isSelected && (
                <div className="absolute top-3 right-3 text-indigo-600">
                  <LucideIcons.CheckCircle2 size={18} />
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
