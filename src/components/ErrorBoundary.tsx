import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by MedLens ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-slate-900">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border-4 border-amber-400 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center border-2 border-amber-300">
              <AlertCircle className="w-12 h-12 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-950 mb-2">
                MedLens
              </h2>
              <p className="text-xl font-extrabold text-slate-800 leading-snug">
                Something didn't load quite right.
              </p>
              <p className="text-base text-slate-600 font-bold mt-2 font-urdu">
                کوئی مسئلہ پیش آگیا ہے۔ براہ کرم ایپ دوبارہ شروع کریں۔
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 bg-slate-100 rounded-xl text-xs font-mono text-slate-700 text-left overflow-x-auto max-h-32 border border-slate-300">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full min-h-[68px] py-4 px-6 bg-teal-600 hover:bg-teal-700 text-white font-black text-2xl rounded-2xl shadow-lg shadow-teal-700/25 flex items-center justify-center gap-3 border-2 border-teal-400 active-press cursor-pointer"
            >
              <RefreshCw className="w-7 h-7 stroke-[3]" />
              <span>Restart App / دوبارہ شروع کریں</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
