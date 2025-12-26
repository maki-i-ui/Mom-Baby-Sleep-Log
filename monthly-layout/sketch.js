/**
sketch.js
 ├─ preload()        // データロード
 ├─ prepareSleepCyclesForDrawing()  // ★データ前処理
 ├─ renderAllMonths()                // ★DOM生成
 ├─ setup() / updateVisualization()
 */
 import { createMonthlyImage } from './charts/createMonthlyImage.js';
 import { spiralRenderer } from './charts/spiralRenderer.js';
 import { barRenderer } from './charts/barRenderer.js';
 import { defaultTheme } from './charts/types.js';
 import { renderIntro, createMonthSection } from './components.js';
 import { createUI } from './ui.js';

let ui;
let sleepData1; // 一人目のデータ
let sleepData2; // 二人目のデータ
let descriptionData;
let eventData;
let allDatesInPeriod = []; // 期間内のすべての日付を格納する新しい変数
let minDateFromData = null;
let maxDateFromData = null;

// --- 時間軸に関する定数 ---
// 各行の表示範囲を午前7時から翌日の午前7時とする
const DISPLAY_START_HOUR = 7;//7;
const DISPLAY_END_HOUR = 7+24;//7 + 24; // 翌日の7時

const DISPLAY_START_MINUTE_ABSOLUTE = DISPLAY_START_HOUR * 60; // 7時の絶対分数 (0:00基準)
const DISPLAY_END_MINUTE_ABSOLUTE = DISPLAY_END_HOUR * 60; // 翌7時の絶対分数 (0:00基準)

// 事前計算された描画データを格納するグローバル変数
let dailySleepData = {};

// The date of pregnancy day 0 (in YYYY-MM-DD format)
const pregnancyStartDate = new Date("2024-05-11");
const birthDate = new Date("2025-01-18");
/**
 * 事前ロード関数: JSONデータを読み込む
 * loadJSONは非同期なので、読み込み完了後にコールバック関数が呼ばれるようにする
 */

