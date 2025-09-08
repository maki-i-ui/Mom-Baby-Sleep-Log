let sleepData1; // Data for person 1
let sleepData2; // Data for person 2
let eventData;
let allDatesInPeriod = []; // A new variable to store all dates in the period
let minDateFromData = null;
let maxDateFromData = null;

// --- Graph settings variables ---
let ROW_HEIGHT; // The height of the entire day's row (height of the bar graph)
let ROW_GAP;    // The gap between days

let SLEEP_LINE_WEIGHT; // The weight of the sleep bar (using the original sleepLineWeight)

let SLEEP_COLOR1; // Sleep color for person 1
let SLEEP_COLOR2; // Sleep color for person 2
let TIME_AXIS_COLOR;
let TEXT_COLOR;

let DAY_BG_COLOR;
let NIGHT_BG_COLOR;
let NO_RECORD_DAY_BG_COLOR1; 
let NO_RECORD_DAY_BG_COLOR2; 
let CANVAS_BG_COLOR;       // Added: Canvas background color

// --- Guide line settings variables ---
let GUIDE_LINE_WEIGHT;
let GUIDE_LINE_COLOR;
let EVENT_TEXT_OFFSET; // Added: Offset for event text
let EVENT_TEXT_PREFIX = "◀︎ "; // Added: Prefix symbol
let SHOW_TIME_TEXT = true;

// Margins (these are fixed)
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 30;
const MARGIN_LEFT = 100;
const MARGIN_RIGHT = 60; // Margin between the visualization area and the event text area
// const EVENT_TEXT_WIDTH = 300; // Define a fixed width for event text
const EVENT_TEXT_WIDTH = 0
const TEXT_OFFSET_Y = 5; // Offset for time text

// UI element references
let rowHeightSlider, rowGapSlider;
let sleepLineWeightSlider, sleepLineWeightValue; 
let sleepColorPicker1, sleepColorAlphaSlider1, sleepColorAlphaValue1;
let sleepColorPicker2, sleepColorAlphaSlider2, sleepColorAlphaValue2;

// Added color picker references
let timeAxisColorPicker, textColorPicker;
let dayBgColorPicker, nightBgColorPicker;
let noRecordDayBgColorPicker1, noRecordDayBgAlphaSlider1, noRecordDayBgAlphaValue1;
let noRecordDayBgColorPicker2, noRecordDayBgAlphaSlider2, noRecordDayBgAlphaValue2;
let canvasBgColorPicker;     // Added: Canvas background color picker

let guideLineWeightSlider, guideLineWeightValue, guideLineColorPicker, guideLineAlphaSlider, guideLineAlphaValue;
let showTimeTextCheckbox;
let toggleButton; // Added
let controlsPanel; // Added
// --- UI elements for period settings ---
let startDatePicker, endDatePicker, applyDateRangeButton, childBirthDatePicker;

// --- Time axis constants ---
// Set the maximum sleep time per day to 24 hours (1440 minutes)
const MAX_SLEEP_MINUTES = 24 * 60; 

// Global variable to store pre-calculated drawing data
let maxSleepPerDay = {};

// The date of pregnancy day 0 (in YYYY-MM-DD format)
const PREGNANCY_START_DATE = '2024-05-11'; 

// --- 凡例に関する新しい変数 ---
let isPerson1Visible = true; // 一人目のデータ表示フラグ
let isPerson2Visible = true; // 二人目のデータ表示フラグ
let hoveredLegendItem = null; // ホバー中の凡例アイテム ('person1', 'person2', or null)
const LEGEND_BOX_SIZE = 15;
const LEGEND_TEXT_OFFSET = 5;

/**
 * Preload function: Loads JSON data
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
 * A function to calculate the earliest and latest dates from sleepData1 and sleepData2
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
        console.warn("No dates found in data files.");
        return;
    }

    const sortedDates = Array.from(allKeys).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
    });

    minDateFromData = sortedDates[0];
    maxDateFromData = sortedDates[sortedDates.length - 1];

    console.log(`Data range: ${minDateFromData} to ${maxDateFromData}`);
}

/**
 * Setup function: Creates the canvas, initializes UI elements, and sets up event listeners
 */
