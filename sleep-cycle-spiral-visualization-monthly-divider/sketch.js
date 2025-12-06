let sleepData1; // 一人目のデータ
let sleepData2; // 二人目のデータ
let eventData;
let allDatesInPeriod = []; // 期間内のすべての日付を格納する新しい変数
let minDateFromData = null;
let maxDateFromData = null;
// --- 可視化に関する設定変数 ---
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
let startDatePicker, endDatePicker, applyDateRangeButton,childBirthDatePicker;

// --- 時間軸に関する定数 ---
// 各行の表示範囲を午前7時から翌日の午前7時とする
const DISPLAY_START_HOUR = 7;//7;
const DISPLAY_END_HOUR = 7+24;//7 + 24; // 翌日の7時

const DISPLAY_START_MINUTE_ABSOLUTE = DISPLAY_START_HOUR * 60; // 7時の絶対分数 (0:00基準)
const DISPLAY_END_MINUTE_ABSOLUTE = DISPLAY_END_HOUR * 60; // 翌7時の絶対分数 (0:00基準)

// 事前計算された描画データを格納するグローバル変数
let cyclesToDrawPerDay = {};

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
 * セットアップ関数: キャンバスの作成、UI要素の初期化、イベントリスナーの設定
 */
function setup() {
    

  // --- UI要素の参照とイベントリスナーの設定 ---
  toggleButton = select('#toggle-button');
  controlsPanel = select('#controls');
  toggleButton.mousePressed(toggleControlsPanel); // クリックイベントを設定


  // --- UI要素の参照とイベントリスナーの設定 ---
  startDatePicker = select('#startDatePicker');
  endDatePicker = select('#endDatePicker');
  applyDateRangeButton = select('#applyDateRangeButton');
  applyDateRangeButton.mousePressed(generateAllDatesInPeriod); // ボタンクリックで日付範囲を生成・更新
  childBirthDatePicker = select('#childBirthDatePicker'); // <-- 追加
  childBirthDatePicker.input(generateAllDatesInPeriod); // 出生日変更時も再描画するように
  
  // データから計算した最小/最大日付を日付ピッカーの初期値に設定
  if (minDateFromData && maxDateFromData) {
    startDatePicker.value(minDateFromData);
    endDatePicker.value(maxDateFromData);
}
  baseRadiusSlider = select('#baseRadiusSlider');
  baseRadiusValue = select('#baseRadiusValue');
  baseRadiusSlider.input(updateVisualization);
  
  ringSpacingSlider = select('#ringSpacingSlider');
  ringSpacingValue = select('#ringSpacingValue');
  ringSpacingSlider.input(updateVisualization);

  sleepLineWeightSlider = select('#sleepLineWeightSlider');
  sleepLineWeightValue = select('#sleepLineWeightValue');
  sleepLineWeightSlider.input(updateVisualization);

  sleepColorPicker1 = select('#sleepColorPicker1');
  sleepColorAlphaSlider1 = select('#sleepColorAlphaSlider1');
  sleepColorAlphaValue1 = select('#sleepColorAlphaValue1');
  sleepColorPicker1.input(updateVisualization);
  sleepColorAlphaSlider1.input(updateVisualization);

  sleepColorPicker2 = select('#sleepColorPicker2');
  sleepColorAlphaSlider2 = select('#sleepColorAlphaSlider2');
  sleepColorAlphaValue2 = select('#sleepColorAlphaValue2');
  sleepColorPicker2.input(updateVisualization);
  sleepColorAlphaSlider2.input(updateVisualization);
  
  // 新しいカラーピッカーのUI要素を紐づける

  textColorPicker = select('#textColorPicker');
  textColorPicker.input(updateVisualization);

  canvasBgColorPicker = select('#canvasBgColorPicker');
canvasBgColorPicker.input(updateVisualization);


  // 初期表示のために期間を生成し、可視化を更新
  generateAllDatesInPeriod(); 
  noLoop(); // draw() 関数は updateVisualization() でのみ呼び出されるようにする
}
function groupDatesByMonth(dateList) {
    const map = {};
  
    dateList.forEach(d => {
      const key = d.slice(0, 7); // "YYYY-MM"
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
  
    return map; // 例: { "2024-10": [...dates], "2024-11": [...dates] }
  }
// g: createGraphics()で作ったもの
// datesInMonth: その月の ["2024-10-01", "2024-10-02"...]
function renderSpiralForMonth(g, datesInMonth) {

    g.background(CANVAS_BG_COLOR);
  
    datesInMonth.forEach((dateStr, index) => {
      const dayCycles = cyclesToDrawPerDay[dateStr] || { person1: [], person2: [] };
  
      drawSleepWakeCyclesSpiralOnGraphics(g, dayCycles.person1, SLEEP_COLOR1, dateStr, index);
      drawSleepWakeCyclesSpiralOnGraphics(g, dayCycles.person2, SLEEP_COLOR2, dateStr, index);
    });
  }

function renderAllMonths() {
    const container = document.getElementById('monthly-spirals');
    container.innerHTML = "";
  
    const grouped = groupDatesByMonth(allDatesInPeriod);
    console.log(grouped)
  
    for (const month in grouped) {
      const g = createGraphics(80, 80); // 好きなサイズ
  
      renderSpiralForMonth(g, grouped[month]);
  
      const imgURL = g.canvas.toDataURL();
  
      const div = document.createElement('div');
      div.className = "month-container";
      div.innerHTML = `
         <h3>${month}</h3>
         <img src="${imgURL}" />
      `;
      container.appendChild(div);
    }
  }



/**
 * 指定された開始日から終了日までの全ての日付を生成し、allDatesInPeriodを更新する関数
 */
function generateAllDatesInPeriod() {
    const startDateStr = startDatePicker.value();
    const endDateStr = endDatePicker.value();

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


/**
 * 可視化の更新関数: UIコントロールの値に基づいて描画設定を更新し、再描画する
 */
function updateVisualization() {
  BASE_RADIUS = parseInt(baseRadiusSlider.value());
  RING_SPACING = parseInt(ringSpacingSlider.value());
  SLEEP_LINE_WEIGHT = parseInt(sleepLineWeightSlider.value());

  const sleepHex1 = sleepColorPicker1.value();
  const sleepR1 = unhex(sleepHex1.substring(1, 3));
  const sleepG1 = unhex(sleepHex1.substring(3, 5));
  const sleepB1 = unhex(sleepHex1.substring(5, 7));
  const sleepA1 = parseInt(sleepColorAlphaSlider1.value());
  SLEEP_COLOR1 = color(sleepR1, sleepG1, sleepB1, sleepA1);

  const sleepHex2 = sleepColorPicker2.value();
  const sleepR2 = unhex(sleepHex2.substring(1, 3));
  const sleepG2 = unhex(sleepHex2.substring(3, 5));
  const sleepB2 = unhex(sleepHex2.substring(5, 7));
  const sleepA2 = parseInt(sleepColorAlphaSlider2.value());
  SLEEP_COLOR2 = color(sleepR2, sleepG2, sleepB2, sleepA2);
  
  // 新しいカラーピッカーのUI要素を紐づける
  
  const textHex = textColorPicker.value();
  TEXT_COLOR = color(unhex(textHex.substring(1, 3)), unhex(textHex.substring(3, 5)), unhex(textHex.substring(5, 7)));

  const canvasBgR = unhex(canvasBgColorPicker.value().substring(1, 3));
    const canvasBgG = unhex(canvasBgColorPicker.value().substring(3, 5));
    const canvasBgB = unhex(canvasBgColorPicker.value().substring(5, 7));
    CANVAS_BG_COLOR = color(canvasBgR, canvasBgG, canvasBgB);

  baseRadiusValue.html(BASE_RADIUS);
  ringSpacingValue.html(RING_SPACING);
  sleepLineWeightValue.html(SLEEP_LINE_WEIGHT);
  sleepColorAlphaValue1.html(sleepA1);
  sleepColorAlphaValue2.html(sleepA2);


  redraw();
  renderAllMonths();
}

/**
 * メイン描画ループ: redraw()が呼び出された時のみ実行される
 */
function draw() {
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

/**
 * 各日の睡眠・起床サイクルを描画するデータを事前に準備する関数
 * この関数は、allDatesInPeriod内の各日付に対して、その1周に描画されるべき睡眠サイクルを計算し、cyclesToDrawPerDayに格納します。
 */

function prepareSleepCyclesForDrawing() {
    cyclesToDrawPerDay = {}; 

    let allSleepCyclesWithAbsoluteTime = [];

    // 出生日を ms に
    const childBirthDateStr = childBirthDatePicker.value();
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

        for (const cycle of allSleepCyclesWithAbsoluteTime) {

            // ★ 睡眠の開始時点がこの期間と重なっている cycle をだけ「この日の描画対象」とする
            const overlaps =
                (rowStartMs <= cycle.sleepStartMs && cycle.sleepStartMs < rowEndMs);

            if (overlaps) {
                if (cycle.person === 1) p1.push(cycle);
                else p2.push(cycle);
            }
        }

        cyclesToDrawPerDay[dateStr] = { person1: p1, person2: p2 };
    }
}

/**
 * 各日の睡眠・起床サイクルを横一列に描画します。(7:00-翌7:00基準)
 * @param {Array} cycles - 描画する睡眠サイクルデータの配列（すでにその行に描画すべきもののみ）
 * @param {p5.Color} color - 描画色
 * @param {number} yBase - 描画する行のベースとなるY座標
 * @param {string} displayDateStr - 現在描画している行の基準となる日付文字列 (例: "2024-10-17")
 * @param {number} currentColumnYBase - 現在描画している列の基準Y座標
 * @param {number} currentColumnIndex - allDatesInPeriodにおける現在の描画列のインデックス
 */
/**
 * 螺旋状に睡眠サイクルを描画する関数
 */
function drawSleepWakeCyclesSpiralOnGraphics(g, cycles, col, dateStr, dayIndex) {
    if (!cycles || cycles.length === 0) return;

    const colorRed = g.color(255, 80, 80);
    const colorBlue = g.color(80, 120, 255);
    const MAX_POSSIBLE_HOURS = 7;

    let maxHours = 0;
    cycles.forEach(cycle => {

        const hours = (cycle.wakeEndMs - cycle.sleepStartMs) / (1000 * 60 * 60);
        if (hours > maxHours) maxHours = hours;
    });

    let t = constrain(maxHours / MAX_POSSIBLE_HOURS, 0, 1);
    let colorVal = lerpColor(colorRed, colorBlue, t);

    const d = new Date(dateStr);
    const dayStartMs = new Date(d.setHours(0, 0, 0, 0)).getTime();
    const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;

    const centerX = g.width / 2;
    const centerY = g.height / 2;

    const baseR = BASE_RADIUS;

    // ▼0:00の半径
    const rStart = baseR + dayIndex * RING_SPACING;
    // ▼翌日0:00の半径
    const rEnd = baseR + (dayIndex + 1) * RING_SPACING;
    const radiusDelta = rEnd - rStart;

    g.strokeWeight(SLEEP_LINE_WEIGHT);

    // ms → 0〜TWO_PI
    const msToAngle = (ms) => ((ms - dayStartMs) / (24 * 60 * 60 * 1000)) * TWO_PI;
    const ANGLE_OFFSET = -HALF_PI;

    // 時刻 → 半径（0:00 → 1.0 → 24:00）
    const msToRadius = (ms) => {
        const f = (ms - dayStartMs) / (24 * 60 * 60 * 1000); // 0〜1
        return rStart + radiusDelta * f;
    };
    for (const c of cycles) {
        const segStart =c.sleepStartMs;
        const segEnd = c.wakeEndMs;
        if (segEnd <= segStart) continue;

        const startA = msToAngle(segStart) + ANGLE_OFFSET;
        const endA = msToAngle(segEnd) + ANGLE_OFFSET;

        g.stroke(colorVal);
        g.noFill();

        const steps = 60;
        const da = (endA - startA) / steps;
        const dms = (segEnd - segStart) / steps;
    
        g.beginShape();
        for (let i = 0; i <= steps; i++) {
            const ms = segStart + dms * i;       // この頂点の時刻
            const a = startA + da * i;           // この頂点の角度
            const rr = msToRadius(ms);           // ★この頂点の半径（線形増加）

            const x = centerX + rr * cos(a);
            const y = centerY + rr * sin(a);

            g.vertex(x, y);
            
        }
        g.endShape();

    }
}

/**
 * A function to toggle the controls panel open and closed
 */
function toggleControlsPanel() {
    controlsPanel.toggleClass('open');
    if (controlsPanel.hasClass('open')) {
        toggleButton.html('Close Settings Panel');
    } else {
        toggleButton.html('Open Settings Panel');
    }
}

