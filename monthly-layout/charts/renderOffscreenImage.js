// renderOffscreenImage.js
export function renderOffscreenImage({ width, height, resolution,draw }) {
    return new Promise((resolve) => {
      const sketch = (p) => {
        let canvas;
  
        p.setup = () => {
          p.pixelDensity(1);
          canvas = p.createCanvas(width*resolution, height*resolution);
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
  