import { useEffect } from 'react'
import { bodies } from '../data/bodies'
import { useStore } from '../store'

/** A narrated guided tour that flies through each world in turn, speaking a
 *  short blurb via the browser's speech synthesis. Renders its start/stop button. */
export function Tour() {
  const tour = useStore((s) => s.tour)
  const startTour = useStore((s) => s.startTour)
  const endTour = useStore((s) => s.endTour)

  useEffect(() => {
    if (!tour) return
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let idx = 0

    const speak = (text: string, onDone: () => void) => {
      let done = false
      const finish = () => {
        if (done || cancelled) return
        done = true
        onDone()
      }
      if (!synth) {
        timer = setTimeout(finish, 4500)
        return
      }
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 1
      u.pitch = 1
      u.onend = finish
      u.onerror = finish
      synth.cancel()
      synth.speak(u)
      // Safety: advance even if the speech engine never fires onend.
      const est = Math.min(15000, Math.max(4500, text.length * 70))
      timer = setTimeout(finish, est)
    }

    const step = () => {
      if (cancelled) return
      if (idx >= bodies.length) {
        endTour()
        return
      }
      const b = bodies[idx]
      useStore.getState().select(b.id)
      speak(`${b.name}. ${b.tagline}. ${b.funFacts[0]}`, () => {
        if (cancelled) return
        timer = setTimeout(() => {
          idx += 1
          step()
        }, 600)
      })
    }

    // Let the first camera fly-in begin before the narration starts.
    timer = setTimeout(step, 500)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      if (synth) synth.cancel()
    }
  }, [tour, endTour])

  return (
    <button
      onClick={() => (tour ? endTour() : startTour())}
      title="Take a narrated tour of the solar system"
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm ring-1 backdrop-blur transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-400/15 active:translate-y-0 ${
        tour
          ? 'bg-rose-500/20 text-rose-100 ring-rose-400/40 hover:bg-rose-500/30 hover:shadow-rose-400/20'
          : 'bg-white/5 text-white/90 ring-white/10 hover:bg-white/10 hover:ring-white/25'
      }`}
    >
      {tour ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1.5" />
          </svg>
          End tour
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Take a tour
        </>
      )}
    </button>
  )
}
