let sleepData1; // 一人目のデータ
let sleepData2; // 二人目のデータ
let eventData;
let allDatesInPeriod = []; // 期間内のすべての日付を格納する新しい変数
let minDateFromData = null;
let maxDateFromData = null;

// --- グラフに関する設定変数 ---
let ROW_HEIGHT; // 1日の列全体の高さ (棒グラフの高さ)
let ROW_GAP;    // 日の間の隙間

let SLEEP_LINE_WEIGHT; // 棒の太さ（元のsleepLineWeightを使用）

let SLEEP_COLOR1; // 一人目の睡眠色
let SLEEP_COLOR2; // 二人目の睡眠色
let TIME_AXIS_COLOR;
let TEXT_COLOR;

let DAY_BG_COLOR;
let NIGHT_BG_COLOR;
let NO_RECORD_DAY_BG_COLOR; // 記録なし日の背景色

// --- 補助線に関する設定変数 ---
let GUIDE_LINE_WEIGHT;
let GUIDE_LINE_COLOR;
let EVENT_TEXT_OFFSET; // 追加: イベントテキストのオフセット
let EVENT_TEXT_PREFIX = "◀︎ "; // 追加: プレフィックス記号
let SHOW_TIME_TEXT = true;

// マージン (これらは固定)
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 30;
const MARGIN_LEFT = 60;
const MARGIN_RIGHT = 60; // 可視化領域とイベントテキスト領域の間のマージン
const EVENT_TEXT_WIDTH = 300; // イベントテキストの固定幅を定義

const TEXT_OFFSET_Y = 5; // 時刻テキストのオフセット

// UI要素の参照
let rowHeightSlider, rowGapSlider;
let sleepLineWeightSlider, sleepLineWeightValue; 
let sleepColorPicker1, sleepColorAlphaSlider1, sleepColorAlphaValue1;
let sleepColorPicker2, sleepColorAlphaSlider2, sleepColorAlphaValue2;

// 追加されたカラーピッカーの参照
let timeAxisColorPicker, textColorPicker;
let dayBgColorPicker, nightBgColorPicker;
let noRecordDayBgColorPicker;

let guideLineWeightSlider, guideLineWeightValue, guideLineColorPicker, guideLineAlphaSlider, guideLineAlphaValue;
let showTimeTextCheckbox;
let toggleButton; // 追加
let controlsPanel; // 追加
// --- 期間設定用のUI要素 ---
let startDatePicker, endDatePicker, applyDateRangeButton,childBirthDatePicker;

// --- 時間軸に関する定数 ---
// 1日あたりの最大睡眠時間を24時間（1440分）とする
const MAX_SLEEP_MINUTES = 24 * 60; 

// 事前計算された描画データを格納するグローバル変数
let maxSleepPerDay = {};

/**
 * 事前ロード関数: JSONデータを読み込む
 */
function preload() {
    loadJSON('../data/sleep_wake_data.json', (data) => {
      sleepData1 = data;
      if (sleepData2) {
        calculateMinMaxDatesFromData();
      }
    });
  
    loadJSON('../data/sleep_wake_data_2.json', (data) => {
      sleepData2 = data;
      if (sleepData1) {
        calculateMinMaxDatesFromData();
      }
    });

    loadJSON('../data/event.json', (data) => {
    eventData = data;
    if (sleepData1 && sleepData2) {
      calculateMinMaxDatesFromData();
     }
    });
}

/**
 * sleepData1 と sleepData2 から最も古い日付と新しい日付を計算する関数
 */
