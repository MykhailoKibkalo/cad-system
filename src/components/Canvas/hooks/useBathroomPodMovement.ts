// src/components/Canvas/hooks/useBathroomPodMovement.ts
import { useEffect } from 'react'
import type { Canvas } from 'fabric'
import { useObjectStore } from '@/state/objectStore'
import { useCanvasStore } from '@/state/canvasStore'

export default function useBathroomPodMovement(canvas: Canvas | null) {
    const updateBathroomPod = useObjectStore(s => s.updateBathroomPod)
    const bathroomPods      = useObjectStore(s => s.bathroomPods)
    const modules           = useObjectStore(s => s.modules)
    const scaleFactor       = useCanvasStore(s => s.scaleFactor)

    useEffect(() => {
        if (!canvas) return

        // Функція обмеження в межах модуля при переміщенні
        const onMoving = (opt: any) => {
            const obj = opt.target as any
            const bpId = obj.isBathroomPod as string | undefined
            if (!bpId) return

            const bp  = bathroomPods.find(b => b.id === bpId)
            const mod = modules.find(m => m.id === bp?.moduleId)
            if (!bp || !mod) return

            // межі модуля в пікселях
            const modLeft   = mod.x0! * scaleFactor
            const modTop    = mod.y0! * scaleFactor
            const modRight  = modLeft + mod.width!  * scaleFactor
            const modBottom = modTop  + mod.length! * scaleFactor

            // розміри прямокутника
            const rectW = obj.getScaledWidth()
            const rectH = obj.getScaledHeight()

            // обчислюємо нові координати з кліпом
            let left = obj.left!
            let top  = obj.top!

            // clamp X
            if (left < modLeft) left = modLeft
            if (left + rectW > modRight) left = modRight - rectW

            // clamp Y
            if (top < modTop) top = modTop
            if (top + rectH > modBottom) top = modBottom - rectH

            // застосовуємо
            obj.set({ left, top })
        }

        // Оновлення даних після завершення переміщення
        const onModified = (opt: any) => {
            const obj = opt.target as any
            const bpId = obj.isBathroomPod as string | undefined
            if (!bpId) return

            const bp  = bathroomPods.find(b => b.id === bpId)
            const mod = modules.find(m => m.id === bp?.moduleId)
            if (!bp || !mod) return

            // bounding box для врахування масштабів і поворотів
            const b = obj.getBoundingRect(true)
            const x1 = (b.left            - mod.x0! * scaleFactor) / scaleFactor
            const y1 = (b.top             - mod.y0! * scaleFactor) / scaleFactor
            const w  = b.width            / scaleFactor
            const h  = b.height           / scaleFactor

            updateBathroomPod(bpId, {
                x_offset: x1,
                y_offset: y1,
                width:    w,
                length:   h,
            })
        }

        canvas.on('object:moving', onMoving)
        canvas.on('object:modified', onModified)

        return () => {
            canvas.off('object:moving', onMoving)
            canvas.off('object:modified', onModified)
        }
    }, [canvas, bathroomPods, modules, scaleFactor, updateBathroomPod])
}