function setup() {
    let canvas = createCanvas(windowWidth , windowHeight);
    canvas.parent(select('body'));

    toggleButton = select('#toggle-button');
    controlsPanel = select('#controls');
    toggleButton.mousePressed(toggleControlsPanel);
    toggleButton.html('Open Settings Panel'); // Set button text

    background(255);
    angleMode(DEGREES);

    startDatePicker = select('#startDatePicker');
    endDatePicker = select('#endDatePicker');
    applyDateRangeButton = select('#applyDateRangeButton');
    applyDateRangeButton.mousePressed(generateAllDatesInPeriod);
    applyDateRangeButton.html('Apply Date Range'); // Set button text
    childBirthDatePicker = select('#childBirthDatePicker');
    childBirthDatePicker.input(generateAllDatesInPeriod);
    childBirthDatePicker.attribute('title', 'Childbirth Date');

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
    
    // Add slider references
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

    // Link new color picker UI elements
    timeAxisColorPicker = select('#timeAxisColorPicker');
    timeAxisColorPicker.input(updateVisualization);

    textColorPicker = select('#textColorPicker');
    textColorPicker.input(updateVisualization);

    dayBgColorPicker = select('#dayBgColorPicker');
    dayBgColorPicker.input(updateVisualization);

    nightBgColorPicker = select('#nightBgColorPicker');
    nightBgColorPicker.input(updateVisualization);

    // Added: Link UI elements for the first person's no-record-day background color
    noRecordDayBgColorPicker1 = select('#noRecordDayBgColorPicker1');
    noRecordDayBgAlphaSlider1 = select('#noRecordDayBgAlphaSlider1');
    noRecordDayBgAlphaValue1 = select('#noRecordDayBgAlphaValue1');
    noRecordDayBgColorPicker1.input(updateVisualization);
    noRecordDayBgAlphaSlider1.input(updateVisualization);

    // Added: Link UI elements for the second person's no-record-day background color
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
    generateAllDatesInPeriod(); 
    noLoop();
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
    // // 凡例のホバー判定
    // const legendX = MARGIN_LEFT;
    // const legendY = MARGIN_TOP / 2 - LEGEND_BOX_SIZE/2; // Y座標を調整
    // const person1LegendX = legendX;
    // const person2LegendX = legendX + LEGEND_BOX_SIZE + LEGEND_TEXT_OFFSET + textWidth('mom') + 40;

    // let newHoveredItem = null;
    // if (mouseX >= person1LegendX && mouseX <= person1LegendX + LEGEND_BOX_SIZE + LEGEND_TEXT_OFFSET + textWidth('mom') + 40 && mouseY >= legendY && mouseY <= legendY + LEGEND_BOX_SIZE) {
    //     newHoveredItem = 'person1';
    // } else if (mouseX >= person2LegendX && mouseX <= person2LegendX + LEGEND_BOX_SIZE + LEGEND_TEXT_OFFSET + textWidth('child') + 40 && mouseY >= legendY && mouseY <= legendY + LEGEND_BOX_SIZE) {
    //     newHoveredItem = 'person2';
    // }

    // // ホバー状態が変化した場合のみ再描画
    // if (newHoveredItem !== hoveredLegendItem) {
    //     hoveredLegendItem = newHoveredItem;
    //     redraw();
    // }
}

/**
 * A function that generates all dates from the specified start date to end date and updates allDatesInPeriod
 */