function calculateMinMaxDatesFromData() {
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
        console.warn("データファイルから日付が見つかりませんでした。");
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
 * セットアップ関数: キャンバスの作成、UI要素の初期化、イベントリスナーの設定
 */
function setup() {
    let canvas = createCanvas(windowWidth , windowHeight);
    canvas.parent(select('body'));

    toggleButton = select('#toggle-button');
    controlsPanel = select('#controls');
    toggleButton.mousePressed(toggleControlsPanel);

    background(255);
    angleMode(DEGREES);

    startDatePicker = select('#startDatePicker');
    endDatePicker = select('#endDatePicker');
    applyDateRangeButton = select('#applyDateRangeButton');
    applyDateRangeButton.mousePressed(generateAllDatesInPeriod);
    childBirthDatePicker = select('#childBirthDatePicker');
    childBirthDatePicker.input(generateAllDatesInPeriod);
  
    if (minDateFromData && maxDateFromData) {
      startDatePicker.value(minDateFromData);
      endDatePicker.value(maxDateFromData);
    }

    rowHeightSlider = select('#rowHeightSlider');
    rowHeightValue = select('#rowHeightValue');
    rowHeightSlider.input(updateVisualization);
  
    rowGapSlider = select('#rowGapSlider');
    rowGapValue = select('#rowGapValue');
    rowGapSlider.input(updateVisualization);
    
    // スライダーの参照を追加
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
    timeAxisColorPicker = select('#timeAxisColorPicker');
    timeAxisColorPicker.input(updateVisualization);

    textColorPicker = select('#textColorPicker');
    textColorPicker.input(updateVisualization);

    dayBgColorPicker = select('#dayBgColorPicker');
    dayBgColorPicker.input(updateVisualization);

    nightBgColorPicker = select('#nightBgColorPicker');
    nightBgColorPicker.input(updateVisualization);

    noRecordDayBgColorPicker = select('#noRecordDayBgColorPicker');
    noRecordDayBgColorPicker.input(updateVisualization);

    showTimeTextCheckbox = select('#showTimeTextCheckbox');
    showTimeTextCheckbox.changed(updateVisualization);

    guideLineWeightSlider = select('#guideLineWeightSlider');
    guideLineWeightValue = select('#guideLineWeightValue');
    guideLineWeightSlider.input(updateVisualization);

    guideLineColorPicker = select('#guideLineColorPicker');
    guideLineAlphaSlider = select('#guideLineAlphaSlider');
    guideLineAlphaValue = select('#guideLineAlphaValue');
    guideLineColorPicker.input(updateVisualization);
    guideLineAlphaSlider.input(updateVisualization);

    generateAllDatesInPeriod(); 
    noLoop();
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
        updateVisualization();
        return;
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (startDate > endDate) {
        console.warn("開始日は終了日より前である必要があります。");
        allDatesInPeriod = [];
        updateVisualization();
        return;
    }

    allDatesInPeriod = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
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

    prepareMaxSleepForDrawing(); 
    updateVisualization();
}


/**
 * 可視化の更新関数: UIコントロールの値に基づいて描画設定を更新し、再描画する
 */
function updateVisualization() {
    ROW_HEIGHT = parseInt(rowHeightSlider.value());
    ROW_GAP = parseInt(rowGapSlider.value());
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

    const timeAxisHex = timeAxisColorPicker.value();
    TIME_AXIS_COLOR = color(unhex(timeAxisHex.substring(1, 3)), unhex(timeAxisHex.substring(3, 5)), unhex(timeAxisHex.substring(5, 7)));

    const textHex = textColorPicker.value();
    TEXT_COLOR = color(unhex(textHex.substring(1, 3)), unhex(textHex.substring(3, 5)), unhex(textHex.substring(5, 7)));

    DAY_BG_COLOR = color(unhex(dayBgColorPicker.value().substring(1, 3)), unhex(dayBgColorPicker.value().substring(3, 5)), unhex(dayBgColorPicker.value().substring(5, 7)));
    NIGHT_BG_COLOR = color(unhex(nightBgColorPicker.value().substring(1, 3)), unhex(nightBgColorPicker.value().substring(3, 5)), unhex(nightBgColorPicker.value().substring(5, 7)));
  
    const noRecordDayBgR = unhex(noRecordDayBgColorPicker.value().substring(1, 3));
    const noRecordDayBgG = unhex(noRecordDayBgColorPicker.value().substring(3, 5));
    const noRecordDayBgB = unhex(noRecordDayBgColorPicker.value().substring(5, 7));
    NO_RECORD_DAY_BG_COLOR = color(noRecordDayBgR, noRecordDayBgG, noRecordDayBgB);

    SHOW_TIME_TEXT = showTimeTextCheckbox.checked();

    GUIDE_LINE_WEIGHT = parseInt(guideLineWeightSlider.value());
    const guideLineHex = guideLineColorPicker.value();
    const guideLineA = parseInt(guideLineAlphaSlider.value());
    GUIDE_LINE_COLOR = color(unhex(guideLineHex.substring(1, 3)), unhex(guideLineHex.substring(3, 5)), unhex(guideLineHex.substring(5, 7)), guideLineA);

    rowHeightValue.html(ROW_HEIGHT);
    rowGapValue.html(ROW_GAP);
    sleepLineWeightValue.html(SLEEP_LINE_WEIGHT);
    sleepColorAlphaValue1.html(sleepA1);
    sleepColorAlphaValue2.html(sleepA2);
    guideLineWeightValue.html(GUIDE_LINE_WEIGHT);
    guideLineAlphaValue.html(guideLineA);

    resizeCanvasBasedOnContent();
    redraw();
}

/**
 * メイン描画ループ: redraw()が呼び出された時のみ実行される
 */
function draw() {
    background(255);
    drawBarGraph();
}

/**
 * 各日の睡眠・起床サイクルを解析し、その日の最大睡眠時間を分単位で計算します。
 * 7:00始まりの24時間周期でデータを集計します。
 */
function prepareMaxSleepForDrawing() {
    maxSleepPerDay = {}; // データをリセット

    const childBirthDateStr = childBirthDatePicker.value();
    let childBirthDateMs = 0;
    if (childBirthDateStr) {
        const tempDate = new Date(childBirthDateStr);
        childBirthDateMs = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate()).getTime();
    }
    
    // allDatesInPeriod の各日付 (表示行の基準日) について処理
    for (const dateStr of allDatesInPeriod) {
        const displayDateObj = new Date(dateStr);
        // 行の表示期間 (ミリ秒): displayDateStr の 7:00 から 翌日 の 7:00
        const rowDisplayStartMs = displayDateObj.getTime() + (7 * 60) * 60 * 1000;
        const rowDisplayEndMs = rowDisplayStartMs + 24 * 60 * 60 * 1000;

        let maxSleep1 = 0;
        let maxSleep2 = 0;
        
        // Person 1 の睡眠時間を集計
        for (const sleepDate in sleepData1) {
            if (sleepData1[sleepDate]) {
                sleepData1[sleepDate].forEach(cycle => {
                    let sleepStart = new Date(sleepDate + 'T' + cycle.sleep + ':00');
                    let wakeEnd = new Date(sleepDate + 'T' + cycle.wake + ':00');
                    if (wakeEnd <= sleepStart) {
                        wakeEnd = new Date(wakeEnd.getTime() + 24 * 60 * 60 * 1000);
                    }
                    if (sleepStart.getTime() < rowDisplayEndMs && wakeEnd.getTime() > rowDisplayStartMs) {
                        const durationMs = min(wakeEnd.getTime(), rowDisplayEndMs) - max(sleepStart.getTime(), rowDisplayStartMs);
                        maxSleep1 = max(maxSleep1, durationMs / (60 * 1000));
                    }
                });
            }
        }
        
        // Person 2 の睡眠時間を集計
        for (const sleepDate in sleepData2) {
            const sleepStartDateMs = new Date(sleepDate).getTime();
            if (childBirthDateMs > 0 && sleepStartDateMs < childBirthDateMs) {
                continue;
            }

            if (sleepData2[sleepDate]) {
                sleepData2[sleepDate].forEach(cycle => {
                    let sleepStart = new Date(sleepDate + 'T' + cycle.sleep + ':00');
                    let wakeEnd = new Date(sleepDate + 'T' + cycle.wake + ':00');
                    if (wakeEnd <= sleepStart) {
                        wakeEnd = new Date(wakeEnd.getTime() + 24 * 60 * 60 * 1000);
                    }
                    if (sleepStart.getTime() < rowDisplayEndMs && wakeEnd.getTime() > rowDisplayStartMs) {
                        const durationMs = min(wakeEnd.getTime(), rowDisplayEndMs) - max(sleepStart.getTime(), rowDisplayStartMs);
                        maxSleep2 = max(maxSleep2, durationMs / (60 * 1000));
                    }
                });
            }
        }
        
        maxSleepPerDay[dateStr] = {
            person1: maxSleep1,
            person2: maxSleep2
        };
    }
}

