// Imports
import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Env } from '@/constants/Env';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  renderFallback?: (error: Error | null) => ReactNode;
  catchAsyncErrors?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidMount() {
    if (!this.props.catchAsyncErrors) return;

    this.rejectionHandler = (event: PromiseRejectionEvent) => {
      event.preventDefault();

      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      this.reportError(error);
      this.setState({ hasError: true, error });
    };
    window.addEventListener('unhandledrejection', this.rejectionHandler);
  }

  componentWillUnmount() {
    if (this.rejectionHandler) {
      window.removeEventListener('unhandledrejection', this.rejectionHandler);
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.reportError(error, errorInfo.componentStack);
  }

  private reportError(error: Error, componentStack?: string | null) {
    try {
      const errorData = {
        page: window.location.pathname,
        message: error.message,
        stack: error.stack,
        componentStack: componentStack || 'N/A (async error)',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        dev_debug_id: Env.network.dev_debug_id,
      };

      console.error(
        `[ErrorBoundary]\n` +
        `Page: ${errorData.page}\n` +
        `Error: ${errorData.message}\n` +
        `Stack: ${errorData.stack}\n` +
        `Component Stack: ${errorData.componentStack}`
      );

      fetch(`${Env.network.dev_debug_url}webhook/frontend-error`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(() => { });
    } catch {
      // Silent fail — never affect the frontend
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };


  render() {
    if (this.state.hasError) {
      if (this.props.renderFallback) {
        return this.props.renderFallback(this.state.error);
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center w-full min-h-screen py-6 sm:py-12 px-4 sm:px-6 bg-background">
          <ErrorFallbackContent error={this.state.error} />
        </div>
      );
    }

    return this.props.children;
  }
}

const ErrorFallbackContent = ({ error }: { error: Error | null }) => (
  <Card className="w-full max-w-lg mx-auto border-border bg-card shadow-xl">
    <CardHeader className="text-center px-4 sm:px-6">
      <div className="flex items-center justify-center space-x-2 mb-2">
        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
        <CardTitle className="text-lg sm:text-xl text-foreground">Something went wrong</CardTitle>
      </div>
      <CardDescription className="text-sm sm:text-base text-muted-foreground">
        An unexpected error occurred
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
      <div className="text-center p-3 sm:p-4 bg-secondary rounded-2xl border border-border">
        <p className="text-xs sm:text-sm text-muted-foreground">
          <span className="font-semibold text-primary">projectcode.dev</span> is working to resolve this issue.
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Seat back and relax it will get auto fixed in a few minutes.
        </p>
      </div>
      {error && (
        <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-2xl">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Error Details</span>
          </div>
          <p className="font-mono text-xs text-destructive/80 break-all">
            {error.message || 'Unknown error'}
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);

export { ErrorFallbackContent };
export default ErrorBoundary;
