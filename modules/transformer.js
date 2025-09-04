// modules/transformer.js

export function generateAllDatesInPeriod(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start) || isNaN(end) || start > end) return [];
    const arr = [];
    let cur = new Date(start);
    while (cur <= end) {
      arr.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }
  
  function hasDataEntryForPerson(data, date) {
    return data && data[date] && Array.isArray(data[date]) && data[date].length > 0;
  }
  
  /**
   * 日跨ぎを 24:00 で切り分ける prepareSleepCyclesForDrawing
   */
export function prepareSleepCyclesForDrawing({ sleepData1, sleepData2, allDatesInPeriod }) {
  const cyclesToDrawPerDay = {};

  // 人ごとに処理
  const persons = { person1: sleepData1, person2: sleepData2 };

  Object.keys(persons).forEach(personKey => {
    const sleepData = persons[personKey];

    Object.keys(sleepData).forEach(dateStr => {
      if (!cyclesToDrawPerDay[dateStr]) cyclesToDrawPerDay[dateStr] = { person1: [], person2: [] };

      const cycles = sleepData[dateStr];
      if (!Array.isArray(cycles)) return;

      cycles.forEach(cycle => {
        const isNextDay = cycle.wake_date && cycle.wake_date !== dateStr;

        if (!isNextDay) {
          // 当日内の睡眠
          cyclesToDrawPerDay[dateStr][personKey].push({
            sleep: cycle.sleep,
            wake: cycle.wake
          });
        } else {
          // 日跨ぎ睡眠
          // 当日分
          cyclesToDrawPerDay[dateStr][personKey].push({
            sleep: cycle.sleep,
            wake: "23:59"
          });
          // 翌日分
          const nextDate = cycle.wake_date;
          if (!cyclesToDrawPerDay[nextDate]) cyclesToDrawPerDay[nextDate] = { person1: [], person2: [] };
          cyclesToDrawPerDay[nextDate][personKey].push({
            sleep: "00:00",
            wake: cycle.wake
          });
        }
      });
    });
  });

  return cyclesToDrawPerDay;
}

  