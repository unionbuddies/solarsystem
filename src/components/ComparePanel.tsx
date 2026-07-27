import { useStore } from '../store'
import { bodies, bodyById, type Body } from '../data/bodies'

function BodyColumn({
  id,
  onChange,
  sizePx,
}: {
  id: string
  onChange: (id: string) => void
  sizePx: number
}) {
  const body = bodyById(id)!
  return (
    <div className="flex flex-col items-center gap-3">
      <select
        value={id}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white outline-none"
      >
        {bodies.map((b) => (
          <option key={b.id} value={b.id} className="bg-[#0a0d16]">
            {b.name}
          </option>
        ))}
      </select>
      <div className="flex h-28 items-center justify-center">
        <span
          className="rounded-full ring-1 ring-white/15"
          style={{
            width: sizePx,
            height: sizePx,
            background: `radial-gradient(circle at 35% 30%, ${body.color}, #000 140%)`,
          }}
        />
      </div>
    </div>
  )
}

const rowsFor = (a: Body, b: Body): [string, string, string][] => [
  ['Diameter', a.stats.diameter, b.stats.diameter],
  ['Mass', a.stats.mass, b.stats.mass],
  ['Gravity', a.stats.gravity, b.stats.gravity],
  ['Day length', a.stats.dayLength, b.stats.dayLength],
  ['Year length', a.stats.yearLength, b.stats.yearLength],
  ['Moons', a.stats.moons, b.stats.moons],
  ['Mean temperature', a.temperature.mean, b.temperature.mean],
  ['Distance from Sun', a.stats.distanceFromSun, b.stats.distanceFromSun],
]

export function ComparePanel() {
  const open = useStore((s) => s.compareOpen)
  const close = useStore((s) => s.closeCompare)
  const aId = useStore((s) => s.compareA)
  const bId = useStore((s) => s.compareB)
  const setA = useStore((s) => s.setCompareA)
  const setB = useStore((s) => s.setCompareB)

  if (!open) return null
  const a = bodyById(aId)!
  const b = bodyById(bId)!
  const maxD = Math.max(a.diameterKm, b.diameterKm)
  const px = (d: number) => 24 + (d / maxD) * 88

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="panel-scroll max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0d16]/95 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Compare worlds</h2>
            <p className="mt-0.5 text-sm text-white/50">Sizes shown to scale with each other.</p>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="rounded-full bg-white/5 p-2 text-white/60 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-6">
          <BodyColumn id={aId} onChange={setA} sizePx={px(a.diameterKm)} />
          <BodyColumn id={bId} onChange={setB} sizePx={px(b.diameterKm)} />
        </div>

        <div className="mt-6 divide-y divide-white/10">
          {rowsFor(a, b).map(([label, av, bv]) => (
            <div key={label} className="py-2.5">
              <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
              <div className="mt-0.5 grid grid-cols-2 gap-6 text-sm">
                <div className="text-white/90">{av}</div>
                <div className="text-right text-white/90">{bv}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
