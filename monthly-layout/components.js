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
  function createMonthSection(dateGroup, spiralImage1,spiralImage2,barImage, description) {
    const section = document.createElement('section');
    section.className = 'month-section';
  
    section.appendChild(createMonthHeader(dateGroup,description));
    section.appendChild(createMonthBody(dateGroup, spiralImage1, spiralImage2,barImage));
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
  function createMonthBody(dateGroup, spiralImage1,spiralImage2,barImage) {
    const body = document.createElement('div');
    body.className = 'month-body';
  
    // body.appendChild(createLeftMetrics(dateGroup));
    body.appendChild(createLeftVisuals(barImage));
    body.appendChild(createRightVisuals(spiralImage1,spiralImage2));
  
    return body;
  }
  
    /* ---------- Left Visuals ---------- */
    function createLeftVisuals(barImage) {
        const left = document.createElement('div');
        left.className = 'month-visuals';
        const img = document.createElement('img');
        img.src = barImage;
        img.className = 'bar-img';
        left.appendChild(img);
        return left;
      }
  
  /* ---------- Right Visuals ---------- */
  function createRightVisuals(spiralImage1,spiralImage2) {
    const right = document.createElement('div');
    right.className = 'month-visuals';
    const img1 = document.createElement('img');
    img1.src = spiralImage1;
    img1.className = 'spiral1-img';
    right.appendChild(img1);
    const img2 = document.createElement('img');
    img2.src = spiralImage2;
    img2.className = 'spiral2-img';
    right.appendChild(img2);
    return right;
  }
  
  
  /* ---------- Divider ---------- */
  function createDivider() {
    const divider = document.createElement('div');
    divider.className = 'month-divider';
    return divider;
  }
  