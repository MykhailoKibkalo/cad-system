// src/components/Canvas/hooks/useRenderBalconies.ts
import { useEffect } from 'react'
import type { Canvas } from 'fabric'
import * as fabric  from 'fabric'
import { useObjectStore } from '@/state/objectStore'
import { useCanvasStore } from '@/state/canvasStore'

export default function useRenderBalconies(canvas: Canvas | null) {
    const balconies = useObjectStore(s => s.balconies)
    const modules   = useObjectStore(s => s.modules)
    const scale     = useCanvasStore(s => s.scaleFactor)

    useEffect(() => {
        if (!canvas) return
        // почистимо старі
        canvas.getObjects().forEach(o => {
            if ((o as any).isBalcony) canvas.remove(o)
        })
        // і нарисуємо нові
        balconies.forEach(bc => {
            const mod = modules.find(m => m.id === bc.moduleId)
            if (!mod) return

            let left = mod.x0! * scale
            let top  = mod.y0! * scale
            let w    = bc.width  * scale
            let h    = bc.length * scale

            switch (bc.wallSide) {
                case 1: // top
                    left += bc.distanceAlongWall * scale
                    top -= h
                    break
                case 2: // right
                    left += mod.width! * scale
                    top  += bc.distanceAlongWall * scale
                    w = bc.length * scale
                    h = bc.width * scale
                    break
                case 3: // bottom
                    left += bc.distanceAlongWall * scale
                    top  += mod.length! * scale
                    break
                case 4: // left
                    left -= bc.length * scale
                    top  += bc.distanceAlongWall * scale
                    w = bc.length * scale
                    h = bc.width * scale
                    break
            }

            const rect = new fabric.Rect({
                    left,
                    top,
                    width:  w,
                    height: h,
                    fill:   'rgba(150,0,200,0.3)',
                    stroke: '#9600c8',
                    strokeWidth: 2,
                    strokeUniform: true,

                    // IMPORTANT: Set origin to left/top for predictable movement
                    originX: 'left',
                    originY: 'top',

                    selectable: true,
                    evented:    true,
                    hasControls: true,

                    // Lock rotation but allow scaling
                    lockRotation: true,

                    // Hide rotation control
                    setControlsVisibility: {
                        mtr: false, // rotation control
                    } as any,

                    // Disable pixel hit-test for better performance
                    perPixelTargetFind: false,
                })
            ;(rect as any).isBalcony = bc.id
            ;(rect as any).balconyData = {
                wallSide: bc.wallSide,
                moduleId: bc.moduleId,
                originalLeft: left,
                originalTop: top,
            }
            canvas.add(rect)
        })
        canvas.requestRenderAll()
    }, [canvas, balconies, modules, scale])
}
