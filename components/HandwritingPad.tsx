import React, { useRef, useState, useEffect, useCallback, useReducer } from "react";
import { createPortal } from "react-dom";
import { Pen, Maximize2 } from "lucide-react";
import {
  createPenStroke,
  drawStroke,
  eraseStrokesAtPoint,
  type Point,
  type Stroke,
} from "./handwriting/strokeModel";
import {
  createStrokeHistory,
  getCurrentStrokes,
  strokeHistoryReducer,
} from "./handwriting/strokeHistory";
import HandwritingToolbar, {
  type RuntimeTool,
  type ToolMode,
} from "./handwriting/HandwritingToolbar";

interface HandwritingPadProps {
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  isDarkMode?: boolean;
}

const HandwritingPad: React.FC<HandwritingPadProps> = ({
  onFileChange,
  disabled,
  isDarkMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const [history, dispatchHistory] = useReducer(
    strokeHistoryReducer,
    undefined,
    createStrokeHistory,
  );
  const currentStrokes = getCurrentStrokes(history);

  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>("pen");
  const [autoRuntimeTool, setAutoRuntimeTool] = useState<RuntimeTool>("pen");
  const [autoToolHint, setAutoToolHint] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const hintTimerRef = useRef<number | null>(null);
  const autoEraserLockedRef = useRef(false);
  const eraserWorkingRef = useRef<Stroke[] | null>(null);
  const eraserChangedRef = useRef(false);
  const [eraserPreview, setEraserPreview] = useState<Stroke[] | null>(null);

  // Dynamic colors based on theme
  const penColor = isDarkMode ? "#ffffff" : "#000000";
  const bgColor = isDarkMode ? "#0f172a" : "#ffffff"; // slate-900 vs white
  const penWidth = 2;
  const eraserRadius = 4;

  // --- Helpers ---
  const getCoordinates = (event: { clientX: number; clientY: number }): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Use cached rect if available to avoid reflow, fallback to fresh rect if needed
    const rect = rectRef.current || canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    // Clear in screen space
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background color based on theme
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply view transform
    ctx.scale(dpr, dpr); // Restore DPR scaling
    ctx.translate(viewOffset.x, viewOffset.y);

    // Draw strokes
    [
      ...(eraserPreview ?? currentStrokes),
      ...(activeStroke ? [activeStroke] : []),
    ].forEach((s) => {
      // Recalculate color based on theme
      const isStandardColor = s.color === "#000000" || s.color === "#ffffff";
      const sClone = { ...s };
      if (isStandardColor) {
        sClone.color = penColor;
      }
      drawStroke(ctx, sClone);
    });

    ctx.restore();
  }, [currentStrokes, eraserPreview, activeStroke, viewOffset, bgColor, penColor]);

  // Export to App state
  const exportImage = useCallback((strokes: Stroke[]) => {
    // NOTE: We always export as BLACK INK on WHITE BACKGROUND for OCR
    // regardless of display theme.

    if (strokes.length === 0) {
      onFileChange(null);
      return;
    }

    // Calc bounds
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    strokes.forEach((s) => {
      if (s.minX < minX) minX = s.minX;
      if (s.maxX > maxX) maxX = s.maxX;
      if (s.minY < minY) minY = s.minY;
      if (s.maxY > maxY) maxY = s.maxY;
    });

    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = Math.max(100, maxX - minX);
    const height = Math.max(100, maxY - minY);

    // Create temp canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tCtx = tempCanvas.getContext("2d");

    if (!tCtx) return;

    // OCR PREFERENCE: White background, Black text
    tCtx.fillStyle = "#ffffff";
    tCtx.fillRect(0, 0, width, height);

    // Translate so content fits in 0,0
    tCtx.translate(-minX, -minY);

    // Force black ink for export
    const exportStrokes = strokes.map((s) => ({ ...s, color: "#000000" }));

    exportStrokes.forEach((s) => drawStroke(tCtx, s));

    tempCanvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "handwriting.jpg", {
            type: "image/jpeg",
          });
          onFileChange(file);
        }
      },
      "image/jpeg",
      0.95
    );
  }, [onFileChange]);

  // --- Interaction Logic ---

  const commitHistory = useCallback((strokes: Stroke[]) => {
    dispatchHistory({ type: "commit", strokes });
  }, []);

  // Export on history change
  useEffect(() => {
    const timer = window.setTimeout(() => exportImage(currentStrokes), 100);
    return () => clearTimeout(timer);
  }, [currentStrokes, exportImage]);

  const showAutoToolHint = useCallback((message: string) => {
    setAutoToolHint(message);

    if (hintTimerRef.current !== null) {
      window.clearTimeout(hintTimerRef.current);
    }

    hintTimerRef.current = window.setTimeout(() => {
      setAutoToolHint(null);
      hintTimerRef.current = null;
    }, 1400);
  }, []);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current !== null) {
        window.clearTimeout(hintTimerRef.current);
      }
    };
  }, []);

  const resolveAutoTool = (e: React.PointerEvent): RuntimeTool => {
    if (e.pointerType === "touch") {
      return "hand";
    }

    if (e.pointerType === "pen") {
      if (autoEraserLockedRef.current || e.pressure > 0.6) {
        autoEraserLockedRef.current = true;
        return "eraser";
      }

      return "pen";
    }

    return "pen";
  };

  const updateAutoRuntimeTool = useCallback(
    (nextTool: RuntimeTool) => {
      setAutoRuntimeTool((prev) => {
        if (prev !== nextTool) {
          showAutoToolHint(
            nextTool === "hand"
              ? "Auto: hand tool"
              : nextTool === "eraser"
              ? "Auto: eraser tool"
              : "Auto: pen tool"
          );
        }
        return nextTool;
      });
    },
    [showAutoToolHint]
  );

  const eraseAtPoint = useCallback((point: Point, initialStrokes: Stroke[]) => {
    const baseStrokes = eraserWorkingRef.current ?? initialStrokes;
    const remaining = eraseStrokesAtPoint(baseStrokes, point, eraserRadius);

    if (remaining !== baseStrokes) {
      eraserChangedRef.current = true;
    }
    eraserWorkingRef.current = remaining;
    setEraserPreview(remaining);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // A cached rect from mount becomes wrong after page/container scrolling.
    // Refresh it once per gesture, then reuse it for coalesced pointer events.
    rectRef.current = canvasRef.current?.getBoundingClientRect() ?? null;

    const effectiveTool: RuntimeTool =
      toolMode === "auto" ? resolveAutoTool(e) : toolMode;

    if (toolMode === "auto") {
      updateAutoRuntimeTool(effectiveTool);
    }

    if (effectiveTool === "hand") {
      isDraggingRef.current = true;
      const domPoint = getCoordinates(e); // DOM coords
      if (domPoint) {
        lastPosRef.current = domPoint;
      }
      return;
    }

    const domPoint = getCoordinates(e);
    if (!domPoint) return;

    // Transform to world space
    const point = {
      x: domPoint.x - viewOffset.x,
      y: domPoint.y - viewOffset.y,
    };

    if (effectiveTool === "pen") {
      setActiveStroke(createPenStroke(point, penColor, penWidth));
    } else if (effectiveTool === "eraser") {
      eraseAtPoint(point, currentStrokes);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (disabled) return;
    if (!e.buttons) return;

    const domPoint = getCoordinates(e);
    if (!domPoint) return;

    const effectiveTool: RuntimeTool =
      toolMode === "auto" ? resolveAutoTool(e) : toolMode;

    if (toolMode === "auto") {
      updateAutoRuntimeTool(effectiveTool);
    }

    if (effectiveTool === "hand") {
      if (activeStroke) {
        commitHistory([...currentStrokes, activeStroke]);
        setActiveStroke(null);
      }

      if (isDraggingRef.current && lastPosRef.current) {
        const dx = domPoint.x - lastPosRef.current.x;
        const dy = domPoint.y - lastPosRef.current.y;

        setViewOffset((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));

        lastPosRef.current = domPoint;
      }
      return;
    }

    // Use getCoalescedEvents for higher precision if available
    const events =
      e.nativeEvent instanceof PointerEvent &&
      "getCoalescedEvents" in e.nativeEvent
        ? e.nativeEvent.getCoalescedEvents()
        : [e.nativeEvent];

    if (effectiveTool === "pen") {
      setActiveStroke((prev) => {
        if (!prev) {
          const point = {
            x: domPoint.x - viewOffset.x,
            y: domPoint.y - viewOffset.y,
          };
          return createPenStroke(point, penColor, penWidth);
        }

        let newPoints = [...prev.points];
        let { minX, maxX, minY, maxY } = prev;

        events.forEach((event) => {
          const dp = getCoordinates(event);
          if (!dp) return;

          // Transform to world space for storage
          const point = {
            x: dp.x - viewOffset.x,
            y: dp.y - viewOffset.y,
          };

          // Simple distance filter to reduce noise (0.1px)
          const lastPoint = newPoints[newPoints.length - 1];
          if (lastPoint) {
            const dist = Math.hypot(
              point.x - lastPoint.x,
              point.y - lastPoint.y
            );
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
          minX,
          maxX,
          minY,
          maxY,
        };
      });
    } else if (effectiveTool === "eraser") {
      let initialStrokes = currentStrokes;
      if (activeStroke) {
        initialStrokes = [...currentStrokes, activeStroke];
        eraserChangedRef.current = true;
        setActiveStroke(null);
      }

      // Just consider the latest point for eraser to avoid lag
      // Transform to world space
      const point = {
        x: domPoint.x - viewOffset.x,
        y: domPoint.y - viewOffset.y,
      };

      eraseAtPoint(point, initialStrokes);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (eraserWorkingRef.current) {
      if (eraserChangedRef.current) {
        commitHistory(eraserWorkingRef.current);
      }
      eraserWorkingRef.current = null;
      eraserChangedRef.current = false;
      setEraserPreview(null);
    } else if (activeStroke) {
      commitHistory([...currentStrokes, activeStroke]);
      setActiveStroke(null);
    }

    isDraggingRef.current = false;
    lastPosRef.current = null;
    autoEraserLockedRef.current = false;
    rectRef.current = null;
  };

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    // Cache the rect for coordinate calculations
    rectRef.current = canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
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
  }, [renderCanvas]);

  const handleUndo = () => {
    dispatchHistory({ type: "undo" });
  };

  const handleRedo = () => {
    dispatchHistory({ type: "redo" });
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
        flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm
        transition-all duration-300 select-none
        ${
          isFullscreen
            ? "fixed inset-0 z-[9999] h-screen w-screen"
            : "relative rounded-2xl h-[300px] w-full max-w-full overflow-hidden"
        }
      `}
      style={isFullscreen ? { top: 0, left: 0 } : {}}
    >
      <HandwritingToolbar
        toolMode={toolMode}
        onToolModeChange={setToolMode}
        canUndo={history.index > 0}
        canRedo={history.index < history.snapshots.length - 1}
        hasContent={currentStrokes.length > 0}
        isFullscreen={isFullscreen}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onToggleFullscreen={() => setIsFullscreen((current) => !current)}
      />

      {/* Canvas Area - Keep background white for ink contrast */}
      <div
        className={`relative flex-1 bg-white overflow-hidden touch-none ${
          (toolMode === "auto" ? autoRuntimeTool : toolMode) === "hand"
            ? isDraggingRef.current
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-crosshair"
        }`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="block w-full h-full touch-none outline-none"
          style={{ touchAction: "none" }}
        />

        {autoToolHint && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/85 text-white dark:bg-slate-100/90 dark:text-slate-900 shadow-sm">
              {autoToolHint}
            </div>
          </div>
        )}

        {/* Empty State Hint */}
        {currentStrokes.length === 0 && !activeStroke && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center opacity-30 select-none">
              <Pen className="w-12 h-12 mx-auto mb-2 text-slate-400" />
              <span className="text-slate-400 text-xl font-medium">
                Write notes here...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <>
        <div className="h-[300px] w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
            <Maximize2 className="w-6 h-6 text-slate-400 dark:text-slate-500" />
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            Editing in fullscreen mode
          </span>
          <button
            onClick={() => setIsFullscreen(false)}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium hover:underline"
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
