// spiralRenderer.js
import { renderMonthlyByDate } from './renderMonthlyByDate.js';

export function spiralRenderer({
  p,
  dates,
  data,
  person,
  theme,
  config,
  resolution = 1,
}) {
  p.background(theme.bgColor);
  p.scale(resolution);

  renderMonthlyByDate({
    p,
    dates,
    data,
    person,
    drawDay: ({ p, date, index, dayData }) => {
      drawSpiralDay({
        p,
        date,
        index,
        cycles: dayData.cycles,
        stats: dayData.stats,
        theme,
        config,
      });
    },
  });
}

function drawSpiralDay({
  p,
  date,
  index,
  cycles,
  stats,
  theme,
  config,
}) {
  const d = new Date(date);
  const dayStartMs = new Date(d.setHours(0, 0, 0, 0)).getTime();

  const centerX = p.width / 2;
  const centerY = p.height / 2;

  const rStart = config.BASE_RADIUS + index * config.RING_SPACING;
  const rEnd   = rStart + config.RING_SPACING;

  const msToAngle = (ms) =>
    ((ms - dayStartMs) / (24 * 60 * 60 * 1000)) * p.TWO_PI - p.HALF_PI;

  const msToRadius = (ms) =>
    p.lerp(rStart, rEnd, (ms - dayStartMs) / (24 * 60 * 60 * 1000));

  // =========================
  // ① データなし日の「薄いリング」
  // =========================
  const hasData = stats && stats.maxSleepMs > 0;

  if (!hasData) {
    p.noFill();
    p.strokeWeight(config.SLEEP_LINE_WEIGHT);

    // 薄い色（テーマに入れてもよい）
    const emptyCol = p.color(
      theme.emptyRing?.[0] ?? 255,
      theme.emptyRing?.[1] ?? 255,
      theme.emptyRing?.[2] ?? 255,
      theme.emptyRing?.[3] ?? 40   // ← アルファ低め
    );

    p.stroke(emptyCol);

    const steps = 120;
    p.beginShape();
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const ms = dayStartMs + f * 24 * 60 * 60 * 1000;
      const a = msToAngle(ms);
      const r = msToRadius(ms);
      p.vertex(
        centerX + r * p.cos(a),
        centerY + r * p.sin(a)
      );
    }
    p.endShape();

    return; // ★ データなし日はここで終了
  }

  // =========================
  // ② データあり日の色計算
  // =========================
  const { min, max, maxHours } = theme.sleepGradient;

  const t = p.constrain(
    stats.maxSleepMs / (1000 * 60 * 60) / maxHours,
    0,
    1
  );

  const col = p.lerpColor(
    p.color(...min),
    p.color(...max),
    t
  );

  p.stroke(col);
  p.noFill();
  p.strokeWeight(config.SLEEP_LINE_WEIGHT);

  // =========================
  // ③ 睡眠サイクル描画
  // =========================
  cycles.forEach((c) => {
    if (c.wakeEndMs <= c.sleepStartMs) return;

    const steps = 60;
    p.beginShape();
    for (let i = 0; i <= steps; i++) {
      const ms = p.lerp(c.sleepStartMs, c.wakeEndMs, i / steps);
      const a = msToAngle(ms);
      const r = msToRadius(ms);
      p.vertex(
        centerX + r * p.cos(a),
        centerY + r * p.sin(a)
      );
    }
    p.endShape();
  });
}

