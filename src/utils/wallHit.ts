import { fabric } from 'fabric';

export const wallHit = (
    mod: fabric.Object,
    p: { x: number; y: number },
    tolerance = 8
): 1 | 2 | 3 | 4 | null => {
    const L = mod.left!;
    const T = mod.top!;
    const W = mod.width!;
    const H = mod.height!;

    if (Math.abs(p.y - (T + H)) < tolerance && p.x >= L && p.x <= L + W) return 1; // bottom
    if (Math.abs(p.x - (L + W)) < tolerance && p.y >= T && p.y <= T + H) return 2; // right
    if (Math.abs(p.y - T) < tolerance && p.x >= L && p.x <= L + W) return 3;        // top
    if (Math.abs(p.x - L) < tolerance && p.y >= T && p.y <= T + H) return 4;        // left
    return null;
};
