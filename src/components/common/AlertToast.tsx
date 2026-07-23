import { useEffect, useRef, useState } from 'react';

const AlertToast = () => {
  const [message, setMessage] = useState<string | null>(null);
  const dismissTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const nativeAlert = window.alert;

    window.alert = (alertMessage?: unknown) => {
      setMessage(String(alertMessage ?? ''));
      if (dismissTimerRef.current !== undefined) {
        window.clearTimeout(dismissTimerRef.current);
      }
      dismissTimerRef.current = window.setTimeout(() => setMessage(null), 3500);
    };

    return () => {
      window.alert = nativeAlert;
      if (dismissTimerRef.current !== undefined) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed right-5 top-5 z-[100] max-w-sm rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 pr-10 text-sm text-on-surface shadow-xl"
    >
      <span className="material-symbols-outlined absolute left-3 top-3 text-primary text-[18px]">
        info
      </span>
      <p className="whitespace-pre-line pl-6">{message}</p>
      <button
        type="button"
        onClick={() => setMessage(null)}
        className="absolute right-2 top-2 rounded p-1 text-secondary hover:bg-surface-container-high hover:text-on-surface"
        aria-label="Dismiss notification"
      >
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
};

export default AlertToast;
