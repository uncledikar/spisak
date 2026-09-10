import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Prevents a single bad list record from blanking the whole app. */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route crashed', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-shell">
          <header className="topbar">
            <Link className="icon-btn" to="/" aria-label="Back">
              ←
            </Link>
            <h1>Spisok</h1>
          </header>
          <div className="empty">
            <h2>Something went wrong</h2>
            <p className="meta">This list could not be opened. Try going back.</p>
            <Link className="btn btn-primary" to="/" style={{ marginTop: 16 }}>
              Home
            </Link>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
