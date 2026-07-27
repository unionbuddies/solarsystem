import { useEffect } from 'react'
import { bodies } from '../data/bodies'
import { useStore } from '../store'

// Preferred British male voices, best-sounding first. Availability varies by
// device/browser, so we fall back through the list and then to any male-ish voice.
const PREFERRED_VOICES = [
  'Daniel', // macOS en-GB male — the preferred tour voice
  'Google UK English Male', // Chrome — natural British male
  'Microsoft Ryan Online (Natural)', // Edge — natural British male
  'Microsoft Brian Online (Natural)',
  'Microsoft George', // Windows en-GB male
  'Arthur', // macOS en-GB male (if installed)
  'Oliver',
]

const MALE_RE = /\b(daniel|arthur|oliver|george|ryan|brian|guy|male|man)\b/i

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const gb = voices.filter((v) => /^en[-_]GB/i.test(v.lang))
  const en = voices.filter((v) => /^en([-_]|$)/i.test(v.lang))
  const byPreference = (list: SpeechSynthesisVoice[]) => {
    for (const name of PREFERRED_VOICES) {
      const match = list.find((v) => v.name.toLowerCase().includes(name.toLowerCase()))
      if (match) return match
    }
    return null
  }
  // Prefer a British voice, then any English voice.
  return (
    byPreference(gb) ??
    gb.find((v) => MALE_RE.test(v.name)) ??
    byPreference(en) ??
    en.find((v) => MALE_RE.test(v.name)) ??
    gb[0] ??
    en[0] ??
    voices[0] ??
    null
  )
}

// Nudge tricky names toward their conventional pronunciation ("YOOR-ah-nus").
const pronounce = (text: string) => text.replace(/Uranus/gi, 'Yoor-ah-nus')

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

const INTROS = [
  'Next up is',
  'Now we arrive at',
  "Let's move on to",
  'Here we have',
  'Turning our attention to',
  'And now, say hello to',
  'Drifting outward, we reach',
]

// Rotated so no two neighboring planets share the same fact lead-in. Kept a
// different length than INTROS so intro/lead pairings keep varying too.
const FACT_LEADS = [
  'Fun fact:',
  'And here is a neat detail —',
  'Interestingly,',
  'Believe it or not,',
  'One thing that really stands out:',
  'Remarkably,',
]

function narrationFor(index: number): string {
  const b = bodies[index]
  const tag = lowerFirst(b.tagline)
  const fact = b.funFacts[0]
  if (index === 0) {
    return `Welcome aboard our tour of the solar system. Let's begin right at the center, with the Sun — ${tag}. ${fact}`
  }
  const intro = INTROS[(index - 1) % INTROS.length]
  const lead = FACT_LEADS[(index - 1) % FACT_LEADS.length]
  return `${intro} ${b.name}, ${tag}. ${lead} ${fact}`
}

/** A narrated guided tour that flies through each world in turn, speaking a
 *  short blurb in a natural male voice via the browser's speech synthesis. */
export function Tour() {
  const tour = useStore((s) => s.tour)
  const startTour = useStore((s) => s.startTour)
  const endTour = useStore((s) => s.endTour)

  // Warm up the voice list (getVoices is populated lazily in some browsers).
  useEffect(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    if (!synth) return
    const warm = () => synth.getVoices()
    warm()
    synth.addEventListener?.('voiceschanged', warm)
    return () => synth.removeEventListener?.('voiceschanged', warm)
  }, [])

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
      const u = new SpeechSynthesisUtterance(pronounce(text))
      const voice = pickVoice(synth.getVoices())
      if (voice) {
        u.voice = voice
        u.lang = voice.lang
      }
      u.rate = 0.95 // a touch slower reads more naturally
      u.pitch = 1
      u.onend = finish
      u.onerror = finish
      synth.cancel()
      synth.speak(u)
      // Safety: advance even if the speech engine never fires onend.
      const est = Math.min(20000, Math.max(5000, text.length * 75))
      timer = setTimeout(finish, est)
    }

    const step = () => {
      if (cancelled) return
      if (idx >= bodies.length) {
        speak('And that completes our grand tour of the solar system. Thanks for joining me.', () => endTour())
        return
      }
      useStore.getState().select(bodies[idx].id)
      speak(narrationFor(idx), () => {
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
