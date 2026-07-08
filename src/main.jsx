import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, fontFamily: 'system-ui', color: '#dc2626', background: '#fff', minHeight: '100vh' }}>
        <h2>Something went wrong</h2>
        <pre style={{ fontSize: 13, background: '#fef2f2', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
          {this.state.error.toString()}
        </pre>
        <p style={{ color: '#64748b' }}>Screenshot this and send it to get it fixed.</p>
      </div>
    );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
