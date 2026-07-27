import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

const MESSAGES = [
  'Summoning the solar system…',
  'Igniting the Sun…',
  'Winding up the orbits…',
  'Scattering a little stardust…',
  'Polishing Saturn’s rings…',
  'Nudging the planets into place…',
]

export function LoadingScreen() {
  const { progress } = useProgress()
  const [msg, setMsg] = useState(0)
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setMsg((i) => (i + 1) % MESSAGES.length), 1500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (progress >= 100) {
      setFading(true)
      const t = setTimeout(() => setGone(true), 700)
      return () => clearTimeout(t)
    }
  }, [progress])

  if (gone) return null

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#05060a] transition-opacity duration-700 ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Little spinning ringed world */}
      <div className="relative mb-8 h-16 w-16">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-t-sky-400" style={{ animationDuration: '1.4s' }} />
        <div className="absolute inset-[26%] rounded-full bg-gradient-to-br from-amber-300 to-orange-500" />
      </div>

      <p className="min-h-[1.5rem] text-sm tracking-wide text-white/70">{MESSAGES[msg]}</p>

      <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] tabular-nums text-white/30">{Math.round(progress)}%</p>
    </div>
  )
}
