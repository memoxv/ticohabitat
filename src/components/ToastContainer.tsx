'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-xl p-4 shadow-xl border backdrop-blur-md transform transition-all duration-300 animate-slideIn ${
              isSuccess
                ? 'bg-emerald-500/90 text-white border-emerald-400'
                : isError
                ? 'bg-red-500/90 text-white border-red-400'
                : 'bg-slate-900/90 text-white border-slate-800'
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {isSuccess ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-100" />
              ) : isError ? (
                <AlertTriangle className="h-5 w-5 text-red-100" />
              ) : (
                <Info className="h-5 w-5 text-blue-100" />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 text-sm font-medium leading-5">
              {toast.text}
            </div>

            {/* Close button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-0.5 text-white/70 hover:text-white rounded hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
