let sleepData1; // 一人目のデータ
let sleepData2; // 二人目のデータ
let eventData;
let allDatesInPeriod = []; // 期間内のすべての日付を格納する新しい変数
let minDateFromData = null;
let maxDateFromData = null;
// --- 可視化に関する設定変数 ---
let ROW_HEIGHT; // 1日の列全体の高さ (二人分を合わせた高さ)
let ROW_GAP; // 日の間の隙間
let SUB_ROW_HEIGHT; // 各人分の行の高さ (計算で求める)

let SLEEP_LINE_WEIGHT; // 睡眠ラインの太さ

let SLEEP_COLOR1; // 一人目の睡眠色
let SLEEP_COLOR2; // 二人目の睡眠色
let TIME_AXIS_COLOR;
let TEXT_COLOR;
let DOT_SIZE;

let DAY_BG_COLOR;
let NIGHT_BG_COLOR;
// let NO_RECORD_DAY_BG_COLOR; // 記録なし日の背景色
let NO_RECORD_DAY_BG_COLOR1; 
let NO_RECORD_DAY_BG_COLOR2; 
// 追加: キャンバス全体の背景色
let CANVAS_BG_COLOR;

// --- 補助線に関する設定変数 ---
let GUIDE_LINE_WEIGHT;
let GUIDE_LINE_COLOR;
let EVENT_TEXT_OFFSET; // 追加: イベントテキストのオフセット
let EVENT_TEXT_PREFIX = "◀︎ "; // 追加: プレフィックス記号
let SHOW_TIME_TEXT = true;

// マージン (これらは固定)
const MARGIN_TOP = 100;
const MARGIN_BOTTOM = 30;
const MARGIN_LEFT = 100;
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
let dotSizeSlider, dotSizeValue;
let dayBgColorPicker, nightBgColorPicker;
// let noRecordDayBgColorPicker;
let noRecordDayBgColorPicker1, noRecordDayBgAlphaSlider1, noRecordDayBgAlphaValue1;
let noRecordDayBgColorPicker2, noRecordDayBgAlphaSlider2, noRecordDayBgAlphaValue2;
let canvasBgColorPicker;

let guideLineWeightSlider, guideLineWeightValue, guideLineColorPicker, guideLineAlphaSlider, guideLineAlphaValue;
let showTimeTextCheckbox;
let toggleButton; // 追加
let controlsPanel; // 追加
// --- 期間設定用のUI要素 ---
let startDatePicker, endDatePicker, applyDateRangeButton,childBirthDatePicker;

// --- 時間軸に関する定数 ---
// 各行の表示範囲を午前7時から翌日の午前7時とする
const DISPLAY_START_HOUR = 7;
const DISPLAY_END_HOUR = 7 + 24; // 翌日の7時

const DISPLAY_START_MINUTE_ABSOLUTE = DISPLAY_START_HOUR * 60; // 7時の絶対分数 (0:00基準)
const DISPLAY_END_MINUTE_ABSOLUTE = DISPLAY_END_HOUR * 60; // 翌7時の絶対分数 (0:00基準)

// 事前計算された描画データを格納するグローバル変数
let cyclesToDrawPerDay = {};

// The date of pregnancy day 0 (in YYYY-MM-DD format)
const PREGNANCY_START_DATE = '2024-05-11'; 

