export default class TimelineRenderer {
    constructor() {
      this.MARGIN_LEFT = 120;
      this.MARGIN_TOP = 100;
      this.MARGIN_RIGHT = 200;
      this.EVENT_TEXT_WIDTH = 150;
    }
  
    rgba(colorObj) {
      if (!colorObj) return 'rgba(0,0,0,1)';
      const a = colorObj.a !== undefined ? colorObj.a / 255 : 1;
      return `rgba(${colorObj.r},${colorObj.g},${colorObj.b},${a})`;
    }
  
    draw({ p5, allDatesInPeriod, cyclesToDrawPerDay, sleepData1, sleepData2, eventData, settings }) {
      const { background, fill, noStroke, stroke, strokeWeight, rect, text, textSize, textAlign, line, ellipse, map } = p5;
      const ROW_HEIGHT = settings.rowHeight;
      const ROW_GAP = settings.rowGap;
      const widthInner = p5.width - this.EVENT_TEXT_WIDTH - this.MARGIN_RIGHT;
  
      background(this.rgba(settings.canvasBgColor));
      this.drawBackgrounds(p5, allDatesInPeriod.length, ROW_HEIGHT, ROW_GAP, settings);
  
      for (let i = 0; i < allDatesInPeriod.length; i++) {
        const dateStr = allDatesInPeriod[i];
        const yBase = this.MARGIN_TOP + i * (ROW_HEIGHT + ROW_GAP);
  
        // 記録なし日の背景
        if (!this._hasData(sleepData1, dateStr)) {
          noStroke();
          fill(this.rgba({ ...settings.noRecordDayBgColor1, a: settings.noRecordDayBgAlpha1 }));
          rect(this.MARGIN_LEFT, yBase, widthInner - this.MARGIN_LEFT + this.MARGIN_LEFT, ROW_HEIGHT);
        }
        if (!this._hasData(sleepData2, dateStr)) {
          noStroke();
          fill(this.rgba({ ...settings.noRecordDayBgColor2, a: settings.noRecordDayBgAlpha2 }));
          rect(this.MARGIN_LEFT, yBase, widthInner - this.MARGIN_LEFT + this.MARGIN_LEFT, ROW_HEIGHT);
        }
  
        // 日付テキスト
        noStroke();
        fill(this.rgba(settings.textColor));
        textSize(12);
        textAlign(p5.RIGHT, p5.CENTER);
        const displayDateText = this._computeDateLabel(dateStr, settings.childBirthDateStr);
        text(displayDateText, this.MARGIN_LEFT - 10, yBase + ROW_HEIGHT / 2);
  
        // イベントテキスト
        if (eventData && eventData[dateStr]) {
          noStroke();
          fill(this.rgba(settings.textColor));
          textSize(12);
          textAlign(p5.LEFT, p5.CENTER);
          text(settings.eventTextPrefix + eventData[dateStr], widthInner, yBase + ROW_HEIGHT / 2, this.EVENT_TEXT_WIDTH - 20);
        }
  
        // 睡眠サイクル描画
        const dataForRow = cyclesToDrawPerDay[dateStr] || { person1: [], person2: [] };
        if (settings.isPerson1Visible) {
          this._drawCyclesForRow(p5, dataForRow.person1 || [], settings.sleepColor1, yBase, ROW_HEIGHT, settings);
        }
        if (settings.isPerson2Visible) {
          this._drawCyclesForRow(p5, dataForRow.person2 || [], settings.sleepColor2, yBase, ROW_HEIGHT, settings);
        }
      }
  
      this.drawTimeAxis(p5, settings);
      this.drawZeroOClockGuideLine(p5, settings);
      this.drawLegend(p5, settings);
    }
  
    _hasData(sleepData, dateStr) {
      return sleepData && sleepData[dateStr] && sleepData[dateStr].length > 0;
    }
  
    _computeDateLabel(dateStr, childBirthDateStr) {
      if (!childBirthDateStr) return dateStr;
      const birthDate = new Date(childBirthDateStr);
      const currentDate = new Date(dateStr);
      const ageDays = Math.floor((currentDate - birthDate) / (1000 * 60 * 60 * 24));
      if (ageDays < 0) return dateStr;
      const months = Math.floor(ageDays / 30);
      const days = ageDays % 30;
      return `${dateStr} (${months}m${days}d)`;
    }
  
