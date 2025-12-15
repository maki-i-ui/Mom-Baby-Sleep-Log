/* =========================
   Intro Component
========================= */
function renderIntro(containerId) {
    const container = document.getElementById(containerId);
  
    const intro = document.createElement('div');
    intro.className = 'intro';
  
    intro.innerHTML = `
      <p class="intro-text">
        “When my baby was born, nights became fragments of minutes.<br>
        I didn’t know when I would sleep again.<br>
        I chose to become a mother —<br>
        but I didn’t choose the loneliness.”
      </p>
    `;
  
    container.appendChild(intro);
  }
  
  
  /* =========================
     Month Section Component
  ========================= */
  function createMonthSection(dateGroup, spiralImage,description) {
    const section = document.createElement('section');
    section.className = 'month-section';
  
    section.appendChild(createMonthHeader(dateGroup,description));
    section.appendChild(createMonthBody(dateGroup, spiralImage));
    section.appendChild(createDivider());
  
    return section;
  }
  
  
  /* ---------- Header ---------- */
  function createMonthHeader(dateGroup,description) {
    const header = document.createElement('div');
    header.className = 'month-header';
  
    header.innerHTML = `
      <div class="month-title">
        <span class="label">Pregnancy:</span>
        <span class="value">${dateGroup.label}</span>
      </div>
      <p class="month-description">
        ${description|| ''}
      </p>
    `;
  
    return header;
  }
  
  
  /* ---------- Body ---------- */
  function createMonthBody(dateGroup, spiralImage) {
    const body = document.createElement('div');
    body.className = 'month-body';
  
    body.appendChild(createLeftMetrics(dateGroup));
    body.appendChild(createRightVisuals(spiralImage));
  
    return body;
  }
  
  
  /* ---------- Left Metrics ---------- */
  function createLeftMetrics(dateGroup) {
    const left = document.createElement('div');
    left.className = 'month-metrics';
  
    if (!dateGroup.metrics) return left;
  
    const bars = document.createElement('div');
    bars.className = 'metrics-bars';
  
    dateGroup.metrics.forEach(m => {
      const bar = document.createElement('div');
      bar.className = 'metric-bar';
      bar.style.width = `${m.value}px`;
      bars.appendChild(bar);
    });
  
    left.appendChild(bars);
    return left;
  }
  
  
  /* ---------- Right Visuals ---------- */
  function createRightVisuals(spiralImage) {
    const right = document.createElement('div');
    right.className = 'month-visuals';
    const img = document.createElement('img');
    img.src = spiralImage;
    img.className = 'spiral-img';
    right.appendChild(img);

  
    return right;
  }
  
  
  /* ---------- Divider ---------- */
  function createDivider() {
    const divider = document.createElement('div');
    divider.className = 'month-divider';
    return divider;
  }
  