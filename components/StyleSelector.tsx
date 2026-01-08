import React from 'react';
import { motion } from 'framer-motion';
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
      {/* 
         We use a grid of SegmentedControls or a custom layout since SegmentedControl implies single row.
         However, for visual consistency, we can stick to a wrapping layout or a grid of buttons that SHARE the design style.
         Actually, the user asked for "Slider Style". A multi-row slider is weird.
         Use a Grid of "Radio Buttons" designed exactly like the SegmentedControl options?
         NO, let's use a wrapping container of SegmentedControls? No, that breaks exclusive selection UI logic (pill sliding).
         
         Decision: Display as a Grid, but use the SAME visual "SegmentedControlOption" style.
         HOWEVER, the user wanted "Slider Animation". 
         Framer Motion `layoutId` works across a Grid perfectly fine! 
         So we can treat the entire Grid as one large SegmentedControl container conceptually.
         
         Let's reuse the logic inside SegmentedControl but adapt styling for Grid?
         Or just pass `flex-wrap`? 
         SegmentedControl is `flex`. If we add `flex-wrap`, it might work if we adjust widths.
         Let's try creating a "GridSegmentedControl" behavior using the same component if possible, 
         or just write it inline here to ensure grid behavior.
         
         Actually, let's try to update SegmentedControl to support `className` override or `variant="grid"`.
         But `SegmentedControl.tsx` is simple flex.
         
         Let's just implement the "Slider Style" here inline using the same motion logic, 
         optimized for a 2-column or 3-column grid.
      */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
        {OCR_OPTIONS.map((option) => {
          const IconComponent = iconMap[option.iconName] || FileText;
          const isSelected = selectedStyle === option.id;

          return (
             <button
              key={option.id}
              onClick={() => onSelect(option.id)}
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
                  layoutId="style-selector-bg"
                  className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  style={{ zIndex: -1 }}
                />
              )}
              
              <IconComponent size={20} strokeWidth={2} />
              <div className="text-center">
                  <span className="block text-sm">{option.label}</span>
                  <span className="block text-[10px] opacity-70 leading-tight mt-0.5 max-w-[80px] mx-auto hidden sm:block">
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

export default StyleSelector;
