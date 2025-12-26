// barRenderer.js
import { renderMonthlyByDate } from './renderMonthlyByDate.js';

export function barRenderer({
  p,
  dates,
  data,
  person,
  theme,
  barHeight = 4,
  gap = 8,
  maxHours = 7,
  resolution = 1,
}) {
  p.background(theme.bgColor);
  p.scale(resolution);

  const logicalWidth = p.width / resolution;
  const maxMs = maxHours * 60 * 60 * 1000;
  const scaleX = logicalWidth / maxMs;

  renderMonthlyByDate({
    p,
    dates,
    data,
    person,
    drawDay: ({ p, index, dayData }) => {
      const y = index * (barHeight * 2 + gap);
      const { totalSleepMs = 0, maxSleepMs = 0 } = dayData.stats || {};

      p.noStroke();
      p.fill(...theme.bars.total);
      p.rect(0, y, totalSleepMs * scaleX, barHeight);

      p.fill(...theme.bars.max);
      p.rect(0, y, maxSleepMs * scaleX, barHeight);
    },
  });
}
