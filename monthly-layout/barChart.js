function generateMaxSleepBarChartImage(statsPerDay, options = {}) {
    const {
      width = 800,
      height = 200,
      barHeight = 2,
      gap = 2,
      bgColor = '#090040',
      barColor1 = '#3dffe8',
      barColor2 = '#fbff00',
      maxHours = 7
    } = options;
  
    const days = Object.keys(statsPerDay);
  
    const sketch = (p) => {
      let canvas;
  
      p.setup = () => {
        canvas = p.createCanvas(width, height);
        p.noLoop();
      };
  
      p.draw = () => {
        p.background(bgColor);
  
        const maxMs = maxHours * 60 * 60 * 1000;
        const scaleX = width / maxMs;
        days.forEach((date, i) => {
          const y = i * (barHeight * 2 + gap) + 20;
  
          const p1 = statsPerDay[date]?.person1?.maxSleepMs ?? 0;
          const p2 = statsPerDay[date]?.person2?.maxSleepMs ?? 0;
            
          // person1
          p.noStroke();
          p.fill(barColor1);
          p.rect(0, y, p1 * scaleX, barHeight);
  
          // person2
          p.fill(barColor2);
          p.rect(0, y + barHeight, p2 * scaleX, barHeight);
        });
      };
  
      p.getImageURL = () => {
        return canvas.elt.toDataURL('image/png');
      };
    };
  
    const pInstance = new p5(sketch, document.createElement('div'));
  
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(pInstance.getImageURL());
        pInstance.remove();
      }, 0);
    });
  }
  

async function createMonthlyMaxSleepBarImage(monthDates) {
    const stats = {};

    monthDates.forEach(date => {
        if (sleepStatsToDrawPerDay[date]) {
        stats[date] = sleepStatsToDrawPerDay[date];
        }
    });
    const gap = 4;
    const barHeight = 4;

    return await generateMaxSleepBarChartImage(stats, {
        width: 160,
        height: monthDates.length * (gap + barHeight),
        barHeight : barHeight,
        gap : gap,
        maxHours: 7
    });
}