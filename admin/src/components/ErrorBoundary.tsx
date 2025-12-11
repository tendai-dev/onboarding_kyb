'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} resetError={this.resetError} />;
      }

      return <ErrorDisplay error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Functional component for error display using plain HTML/CSS to avoid Chakra UI dependency
// This ensures it works even if ChakraProvider is not available
// Uses CSS variables from the Mukuru design system
function ErrorDisplay({ error, resetError }: { error: Error; resetError: () => void }) {
  const styles: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--mukuru-cards-white)',
    padding: '2rem',
    fontFamily: "'Madera', 'Helvetica Neue', 'Arial', sans-serif",
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxWidth: '600px',
    textAlign: 'center',
  };

  const titleStyles: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'var(--mukuru-text-error)',
    margin: 0,
  };

  const textStyles: React.CSSProperties = {
    color: 'var(--mukuru-grey-medium-dark)',
    margin: 0,
  };

  const errorBoxStyles: React.CSSProperties = {
    padding: '1rem',
    backgroundColor: '#fef2f2',
    borderRadius: '0.5rem',
    border: '1px solid #fecaca',
    textAlign: 'left',
    maxWidth: '100%',
    overflow: 'auto',
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    color: 'var(--mukuru-text-error)',
  };

  const buttonStyles: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--mukuru-buttons-primary)',
    color: 'var(--mukuru-white)',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    margin: '0.25rem',
    transition: 'background-color 0.2s',
  };

  const buttonGhostStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'transparent',
    color: 'var(--mukuru-grey-medium-dark)',
    border: '1px solid var(--mukuru-grey-light)',
  };

  const buttonHoverStyles: React.CSSProperties = {
    backgroundColor: 'var(--mukuru-state-hover)',
  };

  return (
    <div style={styles}>
      <div style={containerStyles}>
        <h1 style={titleStyles}>Something went wrong</h1>
        <p style={textStyles}>
          An unexpected error occurred. Our team has been notified and is working on a fix.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div style={errorBoxStyles}>
            <div style={{ marginBottom: '0.5rem' }}>{error.toString()}</div>
            {error.stack && (
              <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                {error.stack}
              </pre>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            style={buttonStyles}
            onClick={resetError}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--mukuru-state-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--mukuru-buttons-primary)';
            }}
          >
            Try Again
          </button>
          <button
            style={buttonGhostStyles}
            onClick={() => (window.location.href = '/dashboard')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--mukuru-state-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