function generateAllDatesInPeriod() {
    const startDateStr = startDatePicker.value();
    const endDateStr = endDatePicker.value();

    if (!startDateStr || !endDateStr) {
        console.warn("Please specify a start and end date.");
        allDatesInPeriod = [];
        updateVisualization();
        return;
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (startDate > endDate) {
        console.warn("Start date must be before the end date.");
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
        console.warn("No dates found within the specified period.");
        createCanvas(windowWidth - select('#controls').width, windowHeight).parent(select('body'));
        background(255);
        textSize(20);
        textAlign(CENTER, CENTER);
        fill(0);
        text("No dates found within the specified period.", width / 2, height / 2);
        noLoop();
        return;
    }

    prepareMaxSleepForDrawing(); 
    updateVisualization();
}


/**
 * Update visualization function: Updates drawing settings based on UI control values and redraws
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
  
    // Added: Link UI elements for the first person's no-record-day background color
    const noRecordDayBgR1 = unhex(noRecordDayBgColorPicker1.value().substring(1, 3));
    const noRecordDayBgG1 = unhex(noRecordDayBgColorPicker1.value().substring(3, 5));
    const noRecordDayBgB1 = unhex(noRecordDayBgColorPicker1.value().substring(5, 7));
    const noRecordDayBgA1 = parseInt(noRecordDayBgAlphaSlider1.value());
    NO_RECORD_DAY_BG_COLOR1 = color(noRecordDayBgR1, noRecordDayBgG1, noRecordDayBgB1, noRecordDayBgA1);
    noRecordDayBgAlphaValue1.html(noRecordDayBgA1);

    // Added: Link UI elements for the second person's no-record-day background color
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
    guideLineWeightValue.html(GUIDE_LINE_WEIGHT);
    guideLineAlphaValue.html(guideLineA);

    resizeCanvasBasedOnContent();
    redraw();
}

/**
 * Main drawing loop: Runs only when redraw() is called
 */
function draw() {
    background(CANVAS_BG_COLOR); // Set the overall canvas background color
    drawBarGraph();
    drawLegend(); // 凡例の描画を呼び出し
}

/**
 * Analyzes each day's sleep-wake cycle and calculates the maximum sleep time in minutes for that day.
 * The data is aggregated in a 24-hour cycle starting at 7:00.
 */
function prepareMaxSleepForDrawing() {
    maxSleepPerDay = {}; // Reset data

    const childBirthDateStr = childBirthDatePicker.value();
    let childBirthDateMs = 0;
    if (childBirthDateStr) {
        const tempDate = new Date(childBirthDateStr);
        childBirthDateMs = new Date(tempDate.getFullYear(), tempDate.getMonth(), tempDate.getDate()).getTime();
    }
    
    // Process each date in allDatesInPeriod (the base date for the display row)
    for (const dateStr of allDatesInPeriod) {
        const displayDateObj = new Date(dateStr);
        // Display period for the row (in milliseconds): from 7:00 of displayDateStr to 7:00 of the next day
        const rowDisplayStartMs = displayDateObj.getTime() + (7 * 60) * 60 * 1000;
        const rowDisplayEndMs = rowDisplayStartMs + 24 * 60 * 60 * 1000;

        let maxSleep1 = 0;
        let maxSleep2 = 0;
        
        // Aggregate sleep time for Person 1
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
        
        // Aggregate sleep time for Person 2
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
 * Draws the bar graph
 */
function drawBarGraph() {
    const totalDays = allDatesInPeriod.length;

    // Draw the vertical axis and guide lines
    drawAxesAndGuidelines();
    
    // Draw the bar graph for each day
    for (let i = 0; i < totalDays; i++) {
        const dateStr = allDatesInPeriod[i];
        const data = maxSleepPerDay[dateStr];
        const yBase = MARGIN_TOP + i * (ROW_HEIGHT + ROW_GAP);
        
        // ハッチングで記録がない日を描画
        drawNoRecordPattern(dateStr, yBase);
        
        // 日付とイベントテキストを描画
        drawDateAndEvents(dateStr, yBase);
        
        // バーグラフを描画
        if (data) {
            drawBars(data, yBase,getDisplayColor('person1', SLEEP_COLOR1),getDisplayColor('person2', SLEEP_COLOR2));
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

/**
 * A helper function to draw the bar graph itself
 */
function drawBars(data,yBase , person1Color,person2Color) {
    const vizWidth = width - MARGIN_LEFT - EVENT_TEXT_WIDTH - MARGIN_RIGHT;

    // Draw the bar for Person 1
    if (data.person1 > 0 && isPerson1Visible) {
        const barLength1 = map(data.person1, 0, MAX_SLEEP_MINUTES, 0, vizWidth);
        const yCenter = yBase + (ROW_HEIGHT / 2);
        stroke(person1Color);
        strokeWeight(SLEEP_LINE_WEIGHT);
        line(MARGIN_LEFT, yCenter, MARGIN_LEFT + barLength1, yCenter);
    }

    // Draw the bar for Person 2
    if (data.person2 > 0 && isPerson2Visible) {
        const barLength2 = map(data.person2, 0, MAX_SLEEP_MINUTES, 0, vizWidth);
        const yCenter = yBase + (ROW_HEIGHT / 2);
        stroke(person2Color);
        strokeWeight(SLEEP_LINE_WEIGHT);
        line(MARGIN_LEFT, yCenter, MARGIN_LEFT + barLength2, yCenter);
    }
}

/**
 * A helper function to draw the date and event text
 */
function drawDateAndEvents(dateStr, yBase) {
    const visualizationRightX = width - EVENT_TEXT_WIDTH - MARGIN_RIGHT;
    
    // 日付とイベントテキストを描画
    noStroke();
    fill(TEXT_COLOR);
    textSize(12);
    textAlign(RIGHT, CENTER);

    const oneDay = 1000 * 60 * 60 * 24;
    const pregnancyStartDate = new Date(PREGNANCY_START_DATE);
    const currentDate = new Date(dateStr);
    const childBirthDate = childBirthDatePicker.value() ? new Date(childBirthDatePicker.value()) : null;

    let displayDateText = '';
    
    // Check if it's the childbirth date
    if (childBirthDate && currentDate.toDateString() === childBirthDate.toDateString()) {
      displayDateText = `Birth Date`;
    } else if (childBirthDate && currentDate.getTime() < childBirthDate.getTime()) {
        // 妊娠期間中の表示
        const daysPregnant = Math.floor((currentDate.getTime() - pregnancyStartDate.getTime()) / oneDay);
        const months = Math.floor(daysPregnant / 30.44);
        const days = daysPregnant % 30.44; 
        
        // Display pregnancy months only on the first day of that month
        if (daysPregnant >= 0 && daysPregnant < 1) {
            displayDateText = `0 mo.`;
        } else if (Math.abs(days) < 1) {
            displayDateText = `${months} mo.`;
        } else {
            // displayDateText = `${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
        }
    } else if (childBirthDate && currentDate.getTime() > childBirthDate.getTime()) {
        // 産後の期間の表示
        const daysSinceBirth = Math.floor((currentDate.getTime() - childBirthDate.getTime()) / oneDay);
        const months = Math.floor(daysSinceBirth / 30.44);
        const days = daysSinceBirth % 30.44;

        // Display postpartum age in months only on the first day of that month
        if (Math.abs(days) < 1) {
            displayDateText = `${months} mo. old`;
        } else {
            // displayDateText = `${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
        }
    } else {
        // If childbirth date is not set
        displayDateText = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
    }
    
    text(displayDateText, MARGIN_LEFT - 10, yBase + ROW_HEIGHT / 2);

    // // Draw event text
    // if (eventData && eventData[dateStr]) {
    //     noStroke();
    //     fill(TEXT_COLOR);
    //     textSize(12);
    //     textAlign(LEFT, CENTER);
    //     const eventTextX = visualizationRightX;
    //     const eventTextY = yBase + ROW_HEIGHT / 2;
    //     text(EVENT_TEXT_PREFIX, eventTextX, eventTextY);
    //     const eventMainTextX = eventTextX + textWidth(EVENT_TEXT_PREFIX);
    //     text(eventData[dateStr], eventMainTextX, eventTextY, EVENT_TEXT_WIDTH - 20);
    // }
}


/**
 * A helper function to draw the hatching pattern for days with no records
 */
function drawNoRecordPattern(dateStr, yBase) {
    const vizWidth = width - MARGIN_LEFT - EVENT_TEXT_WIDTH - MARGIN_RIGHT;
    const hasDataEntry1 = hasDataEntryForPerson(sleepData1, dateStr);
    const hasDataEntry2 = hasDataEntryForPerson(sleepData2, dateStr);
    const currentDisplayDateMs = new Date(new Date(dateStr).getFullYear(), new Date(dateStr).getMonth(), new Date(dateStr).getDate()).getTime();
    const childBirthDateMs = childBirthDatePicker.value() ? new Date(childBirthDatePicker.value()).getTime() : 0;
    
    noFill();
    stroke(NO_RECORD_DAY_BG_COLOR1);
    strokeWeight(1);
    const lineSpacing = 4;
    const subRowHeight = ROW_HEIGHT / 2;

    // Hatching for Person 1 (Mother)
    if (!hasDataEntry1) {
        const rectX = MARGIN_LEFT;
        const rectY = yBase;
        const rectW = vizWidth;
        const rectH = subRowHeight;
        for (let x = rectX - rectH; x < rectX + rectW + rectH; x += lineSpacing) {
            line(x, rectY, x + rectH, rectY + rectH);
        }
    }

    stroke(NO_RECORD_DAY_BG_COLOR2);
    // Hatching for Person 2 (Child) is only displayed if there is no record after the childbirth date
    if (!hasDataEntry2 && (childBirthDateMs !== 0 && currentDisplayDateMs >= childBirthDateMs)) {
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
 * A helper function to draw the axis and guide lines
 */
function drawAxesAndGuidelines() {
    const visualizationRightX = width - EVENT_TEXT_WIDTH - MARGIN_RIGHT;
    const vizWidth = visualizationRightX - MARGIN_LEFT;

    // Axis
    stroke(TIME_AXIS_COLOR);
    strokeWeight(1);
    line(MARGIN_LEFT, MARGIN_TOP, MARGIN_LEFT, height - MARGIN_BOTTOM);
    line(visualizationRightX, MARGIN_TOP, visualizationRightX, height - MARGIN_BOTTOM);

    // Axis text
    
    fill(TEXT_COLOR);
    textSize(12);
    textAlign(CENTER, BOTTOM);
    text('0h', MARGIN_LEFT, MARGIN_TOP - TEXT_OFFSET_Y * 3);
    text('24h', visualizationRightX, MARGIN_TOP - TEXT_OFFSET_Y * 3);

    // 12h, 6h, and 18h guide lines and text
    stroke(GUIDE_LINE_COLOR);
    strokeWeight(GUIDE_LINE_WEIGHT);
    const x12h = map(12 * 60, 0, MAX_SLEEP_MINUTES, MARGIN_LEFT, visualizationRightX);
    const x6h = map(6 * 60, 0, MAX_SLEEP_MINUTES, MARGIN_LEFT, visualizationRightX);
    const x18h = map(18 * 60, 0, MAX_SLEEP_MINUTES, MARGIN_LEFT, visualizationRightX);
    
    line(x12h, MARGIN_TOP, x12h, height - MARGIN_BOTTOM);
    line(x6h, MARGIN_TOP, x6h, height - MARGIN_BOTTOM);
    line(x18h, MARGIN_TOP, x18h, height - MARGIN_BOTTOM);

    noStroke();
    fill(TEXT_COLOR);
    textAlign(CENTER, BOTTOM);
    text('6h', x6h, MARGIN_TOP - TEXT_OFFSET_Y * 3);
    text('12h', x12h, MARGIN_TOP - TEXT_OFFSET_Y * 3);
    text('18h', x18h, MARGIN_TOP - TEXT_OFFSET_Y * 3);
}


/**
 * Checks if a data entry exists for a specific person on that date.
 */
function hasDataEntryForPerson(data, date) {
    return data[date] !== undefined && data[date] !== null && data[date].length > 0;
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
