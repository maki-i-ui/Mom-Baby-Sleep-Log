/**
sketch.js
 ├─ preload()        // データロード
 ├─ prepareSleepCyclesForDrawing()  // ★データ前処理
 ├─ drawSleepWakeCyclesSpiralOnGraphics() // ★1日の描画
 ├─ renderSpiralForMonth()           // ★月キャンバス描画
 ├─ renderAllMonths()                // ★DOM生成
 ├─ setup() / updateVisualization()
 */


let sleepData1; // 一人目のデータ
let sleepData2; // 二人目のデータ
let eventData;
let descriptionData;
let allDatesInPeriod = []; // 期間内のすべての日付を格納する新しい変数
let minDateFromData = null;
let maxDateFromData = null;
// --- 可視化に関する設定変数 ---
let monthWidth =320;
let monthHeight =320;
let RESOLUTION = 2;
let BASE_RADIUS;
let RING_SPACING;
let SLEEP_LINE_WEIGHT; // 睡眠ラインの太さ
let SLEEP_COLOR1; // 一人目の睡眠色
let SLEEP_COLOR2; // 二人目の睡眠色
let TEXT_COLOR;
let CANVAS_BG_COLOR;

// UI要素の参照
let baseRadiusSlider, ringSpacingSlider;
let sleepLineWeightSlider, sleepLineWeightValue; 
let sleepColorPicker1, sleepColorAlphaSlider1, sleepColorAlphaValue1;
let sleepColorPicker2, sleepColorAlphaSlider2, sleepColorAlphaValue2;
let canvasBgColorPicker;
let toggleButton; // 追加
let controlsPanel; // 追加
// --- 期間設定用のUI要素 ---
let pregnancyStartDate; // Date
let birthDate;          // Date
let startDatePicker, endDatePicker, applyDateRangeButton,childBirthDatePicker;

// --- 時間軸に関する定数 ---
// 各行の表示範囲を午前7時から翌日の午前7時とする
const DISPLAY_START_HOUR = 7;//7;
const DISPLAY_END_HOUR = 7+24;//7 + 24; // 翌日の7時

const DISPLAY_START_MINUTE_ABSOLUTE = DISPLAY_START_HOUR * 60; // 7時の絶対分数 (0:00基準)
const DISPLAY_END_MINUTE_ABSOLUTE = DISPLAY_END_HOUR * 60; // 翌7時の絶対分数 (0:00基準)

// 事前計算された描画データを格納するグローバル変数
let cyclesToDrawPerDay = {};
let sleepStatsToDrawPerDay = {};

// The date of pregnancy day 0 (in YYYY-MM-DD format)
const PREGNANCY_START_DATE = '2024-05-11'; 

/**
 * 事前ロード関数: JSONデータを読み込む
 * loadJSONは非同期なので、読み込み完了後にコールバック関数が呼ばれるようにする
 */
