// UI要素の参照
let baseRadiusSlider, ringSpacingSlider;
let sleepLineWeightSlider, sleepLineWeightValue; 
let sleepColorPicker1, sleepColorAlphaSlider1, sleepColorAlphaValue1;
let sleepColorPicker2, sleepColorAlphaSlider2, sleepColorAlphaValue2;
let canvasBgColorPicker;
let toggleButton; 
let controlsPanel; 
// --- 期間設定用のUI要素 ---
let pregnancyStartDate; // Date
let birthDate;          // Date
let startDatePicker, endDatePicker, applyDateRangeButton,childBirthDatePicker;

function setUpUI(){
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
}

function updateUI(){
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
}