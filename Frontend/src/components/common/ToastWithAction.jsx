import { useState } from 'react';
import { useToast } from './Toast';

export function ToastWithAction() {
  const { showToast } = useToast();

  const showActionToast = () => {
    const toastId = Date.now();
    
    showToast(
      <div className="flex flex-col gap-3">
        <p className="text-sm">New version available!</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => {
              // Dismiss toast
            }}
            className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-medium hover:bg-white/20 transition-colors"
          >
            Later
          </button>
        </div>
      </div>,
      'info',
      Infinity
    );
  };

  return (
    <button onClick={showActionToast}>
      Show Update Toast
    </button>
  );
}