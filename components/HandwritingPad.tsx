import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Pen, Eraser, Undo, Redo, Trash2, Maximize2, Minimize2 } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  tool: 'pen' | 'eraser'; // Keeping the tool type for structure, though logic splits
  width: number;
  color: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface HandwritingPadProps {
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

const HandwritingPad: React.FC<HandwritingPadProps> = ({ onFileChange, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [history, setHistory] = useState<Stroke[][]>([[]]);
  const [currentStep, setCurrentStep] = useState(0);
  const currentStrokes = history[currentStep];
  
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const penColor = '#000000';
  const penWidth = 3;
  // Eraser radius reduced to be more consistent with visual precision
  const eraserRadius = 5;

  // --- Helpers ---
  const getCoordinates = (e: React.PointerEvent | PointerEvent | React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'clientX' in e ? e.clientX : (e as any).changedTouches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : (e as any).changedTouches[0].clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) {
        if (stroke.points.length === 1) {
            ctx.fillStyle = stroke.color;
            ctx.beginPath();
            ctx.arc(stroke.points[0].x, stroke.points[0].y, stroke.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        return;
    }

    ctx.lineWidth = stroke.width;
    ctx.strokeStyle = stroke.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const { points } = stroke;
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const mid = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
      };
      ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
    }
    
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    currentStrokes.forEach(s => drawStroke(ctx, s));

    if (activeStroke && tool === 'pen') {
      drawStroke(ctx, activeStroke);
    }
  }, [currentStrokes, activeStroke, tool]);

  // Export to App state
  const exportImage = useCallback(() => {
     const canvas = canvasRef.current;
     if (!canvas) return;
     
     if (currentStrokes.length === 0 && !activeStroke) {
         onFileChange(null);
         return;
     }

     canvas.toBlob((blob) => {
         if (blob) {
             const file = new File([blob], "handwriting.jpg", { type: "image/jpeg" });
             onFileChange(file);
         }
     }, 'image/jpeg', 0.95);
  }, [currentStrokes, activeStroke, onFileChange]);

  // --- Interaction Logic ---

  const commitHistory = (newStrokes: Stroke[]) => {
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(newStrokes);
    setHistory(newHistory);
    // Export whenever history is committed (end of stroke, clear, undo/redo)
    // We need to wait for state update to trigger export? 
    // exportImage depends on currentStrokes which will differ from newStrokes slightly in timing if useeffect.
    // Better call export with newStrokes logic?
    // Actually, let's use useEffect to trigger export when currentStep changes.
    setCurrentStep(newHistory.length - 1);
  };

  // Export on history change
  useEffect(() => {
      // Debounce slightly or just call
      const timer = setTimeout(exportImage, 100);
      return () => clearTimeout(timer);
  }, [history, currentStep, exportImage]);

  const checkEraserHit = (x: number, y: number, strokesToCheck: Stroke[]): Stroke[] => {
    const r = eraserRadius;
    const rSq = r * r;
    
    return strokesToCheck.filter(stroke => {
      if (x < stroke.minX - r || x > stroke.maxX + r || 
          y < stroke.minY - r || y > stroke.maxY + r) {
        return true;
      }
      for (let i = 0; i < stroke.points.length; i += 2) {
        const p = stroke.points[i];
        const dx = p.x - x;
        const dy = p.y - y;
        if (dx * dx + dy * dy < rSq) {
          return false;
        }
      }
      return true;
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (disabled) return;
    
    const point = getCoordinates(e);
    if (!point) return;

    if (tool === 'pen') {
      setActiveStroke({
        points: [point],
        tool: 'pen',
        color: penColor,
        width: penWidth,
        minX: point.x, maxX: point.x,
        minY: point.y, maxY: point.y
      });
    } else if (tool === 'eraser') {
       const remaining = checkEraserHit(point.x, point.y, currentStrokes);
       if (remaining.length !== currentStrokes.length) {
         commitHistory(remaining);
       }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (disabled) return;
    if (!e.buttons) return;

    // Use getCoalescedEvents for higher precision if available
    const events = (e.nativeEvent instanceof PointerEvent && 'getCoalescedEvents' in e.nativeEvent) 
      ? e.nativeEvent.getCoalescedEvents() 
      : [e.nativeEvent];

    if (tool === 'pen') {
      setActiveStroke(prev => {
        if (!prev) return null;
        
        let newPoints = [...prev.points];
        let { minX, maxX, minY, maxY } = prev;

        events.forEach(event => {
            const point = getCoordinates(event);
            if (!point) return;
            
            // Simple distance filter to reduce noise (0.5px)
            const lastPoint = newPoints[newPoints.length - 1];
            if (lastPoint) {
                const dist = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
                // Reduce standard threshold to capturing fine detail
                if (dist < 0.1) return; 
            }

            newPoints.push(point);
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        });

        return {
          ...prev,
          points: newPoints,
          minX, maxX, minY, maxY
        };
      });
    } else if (tool === 'eraser') {
      // Eraser doesn't need high frequency updates, just the latest position is fine usually,
      // but consistent logic doesn't hurt.
      events.forEach(event => {
          const point = getCoordinates(event);
          if (point) {
             // We can't batch state updates purely functionally easily here because 
             // checkEraserHit depends on currentStrokes which doesn't change *inside* this loop.
             // But for eraser, we generally just care about the "current" position. 
             // Using the last event is usually sufficient for UI feedback, 
             // but to erase effectively we should check all points.
             // However, React state updates are async. 
             // Let's just use the final event to trigger the erase check to avoid complexity/lag.
             // Or better: compute the "swept area"? No, simple Point check is fine for now.
          }
      });
      // Just consider the latest point for eraser to avoid lag
      const point = getCoordinates(e);
      if (point) {
          const remaining = checkEraserHit(point.x, point.y, currentStrokes);
          if (remaining.length !== currentStrokes.length) {
            commitHistory(remaining); 
          }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (tool === 'pen' && activeStroke) {
      commitHistory([...currentStrokes, activeStroke]);
      setActiveStroke(null);
    }
  };

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    initCanvas();
    const observer = new ResizeObserver(() => initCanvas());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [initCanvas, isFullscreen]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, history, currentStep]);

  const handleUndo = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRedo = () => {
    if (currentStep < history.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleClear = () => {
    if (currentStrokes.length > 0) {
      commitHistory([]);
    }
  };

  const padContent = (
    <div 
      ref={containerRef}
      className={`
        flex flex-col bg-white border border-slate-200 shadow-sm
        transition-all duration-300 select-none
        ${isFullscreen 
            ? 'fixed inset-0 z-[9999] h-screen w-screen' 
            : 'relative rounded-2xl h-[300px] w-full overflow-hidden'}
      `}
      style={isFullscreen ? { top: 0, left: 0 } : {}}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 sm:p-3 border-b border-slate-100 bg-slate-50/95 backdrop-blur-sm z-10 transition-opacity">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Tools */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setTool('pen')}
              className={`p-1.5 sm:p-2 rounded-md transition-all ${tool === 'pen' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
              title="Pen"
            >
              <Pen className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-1.5 sm:p-2 rounded-md transition-all ${tool === 'eraser' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
              title="Object Eraser"
            >
              <Eraser className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <div className="w-px h-6 bg-slate-300 mx-1" />

          {/* History */}
          <div className="flex space-x-1">
            <button
              onClick={handleUndo}
              disabled={currentStep === 0}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              title="Undo"
            >
              <Undo className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={currentStep === history.length - 1}
              className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              title="Redo"
            >
              <Redo className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
            <button
                onClick={handleClear}
                disabled={currentStrokes.length === 0}
                className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Clear Canvas"
            >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
           <button
             onClick={() => setIsFullscreen(!isFullscreen)}
             className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
             title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
           >
             {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
           </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 bg-white cursor-crosshair overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="block w-full h-full touch-none outline-none"
          style={{ touchAction: 'none' }}
        />
        
        {/* Empty State Hint */}
        {currentStrokes.length === 0 && !activeStroke && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center opacity-30">
                <Pen className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                <span className="text-slate-400 text-xl font-medium select-none">Write notes here...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
      return (
          <>
            <div className="h-[300px] w-full bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all">
                <div className="p-3 bg-white rounded-full shadow-sm">
                    <Maximize2 className="w-6 h-6 text-slate-400" />
                </div>
                <span className="text-slate-500 font-medium text-sm">Editing in fullscreen mode</span>
                <button 
                    onClick={() => setIsFullscreen(false)}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                >
                    Return to view
                </button>
            </div>
            {createPortal(padContent, document.body)}
          </>
      );
  }

  return padContent;
};

export default HandwritingPad;