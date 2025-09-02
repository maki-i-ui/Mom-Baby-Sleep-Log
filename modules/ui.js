// modules/ui.js
// UI 初期化と設定読み取り。元の UI をできるだけ尊重しつつ renderer 切替に対応。

export function initUI({ onChange = ()=>{}, onToggleRenderer = ()=>{} } = {}) {
    // basic toggles: connect many inputs to call onChange()
    const inputs = [
      '#rowHeightSlider','#rowGapSlider','#sleepLineWeightSlider',
      '#sleepColorPicker1','#sleepColorAlphaSlider1',
      '#sleepColorPicker2','#sleepColorAlphaSlider2',
      '#timeAxisColorPicker','#textColorPicker','#dotSizeSlider',
      '#dayBgColorPicker','#nightBgColorPicker',
      '#noRecordDayBgColorPicker1','#noRecordDayBgAlphaSlider1',
      '#noRecordDayBgColorPicker2','#noRecordDayBgAlphaSlider2',
      '#canvasBgColorPicker','#guideLineWeightSlider','#guideLineColorPicker','#guideLineAlphaSlider',
      '#showTimeTextCheckbox','#startDatePicker','#endDatePicker','#childBirthDatePicker'
    ];
    inputs.forEach(sel => {
      const el = select(sel);
      if (el) {
        // p5.dom element
        el.input ? el.input(onChange) : el.addEventListener && el.addEventListener('input', onChange);
      }
    });
  
    // toggle panel button
    const toggleButton = select('#toggle-button');
    const controls = select('#controls');
    if (toggleButton && controls) {
      toggleButton.mousePressed(()=>{
        controls.toggleClass('open');
        if (controls.hasClass('open')) toggleButton.html('設定パネルを閉じる');
        else toggleButton.html('設定パネルを開く');
      });
    }
  
    // renderer switch UI: create a small radio (we'll insert at top of controls if exists)
    const controlsEl = document.getElementById('controls');
    if (controlsEl) {
      const wrapper = document.createElement('div');
      wrapper.style.marginTop = '10px';
      wrapper.innerHTML = `<label><input type="radio" name="vizMode" value="timeline" checked> Timeline (7:00→7:00)</label>
                           <label style="margin-left:12px"><input type="radio" name="vizMode" value="longest"> Longest (duration)</label>`;
      controlsEl.insertBefore(wrapper, controlsEl.firstChild);
      const radios = wrapper.querySelectorAll('input[name="vizMode"]');
      radios.forEach(r => r.addEventListener('change', (e)=>{
        onToggleRenderer(e.target.value);
      }));
    }
  }
  
  // read UI settings into an object used by renderers
  export function readUISettings() {
    const rowHeight = Number(select('#rowHeightSlider').value()) || 20;
    const rowGap = Number(select('#rowGapSlider').value()) || 4;
    const sleepLineWeight = Number(select('#sleepLineWeightSlider').value()) || 2;
    const sleepColorHex1 = select('#sleepColorPicker1').value() || '#3dffe8';
    const sleepA1 = Number(select('#sleepColorAlphaSlider1').value()) || 160;
    const sleepColorHex2 = select('#sleepColorPicker2').value() || '#fbff00';
    const sleepA2 = Number(select('#sleepColorAlphaSlider2').value()) || 160;
    const timeAxisColor = colorFromHex(select('#timeAxisColorPicker').value() || '#090040');
    const textColor = colorFromHex(select('#textColorPicker').value() || '#c5c0ec');
    const dotSize = Number(select('#dotSizeSlider').value()) || 0;
    const dayBgColor = colorFromHex(select('#dayBgColorPicker').value() || '#130b4b');
    const nightBgColor = colorFromHex(select('#nightBgColorPicker').value() || '#090040');
    const noRecordColor1 = select('#noRecordDayBgColorPicker1').value() || '#3dffe8';
    const noRecordA1 = Number(select('#noRecordDayBgAlphaSlider1').value()) || 50;
    const noRecordColor2 = select('#noRecordDayBgColorPicker2').value() || '#fbff00';
    const noRecordA2 = Number(select('#noRecordDayBgAlphaSlider2').value()) || 50;
    const canvasBg = select('#canvasBgColorPicker').value() || '#090040';
    const guideLineWeight = Number(select('#guideLineWeightSlider').value()) || 1;
    const guideLineColor = colorFromHex(select('#guideLineColorPicker').value() || '#FFFFFF');
    const guideA = Number(select('#guideLineAlphaSlider').value()) || 100;
    const showTimeText = select('#showTimeTextCheckbox').checked();
    const startDate = select('#startDatePicker').value();
    const endDate = select('#endDatePicker').value();
    const childBirthDateStr = select('#childBirthDatePicker').value();
  
    // assemble a "settings" object expected by renderers
    return {
      rowHeight,
      rowGap,
      sleepLineWeight,
      sleepColor1: colorFromHex(sleepColorHex1, sleepA1),
      sleepColor2: colorFromHex(sleepColorHex2, sleepA2),
      timeAxisColor,
      textColor,
      dotSize,
      dayBgColor,
      nightBgColor,
      noRecordDayBgColor1: colorFromHex(noRecordColor1, noRecordA1),
      noRecordDayBgAlpha1: noRecordA1,
      noRecordDayBgColor2: colorFromHex(noRecordColor2, noRecordA2),
      noRecordDayBgAlpha2: noRecordA2,
      canvasBgColor: colorFromHex(canvasBg),
      guideLineWeight,
      guideLineColor: colorFromHex(hexFromColor(guideLineColor), guideA),
      showTimeText,
      marginTop: 100,
      marginBottom: 30,
      eventTextPrefix: '◀︎ ',
      isPerson1Visible: true,
      isPerson2Visible: true,
      childBirthDateStr,
      eventTextPrefix: '◀︎ '
    };
    
  }
  
  // helper to convert hex + alpha into a p5 color-like object
  function colorFromHex(hex, alpha=255) {
    // return a simple object with levels so renderers can read .levels if needed,
    // but p5's color() would be better; for compatibility we'll return hex when possible.
    return hexToRGBA(hex, alpha);
  }
  function hexToRGBA(hex, alpha=255) {
    hex = hex.replace('#','');
    const r = parseInt(hex.substring(0,2),16);
    const g = parseInt(hex.substring(2,4),16);
    const b = parseInt(hex.substring(4,6),16);
    return { r,g,b,a: alpha };
  }
  function hexFromColor(c){ // if c is object
    if (c && c.r !== undefined) {
      const r = c.r.toString(16).padStart(2,'0');
      const g = c.g.toString(16).padStart(2,'0');
      const b = c.b.toString(16).padStart(2,'0');
      return `#${r}${g}${b}`;
    }
    return '#ffffff';
  }
  