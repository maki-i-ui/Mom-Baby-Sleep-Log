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
   * 0時〜24時統一版 prepareSleepCyclesForDrawing
   * 入力: { sleepData1, sleepData2, allDatesInPeriod, childBirthDateStr }
   * 出力: { 'YYYY-MM-DD': { person1: [...], person2: [...] } }
   * 各 cycle は { person, sleep, wake, sleepStartMs, wakeEndMs } の形
   */
  export function prepareSleepCyclesForDrawing({
    sleepData1 = {},
    sleepData2 = {},
    allDatesInPeriod = [],
    childBirthDateStr = ''
  }) {
    const allSleepCycles = [];
  
    // 子の誕生日フィルタ用
    let childBirthDateMs = 0;
    if (childBirthDateStr) {
      const t = new Date(childBirthDateStr);
      childBirthDateMs = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
    }
  
    // helper: "HH:MM" → ms
    const toMs = (dateKey, hhmm) => {
      const [hh, mm] = hhmm.split(':').map(s => parseInt(s, 10));
      const base = new Date(dateKey);
      return base.getTime() + (hh * 60 + mm) * 60 * 1000;
    };
  
    // person1
    for (const dateKey in sleepData1) {
      if (!hasDataEntryForPerson(sleepData1, dateKey)) continue;
      for (const cycle of sleepData1[dateKey]) {
        if (!cycle || !cycle.sleep || !cycle.wake) continue;
        try {
          let sleepStartMs = toMs(dateKey, cycle.sleep);
          let wakeEndMs = toMs(dateKey, cycle.wake);
          if (wakeEndMs <= sleepStartMs) wakeEndMs += 24 * 60 * 60 * 1000;
          allSleepCycles.push({
            person: 1,
            sleep: cycle.sleep,
            wake: cycle.wake,
            sleepStartMs,
            wakeEndMs
          });
        } catch (e) { console.warn("parse error", e); }
      }
    }
  
    // person2
    for (const dateKey in sleepData2) {
      if (!hasDataEntryForPerson(sleepData2, dateKey)) continue;
      const sleepStartDateMs = new Date(dateKey).setHours(0, 0, 0, 0);
      if (childBirthDateMs > 0 && sleepStartDateMs < childBirthDateMs) continue;
  
      for (const cycle of sleepData2[dateKey]) {
        if (!cycle || !cycle.sleep || !cycle.wake) continue;
        try {
          let sleepStartMs = toMs(dateKey, cycle.sleep);
          let wakeEndMs = toMs(dateKey, cycle.wake);
          if (wakeEndMs <= sleepStartMs) wakeEndMs += 24 * 60 * 60 * 1000;
          allSleepCycles.push({
            person: 2,
            sleep: cycle.sleep,
            wake: cycle.wake,
            sleepStartMs,
            wakeEndMs
          });
        } catch (e) { console.warn("parse error", e); }
      }
    }
  
    // 日ごとの集計
    const cyclesToDrawPerDay = {};
    for (const displayDateStr of allDatesInPeriod) {
      const displayDateObj = new Date(displayDateStr);
      const rowStartMs = displayDateObj.getTime();
      const rowEndMs = rowStartMs + 24 * 60 * 60 * 1000;
  
      const cyclesForPerson1 = [];
      const cyclesForPerson2 = [];
  
      for (const cycle of allSleepCycles) {
        if (!(cycle.wakeEndMs <= rowStartMs || cycle.sleepStartMs >= rowEndMs)) {
          if (cycle.person === 1) cyclesForPerson1.push(cycle);
          if (cycle.person === 2) cyclesForPerson2.push(cycle);
        }
      }
  
      cyclesToDrawPerDay[displayDateStr] = {
        person1: cyclesForPerson1,
        person2: cyclesForPerson2
      };
    }
  
    return cyclesToDrawPerDay;
  }
  