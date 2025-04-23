/**
 * Snaps a value to the nearest multiple of step
 * @param value The value to snap
 * @param step The step size (default: 10mm)
 * @returns The snapped value
 */
export const snap = (value: number, step = 10): number =>
    Math.round(value / step) * step;
