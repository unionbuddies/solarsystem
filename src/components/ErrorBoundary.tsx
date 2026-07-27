import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  /** Changing this value resets the boundary (e.g. when the selected body changes). */
  resetKey?: string | null
}

interface State {
  hasError: boolean
}

/** Keeps a stray render/disposal error (e.g. from a nested R3F canvas) from
 *  taking down the whole app — shows a graceful fallback instead. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-white/40">
            Couldn’t render this view.
          </div>
        )
      )
    }
    return this.props.children
  }
}
