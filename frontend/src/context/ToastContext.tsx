import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface Toast { id: number; message: string; kind: 'ok' | 'error' | 'coin' }
const Ctx = createContext<(message: string, kind?: Toast['kind']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind === 'error' ? 'error' : ''}`}>
            {t.kind === 'error' ? <AlertCircle size={18} /> : t.kind === 'coin' ? (
              <span className="coin-wrap" aria-hidden="true">
                <span className="coin">₱</span>
                {[0, 1, 2, 3, 4, 5].map((i) => <span key={i} className="spark" style={{ ['--a' as string]: `${i * 60 + 20}deg` }} />)}
              </span>
            ) : <CheckCircle2 size={18} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);