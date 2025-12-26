// barRenderer.js
import { renderMonthlyByDate } from './renderMonthlyByDate.js';

export function barRenderer({
  p,
  dates,          // 実データの日付配列（短くてもOK）
  data,
  person,
  theme,
  barHeight = 4,  // ← UIで指定するのはこれだけ
  maxHours = 12,
  resolution = 1,
  fixedDayCount = 30, // ★ 表示用に固定する日数
}) {
  p.background(theme.bgColor);
  p.scale(resolution);

  const logicalWidth = p.width / resolution;
  const logicalHeight = p.height / resolution;

  // =========================
  // 縦レイアウト計算
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
  // 日付 → index のマップ
  // =========================
  const dateToIndex = new Map();
  dates.forEach((date, i) => {
    dateToIndex.set(date, i);
  });

  // =========================
  // 固定日数分描画
  // =========================
  for (let i = 0; i < fixedDayCount; i++) {
    const y = i * (barHeight + gap);

    // 対応する日付が存在すれば取得
    const date = dates[i];
    const dayData = date ? data[date]?.[person] : null;

    const totalSleepMs = dayData?.stats?.totalSleepMs ?? 0;
    const maxSleepMs   = dayData?.stats?.maxSleepMs ?? 0;

    p.noStroke();

    // total sleep
    p.fill(...theme.bars.total);
    p.rect(0, y, totalSleepMs * scaleX, barHeight);

    // max sleep
    p.fill(...theme.bars.max);
    p.rect(0, y, maxSleepMs * scaleX, barHeight);
  }
}
