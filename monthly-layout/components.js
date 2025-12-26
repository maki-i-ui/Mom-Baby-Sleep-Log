/* =========================
   Intro Component
========================= */
export function renderIntro(containerId) {
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
  export function createMonthSection(dateGroup, spiralImage1,spiralImage2,barImage1,barImage2, description) {
    const section = document.createElement('section');
    section.className = 'month-section';
  
    section.appendChild(createMonthHeader(dateGroup,description));
    section.appendChild(createMonthBody(dateGroup, spiralImage1, spiralImage2,barImage1,barImage2));
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
  function createMonthBody(dateGroup, spiralImage1,spiralImage2,barImage1,barImage2) {
    const body = document.createElement('div');
    body.className = 'month-body';
  
    const leftVisuals = createVisualArea(
      'month-visuals-left',
      { src: spiralImage1, className: 'spiral' },
      { src: barImage1, className: 'bar' }
    );
    const rightVisuals = createVisualArea(
      'month-visuals-right',
      { src: barImage2, className: 'bar' },
      { src: spiralImage2, className: 'spiral' }
    );
    
    body.appendChild(leftVisuals);
    body.appendChild(rightVisuals);

  
    return body;
  }
  function createVisualArea(containerClass, leftImage, rightImage) {
    const container = document.createElement('div');
    container.className = containerClass;
  
    const leftImg = document.createElement('img');
    leftImg.src = leftImage.src;
    leftImg.className = leftImage.className;
  
    const rightImg = document.createElement('img');
    rightImg.src = rightImage.src;
    rightImg.className = rightImage.className;
  
    container.appendChild(leftImg);
    container.appendChild(rightImg);
  
    return container;
  }
  
  
  //   /* ---------- Left Visuals ---------- */
  //   function createLeftVisuals(barImage1,barImage2) {
  //       const left = document.createElement('div');
  //       left.className = 'month-visuals-left';
  //       const img1 = document.createElement('img');
  //       img1.src = barImage1;
  //       img1.className = 'bar1-img';
  //       left.appendChild(img1);
  //       const img2 = document.createElement('img');
  //       img2.src = barImage2;
  //       img2.className = 'bar2-img';
  //       left.appendChild(img2);
  //       return left;
  //     }
  
  // /* ---------- Right Visuals ---------- */
  // function createRightVisuals(spiralImage1,spiralImage2) {
  //   const right = document.createElement('div');
  //   right.className = 'month-visuals-right';
  //   const img1 = document.createElement('img');
  //   img1.src = spiralImage1;
  //   img1.className = 'spiral1-img';
  //   right.appendChild(img1);
  //   const img2 = document.createElement('img');
  //   img2.src = spiralImage2;
  //   img2.className = 'spiral2-img';
  //   right.appendChild(img2);
  //   return right;
  // }
  
  
  /* ---------- Divider ---------- */
  function createDivider() {
    const divider = document.createElement('div');
    divider.className = 'month-divider';
    return divider;
  }
  