// sketch.js (entry point)
import { loadAllJson } from "./modules/dataLoader.js";
import { prepareSleepCyclesForDrawing, generateAllDatesInPeriod } from "./modules/transformer.js";
import  TimelineRenderer  from "./modules/rendererTimeline.js";
import { LongestRenderer } from "./modules/rendererLongest.js";
import { initUI, readUISettings } from "./modules/ui.js";

let sleepData1, sleepData2, eventData;
let allDatesInPeriod = [];
let cyclesToDrawPerDay = {};
let currentRenderer = null;
let timelineRenderer, longestRenderer;

window.preload = function() {
  // データを読み込む（相対パスは index.html の場所に合わせて調整してください）
  loadAllJson({
    p1: "../data/sleep_wake_data.json",
    p2: "../data/sleep_wake_data_2.json",
    events: "../data/event.json"
  }).then(results => {
    sleepData1 = results.p1 || {};
    sleepData2 = results.p2 || {};
    eventData = results.events || {};
    // デフォルトで日付ピッカーにデータ範囲を設定できるようにDOMに入力
    const startDatePicker = select('#startDatePicker');
    const endDatePicker = select('#endDatePicker');
    const keys = Array.from(new Set([...Object.keys(sleepData1), ...Object.keys(sleepData2)])).sort((a,b)=>new Date(a)-new Date(b));
    if (keys.length) {
      if (!startDatePicker.value()) startDatePicker.value(keys[0]);
      if (!endDatePicker.value()) endDatePicker.value(keys[keys.length-1]);
    }
  }).catch(err=>{
    console.error("データ読み込みエラー:", err);
  });
};

window.setup = function() {
  createCanvas(windowWidth, windowHeight).parent(select('body'));
  angleMode(DEGREES);
  noLoop();

  // レンダラーを作る
  timelineRenderer = new TimelineRenderer();
  longestRenderer = new LongestRenderer();

  // UIを初期化（イベントハンドラは ui.js 側で updateVisualization を呼ぶ）
  initUI({
    onChange: () => {
      updateVisualization();
    },
    onToggleRenderer: (mode) => {
      // 切り替え
      if (mode === 'timeline') currentRenderer = timelineRenderer;
      else currentRenderer = longestRenderer;
      updateVisualization();
    }
  });

  // デフォルトレンダラー
  currentRenderer = timelineRenderer;

  // 初期日付範囲生成（UIの値を読む）
  updateVisualization();
};

window.draw = function() {
  if (!currentRenderer) return;
  const settings = readUISettings();
  console.log(settings)
  currentRenderer.draw({
    p5: window, // rendererでp5グローバル関数を使うために渡す
    allDatesInPeriod,
    cyclesToDrawPerDay,
    sleepData1,
    sleepData2,
    eventData,
    settings
  });
};

export function updateVisualization() {
  // 1) allDatesInPeriod を UI から再生成
  const start = select('#startDatePicker').value();
  const end = select('#endDatePicker').value();
  allDatesInPeriod = generateAllDatesInPeriod(start, end);

  // 2) 子の出生日を取得
  const childBirthDateStr = select('#childBirthDatePicker').value();

  // 3) 前処理（夜またぎ・絶対ms計算・出生日フィルタ等）
  cyclesToDrawPerDay = prepareSleepCyclesForDrawing({
    sleepData1, sleepData2, allDatesInPeriod, childBirthDateStr
  });

  // 4) キャンバスサイズ調整（rendererが必要な情報をsettingsから参照）
  const settings = readUISettings();
  // 高さを決める
  const reqHeight = allDatesInPeriod.length * (settings.rowHeight + settings.rowGap) - (allDatesInPeriod.length > 0 ? settings.rowGap : 0) + settings.marginTop + settings.marginBottom;
  const newH = max(windowHeight, reqHeight);
  resizeCanvas(windowWidth, newH);

  redraw();
}

window.windowResized = function() {
  updateVisualization();
}
