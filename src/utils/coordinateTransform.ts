export function topToBottomYMm(topYMm: number, gridHeightM: number): number {
  const gridHeightMm = gridHeightM * 1000;
  return Math.round(gridHeightMm - topYMm);
}

export function bottomToTopYMm(bottomYMm: number, gridHeightM: number): number {
  const gridHeightMm = gridHeightM * 1000;
  return Math.round(gridHeightMm - bottomYMm);
}

export function rectTopToBottomYMm(topYMm: number, heightMm: number, gridHeightM: number): number {
  const gridHeightMm = gridHeightM * 1000;
  return Math.round(gridHeightMm - topYMm - heightMm);
}

export function rectBottomToTopYMm(bottomYMm: number, heightMm: number, gridHeightM: number): number {
  const gridHeightMm = gridHeightM * 1000;
  return Math.round(gridHeightMm - bottomYMm - heightMm);
}
