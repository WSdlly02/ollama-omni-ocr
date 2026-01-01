import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, X, ClipboardPaste } from 'lucide-react';

interface ImageUploaderProps {
  file: File | null;
  setFile: (file: File | null) => void;
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ file, setFile, disabled }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clean up preview URL
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Handle global paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            setFile(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [setFile, disabled]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        setFile(droppedFile);
      }
    }
  }, [setFile, disabled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={inputRef}
        onChange={handleInputChange}
        className="hidden"
        accept="image/*"
      />
      
      {!file ? (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`
            group relative border-2 border-dashed rounded-2xl p-10 
            flex flex-col items-center justify-center text-center cursor-pointer
            transition-all duration-300 min-h-[300px]
            ${isDragging 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-slate-300 bg-slate-50 hover:bg-white hover:border-slate-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Upload an Image
          </h3>
          <p className="text-sm text-slate-500 max-w-xs mb-6">
            Drag & drop, click to browse, or paste (Ctrl+V) from your clipboard.
          </p>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            <ClipboardPaste size={14} />
            <span>Paste supported</span>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 group">
          <img 
            src={previewUrl || ''} 
            alt="Preview" 
            className="w-full h-auto max-h-[500px] object-contain mx-auto"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
          
          <button
            onClick={clearImage}
            disabled={disabled}
            className="absolute top-3 right-3 bg-white/90 hover:bg-red-50 text-slate-700 hover:text-red-600 p-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
            title="Remove Image"
          >
            <X size={20} />
          </button>
          
          <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
