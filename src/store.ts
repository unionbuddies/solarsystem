import { create } from 'zustand'

interface AppState {
  /** Currently focused body id, or null for the overview. */
  selectedId: string | null
  /** Id of the body under the cursor (for hover highlight/labels). */
  hoveredId: string | null
  /** When true, orbital revolution pauses so a focused body stays still. */
  paused: boolean
  /** Show planets at their true relative sizes instead of the illustrative ones. */
  realScale: boolean
  /** Seed planet positions to their real approximate alignment for a date. */
  today: boolean
  /** Days offset from today for the date scrubber (0 = today). */
  dateOffsetDays: number
  /** Whether the narrated guided tour is running. */
  tour: boolean

  /** Side-by-side comparison overlay. */
  compareOpen: boolean
  compareA: string
  compareB: string

  select: (id: string) => void
  clear: () => void
  setHovered: (id: string | null) => void
  toggleRealScale: () => void
  toggleToday: () => void
  setDateOffset: (days: number) => void
  startTour: () => void
  endTour: () => void
  openCompare: () => void
  closeCompare: () => void
  setCompareA: (id: string) => void
  setCompareB: (id: string) => void
}

export const useStore = create<AppState>((set) => ({
  selectedId: null,
  hoveredId: null,
  paused: false,
  realScale: false,
  today: false,
  dateOffsetDays: 0,
  tour: false,
  compareOpen: false,
  compareA: 'earth',
  compareB: 'jupiter',

  select: (id) => set({ selectedId: id, paused: true }),
  clear: () => set({ selectedId: null, paused: false }),
  setHovered: (id) => set({ hoveredId: id }),
  toggleRealScale: () => set((s) => ({ realScale: !s.realScale })),
  toggleToday: () => set((s) => ({ today: !s.today, dateOffsetDays: 0 })),
  setDateOffset: (days) => set({ dateOffsetDays: days }),
  startTour: () => set({ tour: true }),
  endTour: () => set({ tour: false, selectedId: null, paused: false }),
  openCompare: () =>
    set((s) => ({
      compareOpen: true,
      compareB: s.selectedId && s.selectedId !== s.compareA ? s.selectedId : s.compareB,
    })),
  closeCompare: () => set({ compareOpen: false }),
  setCompareA: (id) => set({ compareA: id }),
  setCompareB: (id) => set({ compareB: id }),
}))

// Dev-only hook so the scene selection can be driven/inspected from the console.
if (import.meta.env.DEV) {
  ;(window as unknown as { __store?: typeof useStore }).__store = useStore
}
