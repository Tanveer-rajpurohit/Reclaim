export const drawDaySky = (ctx: CanvasRenderingContext2D, height: number) => {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0.0, "#134B8C");
  grad.addColorStop(0.35, "#2D6FB0");
  grad.addColorStop(0.65, "#7FA9D4");
  grad.addColorStop(0.85, "#C6DCEE");
  grad.addColorStop(1.0, "#E8F0F7");
  return grad;
};

export const drawSunsetSky = (
  ctx: CanvasRenderingContext2D,
  height: number,
) => {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0.0, "#16234A");
  grad.addColorStop(0.35, "#3B3E68");
  grad.addColorStop(0.6, "#9A5E72");
  grad.addColorStop(0.8, "#E07A4E");
  grad.addColorStop(1.0, "#FBBB6E");
  return grad;
};

export const drawTwilightSky = (
  ctx: CanvasRenderingContext2D,
  height: number,
) => {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0.0, "#080B1F");
  grad.addColorStop(0.4, "#1B2350");
  grad.addColorStop(0.72, "#5C3E6E");
  grad.addColorStop(1.0, "#C46B7A");
  return grad;
};

export const drawSynthwaveSky = (
  ctx: CanvasRenderingContext2D,
  height: number,
) => {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0.0, "#0A0221");
  grad.addColorStop(0.4, "#3B0A5E");
  grad.addColorStop(0.7, "#9A1774");
  grad.addColorStop(1.0, "#FF6F91");
  return grad;
};

export const drawMartianSky = (
  ctx: CanvasRenderingContext2D,
  height: number,
) => {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0.0, "#241211");
  grad.addColorStop(0.45, "#5A2A1E");
  grad.addColorStop(0.75, "#A34B2E");
  grad.addColorStop(1.0, "#D98F5C");
  return grad;
};

export const drawStealthSky = (
  ctx: CanvasRenderingContext2D,
  height: number,
) => {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0.0, "#03060A");
  grad.addColorStop(0.5, "#0A1420");
  grad.addColorStop(0.82, "#152B3C");
  grad.addColorStop(1.0, "#234156");
  return grad;
};
export const drawBlueSky = (ctx: CanvasRenderingContext2D, height: number) => {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#125588");
  grad.addColorStop(0.4, "#1c6b9f");
  grad.addColorStop(0.7, "#75a7c5");
  grad.addColorStop(0.9, "#d6e6ef");
  grad.addColorStop(1, "#ffffff");
  return grad;
};
