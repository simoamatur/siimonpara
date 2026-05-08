import React from 'react';
import { AlertTriangle, RefreshCw, Home, Copy } from 'lucide-react';

function ErrorFallback({ error, onReload, onGoHome, onCopy }: {
  error: Error | null;
  onReload: () => void;
  onGoHome: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-xl">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            خطأ غير متوقع
          </h1>
          <p className="text-gray-500 mb-6">
            حدث خطأ في التطبيق. نعتذر عن هذا الخلل.
          </p>

          {error && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-mono text-gray-600 break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onCopy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-all"
            >
              <Copy size={16} />
              نسخ الخطأ
            </button>
            <button
              onClick={onReload}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all text-sm"
            >
              <RefreshCw size={16} />
              إعادة تحميل
            </button>
          </div>

          <button
            onClick={onGoHome}
            className="mt-3 flex items-center gap-2 mx-auto text-sm text-gray-500 hover:text-emerald-600 transition-colors"
          >
            <Home size={14} />
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    </div>
  );
}

export class ErrorBoundary extends React.Component {
  declare state: { error: Error | null };

  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('Erreur rendu React:', error, info?.componentStack);
  }

  componentDidMount() {
    window.addEventListener('error', this._handleError);
    window.addEventListener('unhandledrejection', this._handleRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this._handleError);
    window.removeEventListener('unhandledrejection', this._handleRejection);
  }

  _handleError = (event: ErrorEvent) => {
    (this as any).setState({ error: event.error || new Error(event.message) });
  };

  _handleRejection = (event: PromiseRejectionEvent) => {
    (this as any).setState({ error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)) });
  };

  render() {
    const me: any = this;
    if (this.state.error) {
      if (me.props.fallback) return me.props.fallback;
      return (
        <ErrorFallback
          error={this.state.error}
          onReload={() => { me.setState({ error: null }); window.location.reload(); }}
          onGoHome={() => { me.setState({ error: null }); window.location.href = '/'; }}
          onCopy={() => {
            if (this.state.error) navigator.clipboard.writeText(`${this.state.error.message}\n${this.state.error.stack}`);
          }}
        />
      );
    }
    return me.props.children;
  }
}
