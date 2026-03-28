import { useState, useEffect, createContext, useContext } from 'react';

// Create Toast Context
const ToastContext = createContext();

// Toast Types with Icons and Colors
const TOAST_TYPES = {
  success: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ),
    bgColor: 'from-green-500 to-emerald-500',
    textColor: 'text-white'
  },
  error: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    bgColor: 'from-red-500 to-pink-500',
    textColor: 'text-white'
  },
  warning: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    bgColor: 'from-yellow-500 to-orange-500',
    textColor: 'text-white'
  },
  info: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: 'from-blue-500 to-indigo-500',
    textColor: 'text-white'
  },
  loading: {
    icon: (
      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    bgColor: 'from-indigo-500 to-purple-500',
    textColor: 'text-white'
  }
};

// Toast Provider Component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);

    // Auto remove after duration
    if (duration !== Infinity) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message, duration) => showToast(message, 'success', duration);
  const error = (message, duration) => showToast(message, 'error', duration);
  const warning = (message, duration) => showToast(message, 'warning', duration);
  const info = (message, duration) => showToast(message, 'info', duration);
  const loading = (message, duration) => showToast(message, 'loading', duration);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, loading, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Custom hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast Container Component
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 min-w-[320px] max-w-[420px] pointer-events-none">
      {toasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
          index={index}
        />
      ))}
    </div>
  );
}

// Individual Toast Item
function ToastItem({ toast, onClose, index }) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const typeConfig = TOAST_TYPES[toast.type] || TOAST_TYPES.info;

  // Progress bar animation
  useEffect(() => {
    if (toast.duration === Infinity || isPaused) return;

    const interval = 50; // Update every 50ms
    const step = (interval / toast.duration) * 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.duration, isPaused, onClose]);

  return (
    <div
      className={`
        relative transform transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${index === 0 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-90'}
        hover:translate-y-0 hover:opacity-100
      `}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Toast */}
      <div className={`
        relative overflow-hidden rounded-2xl backdrop-blur-xl
        bg-gradient-to-r ${typeConfig.bgColor}
        shadow-2xl border border-white/20
      `}>
        {/* Content */}
        <div className="relative flex items-start gap-3 p-4">
          {/* Icon */}
          <div className={`flex-shrink-0 ${typeConfig.textColor}`}>
            {typeConfig.icon}
          </div>

          {/* Message */}
          <div className={`flex-1 ${typeConfig.textColor} text-sm font-medium pr-6`}>
            {toast.message}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${typeConfig.textColor} hover:opacity-70 transition-opacity`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        {toast.duration !== Infinity && (
          <div
            className="absolute bottom-0 left-0 h-1 bg-white/30 backdrop-blur-sm"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </div>
  );
}

// Standalone Toast Component (for direct usage)
export default function Toast({ 
  message, 
  type = 'info', 
  duration = 3000,
  onClose,
  show = true 
}) {
  const [visible, setVisible] = useState(show);
  const [progress, setProgress] = useState(100);
  const typeConfig = TOAST_TYPES[type] || TOAST_TYPES.info;

  useEffect(() => {
    setVisible(show);
  }, [show]);

  useEffect(() => {
    if (!visible || duration === Infinity) return;

    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    // Progress bar animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) return 0;
        return prev - (100 / (duration / 50));
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] min-w-[320px] max-w-[420px] animate-slide-up">
      <div className={`
        relative overflow-hidden rounded-2xl backdrop-blur-xl
        bg-gradient-to-r ${typeConfig.bgColor}
        shadow-2xl border border-white/20
      `}>
        <div className="relative flex items-start gap-3 p-4">
          <div className={`flex-shrink-0 ${typeConfig.textColor}`}>
            {typeConfig.icon}
          </div>
          
          <div className={`flex-1 ${typeConfig.textColor} text-sm font-medium pr-6`}>
            {message}
          </div>
          
          <button
            onClick={() => {
              setVisible(false);
              onClose?.();
            }}
            className={`flex-shrink-0 ${typeConfig.textColor} hover:opacity-70 transition-opacity`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {duration !== Infinity && (
          <div
            className="absolute bottom-0 left-0 h-1 bg-white/30 backdrop-blur-sm transition-all"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </div>
  );
}