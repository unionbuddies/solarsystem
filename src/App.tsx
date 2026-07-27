import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './components/Scene'
import { InfoPanel } from './components/InfoPanel'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useStore } from './store'

function Loader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-sm tracking-widest text-white/50">LOADING THE SOLAR SYSTEM…</div>
    </div>
  )
}

function ToggleChip({
  active,
  onClick,
  label,
  title,
}: {
  active: boolean
  onClick: () => void
  label: string
  title: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-full px-4 py-2 text-xs font-medium ring-1 backdrop-blur transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-400/15 active:translate-y-0 ${
        active
          ? 'bg-sky-500/25 text-sky-100 ring-sky-400/40 hover:bg-sky-500/35 hover:ring-sky-300/60'
          : 'bg-white/5 text-white/60 ring-white/10 hover:bg-white/10 hover:text-white hover:ring-white/25'
      }`}
    >
      {label}
    </button>
  )
}

export default function App() {
  const selectedId = useStore((s) => s.selectedId)
  const clear = useStore((s) => s.clear)
  const realScale = useStore((s) => s.realScale)
  const today = useStore((s) => s.today)
  const toggleRealScale = useStore((s) => s.toggleRealScale)
  const toggleToday = useStore((s) => s.toggleToday)

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#05060a]">
      <Canvas
        shadows
        camera={{ position: [0, 48, 118], fov: 45, near: 0.1, far: 2000 }}
        dpr={[1, 2]}
        onPointerMissed={() => clear()}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* Top-left branding / navigation */}
      <div className="pointer-events-none absolute left-0 top-0 p-6">
        {selectedId ? (
          <button
            onClick={clear}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/80 ring-1 ring-white/10 backdrop-blur transition hover:bg-white/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to overview
          </button>
        ) : (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Solar System</h1>
            <p className="mt-1 max-w-xs text-sm text-white/50">
              An interactive journey through the Sun and its eight planets.
            </p>
            <div className="pointer-events-auto mt-4 flex gap-2">
              <ToggleChip
                active={realScale}
                onClick={toggleRealScale}
                label="True scale"
                title="Show planets at their real relative sizes"
              />
              <ToggleChip
                active={today}
                onClick={toggleToday}
                label="Today's sky"
                title="Position the planets at their real alignment for today"
              />
            </div>
          </div>
        )}
      </div>

      <ErrorBoundary resetKey={selectedId} fallback={null}>
        <Suspense fallback={<Loader />}>
          <InfoPanel />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
