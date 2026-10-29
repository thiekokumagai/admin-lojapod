import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary capturou um erro não tratado:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReset = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
    } catch (e) {
      console.error("Erro ao limpar caches:", e);
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-white font-sans">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2 text-white">
              {this.props.fallbackTitle || "Ops! Não foi possível carregar a página"}
            </h2>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-md">
              Ocorreu uma falha ao renderizar os componentes no dispositivo. Você pode recarregar a página ou limpar os dados em cache.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/25 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </button>

              <button
                type="button"
                onClick={this.handleClearAndReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition border border-slate-700 active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                Limpar Cache e Reiniciar
              </button>
            </div>

            <div className="w-full text-left">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1 mx-auto transition"
              >
                <span>{this.state.showDetails ? "Ocultar detalhes técnicos" : "Ver detalhes do erro"}</span>
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-rose-300 break-words max-h-48 overflow-y-auto">
                  <p className="font-bold mb-1">{this.state.error?.toString()}</p>
                  <pre className="text-[11px] text-slate-400 whitespace-pre-wrap">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
