export interface KiroPoint {
  x: number;
  y: number;
}

export interface KiroBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type KiroWarp = (point: KiroPoint) => KiroPoint;

type KiroTriangle = readonly [KiroPoint, KiroPoint, KiroPoint];

function expandTriangle(points: KiroTriangle, amount: number): [KiroPoint, KiroPoint, KiroPoint] {
  const [p0, p1, p2] = points;
  const cx = (p0.x + p1.x + p2.x) / 3;
  const cy = (p0.y + p1.y + p2.y) / 3;
  return points.map((point) => {
    const dx = point.x - cx;
    const dy = point.y - cy;
    const length = Math.hypot(dx, dy) || 1;
    return {
      x: point.x + (dx / length) * amount,
      y: point.y + (dy / length) * amount,
    };
  }) as [KiroPoint, KiroPoint, KiroPoint];
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  source: KiroTriangle,
  destination: KiroTriangle,
) {
  const [s0, s1, s2] = source;
  const [d0, d1, d2] = destination;
  const denominator = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
  if (Math.abs(denominator) < 0.0001) return;

  const a = (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / denominator;
  const c = (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / denominator;
  const e = (
    d0.x * (s1.x * s2.y - s2.x * s1.y)
    + d1.x * (s2.x * s0.y - s0.x * s2.y)
    + d2.x * (s0.x * s1.y - s1.x * s0.y)
  ) / denominator;
  const b = (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / denominator;
  const d = (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / denominator;
  const f = (
    d0.y * (s1.x * s2.y - s2.x * s1.y)
    + d1.y * (s2.x * s0.y - s0.x * s2.y)
    + d2.y * (s0.x * s1.y - s1.x * s0.y)
  ) / denominator;

  const clip = expandTriangle(destination, 0.72);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(clip[0].x, clip[0].y);
  ctx.lineTo(clip[1].x, clip[1].y);
  ctx.lineTo(clip[2].x, clip[2].y);
  ctx.closePath();
  ctx.clip();
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

function getGridPoint(points: readonly KiroPoint[][], row: number, column: number): KiroPoint {
  const point = points[row]?.[column];
  if (!point) {
    throw new RangeError(`Kiro mesh grid point [${row}, ${column}] is outside the generated grid.`);
  }
  return point;
}

export function drawWarpedGrid(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  bounds: KiroBounds,
  columns: number,
  rows: number,
  warp: KiroWarp,
) {
  const points: KiroPoint[][] = [];
  for (let row = 0; row <= rows; row += 1) {
    const y = bounds.y + (bounds.height * row) / rows;
    const line: KiroPoint[] = [];
    for (let column = 0; column <= columns; column += 1) {
      const x = bounds.x + (bounds.width * column) / columns;
      line.push(warp({ x, y }));
    }
    points.push(line);
  }

  for (let row = 0; row < rows; row += 1) {
    const sy0 = bounds.y + (bounds.height * row) / rows;
    const sy1 = bounds.y + (bounds.height * (row + 1)) / rows;
    for (let column = 0; column < columns; column += 1) {
      const sx0 = bounds.x + (bounds.width * column) / columns;
      const sx1 = bounds.x + (bounds.width * (column + 1)) / columns;
      const s00 = { x: sx0, y: sy0 };
      const s10 = { x: sx1, y: sy0 };
      const s01 = { x: sx0, y: sy1 };
      const s11 = { x: sx1, y: sy1 };
      const d00 = getGridPoint(points, row, column);
      const d10 = getGridPoint(points, row, column + 1);
      const d01 = getGridPoint(points, row + 1, column);
      const d11 = getGridPoint(points, row + 1, column + 1);
      drawTriangle(ctx, image, [s00, s10, s11], [d00, d10, d11]);
      drawTriangle(ctx, image, [s00, s11, s01], [d00, d11, d01]);
    }
  }
}

export function rotateAround(point: KiroPoint, center: KiroPoint, radians: number): KiroPoint {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const x = point.x - center.x;
  const y = point.y - center.y;
  return {
    x: center.x + x * cos - y * sin,
    y: center.y + x * sin + y * cos,
  };
}

export function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0 || 1)));
  return t * t * (3 - 2 * t);
}

export function gaussianWeight(point: KiroPoint, center: KiroPoint, radiusX: number, radiusY: number) {
  const dx = (point.x - center.x) / radiusX;
  const dy = (point.y - center.y) / radiusY;
  return Math.exp(-(dx * dx + dy * dy) * 2.2);
}
