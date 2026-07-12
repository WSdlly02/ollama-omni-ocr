import React from "react";
import {
  Eraser,
  Hand,
  Maximize2,
  Minimize2,
  Pen,
  Redo,
  Trash2,
  Undo,
} from "lucide-react";
import SegmentedControl from "../SegmentedControl";

export type RuntimeTool = "pen" | "eraser" | "hand";
export type ToolMode = "auto" | RuntimeTool;

interface HandwritingToolbarProps {
  toolMode: ToolMode;
  onToolModeChange: (tool: ToolMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  hasContent: boolean;
  isFullscreen: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onToggleFullscreen: () => void;
}

const HandwritingToolbar: React.FC<HandwritingToolbarProps> = ({
  toolMode,
  onToolModeChange,
  canUndo,
  canRedo,
  hasContent,
  isFullscreen,
  onUndo,
  onRedo,
  onClear,
  onToggleFullscreen,
}) => (
  <div className="flex items-center justify-between p-2 sm:p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm z-10 transition-opacity">
    <div className="flex items-center space-x-1 sm:space-x-2">
      <SegmentedControl
        name="drawing-tools"
        value={toolMode}
        onChange={onToolModeChange}
        options={[
          { value: "auto", label: "Auto" },
          { value: "hand", label: "", icon: Hand, ariaLabel: "Pan canvas" },
          { value: "pen", label: "", icon: Pen, ariaLabel: "Draw with pen" },
          { value: "eraser", label: "", icon: Eraser, ariaLabel: "Erase strokes" },
        ]}
        fullWidth={false}
      />

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" />

      <div className="flex space-x-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last handwriting change"
          className="p-1.5 sm:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          title="Undo"
        >
          <Undo className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo handwriting change"
          className="p-1.5 sm:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
          title="Redo"
        >
          <Redo className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>

    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={onClear}
        disabled={!hasContent}
        aria-label="Clear handwriting canvas"
        className="p-1.5 sm:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-30 transition-colors"
        title="Clear Canvas"
      >
        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? "Exit fullscreen handwriting mode" : "Enter fullscreen handwriting mode"}
        className="p-1.5 sm:p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
      </button>
    </div>
  </div>
);

export default HandwritingToolbar;
