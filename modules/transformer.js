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
   * 日をまたぐ場合に分割して描画するための prepareSleepCyclesForDrawing
   */
  export function prepareSleepCyclesForDrawing({ sleepData1 = {}, sleepData2 = {}, allDatesInPeriod = [], childBirthDateStr = '' }) {
    const DISPLAY_START_MINUTE_ABSOLUTE = 0 * 60;       // 7:00
    const DISPLAY_END_MINUTE_ABSOLUTE = (0 + 24) * 60;  // 翌日7:00
  
    let allSleepCyclesWithAbsoluteTime = [];
  
    // 子の誕生日フィルタ用
    let childBirthDateMs = 0;
    if (childBirthDateStr) {
      const t = new Date(childBirthDateStr);
      childBirthDateMs = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
    }
  
    // helper to parse "HH:MM" with base date (dateKey)
    const toMs = (dateKey, hhmm) => {
      const [hh, mm] = hhmm.split(':').map(s => parseInt(s, 10));
      const base = new Date(dateKey);
      return base.getTime() + (hh * 60 + mm) * 60 * 1000;
    };
  
    // helper to split跨ぎ
    const splitIfCrosses = (person, sleep, wake, sleepStartMs, wakeEndMs) => {
      const parts = [];
      let curStart = sleepStartMs;
      while (curStart < wakeEndMs) {
        const curDate = new Date(curStart);
        const next7am = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate(), 7, 0, 0, 0).getTime();
        const curEnd = Math.min(wakeEndMs, next7am + 24 * 60 * 60 * 1000); // 翌日の7:00
        parts.push({
          person,
          sleep,
          wake,
          sleepStartMs: curStart,
          wakeEndMs: curEnd
        });
        curStart = curEnd;
      }
      return parts;
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
  
          const splitCycles = splitIfCrosses(1, cycle.sleep, cycle.wake, sleepStartMs, wakeEndMs);
          allSleepCyclesWithAbsoluteTime.push(...splitCycles);
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
  
          const splitCycles = splitIfCrosses(2, cycle.sleep, cycle.wake, sleepStartMs, wakeEndMs);
          allSleepCyclesWithAbsoluteTime.push(...splitCycles);
        } catch (e) { console.warn("parse error", e); }
      }
    }
  
    // 日ごとの割り当て
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
  