function preload() {
    // sleepData1の読み込み
    loadJSON('../data/sleep_wake_data.json', (data) => {
      sleepData1 = data;
      // sleepData2も読み込まれているかチェックしてから日付計算を呼び出す
      if (sleepData2) { // sleepData2が先に読み込まれている場合
        calculateMinMaxDatesFromData();
      }
    });
  
    // sleepData2の読み込み
    loadJSON('../data/sleep_wake_data_2_test.json', (data) => {
      sleepData2 = data;
      // sleepData1も読み込まれているかチェックしてから日付計算を呼び出す
      if (sleepData1) { // sleepData1が先に読み込まれている場合
        calculateMinMaxDatesFromData();
      }
    });

    // イベントデータをロード
    loadJSON('../data/event.json', (data) => { // ファイル名を 'event.json' に変更
    eventData = data; // 変数名を eventData に変更
    if (sleepData1 && sleepData2) {
      calculateMinMaxDatesFromData();
     }
    });

    // 説明文データをロード
    loadJSON('../data/descriptions.json', (data) => { 
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

    // ここで setup() を呼び出すことで、preloadが完了した後にUIを初期化できる
    // ただし、p5.jsの通常フローではsetupは自動で呼ばれるため、この直接呼び出しは不要な場合が多い。
    // 今回はpreload()内でUI初期化に必要な情報をセットしているので、
    // setup()が呼ばれる前にmin/maxDateがセットされることを期待する。
    // もしsetup()内で初期化がうまくいかない場合は、この場所でgenerateAllDatesInPeriod()を呼ぶことも検討する。
    
    // ここで generateAllDatesInPeriod() を呼び出して初期描画を確実にトリガーすることもできます
    // 今回は setup() の最後に generateAllDatesInPeriod() があるので、この行は削除しました。
    // updateVisualization(); // もし setup() 外で初期描画をトリガーしたい場合
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

function prepareSleepCyclesForDrawing() {
    cyclesToDrawPerDay = {}; 
    sleepStatsToDrawPerDay = {};

    let allSleepCyclesWithAbsoluteTime = [];

    // 出生日を ms に
    const childBirthDateStr = childBirthDatePicker.value;
    const childBirthDateMs = childBirthDateStr
        ? new Date(new Date(childBirthDateStr).setHours(0,0,0,0)).getTime()
        : 0;

    // --------------------------------------------------------------------
    // sleepDataX を絶対時刻化して1本の配列にする
    // --------------------------------------------------------------------
    function appendCyclesFromData(sleepData, personId) {
        for (const dateKey in sleepData) {
            if (!hasDataEntryForPerson(sleepData, dateKey)) continue;

            const baseDate = new Date(dateKey);
            const baseMs = new Date(baseDate.setHours(0,0,0,0)).getTime();

            for (const cycle of sleepData[dateKey]) {
                if (!cycle.sleep || !cycle.wake) continue;

                // --- sleep 時刻 ---
                const sH = +cycle.sleep.slice(0, 2);
                const sM = +cycle.sleep.slice(3, 5);
                let sleepStartMs = baseMs + (sH * 60 + sM) * 60 * 1000;

                // --- wake 時刻 ---
                let wakeBaseMs = baseMs;
                if (cycle.wake_date) {
                    // wake_date がある → 完全に翌日/別日
                    wakeBaseMs = new Date(cycle.wake_date).setHours(0,0,0,0);
                }

                const wH = +cycle.wake.slice(0, 2);
                const wM = +cycle.wake.slice(3, 5);
                let wakeEndMs = wakeBaseMs + (wH * 60 + wM) * 60 * 1000;

                // 24:00 → 翌日 00:00 の扱い
                if (cycle.wake === "24:00") {
                    wakeEndMs = baseMs + 24 * 60 * 60 * 1000;
                }

                // 日またぎ処理
                if (wakeEndMs <= sleepStartMs) {
                    wakeEndMs += 24 * 60 * 60 * 1000;
                }

                // Person2のみ、出生日以前のデータを除外
                if (personId === 2 && childBirthDateMs > 0 && sleepStartMs < childBirthDateMs) {
                    continue;
                }

                // ★ ここが重要：cycle は完全体として1つだけ push（分割しない）
                allSleepCyclesWithAbsoluteTime.push({
                    person: personId,
                    date: dateKey,
                    sleep :cycle.sleep,
                    wake :cycle.wake,
                    sleepStartMs,
                    wakeEndMs

                });
            }
        }
    }

    appendCyclesFromData(sleepData1, 1);
    appendCyclesFromData(sleepData2, 2);

    // --------------------------------------------------------------------
    // 1日のリング（7時から翌7時で1周）に対し、睡眠の開始時間が重なっている cycle を割り当てる（描画用）
    // --------------------------------------------------------------------
    for (let i = 0; i < allDatesInPeriod.length; i++) {

        const dateStr = allDatesInPeriod[i];
        const d = new Date(dateStr);
        const dayStartMs = new Date(d.setHours(0,0,0,0)).getTime();

        const rowStartMs = dayStartMs + DISPLAY_START_MINUTE_ABSOLUTE * 60 * 1000;
        const rowEndMs   = dayStartMs + DISPLAY_END_MINUTE_ABSOLUTE   * 60 * 1000;

        let p1 = [];
        let p2 = [];

        // ★ 統計初期化
        sleepStatsToDrawPerDay[dateStr] = {
          person1: {
              totalSleepMs: 0,
              maxSleepMs: 0
          },
          person2: {
              totalSleepMs: 0,
              maxSleepMs: 0
          }
        };
      
        for (const cycle of allSleepCyclesWithAbsoluteTime) {

          const overlaps =
              (rowStartMs <= cycle.sleepStartMs && cycle.sleepStartMs < rowEndMs);
  
          if (!overlaps) continue;
  
          const durationMs = cycle.wakeEndMs - cycle.sleepStartMs;
  
          if (cycle.person === 1) {
              p1.push(cycle);
  
              sleepStatsToDrawPerDay[dateStr].person1.totalSleepMs += durationMs;
              sleepStatsToDrawPerDay[dateStr].person1.maxSleepMs =
                  Math.max(
                      sleepStatsToDrawPerDay[dateStr].person1.maxSleepMs,
                      durationMs
                  );
  
          } else {
              p2.push(cycle);
  
              sleepStatsToDrawPerDay[dateStr].person2.totalSleepMs += durationMs;
              sleepStatsToDrawPerDay[dateStr].person2.maxSleepMs =
                  Math.max(
                      sleepStatsToDrawPerDay[dateStr].person2.maxSleepMs,
                      durationMs
                  );
          }
      }
  
      cyclesToDrawPerDay[dateStr] = {
          person1: p1,
          person2: p2
      };
  }
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
    prepareSleepCyclesForDrawing(); 
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

async function renderAllMonths() {
  const container = document.getElementById('monthly-spirals');
  container.innerHTML = '';

  const dateGroups = groupDatesByPregnancyPhase(allDatesInPeriod);

  for (const dateGroup of dateGroups) {

    const [spiralURL, barURL] = await Promise.all([
      createMonthlySpiralImage({
        dates: dateGroup.dates,
        width: monthWidth,
        height: monthHeight,
        resolution: RESOLUTION,
      }),
      createMonthlyMaxSleepBarImage({
        dates: dateGroup.dates,
        statsPerDay: sleepStatsToDrawPerDay
      })
    ]);

    const description = getDescription(descriptionData,dateGroup.phase,dateGroup.index)
    const section = createMonthSection(dateGroup, spiralURL,barURL, description);
    container.appendChild(section);
  }
}




/**
 * セットアップ関数: キャンバスの作成、UI要素の初期化、イベントリスナーの設定
 */

function setup() {  
    pregnancyStartDate = new Date("2024-05-11");
    birthDate = new Date("2025-01-18");

    toggleButton = document.querySelector('#toggle-button');
    controlsPanel = document.querySelector('#controls');
    toggleButton.addEventListener('click', toggleControlsPanel);
  
    startDatePicker = document.querySelector('#startDatePicker');
    endDatePicker = document.querySelector('#endDatePicker');
    applyDateRangeButton = document.querySelector('#applyDateRangeButton');
    childBirthDatePicker = document.querySelector('#childBirthDatePicker');
  
    baseRadiusSlider = document.querySelector('#baseRadiusSlider');
    baseRadiusValue = document.querySelector('#baseRadiusValue');
  
    ringSpacingSlider = document.querySelector('#ringSpacingSlider');
    ringSpacingValue = document.querySelector('#ringSpacingValue');
  
    sleepLineWeightSlider = document.querySelector('#sleepLineWeightSlider');
    sleepLineWeightValue = document.querySelector('#sleepLineWeightValue');
  
    sleepColorPicker1 = document.querySelector('#sleepColorPicker1');
    sleepColorAlphaSlider1 = document.querySelector('#sleepColorAlphaSlider1');
    sleepColorAlphaValue1 = document.querySelector('#sleepColorAlphaValue1');
  
    sleepColorPicker2 = document.querySelector('#sleepColorPicker2');
    sleepColorAlphaSlider2 = document.querySelector('#sleepColorAlphaSlider2');
    sleepColorAlphaValue2 = document.querySelector('#sleepColorAlphaValue2');
  
    textColorPicker = document.querySelector('#textColorPicker');
    canvasBgColorPicker = document.querySelector('#canvasBgColorPicker');
  
    //
    // --- イベントリスナーの置き換え ---
    //
  
    applyDateRangeButton.addEventListener('click', generateAllDatesInPeriod);
    childBirthDatePicker.addEventListener('input', generateAllDatesInPeriod);
  
    startDatePicker.addEventListener('input', updateVisualization);
    endDatePicker.addEventListener('input', updateVisualization);
  
    baseRadiusSlider.addEventListener('input', updateVisualization);
    ringSpacingSlider.addEventListener('input', updateVisualization);
    sleepLineWeightSlider.addEventListener('input', updateVisualization);
  
    sleepColorPicker1.addEventListener('input', updateVisualization);
    sleepColorAlphaSlider1.addEventListener('input', updateVisualization);
  
    sleepColorPicker2.addEventListener('input', updateVisualization);
    sleepColorAlphaSlider2.addEventListener('input', updateVisualization);
  
    textColorPicker.addEventListener('input', updateVisualization);
    canvasBgColorPicker.addEventListener('input', updateVisualization);
  
    //
    // --- 日付ピッカー初期値設定 ---
    //
    if (minDateFromData && maxDateFromData) {
      startDatePicker.value = minDateFromData;
      endDatePicker.value = maxDateFromData;
    }
  
    generateAllDatesInPeriod();
    //
    // --- 初期レンダリング ---
    //
    noCanvas(); // DOMだけ使うなら


    noLoop(); // ← p5.js の draw を止める
  }
  

/**
 * 可視化の更新関数: UIコントロールの値に基づいて描画設定を更新し、再描画する
 */
function updateVisualization() {
  BASE_RADIUS = parseInt(baseRadiusSlider.value);
  RING_SPACING = parseInt(ringSpacingSlider.value);
  SLEEP_LINE_WEIGHT = parseInt(sleepLineWeightSlider.value);

  const sleepHex1 = sleepColorPicker1.value;
  const sleepR1 = unhex(sleepHex1.substring(1, 3));
  const sleepG1 = unhex(sleepHex1.substring(3, 5));
  const sleepB1 = unhex(sleepHex1.substring(5, 7));
  const sleepA1 = parseInt(sleepColorAlphaSlider1.value);
  SLEEP_COLOR1 = color(sleepR1, sleepG1, sleepB1, sleepA1);

  const sleepHex2 = sleepColorPicker2.value;
  const sleepR2 = unhex(sleepHex2.substring(1, 3));
  const sleepG2 = unhex(sleepHex2.substring(3, 5));
  const sleepB2 = unhex(sleepHex2.substring(5, 7));
  const sleepA2 = parseInt(sleepColorAlphaSlider2.value);
  SLEEP_COLOR2 = color(sleepR2, sleepG2, sleepB2, sleepA2);
  
  // 新しいカラーピッカーのUI要素を紐づける
  
  const textHex = textColorPicker.value;
  TEXT_COLOR = color(unhex(textHex.substring(1, 3)), unhex(textHex.substring(3, 5)), unhex(textHex.substring(5, 7)));

  const canvasBgR = unhex(canvasBgColorPicker.value.substring(1, 3));
    const canvasBgG = unhex(canvasBgColorPicker.value.substring(3, 5));
    const canvasBgB = unhex(canvasBgColorPicker.value.substring(5, 7));
    CANVAS_BG_COLOR = color(canvasBgR, canvasBgG, canvasBgB);

  baseRadiusValue.innerHTML =BASE_RADIUS;
  ringSpacingValue.innerHTML =RING_SPACING;
  sleepLineWeightValue.innerHTML =SLEEP_LINE_WEIGHT;
  sleepColorAlphaValue1.innerHTML =sleepA1;
  sleepColorAlphaValue2.innerHTML =sleepA2;


  redraw();
  renderIntro('intro');
  renderAllMonths();
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

