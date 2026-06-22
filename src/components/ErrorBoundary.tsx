import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0d12',
          color: '#e8d5a3',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '2rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#c9a962' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#9a8fa8', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              An unexpected error occurred. Please refresh the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#c9a962',
                color: '#0f0d12',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 2rem',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                <summary style={{ color: '#9a8fa8', cursor: 'pointer', fontSize: '0.75rem' }}>
                  Technical details
                </summary>
                <pre style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  background: '#1a1520',
                  borderRadius: '0.5rem',
                  fontSize: '0.7rem',
                  color: '#ff6b6b',
                  overflow: 'auto',
                  maxHeight: '120px',
                  border: '1px solid rgba(201,169,98,0.15)',
                }}>
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