/**
 * 棒グラフの描画
 */
function drawBarGraph() {
    const totalDays = allDatesInPeriod.length;

    // 縦軸と補助線の描画
    drawAxesAndGuidelines();
    
    // 各日付の棒グラフを描画
    for (let i = 0; i < totalDays; i++) {
        const dateStr = allDatesInPeriod[i];
        const data = maxSleepPerDay[dateStr];
        const yBase = MARGIN_TOP + i * (ROW_HEIGHT + ROW_GAP);
        
        // 記録なし日の網掛け
        drawNoRecordPattern(dateStr, yBase);
        
        // 日付とイベントテキストの描画
        drawDateAndEvents(dateStr, yBase);
        
        // 棒グラフの描画
        if (data) {
            drawBars(data, yBase);
        }
    }
}

/**
 * 棒グラフ本体を描画するヘルパー関数
 */
function drawBars(data, yBase) {
    const vizWidth = width - MARGIN_LEFT - EVENT_TEXT_WIDTH - MARGIN_RIGHT;

    // Person 1の棒グラフを描画
    if (data.person1 > 0) {
        const barLength1 = map(data.person1, 0, MAX_SLEEP_MINUTES, 0, vizWidth);
        const yCenter = yBase + (ROW_HEIGHT / 2);
        stroke(SLEEP_COLOR1);
        strokeWeight(SLEEP_LINE_WEIGHT);
        line(MARGIN_LEFT, yCenter, MARGIN_LEFT + barLength1, yCenter);
    }

    // Person 2の棒グラフを描画
    if (data.person2 > 0) {
        const barLength2 = map(data.person2, 0, MAX_SLEEP_MINUTES, 0, vizWidth);
        const yCenter = yBase + (ROW_HEIGHT / 2);
        stroke(SLEEP_COLOR2);
        strokeWeight(SLEEP_LINE_WEIGHT);
        line(MARGIN_LEFT, yCenter, MARGIN_LEFT + barLength2, yCenter);
    }
}

