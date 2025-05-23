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
      const mod = modules.find(m => m.id === bc.moduleId)!
      let left = mod.x0! * scale
      let top  = mod.y0! * scale
      let w    = bc.width  * scale
      let h    = bc.length * scale

      switch (bc.wallSide) {
        case 1: left += bc.distanceAlongWall * scale; top -= h;                break
        case 2:
          left += mod.width! * scale
          top  += bc.distanceAlongWall * scale
          w = bc.length * scale; h = bc.width * scale
          break
        case 3:
          left += bc.distanceAlongWall * scale
          top  += mod.length! * scale
          break
        case 4:
          left -= bc.length * scale
          top  += bc.distanceAlongWall * scale
          w = bc.length * scale; h = bc.width * scale
          break
      }

      const rect = new fabric.Rect({
            left,
            top,
            width:  w,
            height: h,
            fill:   'rgba(150,0,200,0.3)',
            stroke: '#9600c8',
            strokeWidth: 1,

            selectable: true,
            evented:    true,

            // Заборона скейлу/ротації, але дозволяємо переміщення
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true,

            // *** ВАЖЛИВО: відключаємо піксельний hit-тест! ***
            perPixelTargetFind: false,
          })
      ;(rect as any).isBalcony = bc.id
      canvas.add(rect)
    })
    canvas.requestRenderAll()
  }, [canvas, balconies, modules, scale])
}
