import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 my-5 text-center">
          <div
            className="cinema-card p-5 mx-auto"
            style={{
              maxWidth: '620px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <div
              className="d-inline-flex align-items-center justify-content-center mb-3"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(229, 9, 20, 0.15)',
                color: 'var(--color-primary)',
                fontSize: '28px',
              }}
            >
              ⚠️
            </div>
            <h2 className="h3 fw-bold mb-2" style={{ color: 'var(--color-text)' }}>
              Something Went Wrong
            </h2>
            <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
              We encountered an unexpected error while loading this cinema page.
              Please refresh the page or head back to the main lobby.
            </p>

            <div className="d-flex justify-content-center gap-3 mb-4">
              <button
                type="button"
                onClick={this.handleReload}
                className="btn btn-cinema px-4 py-2"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="btn btn-cinema-secondary px-4 py-2"
              >
                Return to Home
              </button>
            </div>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details
                className="text-start mt-3 p-3 rounded small text-danger"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                <summary style={{ cursor: 'pointer', color: '#ff6b6b' }}>
                  Technical Error Details
                </summary>
                <div className="mt-2 text-white-50">
                  {this.state.error.toString()}
                  <br />
                  {this.state.errorInfo?.componentStack}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
