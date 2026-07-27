import { create } from 'zustand'

interface AppState {
  /** Currently focused body id, or null for the overview. */
  selectedId: string | null
  /** Id of the body under the cursor (for hover highlight/labels). */
  hoveredId: string | null
  /** When true, orbital revolution pauses so a focused body stays still. */
  paused: boolean

  select: (id: string) => void
  clear: () => void
  setHovered: (id: string | null) => void
}

export const useStore = create<AppState>((set) => ({
  selectedId: null,
  hoveredId: null,
  paused: false,

  select: (id) => set({ selectedId: id, paused: true }),
  clear: () => set({ selectedId: null, paused: false }),
  setHovered: (id) => set({ hoveredId: id }),
}))

// Dev-only hook so the scene selection can be driven/inspected from the console.
if (import.meta.env.DEV) {
  ;(window as unknown as { __store?: typeof useStore }).__store = useStore
}
