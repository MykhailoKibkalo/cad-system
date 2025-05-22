// src/components/Canvas/hooks/useGroupCommands.ts
import { useEffect } from 'react'
import type { Canvas } from 'fabric'
import { useToolStore } from '@/state/toolStore'

export default function useGroupCommands(canvas: Canvas | null) {
    const { tool } = useToolStore()

    useEffect(() => {
        if (!canvas) return

        const onKeyDown = (e: KeyboardEvent) => {
            // Ctrl+G → групувати
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                const sel = canvas.getActiveObject()
                if (sel && (sel as any).type === 'activeSelection') {
                    const group = (sel as any).toGroup()
                    canvas.requestRenderAll()
                    canvas.setActiveObject(group)
                }
            }
            // Ctrl+U → розгрупувати
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                const obj = canvas.getActiveObject()
                if (obj && (obj as any).type === 'group') {
                    const activeSel = (obj as any).toActiveSelection()
                    canvas.requestRenderAll()
                    canvas.setActiveObject(activeSel)
                }
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [canvas, tool])
}
