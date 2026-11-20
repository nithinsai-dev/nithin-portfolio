import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.warn('[ErrorBoundary] Unhandled error captured:', error, errorInfo)
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#140C0D] text-[#E8DDD3] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md flex flex-col items-center gap-4">
            <span className="font-mono text-xs uppercase tracking-widest text-[#F2C14E]">
              // notice
            </span>
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#E8DDD3] tracking-tight">
              Something went wrong.
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#E8DDD3]/70 leading-relaxed">
              An unexpected error occurred while rendering this view.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false })
                window.location.href = '/'
              }}
              className="mt-2 font-mono text-xs text-[#140C0D] bg-[#F2C14E] px-4 py-2 rounded font-medium hover:bg-[#F2C14E]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C14E] cursor-pointer"
            >
              Return Home <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
