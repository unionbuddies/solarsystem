import { useEffect, useMemo, useRef, useState } from 'react'
import { bodies } from '../data/bodies'
import { useStore } from '../store'

export function JumpMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const select = useStore((s) => s.select)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return bodies
    return bodies.filter((b) => b.name.toLowerCase().includes(q) || b.tagline.toLowerCase().includes(q))
  }, [query])

  // Open with "/", close with Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement
      if (e.key === '/' && !typing) {
        e.preventDefault()
        setOpen(true)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Focus the field when opening; reset query when closing.
  useEffect(() => {
    if (open) {
      setQuery('')
      const t = setTimeout(() => inputRef.current?.focus(), 20)
      return () => clearTimeout(t)
    }
  }, [open])

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  const choose = (id: string) => {
    select(id)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Jump to a world  ( / )"
        className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/90 ring-1 ring-white/10 backdrop-blur transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-md hover:shadow-sky-400/15 hover:ring-white/25 active:translate-y-0"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        Jump to
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0a0d16]/90 shadow-2xl backdrop-blur-xl">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) choose(results[0].id)
            }}
            placeholder="Search worlds…"
            className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm text-white placeholder-white/30 outline-none"
          />
          <ul className="max-h-72 overflow-y-auto py-1">
            {results.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => choose(b.id)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-white/10"
                >
                  <span className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: b.color }} />
                  <span>
                    <span className="text-sm text-white/90">{b.name}</span>
                    <span className="block text-[11px] text-white/40">{b.tagline}</span>
                  </span>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="px-4 py-3 text-sm text-white/40">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