// --- 凡例に関する新しい変数 ---
let isPerson1Visible = true; // 一人目のデータ表示フラグ
let isPerson2Visible = true; // 二人目のデータ表示フラグ
let hoveredLegendItem = null; // ホバー中の凡例アイテム ('person1', 'person2', or null)
const LEGEND_BOX_SIZE = 15;
const LEGEND_TEXT_OFFSET = 5;

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
    loadJSON('../data/sleep_wake_data_2.json', (data) => {
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
    
  let canvas = createCanvas(windowWidth , windowHeight);
  canvas.parent(select('body'));

  // --- UI要素の参照とイベントリスナーの設定 ---
  toggleButton = select('#toggle-button');
  controlsPanel = select('#controls');
  toggleButton.mousePressed(toggleControlsPanel); // クリックイベントを設定

  background(255);
  angleMode(DEGREES);

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

  rowHeightSlider = select('#rowHeightSlider');
  rowHeightValue = select('#rowHeightValue');
  rowHeightSlider.input(updateVisualization);
  
  rowGapSlider = select('#rowGapSlider');
  rowGapValue = select('#rowGapValue');
  rowGapSlider.input(updateVisualization);

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

  dotSizeSlider = select('#dotSizeSlider');
  dotSizeValue = select('#dotSizeValue');
  dotSizeSlider.input(updateVisualization);
  
  dayBgColorPicker = select('#dayBgColorPicker');
  dayBgColorPicker.input(updateVisualization);

  nightBgColorPicker = select('#nightBgColorPicker');
  nightBgColorPicker.input(updateVisualization);

    // 追加: 一人目の記録なし日背景色のUI要素を紐づけ
    noRecordDayBgColorPicker1 = select('#noRecordDayBgColorPicker1');
    noRecordDayBgAlphaSlider1 = select('#noRecordDayBgAlphaSlider1');
    noRecordDayBgAlphaValue1 = select('#noRecordDayBgAlphaValue1');
    noRecordDayBgColorPicker1.input(updateVisualization);
    noRecordDayBgAlphaSlider1.input(updateVisualization);

    // 追加: 二人目の記録なし日背景色のUI要素を紐づけ
    noRecordDayBgColorPicker2 = select('#noRecordDayBgColorPicker2');
    noRecordDayBgAlphaSlider2 = select('#noRecordDayBgAlphaSlider2');
    noRecordDayBgAlphaValue2 = select('#noRecordDayBgAlphaValue2');
    noRecordDayBgColorPicker2.input(updateVisualization);
    noRecordDayBgAlphaSlider2.input(updateVisualization);

  canvasBgColorPicker = select('#canvasBgColorPicker');
    canvasBgColorPicker.input(updateVisualization);

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

  // 初期表示のために期間を生成し、可視化を更新
  generateAllDatesInPeriod(); 
  noLoop(); // draw() 関数は updateVisualization() でのみ呼び出されるようにする
}

/**
 * マウスがクリックされたときに呼び出されます
 */
function mouseClicked() {
    // 凡例のクリック判定
    const legendX = MARGIN_LEFT;
    const legendY = MARGIN_TOP / 2 - LEGEND_BOX_SIZE/2; // Y座標を調整して中央に合わせる
    
    // 一人目の凡例をクリック
    const person1LegendX = legendX;
    // 凡例のボックスとテキストの両方を検知範囲に含める
    if (mouseX >= person1LegendX && mouseX <= person1LegendX + LEGEND_BOX_SIZE + LEGEND_TEXT_OFFSET + textWidth('mom') && mouseY >= legendY && mouseY <= legendY + LEGEND_BOX_SIZE) {
        isPerson1Visible = !isPerson1Visible;
        redraw();
    }

    // 二人目の凡例をクリック
    const person2LegendX = legendX + LEGEND_BOX_SIZE + LEGEND_TEXT_OFFSET + textWidth('mom') + 40; // 40は適当な隙間
    // 凡例のボックスとテキストの両方を検知範囲に含める
    if (mouseX >= person2LegendX && mouseX <= person2LegendX + LEGEND_BOX_SIZE + LEGEND_TEXT_OFFSET + textWidth('child') && mouseY >= legendY && mouseY <= legendY + LEGEND_BOX_SIZE) {
        isPerson2Visible = !isPerson2Visible;
        redraw();
    }
}


/**
 * マウスが動いたときに呼び出されます
 */
function mouseMoved() {
    // 凡例のホバー判定
    const legendX = MARGIN_LEFT;
    const legendY = MARGIN_TOP / 2 - LEGEND_BOX_SIZE/2; // Y座標を調整
    const person1LegendX = legendX;
    const person2LegendX = legendX + LEGEND_BOX_SIZE + LEGEND_TEXT_OFFSET + textWidth('mom') + 40;

    let newHoveredItem = null;
    if (mouseX >= person1LegendX && mouseX <= person1LegendX + LEGEND_BOX_SIZE + LEGEND_TEXT_OFFSET + textWidth('mom') + 40 && mouseY >= legendY && mouseY <= legendY + LEGEND_BOX_SIZE) {
        newHoveredItem = 'person1';
    } else if (mouseX >= person2LegendX && mouseX <= person2LegendX + LEGEND_BOX_SIZE + LEGEND_TEXT_OFFSET + textWidth('child') + 40 && mouseY >= legendY && mouseY <= legendY + LEGEND_BOX_SIZE) {
        newHoveredItem = 'person2';
    }

    // ホバー状態が変化した場合のみ再描画
    if (newHoveredItem !== hoveredLegendItem) {
        hoveredLegendItem = newHoveredItem;
        redraw();
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
  ROW_HEIGHT = parseInt(rowHeightSlider.value());
  ROW_GAP = parseInt(rowGapSlider.value());
  SUB_ROW_HEIGHT = ROW_HEIGHT / 2; // 各人分の行の高さはROW_HEIGHTの半分

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
  const timeAxisHex = timeAxisColorPicker.value();
  TIME_AXIS_COLOR = color(unhex(timeAxisHex.substring(1, 3)), unhex(timeAxisHex.substring(3, 5)), unhex(timeAxisHex.substring(5, 7)));

  const textHex = textColorPicker.value();
  TEXT_COLOR = color(unhex(textHex.substring(1, 3)), unhex(textHex.substring(3, 5)), unhex(textHex.substring(5, 7)));

  DOT_SIZE = parseInt(dotSizeSlider.value());

  DAY_BG_COLOR = color(unhex(dayBgColorPicker.value().substring(1, 3)), unhex(dayBgColorPicker.value().substring(3, 5)), unhex(dayBgColorPicker.value().substring(5, 7)));
  NIGHT_BG_COLOR = color(unhex(nightBgColorPicker.value().substring(1, 3)), unhex(nightBgColorPicker.value().substring(3, 5)), unhex(nightBgColorPicker.value().substring(5, 7)));
  
    // 追加: 一人目の記録なし日背景色のUI要素を紐づけ
    const noRecordDayBgR1 = unhex(noRecordDayBgColorPicker1.value().substring(1, 3));
    const noRecordDayBgG1 = unhex(noRecordDayBgColorPicker1.value().substring(3, 5));
    const noRecordDayBgB1 = unhex(noRecordDayBgColorPicker1.value().substring(5, 7));
    const noRecordDayBgA1 = parseInt(noRecordDayBgAlphaSlider1.value());
    NO_RECORD_DAY_BG_COLOR1 = color(noRecordDayBgR1, noRecordDayBgG1, noRecordDayBgB1, noRecordDayBgA1);
    noRecordDayBgAlphaValue1.html(noRecordDayBgA1);

    // 追加: 二人目の記録なし日背景色のUI要素を紐づけ
    const noRecordDayBgR2 = unhex(noRecordDayBgColorPicker2.value().substring(1, 3));
    const noRecordDayBgG2 = unhex(noRecordDayBgColorPicker2.value().substring(3, 5));
    const noRecordDayBgB2 = unhex(noRecordDayBgColorPicker2.value().substring(5, 7));
    const noRecordDayBgA2 = parseInt(noRecordDayBgAlphaSlider2.value());
    NO_RECORD_DAY_BG_COLOR2 = color(noRecordDayBgR2, noRecordDayBgG2, noRecordDayBgB2, noRecordDayBgA2);
    noRecordDayBgAlphaValue2.html(noRecordDayBgA2);

  const canvasBgR = unhex(canvasBgColorPicker.value().substring(1, 3));
    const canvasBgG = unhex(canvasBgColorPicker.value().substring(3, 5));
    const canvasBgB = unhex(canvasBgColorPicker.value().substring(5, 7));
    CANVAS_BG_COLOR = color(canvasBgR, canvasBgG, canvasBgB);

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
  dotSizeValue.html(DOT_SIZE);
  guideLineWeightValue.html(GUIDE_LINE_WEIGHT);
  guideLineAlphaValue.html(guideLineA);


  resizeCanvasBasedOnContent();
  redraw();
}

/**
 * メイン描画ループ: redraw()が呼び出された時のみ実行される
 */
function draw() {
    background(CANVAS_BG_COLOR); // キャンバス全体の背景色を設定
  drawBackgrounds(); // 全体背景の描画を分離
  drawDateRows();
  drawTimeAxis();
  drawZeroOClockGuideLine();
  drawLegend(); // 凡例の描画を呼び出し
}

/**
 * 全体の夜間・日中背景を描画する関数 (7:00-翌7:00基準)
 */
function drawBackgrounds() {
    // 表示範囲は常に 7:00 から 翌日 7:00 (24時間)
    const displayStartMinute = DISPLAY_START_MINUTE_ABSOLUTE; 
    const displayEndMinute = DISPLAY_END_MINUTE_ABSOLUTE; 

    // 日中と夜間の境界 (0:00基準の絶対分数)
    const dayStartAbsoluteMinute = 7 * 60;  // 7:00
    const dayEndAbsoluteMinute = 19 * 60;   // 19:00
    
    const totalVisualizationHeight = allDatesInPeriod.length * (ROW_HEIGHT + ROW_GAP) - (allDatesInPeriod.length > 0 ? ROW_GAP : 0); 
    
    noStroke();

    // 日中背景（7:00 - 19:00）
    const dayBgStartX = map(dayStartAbsoluteMinute, displayStartMinute, displayEndMinute, MARGIN_LEFT, width - EVENT_TEXT_WIDTH - MARGIN_RIGHT);
    const dayBgEndX = map(dayEndAbsoluteMinute, displayStartMinute, displayEndMinute, MARGIN_LEFT, width - EVENT_TEXT_WIDTH - MARGIN_RIGHT);
    
    fill(DAY_BG_COLOR);
    rect(dayBgStartX, MARGIN_TOP, dayBgEndX - dayBgStartX, totalVisualizationHeight);

    // 夜間背景
    fill(NIGHT_BG_COLOR);
    
    // Part 1: その日の日中の終了 (19:00) から翌日の日中の開始 (翌7:00) まで
    // これは 19:00 から翌日 7:00 までが夜間
    const nightPart2StartX = map(dayEndAbsoluteMinute, displayStartMinute, displayEndMinute, MARGIN_LEFT, width - EVENT_TEXT_WIDTH - MARGIN_RIGHT);
    const nightPart2EndX = map(DISPLAY_END_MINUTE_ABSOLUTE, displayStartMinute, displayEndMinute, MARGIN_LEFT, width - EVENT_TEXT_WIDTH - MARGIN_RIGHT);
    rect(nightPart2StartX, MARGIN_TOP, nightPart2EndX - nightPart2StartX, totalVisualizationHeight);
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
 * この関数は、allDatesInPeriod内の各日付に対して、その行に描画されるべき睡眠サイクルを計算し、cyclesToDrawPerDayに格納します。
 */
function prepareSleepCyclesForDrawing() {
    cyclesToDrawPerDay = {}; // データをリセット

    // 全ての睡眠データを収集し、絶対時刻を計算する
    // これを一度行い、その後で各表示行に割り当てる
    let allSleepCyclesWithAbsoluteTime = [];

    // 子供の出生日を取得し、Dateオブジェクトに変換
    const childBirthDateStr = childBirthDatePicker.value();
    let childBirthDateMs = 0; // デフォルト値 (0はDate変換でエラーにならない適当な過去の日付)
    if (childBirthDateStr) {
        const tempDate = new Date(childBirthDateStr);
        // 日付の比較のために、その日の00:00:00のミリ秒を取得
        childBirthDateMs = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate()).getTime();
    }

    // Person 1 の全てのJSONデータを反復処理
    for (const dateKey in sleepData1) {
        if (hasDataEntryForPerson(sleepData1, dateKey)) {
            sleepData1[dateKey].forEach(cycle => {
                // cycle.sleep または cycle.wake が無効な場合にスキップ
                if (!cycle.sleep || typeof cycle.sleep !== 'string' ||
                    !cycle.wake || typeof cycle.wake !== 'string') {
                    console.warn(`Skipping invalid sleep cycle data for Person 1 on ${dateKey}:`, cycle);
                    return; // このサイクルはスキップして次のサイクルへ
                }

                let sleepHour = parseInt(cycle.sleep.substring(0, 2));
                let sleepMinute = parseInt(cycle.sleep.substring(3, 5));
                let wakeHour = parseInt(cycle.wake.substring(0, 2));
                let wakeMinute = parseInt(cycle.wake.substring(3, 5));

                // JSONキーの日付を基準に絶対時刻を計算
                let baseDate = new Date(dateKey); 
                
                let sleepStartMs = baseDate.getTime() + (sleepHour * 60 + sleepMinute) * 60 * 1000;
                let wakeEndMs = baseDate.getTime() + (wakeHour * 60 + wakeMinute) * 60 * 1000;

                // 起床時刻が睡眠時刻よりも前の場合（翌日へのまたぎ）
                if (wakeEndMs <= sleepStartMs) { // <= に変更することで、完全に同じ時刻も翌日として扱う
                    wakeEndMs += 24 * 60 * 60 * 1000; // 24時間を加算して翌日扱いにする
                }

                allSleepCyclesWithAbsoluteTime.push({
                    person: 1, // どの人かを示す
                    sleep: cycle.sleep,
                    wake: cycle.wake,
                    sleepStartMs: sleepStartMs,
                    wakeEndMs: wakeEndMs
                });
            });
        }
    }

    // Person 2 の全てのJSONデータを反復処理
    for (const dateKey in sleepData2) {
        if (hasDataEntryForPerson(sleepData2, dateKey)) {
            sleepData2[dateKey].forEach(cycle => {
                // cycle.sleep または cycle.wake が無効な場合にスキップ
                if (!cycle.sleep || typeof cycle.sleep !== 'string' ||
                    !cycle.wake || typeof cycle.wake !== 'string') {
                    console.warn(`Skipping invalid sleep cycle data for Person 2 on ${dateKey}:`, cycle);
                    return; // このサイクルはスキップして次のサイクルへ
                }

                // 睡眠開始日のDateオブジェクトを作成し、出生日と比較
                const sleepStartDate = new Date(dateKey); // cycle.sleep が始まるJSONのキーの日付
                const sleepStartDateMs = new Date(sleepStartDate.getFullYear(), sleepStartDate.getMonth(), sleepStartDate.getDate()).getTime();
                
                // 睡眠開始日が、子供の出生日よりも前であればスキップ
                // (childBirthDateMs が 0 の場合は常に描画されることになる)
                if (childBirthDateMs > 0 && sleepStartDateMs < childBirthDateMs) {
                    return; // このサイクルは出生日より前なのでスキップ
                }

                let sleepHour = parseInt(cycle.sleep.substring(0, 2));
                let sleepMinute = parseInt(cycle.sleep.substring(3, 5));
                let wakeHour = parseInt(cycle.wake.substring(0, 2));
                let wakeMinute = parseInt(cycle.wake.substring(3, 5));

                let baseDate = new Date(dateKey); 
                
                let sleepStartMs = baseDate.getTime() + (sleepHour * 60 + sleepMinute) * 60 * 1000;
                let wakeEndMs = baseDate.getTime() + (wakeHour * 60 + wakeMinute) * 60 * 1000;

                if (wakeEndMs <= sleepStartMs) {
                    wakeEndMs += 24 * 60 * 60 * 1000;
                }

                allSleepCyclesWithAbsoluteTime.push({
                    person: 2, // どの人かを示す
                    sleep: cycle.sleep,
                    wake: cycle.wake,
                    sleepStartMs: sleepStartMs,
                    wakeEndMs: wakeEndMs
                });
            });
        }
    }

    // allDatesInPeriod の各日付 (表示行の基準日) について処理
    for (let i = 0; i < allDatesInPeriod.length; i++) {
        const displayDateStr = allDatesInPeriod[i];
        const displayDateObj = new Date(displayDateStr);

        // その行の表示期間 (ミリ秒): displayDateStr の 7:00 から 翌日 の 7:00
        const rowDisplayStartMs = displayDateObj.getTime() + DISPLAY_START_MINUTE_ABSOLUTE * 60 * 1000;
        const rowDisplayEndMs = displayDateObj.getTime() + DISPLAY_END_MINUTE_ABSOLUTE * 60 * 1000; // 翌日7時の絶対ミリ秒

        let cyclesForCurrentRowPerson1 = [];
        let cyclesForCurrentRowPerson2 = [];

        // 全ての睡眠サイクルをこの行の表示期間と照合
        for (const cycle of allSleepCyclesWithAbsoluteTime) {
            // 睡眠サイクルと現在の行の表示期間との重なりをチェック
            // 睡眠サイクルが現在の行の期間に少しでも重なっていれば追加
            if (!(cycle.wakeEndMs <= rowDisplayStartMs || cycle.sleepStartMs >= rowDisplayEndMs)) {
                // 重なっている場合は、この行に割り当てられたデータとして追加
                if (cycle.person === 1) {
                    cyclesForCurrentRowPerson1.push(cycle);
                } else if (cycle.person === 2) {
                    cyclesForCurrentRowPerson2.push(cycle);
                }
            }
        }

        cyclesToDrawPerDay[displayDateStr] = {
            person1: cyclesForCurrentRowPerson1,
            person2: cyclesForCurrentRowPerson2
        };
    }
}

/**
 * 各日の背景色（記録なし）と睡眠サイクルを描画する関数
 */
function drawDateRows() {
    const requiredVerticalSpace = 80; 
    const totalRowHeightPerDay = ROW_HEIGHT + ROW_GAP; 
    let skipInterval = 1;
    if (totalRowHeightPerDay < requiredVerticalSpace) {
        skipInterval = ceil(requiredVerticalSpace / totalRowHeightPerDay);
        if (skipInterval === 0) skipInterval = 1;
    }

    const childBirthDateStr = childBirthDatePicker.value();
    let childBirthDateMs = 0;
    if (childBirthDateStr) {
        const tempDate = new Date(childBirthDateStr);
        childBirthDateMs = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate()).getTime();
    }

    for (let i = 0; i < allDatesInPeriod.length; i++) {
        const currentDisplayDateStr = allDatesInPeriod[i];
        const currentYBase = MARGIN_TOP + (i * (ROW_HEIGHT + ROW_GAP));
        
        const currentDisplayDateObj = new Date(currentDisplayDateStr);
        const currentDisplayDateMs = new Date(currentDisplayDateObj.getFullYear(), currentDisplayDateObj.getMonth(), currentDisplayDateObj.getDate()).getTime();
        
        const oneDay = 1000 * 60 * 60 * 24;
        const pregnancyStartDate = new Date(PREGNANCY_START_DATE);
        const currentDate = new Date(currentDisplayDateStr);
        const childBirthDate = childBirthDatePicker.value() ? new Date(childBirthDatePicker.value()) : null;

        let displayDateText = '';

        if (childBirthDate && currentDate.toDateString() === childBirthDate.toDateString()) {
            displayDateText = `Birth Date`;
        } else if (childBirthDate && currentDate.getTime() < childBirthDate.getTime()) {
            const daysPregnant = Math.floor((currentDate.getTime() - pregnancyStartDate.getTime()) / oneDay);
            const months = Math.floor(daysPregnant / 30.44);
            const days = daysPregnant % 30.44; 
            
            if (daysPregnant >= 0 && daysPregnant < 1) {
                displayDateText = `0 mo.`;
            } else if (Math.abs(days) < 1) {
                displayDateText = `${months} mo.`;
            }
        } else if (childBirthDate && currentDate.getTime() > childBirthDate.getTime()) {
            const daysSinceBirth = Math.floor((currentDate.getTime() - childBirthDate.getTime()) / oneDay);
            const months = Math.floor(daysSinceBirth / 30.44);
            const days = daysSinceBirth % 30.44;

            if (Math.abs(days) < 1) {
                displayDateText = `${months} mo. old`;
            }
        } else {
            displayDateText = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
        }
        
        // --- 各個人の記録なし背景を描画 ---
        // Person 1 (母) の記録なし背景
        const hasDataEntry1ForCurrentDate = hasDataEntryForPerson(sleepData1, currentDisplayDateStr);
        if (!hasDataEntry1ForCurrentDate) { 
            noFill();
            stroke(NO_RECORD_DAY_BG_COLOR1); 
            strokeWeight(1);
            
            const rectX = MARGIN_LEFT;
            const rectY = currentYBase; // Person 1 のハッチングも同じY座標
            const rectW = width - MARGIN_LEFT - EVENT_TEXT_WIDTH - MARGIN_RIGHT;
            const rectH = ROW_HEIGHT; // ハッチングの高さをROW_HEIGHT全体に
            const lineSpacing = 4;
            for (let x = rectX - rectH; x < rectX + rectW + rectH; x += lineSpacing) {
                line(x, rectY, x + rectH, rectY + rectH);
            }
        }

        // Person 2 (子供) の記録なし背景
        const hasDataEntry2ForCurrentDate = hasDataEntryForPerson(sleepData2, currentDisplayDateStr);
        if (!hasDataEntry2ForCurrentDate && (childBirthDateMs === 0 || currentDisplayDateMs >= childBirthDateMs)) { 
            noFill();
            stroke(NO_RECORD_DAY_BG_COLOR2); 
            strokeWeight(1);
            
            const rectX = MARGIN_LEFT;
            const rectY = currentYBase; // Person 2 のハッチングも同じY座標
            const rectW = width - MARGIN_LEFT - EVENT_TEXT_WIDTH - MARGIN_RIGHT;
            const rectH = ROW_HEIGHT; // ハッチングの高さをROW_HEIGHT全体に
            const lineSpacing = 4;
            const offset = lineSpacing / 2;

            for (let x = rectX - rectH - offset; x < rectX + rectW + rectH; x += lineSpacing) {
                line(x, rectY, x + rectH, rectY + rectH);
            }
        }
        
        noStroke();
        fill(TEXT_COLOR);
        textSize(12);
        textAlign(RIGHT, CENTER);
        text(displayDateText, MARGIN_LEFT - 10, currentYBase + ROW_HEIGHT / 2);

        const visualizationRightX = width - EVENT_TEXT_WIDTH - MARGIN_RIGHT;

        if (eventData && eventData[currentDisplayDateStr]) {
            noStroke();
            fill(TEXT_COLOR);
            textSize(12);
            textAlign(LEFT, CENTER);
            const eventTextX = visualizationRightX ;
            const eventTextY = currentYBase + ROW_HEIGHT / 2;
            text(EVENT_TEXT_PREFIX, eventTextX, eventTextY);
            const eventMainTextX = eventTextX + textWidth(EVENT_TEXT_PREFIX);
            text(eventData[currentDisplayDateStr], eventMainTextX, eventTextY, EVENT_TEXT_WIDTH - 20);
        }
        
        // --- 睡眠データの描画呼び出し ---
        const dataForThisRow = cyclesToDrawPerDay[currentDisplayDateStr];
        if (!dataForThisRow) {
            console.warn(`No pre-calculated sleep data for ${currentDisplayDateStr}. This should not happen if prepareSleepCyclesForDrawing is called correctly.`);
            continue; 
        }

        // 凡例の状態に基づいて描画を呼び出す
        if (isPerson1Visible) {
            // Y座標を統一
            drawSleepWakeCycles(dataForThisRow.person1, getDisplayColor('person1', SLEEP_COLOR1), currentYBase, currentDisplayDateStr, currentYBase, i);
        }
        if (isPerson2Visible) {
            // Y座標を統一
            drawSleepWakeCycles(dataForThisRow.person2, getDisplayColor('person2', SLEEP_COLOR2), currentYBase, currentDisplayDateStr, currentYBase, i);
        }
    }
}

/**
 * 凡例を描画する関数
 */
function drawLegend() {
    const legendY = MARGIN_TOP / 2 - LEGEND_BOX_SIZE/2; // Y座標を調整して中央に合わせる

    // 凡例の項目
    const legendItems = [
        { label: 'mom', personId: 'person1', color: SLEEP_COLOR1, isVisible: isPerson1Visible },
        { label: 'child', personId: 'person2', color: SLEEP_COLOR2, isVisible: isPerson2Visible }
    ];

    noStroke();
    textSize(12);
    textAlign(LEFT, TOP);

    // X座標の初期位置
    let currentX = MARGIN_LEFT;

    for (const item of legendItems) {
        // ホバーによる色の変更を適用
        let displayColor = getDisplayColor(item.personId, item.color);

        // 非表示の場合は、灰色にして透明度を下げる
        if (!item.isVisible) {
            displayColor = color(150, alpha(displayColor) * 0.5); // 灰色に設定
        }

        fill(displayColor);
        rect(currentX, legendY, LEGEND_BOX_SIZE, LEGEND_BOX_SIZE);

        // テキストの描画
        fill(TEXT_COLOR);
        text(item.label, currentX + LEGEND_BOX_SIZE + LEGEND_TEXT_OFFSET, legendY);

        // 次の凡例のX座標を計算
        currentX += LEGEND_BOX_SIZE + LEGEND_TEXT_OFFSET + textWidth(item.label) + 40; // 40は適当な隙間
    }
}

/**
 * 表示色を返すヘルパー関数。ホバー状態によって透明度を調整する。
 */
function getDisplayColor(personId, originalColor) {
    // ユーザーの新しいリクエスト: データが非表示の場合は、ホバーによる半透明化を無効にする
    if (personId === 'person1' && !isPerson1Visible) {
        return originalColor;
    }
    if (personId === 'person2' && !isPerson2Visible) {
        return originalColor;
    }

    // ホバー中のアイテムが存在し、それがこのpersonIdと一致しない場合、半透明にする
    if (hoveredLegendItem !== null && hoveredLegendItem !== personId) {
        return color(red(originalColor), green(originalColor), blue(originalColor), alpha(originalColor) * 0.2); // 半透明に
    }
    
    // それ以外の場合は元の色を返す
    return originalColor;
}

function drawTimeAxis() {
    stroke(TIME_AXIS_COLOR);
    strokeWeight(1);
    line(MARGIN_LEFT, MARGIN_TOP, width - EVENT_TEXT_WIDTH - MARGIN_RIGHT, MARGIN_TOP);

    fill(TEXT_COLOR);
    textSize(12);
    textAlign(CENTER, BOTTOM);

    // 描画したい時刻を0:00からの絶対分数で定義
    const timesToDraw = [
        { hour: 7, text: '07:00' },
        { hour: 12, text: '12:00' },
        { hour: 19, text: '19:00' },
        { hour: 24, text: '00:00 (+1d)' }, // 翌日0:00
        { hour: 31, text: '07:00 (+1d)' } // 翌日7:00
    ];

    // 表示範囲は 7:00 から翌日 7:00
    const displayStartMinute = DISPLAY_START_HOUR * 60;
    const displayEndMinute = DISPLAY_END_HOUR * 60;

    for (const time of timesToDraw) {
        // 時刻を絶対分数に変換
        const currentMinuteAbsolute = time.hour * 60;

        // X座標を計算
        const x = map(currentMinuteAbsolute, displayStartMinute, displayEndMinute, MARGIN_LEFT, width - EVENT_TEXT_WIDTH - MARGIN_RIGHT);

        // 目盛り線の描画
        line(x, MARGIN_TOP - 5, x, MARGIN_TOP);

        // ラベルテキストの描画
        noStroke(); 
        text(time.text, x, MARGIN_TOP - TEXT_OFFSET_Y * 3);
    }
}

/**
 * 0:00 の位置に垂直の補助線を描画します。 (新しい時間軸では左端から24-7=17時間後の位置)
 * ただし、ユーザーの要望として「0時補助線は残す」とあるため、新しい時間軸（7時から翌7時）における0時の位置に補助線を描画します。
 * 0時は、表示開始時刻の7時から17時間後になります。
 */
function drawZeroOClockGuideLine() {
    // 表示範囲は 7:00 から翌日 7:00
    const displayStartMinute = DISPLAY_START_MINUTE_ABSOLUTE; 
    const displayEndMinute = DISPLAY_END_MINUTE_ABSOLUTE; 

    // 翌日の0:00を表す絶対分数 (0:00基準)
    const zeroOClockAbsoluteMinute = 24 * 60; 

    // 新しい時間軸 (7:00-翌7:00) の中で、0:00 (翌日) の位置をマッピング
    const zeroOClockX = map(
        zeroOClockAbsoluteMinute, 
        displayStartMinute,       
        displayEndMinute,         
        MARGIN_LEFT,              
        width - EVENT_TEXT_WIDTH - MARGIN_RIGHT      
    );

    stroke(GUIDE_LINE_COLOR);
    strokeWeight(GUIDE_LINE_WEIGHT);
    
    // 補助線が描画範囲内にあるかチェック
    if (zeroOClockX > MARGIN_LEFT && zeroOClockX < width - EVENT_TEXT_WIDTH - MARGIN_RIGHT) {
        line(zeroOClockX, MARGIN_TOP, zeroOClockX, height - MARGIN_BOTTOM);
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
function drawSleepWakeCycles(cycles, color, yBase, displayDateStr, currentColumnYBase, currentColumnIndex) {
    const sleepLineCenterY = yBase + (ROW_HEIGHT / 2); // Person1とPerson2を同じY座標に描画

    if (!cycles || cycles.length === 0) return;

    const currentDisplayDateObj = new Date(displayDateStr);
    const rowDisplayStartMs = currentDisplayDateObj.getTime() + DISPLAY_START_MINUTE_ABSOLUTE * 60 * 1000;
    const rowDisplayEndMs = currentDisplayDateObj.getTime() + DISPLAY_END_MINUTE_ABSOLUTE * 60 * 1000; // 翌日7時の絶対ミリ秒

    const totalDisplayMinutes = DISPLAY_END_MINUTE_ABSOLUTE - DISPLAY_START_MINUTE_ABSOLUTE;

    for (const cycle of cycles) {
        // prepareSleepCyclesForDrawing で計算済みの絶対時刻を使用
        const sleepStartMs = cycle.sleepStartMs;
        const wakeEndMs = cycle.wakeEndMs;

        // このサイクルが現在の行の表示期間と重なっている部分を計算
        // ここが重要：描画される範囲を現在の行の期間に限定する
        const intersectionStartMs = max(sleepStartMs, rowDisplayStartMs);
        const intersectionEndMs = min(wakeEndMs, rowDisplayEndMs); 

        // 重なりがない場合は描画しない (理論上はprepareSleepCyclesForDrawingでフィルタリング済みだが、念のため)
        if (intersectionStartMs >= intersectionEndMs) {
            continue;
        }

        // 行の表示開始時刻を0分とした相対的な開始・終了分数を計算
        const relativePlotStartMinutes = (intersectionStartMs - rowDisplayStartMs) / (60 * 1000);
        const relativePlotEndMinutes = (intersectionEndMs - rowDisplayStartMs) / (60 * 1000);
        
        const partStartX = map(relativePlotStartMinutes, 0, totalDisplayMinutes, MARGIN_LEFT, width - EVENT_TEXT_WIDTH - MARGIN_RIGHT);
        const partEndX = map(relativePlotEndMinutes, 0, totalDisplayMinutes, MARGIN_LEFT, width - EVENT_TEXT_WIDTH - MARGIN_RIGHT);

        stroke(color);
        strokeWeight(SLEEP_LINE_WEIGHT);
        line(partStartX, sleepLineCenterY, partEndX, sleepLineCenterY);

        fill(color);
        noStroke();

        // ドットとテキストの描画条件: 実際の睡眠開始/起床終了がこの行の表示期間に入っているかどうか
        // intersectionStartMs === sleepStartMs は、この部分がその睡眠サイクルの「本当の開始点」であり、かつこの行の表示範囲内である場合にのみtrue
        if (intersectionStartMs === sleepStartMs) {
            ellipse(partStartX, sleepLineCenterY, DOT_SIZE, DOT_SIZE);
        }
        
        if (intersectionEndMs === wakeEndMs) {
            ellipse(partEndX, sleepLineCenterY, DOT_SIZE, DOT_SIZE);
        }

        if (SHOW_TIME_TEXT) {
            fill(TEXT_COLOR);
            textSize(10);
            
            // 睡眠開始時刻テキスト
            if (intersectionStartMs === sleepStartMs) {
                textAlign(CENTER, BOTTOM);
                text(cycle.sleep, partStartX, sleepLineCenterY - (SLEEP_LINE_WEIGHT / 2) - TEXT_OFFSET_Y);
            }

            // 起床時刻テキスト
            if (intersectionEndMs === wakeEndMs) {
                textAlign(CENTER, TOP);
                text(cycle.wake, partEndX, sleepLineCenterY + (SLEEP_LINE_WEIGHT / 2) + TEXT_OFFSET_Y);
            }
        }
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

/**
 * A helper function to adjust the canvas size to fit the content
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
 * Called when the browser window is resized.
 */
function windowResized() {
    resizeCanvasBasedOnContent();
    redraw();
}
