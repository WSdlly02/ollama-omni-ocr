import React from 'react';
import { Image as ImageIcon, PenTool, Camera } from 'lucide-react';
import SegmentedControl from './SegmentedControl';
import ImageUploader from './ImageUploader';
import HandwritingPad from './HandwritingPad';
import CameraCapture from './CameraCapture';

export type InputMode = 'upload' | 'handwriting' | 'camera';

interface InputPanelProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
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
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold">1</span>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Source Input</h2>
        </div>
        <SegmentedControl
          name="input-source"
          value={inputMode}
          onChange={(val) => {
            setInputMode(val as InputMode);
            setFile(null);
          }}
          options={[
            { value: 'upload', label: 'Upload', icon: ImageIcon },
            { value: 'camera', label: 'Camera', icon: Camera },
            { value: 'handwriting', label: 'Draw', icon: PenTool },
          ]}
          disabled={isProcessing}
        />
      </div>
      
      <div className="relative">
        {inputMode === 'upload' && (
          <ImageUploader 
            file={file} 
            setFile={setFile} 
            disabled={isProcessing}
          />
        )}
        {inputMode === 'camera' && (
          <CameraCapture
            onFileChange={setFile}
            disabled={isProcessing}
          />
        )}
        {inputMode === 'handwriting' && (
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
