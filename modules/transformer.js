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
  export function prepareSleepCyclesForDrawing({
    sleepData1 = {},
    sleepData2 = {},
    allDatesInPeriod = [],
    childBirthDateStr = ''
  }) {
    const allSleepCyclesByDay = {};
  
    // 子の誕生日フィルタ
    let childBirthDateMs = 0;
    if (childBirthDateStr) {
      const t = new Date(childBirthDateStr);
      childBirthDateMs = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
    }
  
    const processData = (data, person) => {
      for (const dateKey in data) {
        if (!hasDataEntryForPerson(data, dateKey)) continue;
  
        const dateMs = new Date(dateKey).setHours(0, 0, 0, 0);
        if (person === 2 && childBirthDateMs > 0 && dateMs < childBirthDateMs) continue;
  
        for (const cycle of data[dateKey]) {
          if (!cycle || !cycle.sleep || !cycle.wake) continue;
  
          const sleepStartMs = new Date(`${dateKey}T${cycle.sleep}:00`).getTime();
          const wakeEndMs = cycle.wake_date
            ? new Date(`${cycle.wake_date}T${cycle.wake}:00`).getTime()
            : (() => {
                const w = new Date(`${dateKey}T${cycle.wake}:00`).getTime();
                return w <= sleepStartMs ? w + 24 * 60 * 60 * 1000 : w;
              })();
  
          // 日跨ぎ分割
          let curStartMs = sleepStartMs;
          while (curStartMs < wakeEndMs) {
            const curDate = new Date(curStartMs);
            const curDateStr = curDate.toISOString().split('T')[0];
            const nextMidnightMs = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate() + 1).getTime();
            const curEndMs = Math.min(nextMidnightMs, wakeEndMs);
  
            const sleepStr = curStartMs === sleepStartMs ? cycle.sleep : '00:00';
            const wakeStr = curEndMs === wakeEndMs
              ? cycle.wake
              : '23:59';
  
            if (!allSleepCyclesByDay[curDateStr]) {
              allSleepCyclesByDay[curDateStr] = { person1: [], person2: [] };
            }
            allSleepCyclesByDay[curDateStr][`person${person}`].push({
              sleep: sleepStr,
              wake: wakeStr,
              sleepStartMs: curStartMs,
              wakeEndMs: curEndMs
            });
  
            curStartMs = curEndMs;
          }
        }
      }
    };
  
    processData(sleepData1, 1);
    processData(sleepData2, 2);
  
    // allDatesInPeriod に合わせて空の日も作る
    const cyclesToDrawPerDay = {};
    for (const dateStr of allDatesInPeriod) {
      cyclesToDrawPerDay[dateStr] = allSleepCyclesByDay[dateStr] || { person1: [], person2: [] };
    }
  
    return cyclesToDrawPerDay;
  }
  