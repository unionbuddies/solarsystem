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

export default function App() {
  const selectedId = useStore((s) => s.selectedId)
  const clear = useStore((s) => s.clear)

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#05060a]">
      <Canvas
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
