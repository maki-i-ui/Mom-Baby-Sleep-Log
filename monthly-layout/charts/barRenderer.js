// barRenderer.js
import { renderMonthlyByDate } from './renderMonthlyByDate.js';

export function barRenderer({
  p,
  dates,          // 実データの日付配列（短くてもOK）
  data,
  person,
  theme,
  barHeight = 4,  // UIで指定
  maxHours = 16,
  resolution = 1,
  fixedDayCount = 30, // 表示用固定日数
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
    const color        = stats?.sleepColor; // ★ ここがポイント

    p.noStroke();

    // ===== total sleep（100% opacity）=====
    if (color) {
      p.fill(color.r, color.g, color.b, 128);
      p.rect(0, y, totalSleepMs * scaleX, barHeight);
    } else {
      // データなし日は薄いグレーなど（任意）
      p.fill(255, 255, 255, 30);
      p.rect(0, y, maxMs * scaleX, barHeight);
    }
    

    // ===== max sleep（50% opacity）=====
    if (color) {
      p.fill(color.r, color.g, color.b, 255);
      p.rect(0, y, maxSleepMs * scaleX, barHeight);
    }
  }
}
