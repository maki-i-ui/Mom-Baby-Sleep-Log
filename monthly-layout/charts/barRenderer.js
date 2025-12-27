// barRenderer.js
import { renderMonthlyByDate } from './renderMonthlyByDate.js';

export function barRenderer({
  p,
  dates,
  data,
  person,
  theme,
  barHeight = 4,
  maxHours = 16,
  resolution = 1,
  fixedDayCount = 30,
  align = 'left', // ★ 'left' or 'right'
}) {
  p.background(theme.bgColor);
  p.scale(resolution);

  const logicalWidth  = p.width  / resolution;
  const logicalHeight = p.height / resolution;

  // =========================
  // 縦レイアウト
  // =========================
  const totalBarHeight = barHeight * fixedDayCount;
  const gap =
    fixedDayCount > 1
      ? (logicalHeight - totalBarHeight) / (fixedDayCount - 1)
      : 0;

  // =========================
  // 横スケール
  // =========================
  const maxMs = maxHours * 60 * 60 * 1000;
  const scaleX = logicalWidth / maxMs;

  // =========================
  // 固定日数分描画
  // =========================
  for (let i = 0; i < fixedDayCount; i++) {
    const y = i * (barHeight + gap);

    const date = dates[i];
    const dayData = date ? data[date]?.[person] : null;
    const stats = dayData?.stats;

    const totalSleepMs = stats?.totalSleepMs ?? 0;
    const maxSleepMs   = stats?.maxSleepMs   ?? 0;
    const color        = stats?.sleepColor;
    const emptyColor   = theme?.emptyBar;

    const totalW = totalSleepMs * scaleX;
    const maxW   = maxSleepMs   * scaleX;

    // ★ ここが肝
    const xTotal =
      align === 'right'
        ? logicalWidth - totalW
        : 0;

    const xMax =
      align === 'right'
        ? logicalWidth - maxW
        : 0;

    p.noStroke();

    // ===== total sleep（薄め）=====
    if (color) {
      p.fill(color.r, color.g, color.b, 128);
      p.rect(xTotal, y, totalW, barHeight);
    } else {
      p.fill(emptyColor);
      p.rect(
        align === 'right' ? 0 : 0,
        y,
        logicalWidth,
        barHeight
      );
    }

    // ===== max sleep（濃い）=====
    if (color) {
      p.fill(color.r, color.g, color.b, 255);
      p.rect(xMax, y, maxW, barHeight);
    }
  }
}
