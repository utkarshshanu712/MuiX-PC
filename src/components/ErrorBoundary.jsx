import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Auto refresh after 1 second when an error occurs
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  render() {
    if (this.state.hasError) {
      return null; // Return null since we're auto-refreshing
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