/**
 * 日付とイベントテキストを描画するヘルパー関数
 */
function drawDateAndEvents(dateStr, yBase) {
    const visualizationRightX = width - EVENT_TEXT_WIDTH - MARGIN_RIGHT;
    const requiredVerticalSpace = 18; 
    const totalRowHeightPerDay = ROW_HEIGHT + ROW_GAP;
    let skipInterval = 1;
    if (totalRowHeightPerDay < requiredVerticalSpace) {
        skipInterval = ceil(requiredVerticalSpace / totalRowHeightPerDay);
        if (skipInterval === 0) skipInterval = 1;
    }

    // 日付テキスト
    if (allDatesInPeriod.indexOf(dateStr) % skipInterval === 0 || allDatesInPeriod.length === 1) {
        fill(TEXT_COLOR);
        textSize(14);
        textAlign(RIGHT, CENTER);
        text(dateStr.substring(5), MARGIN_LEFT - 10, yBase + ROW_HEIGHT / 2);
    }

    // イベントテキストの描画
    if (eventData && eventData[dateStr]) {
        fill(TEXT_COLOR);
        textSize(12);
        textAlign(LEFT, CENTER);
        const eventTextX = visualizationRightX;
        const eventTextY = yBase + ROW_HEIGHT / 2;
        text(EVENT_TEXT_PREFIX, eventTextX, eventTextY);
        const eventMainTextX = eventTextX + textWidth(EVENT_TEXT_PREFIX);
        text(eventData[dateStr], eventMainTextX, eventTextY, EVENT_TEXT_WIDTH - 20);
    }
}

/**
 * 記録なし日の網掛けを描画するヘルパー関数
 */
function drawNoRecordPattern(dateStr, yBase) {
    const vizWidth = width - MARGIN_LEFT - EVENT_TEXT_WIDTH - MARGIN_RIGHT;
    const hasDataEntry1 = hasDataEntryForPerson(sleepData1, dateStr);
    const hasDataEntry2 = hasDataEntryForPerson(sleepData2, dateStr);
    const currentDisplayDateMs = new Date(new Date(dateStr).getFullYear(), new Date(dateStr).getMonth(), new Date(dateStr).getDate()).getTime();
    const childBirthDateMs = childBirthDatePicker.value() ? new Date(childBirthDatePicker.value()).getTime() : 0;
    
    noFill();
    stroke(NO_RECORD_DAY_BG_COLOR);
    strokeWeight(1);
    const lineSpacing = 4;
    const subRowHeight = ROW_HEIGHT / 2;

    // Person 1 (母) の網掛け
    if (!hasDataEntry1) {
        const rectX = MARGIN_LEFT;
        const rectY = yBase;
        const rectW = vizWidth;
        const rectH = subRowHeight;
        for (let x = rectX - rectH; x < rectX + rectW + rectH; x += lineSpacing) {
            line(x, rectY, x + rectH, rectY + rectH);
        }
    }

    // Person 2 (子供) の網掛け
    if (!hasDataEntry2 && (childBirthDateMs === 0 || currentDisplayDateMs >= childBirthDateMs)) {
        const rectX = MARGIN_LEFT;
        const rectY = yBase + subRowHeight;
        const rectW = vizWidth;
        const rectH = subRowHeight;
        const offset = lineSpacing / 2;
        for (let x = rectX - rectH - offset; x < rectX + rectW + rectH; x += lineSpacing) {
            line(x, rectY, x + rectH, rectY + rectH);
        }
    }
}

