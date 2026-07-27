import { useEffect } from 'react'
import { bodies } from '../data/bodies'
import { useStore } from '../store'

// Keyboard shortcuts:
//   ← / →  cycle through the Sun and planets
//   1–8    jump to a planet (Mercury→Neptune),  0  jumps to the Sun
//   Esc    back to the overview (or end the tour)
export function KeyboardNav() {
  useEffect(() => {
    const ids = bodies.map((b) => b.id)

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const st = useStore.getState()

      if (e.key === 'Escape') {
        if (st.tour) st.endTour()
        else st.clear()
        return
      }

      const isArrow = e.key === 'ArrowRight' || e.key === 'ArrowLeft'
      const isDigit = /^[0-8]$/.test(e.key)
      if (!isArrow && !isDigit) return

      if (st.tour) st.endTour()

      if (isArrow) {
        e.preventDefault()
        const dir = e.key === 'ArrowRight' ? 1 : -1
        const cur = st.selectedId ? ids.indexOf(st.selectedId) : dir === 1 ? -1 : ids.length
        const next = (cur + dir + ids.length) % ids.length
        st.select(ids[next])
      } else {
        const n = parseInt(e.key, 10)
        st.select(n === 0 ? 'sun' : ids[n])
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return null
}
