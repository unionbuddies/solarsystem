import { useStore } from '../store'

const DAY = 86_400_000

/** Slider to drag the sky forward/back day by day while "Today's sky" is on. */
export function DateScrubber() {
  const today = useStore((s) => s.today)
  const selectedId = useStore((s) => s.selectedId)
  const offset = useStore((s) => s.dateOffsetDays)
  const setDateOffset = useStore((s) => s.setDateOffset)

  // Only in the overview, where you can watch the whole system shift.
  if (!today || selectedId) return null

  const date = new Date(Date.now() + offset * DAY)
  const label = date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const btn =
    'flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white/5 text-lg leading-none text-white/70 ring-1 ring-white/10 transition hover:bg-white/10'

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0d16]/80 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-300/80">
            Sky on
          </span>
          <span className="text-sm font-medium text-white/90">{label}</span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button className={btn} onClick={() => setDateOffset(offset - 1)} aria-label="Previous day">
            −
          </button>
          <input
            type="range"
            min={-365}
            max={365}
            step={1}
            value={offset}
            onChange={(e) => setDateOffset(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-sky-400"
          />
          <button className={btn} onClick={() => setDateOffset(offset + 1)} aria-label="Next day">
            +
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-white/40">
          <span>−1 yr</span>
          <button
            onClick={() => setDateOffset(0)}
            className="rounded-full px-2 py-0.5 text-sky-300 transition hover:bg-white/10"
          >
            Jump to today
          </button>
          <span>+1 yr</span>
        </div>
      </div>
    </div>
  )
}