/**
 * 軸と補助線を描画するヘルパー関数
 */
function drawAxesAndGuidelines() {
    const visualizationRightX = width - EVENT_TEXT_WIDTH - MARGIN_RIGHT;
    const vizWidth = visualizationRightX - MARGIN_LEFT;

    // 軸
    stroke(TIME_AXIS_COLOR);
    strokeWeight(1);
    line(MARGIN_LEFT, MARGIN_TOP, MARGIN_LEFT, height - MARGIN_BOTTOM);
    line(visualizationRightX, MARGIN_TOP, visualizationRightX, height - MARGIN_BOTTOM);

    // 軸テキスト
    fill(TEXT_COLOR);
    textSize(12);
    textAlign(CENTER, BOTTOM);
    text('0h', MARGIN_LEFT, MARGIN_TOP - TEXT_OFFSET_Y * 3);
    text('24h', visualizationRightX, MARGIN_TOP - TEXT_OFFSET_Y * 3);

    // 12時間と6時間、18時間の補助線とテキスト
    stroke(GUIDE_LINE_COLOR);
    strokeWeight(GUIDE_LINE_WEIGHT);
    const x12h = map(12 * 60, 0, MAX_SLEEP_MINUTES, MARGIN_LEFT, visualizationRightX);
    const x6h = map(6 * 60, 0, MAX_SLEEP_MINUTES, MARGIN_LEFT, visualizationRightX);
    const x18h = map(18 * 60, 0, MAX_SLEEP_MINUTES, MARGIN_LEFT, visualizationRightX);
    
    line(x12h, MARGIN_TOP, x12h, height - MARGIN_BOTTOM);
    line(x6h, MARGIN_TOP, x6h, height - MARGIN_BOTTOM);
    line(x18h, MARGIN_TOP, x18h, height - MARGIN_BOTTOM);

    fill(TEXT_COLOR);
    textAlign(CENTER, BOTTOM);
    text('6h', x6h, MARGIN_TOP - TEXT_OFFSET_Y * 3);
    text('12h', x12h, MARGIN_TOP - TEXT_OFFSET_Y * 3);
    text('18h', x18h, MARGIN_TOP - TEXT_OFFSET_Y * 3);
}


/**
 * 特定の人のデータにその日付のエントリが存在するかどうかをチェックします。
 */
function hasDataEntryForPerson(data, date) {
    return data[date] !== undefined && data[date] !== null && data[date].length > 0;
}

/**
 * コントロールパネルの開閉を切り替える関数
 */
function toggleControlsPanel() {
    controlsPanel.toggleClass('open');
    if (controlsPanel.hasClass('open')) {
        toggleButton.html('設定パネルを閉じる');
    } else {
        toggleButton.html('設定パネルを開く');
    }
}

/**
 * キャンバスのサイズをコンテンツに合わせて調整するヘルパー関数
 */
function resizeCanvasBasedOnContent() {
    const requiredHeightForContent = allDatesInPeriod.length * (ROW_HEIGHT + ROW_GAP) - 
                                     (allDatesInPeriod.length > 0 ? ROW_GAP : 0) + 
                                     MARGIN_TOP + MARGIN_BOTTOM;
    
    const newCanvasHeight = max(windowHeight, requiredHeightForContent);
    const newCanvasWidth = windowWidth;
  
    resizeCanvas(newCanvasWidth, newCanvasHeight);
}


/**
 * ブラウザウィンドウがリサイズされたときに呼び出されます。
 */
function windowResized() {
    resizeCanvasBasedOnContent();
    redraw();
}