export function drawVisualization(drawData, settings, eventData) {
    background(rgba(settings.canvasBg));
    let dayIndex = 0;
    for (let [date, cycles] of Object.entries(drawData)) {
      let y = 50 + dayIndex * 20;
  
      if (cycles.person1 && settings.showPerson1) {
        drawSleepBlocks(cycles.person1, y, settings.color1);
      }
      if (cycles.person2 && settings.showPerson2) {
        drawSleepBlocks(cycles.person2, y + 10, settings.color2);
      }
  
      fill(255);
      noStroke();
      textSize(10);
      text(date, 10, y - 5);
  
      dayIndex++;
    }
  }
  
  function drawSleepBlocks(cycles, y, col) {
    fill(rgba(col));
    noStroke();
    for (let c of cycles) {
      let x1 = timeToX(c.start);
      let x2 = timeToX(c.end);
      rect(x1, y, x2 - x1, 8);
    }
  }
  
  function timeToX(timeStr) {
    let d = new Date(timeStr);
    return map(d.getHours() * 60 + d.getMinutes(), 0, 24 * 60, 100, width - 50);
  }
  function rgba(obj) {
    // obj = {r,g,b,a} の形式
    return color(obj.r, obj.g, obj.b, obj.a);
  }