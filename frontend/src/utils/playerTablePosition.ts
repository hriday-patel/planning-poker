const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const TABLE_WIDTH_RATIO = 0.58;
const TABLE_MAX_WIDTH_PX = 520;
const TABLE_HEIGHT_RATIO = 0.36;
const TABLE_MAX_HEIGHT_PX = 256;
const TABLE_MIN_HEIGHT_PX = 144;

const getTableRadii = (containerWidth: number, containerHeight: number) => {
  const tableWidth = Math.min(containerWidth * TABLE_WIDTH_RATIO, TABLE_MAX_WIDTH_PX);
  const tableHeight = Math.min(
    Math.max(containerHeight * TABLE_HEIGHT_RATIO, TABLE_MIN_HEIGHT_PX),
    TABLE_MAX_HEIGHT_PX,
  );

  return {
    rx: tableWidth / 2,
    ry: tableHeight / 2,
  };
};

const getSeatOffsetPx = (containerWidth: number, containerHeight: number, total: number) => {
  const baseOffset = Math.min(containerWidth, containerHeight) * 0.1;
  const densityBoost =
    total > 12 ? 1 + Math.min((total - 12) * 0.02, 0.16) : 1;

  return baseOffset * densityBoost;
};

export const getPlayerPosition = (
  index: number,
  total: number,
  containerWidth: number,
  containerHeight: number,
) => {
  if (total <= 1) return { left: 50, top: 80 };

  if (containerWidth <= 0 || containerHeight <= 0) {
    const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
    return {
      left: clamp(50 + 29 * Math.cos(angle), 10, 90),
      top: clamp(50 + 18 * Math.sin(angle), 10, 90),
    };
  }

  const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const cx = containerWidth / 2;
  const cy = containerHeight / 2;
  const { rx, ry } = getTableRadii(containerWidth, containerHeight);

  const edgeX = cx + rx * cos;
  const edgeY = cy + ry * sin;

  const normalX = ry * cos;
  const normalY = rx * sin;
  const normalLength = Math.hypot(normalX, normalY) || 1;
  const offsetPx = getSeatOffsetPx(containerWidth, containerHeight, total);

  const playerX = edgeX + (offsetPx * normalX) / normalLength;
  const playerY = edgeY + (offsetPx * normalY) / normalLength;

  return {
    left: clamp((playerX / containerWidth) * 100, 8, 92),
    top: clamp((playerY / containerHeight) * 100, 8, 92),
  };
};
