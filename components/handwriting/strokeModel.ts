export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  tool: "pen" | "eraser";
  width: number;
  color: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const createPenStroke = (
  point: Point,
  color: string,
  width: number,
): Stroke => ({
  points: [point],
  tool: "pen",
  color,
  width,
  minX: point.x,
  maxX: point.x,
  minY: point.y,
  maxY: point.y,
});

export const drawStroke = (
  context: CanvasRenderingContext2D,
  stroke: Stroke,
): void => {
  const firstPoint = stroke.points[0];
  if (!firstPoint) return;

  if (stroke.points.length === 1) {
    context.fillStyle = stroke.color;
    context.beginPath();
    context.arc(firstPoint.x, firstPoint.y, stroke.width / 2, 0, Math.PI * 2);
    context.fill();
    return;
  }

  context.lineWidth = stroke.width;
  context.strokeStyle = stroke.color;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(firstPoint.x, firstPoint.y);

  for (let index = 1; index < stroke.points.length - 1; index += 1) {
    const point = stroke.points[index];
    const nextPoint = stroke.points[index + 1];
    if (!point || !nextPoint) continue;

    context.quadraticCurveTo(
      point.x,
      point.y,
      (point.x + nextPoint.x) / 2,
      (point.y + nextPoint.y) / 2,
    );
  }

  const lastPoint = stroke.points.at(-1);
  if (lastPoint) context.lineTo(lastPoint.x, lastPoint.y);
  context.stroke();
};

/**
 * The eraser removes whole strokes. It returns the original array when there
 * is no hit, which lets callers cheaply detect whether a preview changed.
 */
export const eraseStrokesAtPoint = (
  strokes: Stroke[],
  point: Point,
  radius: number,
): Stroke[] => {
  const radiusSquared = radius * radius;
  let changed = false;

  const remaining = strokes.filter((stroke) => {
    if (
      point.x < stroke.minX - radius ||
      point.x > stroke.maxX + radius ||
      point.y < stroke.minY - radius ||
      point.y > stroke.maxY + radius
    ) {
      return true;
    }

    for (let index = 0; index < stroke.points.length; index += 2) {
      const strokePoint = stroke.points[index];
      if (!strokePoint) continue;

      const deltaX = strokePoint.x - point.x;
      const deltaY = strokePoint.y - point.y;
      if (deltaX * deltaX + deltaY * deltaY < radiusSquared) {
        changed = true;
        return false;
      }
    }

    return true;
  });

  return changed ? remaining : strokes;
};
