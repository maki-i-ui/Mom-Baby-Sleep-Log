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
        resolution
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
  resolution
}) {
  if (!cycles?.length || !stats) return;

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

  const d = new Date(date);
  const dayStartMs = new Date(d.setHours(0, 0, 0, 0)).getTime();

  const centerX = p.width / 2 / resolution;
  const centerY = p.height / 2 / resolution;


  const rStart = config.BASE_RADIUS + index * config.RING_SPACING;
  const rEnd = rStart + config.RING_SPACING;

  const msToAngle = (ms) =>
    ((ms - dayStartMs) / (24 * 60 * 60 * 1000)) * p.TWO_PI - p.HALF_PI;

  const msToRadius = (ms) =>
    p.lerp(rStart, rEnd, (ms - dayStartMs) / (24 * 60 * 60 * 1000));

  p.stroke(col);
  p.noFill();
  p.strokeWeight(config.SLEEP_LINE_WEIGHT);

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
