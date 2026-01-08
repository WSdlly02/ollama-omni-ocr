import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  description?: string; // Optional tooltip or subtile
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  name: string; // Unique identifier for layoutId
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const SegmentedControl = <T extends string>({ 
  options, 
  value, 
  onChange, 
  disabled, 
  name,
  size = 'md',
  fullWidth = true
}: SegmentedControlProps<T>) => {
  
  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-1.5 px-3',
    lg: 'text-base py-2 px-4'
  };

  return (
    <div className={`
      relative flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
      ${fullWidth ? 'w-full' : 'inline-flex'}
      ${disabled ? 'opacity-50 pointer-events-none' : ''}
    `}>
      {options.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`
              relative z-10 flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200
              ${fullWidth ? 'flex-1' : ''}
              ${sizeClasses[size]}
              ${isSelected 
                ? 'text-indigo-700 dark:text-indigo-300' 
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'}
            `}
          >
            {isSelected && (
              <motion.div
                layoutId={`segment-bg-${name}`}
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                style={{ zIndex: -1 }}
              />
            )}
            
            {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.5} />}
            {option.label && <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
