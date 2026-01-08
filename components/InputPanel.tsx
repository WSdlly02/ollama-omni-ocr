import React from 'react';
import { Image as ImageIcon, PenTool } from 'lucide-react';
import SegmentedControl from './SegmentedControl';
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
        
        <div className="w-48">
          <SegmentedControl
            name="input-source"
            value={inputMode}
            onChange={(val) => {
              setInputMode(val as 'upload' | 'handwriting');
              setFile(null);
            }}
            options={[
              { value: 'upload', label: 'Upload', icon: ImageIcon },
              { value: 'handwriting', label: 'Draw', icon: PenTool }
            ]}
            disabled={isProcessing}
          />
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
