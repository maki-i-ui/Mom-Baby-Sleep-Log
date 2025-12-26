// createMonthlyImage.js
import { renderOffscreenImage } from './renderOffscreenImage.js';

export async function createMonthlyImage({
  renderer,
  dates,
  data,
  person,
  width,
  height,
  theme,
  config,
  ...rendererOptions
}) {
  return renderOffscreenImage({
    width,
    height,
    draw: (p) =>
      renderer({
        p,
        dates,
        data,
        person,
        theme,
        config,
        ...rendererOptions,
      }),
  });
}
