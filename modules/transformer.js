// modules/transformer.js
// 目的: 元コードの prepareSleepCyclesForDrawing を再現して、
//       allDatesInPeriod の各日付に対して person1/person2 の
//       描画用サイクル配列を返す。

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
   * prepareSleepCyclesForDrawing の復刻版（機能は元コードに合わせる）
   * 入力: { sleepData1, sleepData2, allDatesInPeriod, childBirthDateStr }
   * 出力: { 'YYYY-MM-DD': { person1: [...], person2: [...] } }
   * 各 cycle は { person, sleep, wake, sleepStartMs, wakeEndMs } の形
   */
  export function prepareSleepCyclesForDrawing({ sleepData1 = {}, sleepData2 = {}, allDatesInPeriod = [], childBirthDateStr = '' }) {
    const DISPLAY_START_MINUTE_ABSOLUTE = 7 * 60;
    const DISPLAY_END_MINUTE_ABSOLUTE = (7 + 24) * 60;
  
    let allSleepCyclesWithAbsoluteTime = [];
  
    // child birth ms
    let childBirthDateMs = 0;
    if (childBirthDateStr) {
      const t = new Date(childBirthDateStr);
      childBirthDateMs = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
    }
  
    // helper to parse "HH:MM" with base date (dateKey)
    const toMs = (dateKey, hhmm) => {
      const [hh, mm] = hhmm.split(':').map(s => parseInt(s,10));
      const base = new Date(dateKey);
      return base.getTime() + (hh * 60 + mm) * 60 * 1000;
    };
  
    // iterate person1
    for (const dateKey in sleepData1) {
      if (!hasDataEntryForPerson(sleepData1, dateKey)) continue;
      for (const cycle of sleepData1[dateKey]) {
        if (!cycle || !cycle.sleep || !cycle.wake) continue;
        try {
          let sleepStartMs = toMs(dateKey, cycle.sleep);
          let wakeEndMs = toMs(dateKey, cycle.wake);
          if (wakeEndMs <= sleepStartMs) wakeEndMs += 24*60*60*1000;
          allSleepCyclesWithAbsoluteTime.push({
            person: 1,
            sleep: cycle.sleep,
            wake: cycle.wake,
            sleepStartMs,
            wakeEndMs
          });
        } catch(e){ console.warn("parse error", e); }
      }
    }
  
    // iterate person2 (child) with birth filter
    for (const dateKey in sleepData2) {
      if (!hasDataEntryForPerson(sleepData2, dateKey)) continue;
      // check birth filter: skip cycles whose day < childBirthDate
      const sleepStartDateMs = (() => {
        const d = new Date(dateKey);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      })();
      if (childBirthDateMs > 0 && sleepStartDateMs < childBirthDateMs) {
        continue;
      }
  
      for (const cycle of sleepData2[dateKey]) {
        if (!cycle || !cycle.sleep || !cycle.wake) continue;
        try {
          let sleepStartMs = toMs(dateKey, cycle.sleep);
          let wakeEndMs = toMs(dateKey, cycle.wake);
          if (wakeEndMs <= sleepStartMs) wakeEndMs += 24*60*60*1000;
          allSleepCyclesWithAbsoluteTime.push({
            person: 2,
            sleep: cycle.sleep,
            wake: cycle.wake,
            sleepStartMs,
            wakeEndMs
          });
        } catch(e){ console.warn("parse error", e); }
      }
    }
  
    // now for each display row, pick cycles overlapping that row (7:00 - +24h -> next day 7:00)
    const cyclesToDrawPerDay = {};
    for (let i = 0; i < allDatesInPeriod.length; i++) {
      const displayDateStr = allDatesInPeriod[i];
      const displayDateObj = new Date(displayDateStr);
      const rowDisplayStartMs = displayDateObj.getTime() + DISPLAY_START_MINUTE_ABSOLUTE * 60 * 1000;
      const rowDisplayEndMs = displayDateObj.getTime() + DISPLAY_END_MINUTE_ABSOLUTE * 60 * 1000;
  
      let cyclesForCurrentRowPerson1 = [];
      let cyclesForCurrentRowPerson2 = [];
  
      for (const cycle of allSleepCyclesWithAbsoluteTime) {
        if (!(cycle.wakeEndMs <= rowDisplayStartMs || cycle.sleepStartMs >= rowDisplayEndMs)) {
          if (cycle.person === 1) cyclesForCurrentRowPerson1.push(cycle);
          if (cycle.person === 2) cyclesForCurrentRowPerson2.push(cycle);
        }
      }
  
      cyclesToDrawPerDay[displayDateStr] = {
        person1: cyclesForCurrentRowPerson1,
        person2: cyclesForCurrentRowPerson2
      };
    }
  
    return cyclesToDrawPerDay;
  }
  