    _drawCyclesForRow(p5, cycles, colorObj, yBase, rowHeight, settings) {
      const { noStroke, fill, rect, ellipse, map } = p5;
      const widthInner = p5.width - this.EVENT_TEXT_WIDTH - this.MARGIN_RIGHT;
  
      cycles.forEach(cycle => {
        if (!cycle.sleep || !cycle.wake) return;
  
        const [sleepHour, sleepMin] = cycle.sleep.split(':').map(Number);
        const [wakeHour, wakeMin] = cycle.wake.split(':').map(Number);
        const sleepTime = sleepHour + sleepMin / 60;
        const wakeTime = wakeHour + wakeMin / 60;
  
        const xStart = map(sleepTime, 0, 24, this.MARGIN_LEFT, widthInner);
        const xEnd = map(wakeTime, 0, 24, this.MARGIN_LEFT, widthInner);
  
        noStroke();
        fill(this.rgba(colorObj));
        rect(xStart, yBase, xEnd - xStart, rowHeight);
  
        if (settings.dotSize > 0) {
          ellipse(xStart, yBase + rowHeight / 2, settings.dotSize, settings.dotSize);
          ellipse(xEnd, yBase + rowHeight / 2, settings.dotSize, settings.dotSize);
        }
      });
    }
  
    drawBackgrounds(p5, totalRows, rowHeight, rowGap, settings) {
      const { rect, noStroke, fill, map } = p5;
      const widthInner = p5.width - this.EVENT_TEXT_WIDTH - this.MARGIN_RIGHT;
  
      for (let i = 0; i < totalRows; i++) {
        const yBase = this.MARGIN_TOP + i * (rowHeight + rowGap);
        noStroke();
        fill(this.rgba(settings.nightBgColor));
        rect(this.MARGIN_LEFT, yBase, widthInner - this.MARGIN_LEFT + this.MARGIN_LEFT, rowHeight);
  
        fill(this.rgba(settings.dayBgColor));
        const xDayStart = map(7, 0, 24, this.MARGIN_LEFT, widthInner);
        const xDayEnd = map(19, 0, 24, this.MARGIN_LEFT, widthInner);
        rect(xDayStart, yBase, xDayEnd - xDayStart, rowHeight);
      }
    }
  
    drawTimeAxis(p5, settings) {
      const { text, textAlign, textSize, line, stroke, strokeWeight, fill, map } = p5;
      const widthInner = p5.width - this.EVENT_TEXT_WIDTH - this.MARGIN_RIGHT;
  
      for (let h = 0; h <= 24; h += 1) {
        const x = map(h, 0, 24, this.MARGIN_LEFT, widthInner);
        stroke(this.rgba(settings.timeAxisColor));
        strokeWeight(1);
        line(x, 0, x, this.MARGIN_TOP - 10);
        noStroke();
        fill(this.rgba(settings.textColor));
        textSize(10);
        textAlign(p5.CENTER, p5.BOTTOM);
        text(`${h}:00`, x, this.MARGIN_TOP - 12);
      }
    }
  
    drawZeroOClockGuideLine(p5, settings) {
      const { stroke, strokeWeight, line, map } = p5;
      const x = map(0, 0, 24, this.MARGIN_LEFT, p5.width - this.EVENT_TEXT_WIDTH - this.MARGIN_RIGHT);
      stroke(this.rgba(settings.guideLineColor));
      strokeWeight(settings.guideLineWeight);
      line(x, 0, x, p5.height);
    }
  
    drawLegend(p5, settings) {
      const { fill, rect, text, textSize, textAlign, noStroke } = p5;
      const x = p5.width - this.MARGIN_RIGHT + 20;
      let y = this.MARGIN_TOP;
      textSize(12);
      textAlign(p5.LEFT, p5.TOP);
      noStroke();
      fill(this.rgba(settings.sleepColor1));
      rect(x, y, 20, 10);
      fill(this.rgba(settings.textColor));
      text('Person1', x + 25, y);
      y += 20;
      fill(this.rgba(settings.sleepColor2));
      rect(x, y, 20, 10);
      fill(this.rgba(settings.textColor));
      text('Person2', x + 25, y);
    }
  }
  