new p5((p) => {
  p.preload=()=> {
    console.log("preload")
      // sleepData1の読み込み
      p.loadJSON('../data/sleep_wake_data.json', (data) => {
        sleepData1 = data;
        // sleepData2も読み込まれているかチェックしてから日付計算を呼び出す
        if (sleepData2) { // sleepData2が先に読み込まれている場合
          calculateMinMaxDatesFromData();
        }
      });
    
      // sleepData2の読み込み
      p.loadJSON('../data/sleep_wake_data_2.json', (data) => {
        sleepData2 = data;
        // sleepData1も読み込まれているかチェックしてから日付計算を呼び出す
        if (sleepData1) { // sleepData1が先に読み込まれている場合
          calculateMinMaxDatesFromData();
        }
      });

      // イベントデータをロード
      p.loadJSON('../data/event.json', (data) => { // ファイル名を 'event.json' に変更
      eventData = data; // 変数名を eventData に変更
      if (sleepData1 && sleepData2) {
        calculateMinMaxDatesFromData();
      }
      });

      // 説明文データをロード
      p.loadJSON('../data/descriptions.json', (data) => { 
        descriptionData = data; 
        });
    }

  /**
   * sleepData1 と sleepData2 から最も古い日付と新しい日付を計算する関数
   * この関数は、両方のJSONデータがロードされた後にのみ実行されるべき
   */
  function calculateMinMaxDatesFromData() {
      // データがまだロードされていない場合は、何もしない (二重呼び出し対策)
      if (!sleepData1 || !sleepData2 || minDateFromData !== null) {
          return; 
      }

      let allKeys = new Set();

      for (const dateKey in sleepData1) {
          allKeys.add(dateKey);
      }
      for (const dateKey in sleepData2) {
          allKeys.add(dateKey);
      }

      if (allKeys.size === 0) {
          console.warn("データファイルから日付が見つかりませんでした。データが空か、正しいJSON形式ではありません。");
          return;
      }

      const sortedDates = Array.from(allKeys).sort((a, b) => {
          return new Date(a).getTime() - new Date(b).getTime();
      });

      minDateFromData = sortedDates[0];
      maxDateFromData = sortedDates[sortedDates.length - 1];

      console.log(`データ範囲: ${minDateFromData} から ${maxDateFromData}`);
  }

  /**
   * 特定の人のデータにその日付のエントリが存在するかどうかをチェックします。
   * @param {object} data - チェックする睡眠データ (sleepData1 または sleepData2)
   * @param {string} date - チェックする日付文字列
   * @returns {boolean} データエントリが存在すれば true、そうでなければ false
   */
  function hasDataEntryForPerson(data, date) {
      return data[date] !== undefined && data[date] !== null && data[date].length > 0;
  }
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const DAYS_PER_MONTH = 30;

  function getPregnancyOrPostpartumMonth(dateStr) {
    const d = new Date(dateStr);
    d.setHours(0,0,0,0);


    const pregStartMs = pregnancyStartDate.getTime();
    const birthMs = birthDate.getTime();
    const t = d.getTime();

    if (t < pregStartMs) return null;

    // 妊娠中
    if (t < birthMs) {
      const days = Math.floor((t - pregStartMs) / MS_PER_DAY);
      const monthIndex = Math.floor(days / DAYS_PER_MONTH);
      return {
        phase: 'pregnancy',
        index: monthIndex,
        label: `妊娠${monthIndex}ヶ月`
      };
    }

    // 産後
    const days = Math.floor((t - birthMs) / MS_PER_DAY);
    const monthIndex = Math.floor(days / DAYS_PER_MONTH);
    return {
      phase: 'postpartum',
      index: monthIndex,
      label: `産後${monthIndex}ヶ月`
    };
  }


  /**
   * 各日の睡眠・起床サイクルを描画するデータを事前に準備する関数
   * この関数は、allDatesInPeriod内の各日付に対して、その1周に描画されるべき睡眠サイクルを計算し、cyclesToDrawPerDayに格納します。
   */

  function buildDailySleepData() {
    const dailySleepData = {};
  
    // 初期化
    for (const dateStr of allDatesInPeriod) {
      dailySleepData[dateStr] = {
        person1: { cycles: [], stats: { totalSleepMs: 0, maxSleepMs: 0 } },
        person2: { cycles: [], stats: { totalSleepMs: 0, maxSleepMs: 0 } }
      };
    }
  
    const allSleepCycles = [];
  
    function appendCyclesFromData(sleepData, personId) {
      const childBirthDateMs = birthDate.setHours(0,0,0,0);
      for (const dateKey in sleepData) {
        if (!hasDataEntryForPerson(sleepData, dateKey)) continue;
  
        const baseMs = new Date(dateKey).setHours(0,0,0,0);
  
        for (const cycle of sleepData[dateKey]) {
          if (!cycle.sleep || !cycle.wake) continue;
  
          const sH = +cycle.sleep.slice(0,2);
          const sM = +cycle.sleep.slice(3,5);
          let sleepStartMs = baseMs + (sH * 60 + sM) * 60 * 1000;
  
          let wakeBaseMs = baseMs;
          if (cycle.wake_date) {
            wakeBaseMs = new Date(cycle.wake_date).setHours(0,0,0,0);
          }
  
          const wH = +cycle.wake.slice(0,2);
          const wM = +cycle.wake.slice(3,5);
          let wakeEndMs = wakeBaseMs + (wH * 60 + wM) * 60 * 1000;
          
          // 24:00 → 翌日 00:00 の扱い
          if (cycle.wake === "24:00") {
            wakeEndMs = baseMs + 24 * 60 * 60 * 1000;
          }

          // 日またぎ処理
          if (wakeEndMs <= sleepStartMs) {
            wakeEndMs += 24 * 60 * 60 * 1000;
          }
  
          // 出生日前の person2 除外
          if (personId === 2 && childBirthDateMs > 0 && sleepStartMs < childBirthDateMs) {
            continue;
          }
  
          allSleepCycles.push({
            person: personId,
            sleep: cycle.sleep,
            wake: cycle.wake,
            sleepStartMs,
            wakeEndMs
          });
        }
      }
    }
  
    appendCyclesFromData(sleepData1, 1);
    appendCyclesFromData(sleepData2, 2);
  
    // ---- 1日のリング（7時から翌7時で1周）に対し、睡眠の開始時間が重なっている cycle を割り当てる ----
    for (const dateStr of allDatesInPeriod) {
      const dayStartMs = new Date(dateStr).setHours(0,0,0,0);
      const rowStartMs = dayStartMs + DISPLAY_START_MINUTE_ABSOLUTE * 60 * 1000;
      const rowEndMs   = dayStartMs + DISPLAY_END_MINUTE_ABSOLUTE   * 60 * 1000;
  
      for (const cycle of allSleepCycles) {
        if (!(rowStartMs <= cycle.sleepStartMs && cycle.sleepStartMs < rowEndMs)) {
          continue;
        }
  
        const durationMs = cycle.wakeEndMs - cycle.sleepStartMs;
        const personKey = cycle.person === 1 ? 'person1' : 'person2';
  
        const day = dailySleepData[dateStr][personKey];
  
        day.cycles.push(cycle);
        day.stats.totalSleepMs += durationMs;
        day.stats.maxSleepMs = Math.max(day.stats.maxSleepMs, durationMs);
      }
    }
  
    return dailySleepData;
  }
  


  /**
   * 指定された開始日から終了日までの全ての日付を生成し、allDatesInPeriodを更新する関数
   */
  function generateAllDatesInPeriod() {
      const startDateStr = startDatePicker.value;
      const endDateStr = endDatePicker.value;

      if (!startDateStr || !endDateStr) {
          console.warn("開始日と終了日を指定してください。");
          allDatesInPeriod = [];
          updateVisualization(); // 空の状態で可視化を更新
          return;
      }

      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      if (startDate > endDate) {
          console.warn("開始日は終了日より前である必要があります。");
          allDatesInPeriod = [];
          updateVisualization(); // 空の状態で可視化を更新
          return;
      }

      allDatesInPeriod = [];
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
          // ISO形式 (YYYY-MM-DD) で日付文字列を追加
          allDatesInPeriod.push(currentDate.toISOString().split('T')[0]);
          currentDate.setDate(currentDate.getDate() + 1);
      }

      if (allDatesInPeriod.length === 0) {
          console.warn("指定された期間内に日付が見つかりませんでした。");
          createCanvas(windowWidth - select('#controls').width, windowHeight).parent(select('body'));
          background(255);
          textSize(20);
          textAlign(CENTER, CENTER);
          fill(0);
          text("指定された期間内に日付が見つかりませんでした。", width / 2, height / 2);
          noLoop();
          return;
      }

      // 日付が生成された後、描画データを準備する関数を呼び出す
      dailySleepData = buildDailySleepData();
      // その後で可視化を更新（これにより redraw() が呼ばれる）
      updateVisualization();

     
  }

  function groupDatesByPregnancyPhase(dateList) {
      const map = {};
    
      dateList.forEach(dateStr => {
        const info = getPregnancyOrPostpartumMonth(dateStr);
        if (!info) return;
    
        const key = `${info.phase}-${info.index}`;
    
        if (!map[key]) {
          map[key] = {
            label: info.label,
            phase: info.phase,
            index: info.index,
            dates: []
          };
        }
    
        map[key].dates.push(dateStr);
      });
    
      // index順に並び替え
      return Object.values(map).sort((a, b) => {
        if (a.phase !== b.phase) {
          return a.phase === 'pregnancy' ? -1 : 1;
        }
        return a.index - b.index;
      });
  }
    
  function getDescription(data, phase, index) {
    const item = data.find(
      d => d.phase === phase && d.index === index
    );
    return item ? item.description : null;
  }

  async function renderAllMonths(config) {
    const container = document.getElementById('monthly-spirals');
    container.innerHTML = '';

    const dateGroups = groupDatesByPregnancyPhase(allDatesInPeriod);

    for (const dateGroup of dateGroups) {

      const [spiralURL1,spiralURL2, barURL1,barURL2] = await Promise.all([
        createMonthlyImage({
          renderer: spiralRenderer,
          dates:dateGroup.dates,
          data: dailySleepData,
          person: 'person1',
          width: 800,
          height: 800,
          resolution: 2,
          theme: defaultTheme,
          config,
        }),
        createMonthlyImage({
          renderer: spiralRenderer,
          dates:dateGroup.dates,
          data: dailySleepData,
          person: 'person2',
          width: 800,
          height: 800,
          resolution: 2,
          theme: defaultTheme,
          config,
        }),
        createMonthlyImage({
          renderer: barRenderer,
          dates:dateGroup.dates,
          data: dailySleepData,
          person: 'person1',
          width: 160,
          height: dateGroup.dates.length * 16,
          theme: defaultTheme,
          config,
        }),
        createMonthlyImage({
          renderer: barRenderer,
          dates:dateGroup.dates,
          data: dailySleepData,
          person: 'person2',
          width: 160,
          height: dateGroup.dates.length * 16,
          theme: defaultTheme,
          config,
        })
      ]);

      const description = getDescription(descriptionData,dateGroup.phase,dateGroup.index)
      const section = createMonthSection(dateGroup, spiralURL1,spiralURL2,barURL1,barURL2, description);
      container.appendChild(section);
    }
  }




  /**
   * セットアップ関数: キャンバスの作成、UI要素の初期化、イベントリスナーの設定
   */

  p.setup=()=> {  
    console.log("setup")
    ui = createUI({
      minDateFromData,
      maxDateFromData,
      onUpdateVisualization: updateVisualization,
      onGenerateAllDates: generateAllDatesInPeriod
    });
    // pregnancyStartDate = new Date("2024-05-11");
    // birthDate = new Date("2025-01-18");

    // setUpUI();
    generateAllDatesInPeriod();
    p.noCanvas(); // DOMだけ使うなら
    p.noLoop(); // ← p5.js の draw を止める
    }
    

  /**
   * 可視化の更新関数: UIコントロールの値に基づいて描画設定を更新し、再描画する
   */
  function updateVisualization() {
    const uiState = ui.readUIState(p);
    const renderConfig = {
      ...uiState,
      theme: defaultTheme,
    };

    // updateUI();
    // redraw();
    renderIntro('intro');
    renderAllMonths(renderConfig);
  }

  /**
   * メイン描画ループ: redraw()が呼び出された時のみ実行される
   */
  function draw() {
  }


  /**
   * A function to toggle the controls panel open and closed
   */
  function toggleControlsPanel() {
      // class の ON/OFF
      controlsPanel.classList.toggle('open');

      if (controlsPanel.classList.contains('open')) {
          toggleButton.textContent = 'Close Settings Panel';
      } else {
          toggleButton.textContent = 'Open Settings Panel';
      }
  }
});
