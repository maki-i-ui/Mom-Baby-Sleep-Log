// renderMonthlyByDate.js
export function renderMonthlyByDate({
    p,
    dates,
    data,
    person,
    drawDay,
  }) {
    dates.forEach((date, index) => {
      const dayData = data[date]?.[person];
      if (!dayData) return;
  
      drawDay({
        p,
        date,
        index,
        dayData,
      });
    });
  }
  