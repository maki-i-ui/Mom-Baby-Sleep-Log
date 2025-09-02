// modules/rendererLongest.js
// LongestRenderer: 各日について「最長連続睡眠時間」を計算し、横軸を「睡眠時間（分）」に置き換えて描画するレンダラー
export class LongestRenderer {
    constructor() {
      this.MARGIN_TOP = 100;
      this.MARGIN_BOTTOM = 30;
      this.MARGIN_LEFT = 140;
      this.MARGIN_RIGHT = 60;
      this.EVENT_TEXT_WIDTH = 300;
    }
  
    draw({ p5, allDatesInPeriod, cyclesToDrawPerDay, sleepData1, sleepData2, eventData, settings }) {
      const { background, fill, noStroke, stroke, rect, text, textSize, textAlign, map } = p5;
      background(settings.canvasBgColor);
  
      // compute max duration across all days to build scale
      let maxDurMin = 1;
      const perDay = {};
      for (const date of allDatesInPeriod) {
        const row = cyclesToDrawPerDay[date] || {person1: [], person2: []};
        const longest1 = this._calcLongestMin(row.person1);
        const longest2 = this._calcLongestMin(row.person2);
        perDay[date] = { longest1, longest2 };
        maxDurMin = Math.max(maxDurMin, longest1 || 0, longest2 || 0);
      }
  
      const vizRight = width - this.EVENT_TEXT_WIDTH - this.MARGIN_RIGHT;
  
      // draw axis: 0 .. maxDurMin minutes
      textAlign(LEFT);
      textSize(12);
      fill(settings.textColor);
      text(`Longest sleep (min) →`, 10, this.MARGIN_TOP - 20);
      // ticks
      const ticks = 5;
      for (let i=0;i<=ticks;i++){
        const v = Math.round((maxDurMin * i) / ticks);
        const x = map(v, 0, maxDurMin, this.MARGIN_LEFT, vizRight);
        text(v, x, this.MARGIN_TOP - 5);
        stroke(150);
        line(x, this.MARGIN_TOP, x, height - this.MARGIN_BOTTOM);
      }
  
      // draw rows
      for (let i=0;i<allDatesInPeriod.length;i++){
        const date = allDatesInPeriod[i];
        const y = this.MARGIN_TOP + i * (settings.rowHeight + settings.rowGap);
        // date label
        noStroke();
        fill(settings.textColor);
        textAlign(RIGHT, CENTER);
        text(date, this.MARGIN_LEFT - 10, y + settings.rowHeight/2);
  
        // person1 bar
        if (settings.isPerson1Visible && perDay[date].longest1) {
          const w = map(perDay[date].longest1, 0, maxDurMin, 0, vizRight - this.MARGIN_LEFT);
          fill(settings.sleepColor1);
          rect(this.MARGIN_LEFT, y, w, settings.rowHeight/3);
        }
        // person2 bar (below)
        if (settings.isPerson2Visible && perDay[date].longest2) {
          const w = map(perDay[date].longest2, 0, maxDurMin, 0, vizRight - this.MARGIN_LEFT);
          fill(settings.sleepColor2);
          rect(this.MARGIN_LEFT, y + settings.rowHeight/2, w, settings.rowHeight/3);
        }
      }
    }
  
    _calcLongestMin(cycles) {
      if (!cycles || cycles.length === 0) return 0;
      let maxMin = 0;
      for (const c of cycles) {
        const durMin = (c.wakeEndMs - c.sleepStartMs) / (60*1000);
        if (durMin > maxMin) maxMin = durMin;
      }
      return Math.round(maxMin);
    }
  }
  