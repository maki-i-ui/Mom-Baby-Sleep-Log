// renderOffscreenImage.js
export function renderOffscreenImage({ width, height, draw }) {
    return new Promise((resolve) => {
      const sketch = (p) => {
        let canvas;
  
        p.setup = () => {
          canvas = p.createCanvas(width, height);
          p.noLoop();
        };
  
        p.draw = () => {
          draw(p);
          resolve(canvas.elt.toDataURL('image/png'));
          p.remove();
        };
      };
  
      new p5(sketch, document.createElement('div'));
    });
  }
  