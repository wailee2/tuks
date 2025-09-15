// src/components/ErrorBoundary.jsx
import React from 'react';

/**
 * Simple Error Boundary that:
 * - Shows a fallback UI
 * - Logs error to console (and optionally send to your server)
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    // update state so next render shows fallback
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // save stack + component stack
    this.setState({ error, info });

    // Log locally
    console.error('[ErrorBoundary] caught error:', error);
    console.error(info);

    // Optional: send to your logging endpoint
    // fetch('/api/logs', { method: 'POST', body: JSON.stringify({ error: String(error), info }), headers: {'Content-Type':'application/json'}});
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;
      // If parent provided custom fallback element, render it
      if (fallback) return fallback;
      // Default fallback UI
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-gray-600 mt-2">An unexpected error occurred in this part of the app.</p>
          <details className="mt-4 whitespace-pre-wrap text-xs text-red-600">
            {this.state.error && this.state.error.toString()}
            {this.state.info?.componentStack && `\n\n${this.state.info.componentStack}`}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
