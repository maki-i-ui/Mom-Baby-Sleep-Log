/**
 * spiralChart.js
 * 月単位スパイラル画像を生成して imgURL を返す
 */

async function createMonthlySpiralImage({
    dates,
    width,
    height,
    resolution
  }) {
    const g = createGraphics(width * resolution, height * resolution);
    g.pixelDensity(1);
  
    renderSpiralForMonth(g, dates);
  
    const imgURL = g.canvas.toDataURL('image/png');
  
    g.remove?.();
    return Promise.resolve(imgURL);
  }
  
  /* =========================
     以下は完全に内部実装
     ========================= */
  
  function renderSpiralForMonth(g, datesInMonth) {
    g.background(CANVAS_BG_COLOR);
  
    datesInMonth.forEach((dateStr, index) => {
      const dayCycles = cyclesToDrawPerDay[dateStr] || { person1: [], person2: [] };
      const dayStats  = sleepStatsToDrawPerDay[dateStr];
  
      drawSleepWakeCyclesSpiralOnGraphics(
        g,
        dayCycles.person1,
        dayStats.person1,
        SLEEP_COLOR1,
        dateStr,
        index
      );
  
    //   drawSleepWakeCyclesSpiralOnGraphics(
    //     g,
    //     dayCycles.person2,
    //     dayStats.person2,
    //     SLEEP_COLOR2,
    //     dateStr,
    //     index
    //   );
    });
  }

  /**
 * 螺旋状に睡眠サイクルを描画する関数
 */
function drawSleepWakeCyclesSpiralOnGraphics(g, cycles,stats, col, dateStr, dayIndex) {
    if (!cycles || cycles.length === 0) return;
    g.push();
    g.scale(RESOLUTION);
    const colorRed = g.color(255, 80, 80);
    const colorBlue = g.color(80, 120, 255);
    const MAX_POSSIBLE_HOURS = 7;
    let maxHours = stats.maxSleepMs/ (1000 * 60 * 60)

    let t = constrain(maxHours / MAX_POSSIBLE_HOURS, 0, 1);
    let colorVal = lerpColor(colorRed, colorBlue, t);

    const d = new Date(dateStr);
    const dayStartMs = new Date(d.setHours(0, 0, 0, 0)).getTime();
    const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;

    const centerX = g.width / 2/RESOLUTION;
    const centerY = g.height / 2/RESOLUTION;

    const baseR = BASE_RADIUS;

    // ▼0:00の半径
    const rStart = baseR + dayIndex * RING_SPACING;
    // ▼翌日0:00の半径
    const rEnd = baseR + (dayIndex + 1) * RING_SPACING;
    const radiusDelta = rEnd - rStart;

    g.strokeWeight(SLEEP_LINE_WEIGHT);

    // ms → 0〜TWO_PI
    const msToAngle = (ms) => ((ms - dayStartMs) / (24 * 60 * 60 * 1000)) * TWO_PI;
    const ANGLE_OFFSET = -HALF_PI;

    // 時刻 → 半径（0:00 → 1.0 → 24:00）
    const msToRadius = (ms) => {
        const f = (ms - dayStartMs) / (24 * 60 * 60 * 1000); // 0〜1
        return rStart + radiusDelta * f;
    };
    for (const c of cycles) {
        const segStart =c.sleepStartMs;
        const segEnd = c.wakeEndMs;
        if (segEnd <= segStart) continue;

        const startA = msToAngle(segStart) + ANGLE_OFFSET;
        const endA = msToAngle(segEnd) + ANGLE_OFFSET;

        g.stroke(colorVal);
        g.noFill();

        const steps = 60;
        const da = (endA - startA) / steps;
        const dms = (segEnd - segStart) / steps;
    
        g.beginShape();
        for (let i = 0; i <= steps; i++) {
            const ms = segStart + dms * i;       // この頂点の時刻
            const a = startA + da * i;           // この頂点の角度
            const rr = msToRadius(ms);           // ★この頂点の半径（線形増加）

            const x = centerX + rr * cos(a);
            const y = centerY + rr * sin(a);

            g.vertex(x, y);
            
        }
        g.endShape();

    }
    g.pop();
}
  