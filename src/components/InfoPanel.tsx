import { Suspense } from 'react'
import { useStore } from '../store'
import { bodyById, type Body } from '../data/bodies'
import { Cutaway } from './Cutaway'
import { ErrorBoundary } from './ErrorBoundary'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2 ring-1 ring-white/10">
      <div className="text-[11px] uppercase tracking-wide text-white/40">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-white/90">{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-300/80">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-white/75">{children}</div>
    </section>
  )
}

function Comparison({ body }: { body: Body }) {
  const earth = bodyById('earth')!
  const ratio = body.diameterKm / earth.diameterKm
  const EARTH_PX = 18
  const planetPx = Math.max(6, Math.min(112, EARTH_PX * ratio))
  const ratioLabel = ratio >= 10 ? `${Math.round(ratio)}× Earth` : `${ratio.toFixed(ratio >= 1 ? 1 : 2)}× Earth`

  const AU_MAX = 31
  const auPct = Math.min(100, (body.distanceAu / AU_MAX) * 100)
  const earthPct = (1 / AU_MAX) * 100

  return (
    <Section title="Size & distance">
      <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
        <div className="flex items-end gap-5">
          <div className="flex flex-col items-center gap-1">
            <span className="rounded-full bg-sky-400/70" style={{ width: EARTH_PX, height: EARTH_PX }} />
            <span className="text-[10px] text-white/40">Earth</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span
              className="rounded-full bg-gradient-to-br from-white/80 to-white/25"
              style={{ width: planetPx, height: planetPx }}
            />
            <span className="text-[10px] text-white/60">{body.name}</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-white/60">
          Diameter {body.diameterKm.toLocaleString()} km · <span className="text-white/90">{ratioLabel}</span>
        </div>
      </div>

      <div className="mt-2 rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
        <div className="mb-2 text-xs text-white/60">
          Distance from Sun · <span className="text-white/90">{body.distanceAu} AU</span>
        </div>
        <div className="relative h-2 rounded-full bg-gradient-to-r from-amber-500/40 to-sky-500/20">
          {body.id !== 'earth' && body.distanceAu > 0 && (
            <span
              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/70"
              style={{ left: `${earthPct}%` }}
            />
          )}
          <span
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-sky-400"
            style={{ left: `${auPct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-white/30">
          <span>Sun</span>
          <span>30 AU</span>
        </div>
      </div>
    </Section>
  )
}

function PanelBody({ body }: { body: Body }) {
  return (
    <>
      {/* 3D interior cutaway */}
      <Section title="Interior — drag to rotate">
        <div className="h-56 w-full overflow-hidden rounded-xl bg-gradient-to-b from-white/[0.04] to-transparent ring-1 ring-white/10">
          <ErrorBoundary
            resetKey={body.id}
            fallback={
              <div className="flex h-full items-center justify-center p-4 text-center text-sm text-white/40">
                Interior view unavailable.
              </div>
            }
          >
            <Suspense fallback={<div className="flex h-full items-center justify-center text-white/40">Loading…</div>}>
              <Cutaway body={body} />
            </Suspense>
          </ErrorBoundary>
        </div>
        <ul className="mt-3 space-y-2">
          {[...body.layers].reverse().map((l) => (
            <li key={l.name} className="flex gap-2.5">
              <span
                className="mt-1 h-3 w-3 flex-none rounded-full ring-1 ring-white/20"
                style={{ backgroundColor: l.color }}
              />
              <span>
                <span className="font-medium text-white/90">{l.name}</span>
                <span className="text-white/60"> — {l.description}</span>
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Quick stats */}
      <Section title="At a glance">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Diameter" value={body.stats.diameter} />
          <Stat label="Mass" value={body.stats.mass} />
          <Stat label="Gravity" value={body.stats.gravity} />
          <Stat label="Distance from Sun" value={body.stats.distanceFromSun} />
          <Stat label="Day length" value={body.stats.dayLength} />
          <Stat label="Year length" value={body.stats.yearLength} />
          <Stat label="Moons" value={body.stats.moons} />
        </div>
      </Section>

      <Comparison body={body} />

      {/* Temperature */}
      <Section title="Temperature">
        <div className="rounded-lg bg-gradient-to-r from-orange-500/10 to-sky-500/10 px-3 py-2.5 ring-1 ring-white/10">
          <div className="text-base font-semibold text-white/90">{body.temperature.mean}</div>
          {body.temperature.range && <div className="text-white/60">{body.temperature.range}</div>}
          {body.temperature.note && <div className="mt-1 text-xs text-white/50">{body.temperature.note}</div>}
        </div>
      </Section>

      <Section title="Atmosphere & weather">{body.atmosphere}</Section>
      <Section title="What it's made of">{body.composition}</Section>

      <Section title="Fun facts">
        <ul className="space-y-2">
          {body.funFacts.map((f, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1 flex-none text-sky-300/80">✦</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Sources">
        <div className="flex flex-wrap gap-2">
          {body.sources.map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/5 px-3 py-1 text-xs text-sky-300 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              {s.label} ↗
            </a>
          ))}
        </div>
      </Section>
    </>
  )
}

export function InfoPanel() {
  const selectedId = useStore((s) => s.selectedId)
  const clear = useStore((s) => s.clear)
  const body = selectedId ? bodyById(selectedId) : undefined

  return (
    <div
      className={`pointer-events-none fixed z-20 inset-x-0 bottom-0 max-h-[64vh] w-full transition-transform duration-500 ease-out sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-[440px] ${
        body
          ? 'translate-y-0 sm:translate-x-0'
          : 'translate-y-full sm:translate-y-0 sm:translate-x-full'
      }`}
    >
      {body && (
        <div className="panel-scroll pointer-events-auto h-full overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#0a0d16]/85 px-6 pb-6 pt-4 backdrop-blur-xl sm:rounded-none sm:border-l sm:border-t-0 sm:py-6">
          {/* grab handle (mobile only) */}
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-block rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-sky-300 ring-1 ring-sky-400/20">
                {body.type === 'star' ? 'Star' : 'Planet'}
              </span>
              <h2 className="mt-2 font-[system-ui] text-3xl font-bold text-white">{body.name}</h2>
              <p className="mt-1 text-sm text-white/50">{body.tagline}</p>
            </div>
            <button
              onClick={clear}
              aria-label="Close"
              className="flex-none rounded-full bg-white/5 p-2 text-white/60 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-white/75">{body.overview}</p>

          <PanelBody body={body} />

          <div className="h-6" />
        </div>
      )}
    </div>
  )
}
