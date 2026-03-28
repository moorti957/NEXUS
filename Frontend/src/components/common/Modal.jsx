import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Modal Types
const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

const MODAL_POSITIONS = {
  center: 'items-center',
  top: 'items-start pt-20',
  bottom: 'items-end pb-20',
};

// Main Modal Component
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  position = 'center',
  showCloseButton = true,
  closeOnClickOutside = true,
  closeOnEsc = true,
  showFooter = true,
  footerContent,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
  cancelVariant = 'secondary',
  isLoading = false,
  preventScroll = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  footerClassName = '',
  animation = 'slideUp', // 'fade', 'slideUp', 'slideDown', 'zoom', 'none'
}) {
  const [mounted, setMounted] = useState(false);

  // Handle mount/unmount for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, closeOnEsc, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (preventScroll) {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, preventScroll]);

  // Animation classes
  const getAnimationClasses = () => {
    switch (animation) {
      case 'fade':
        return {
          overlay: 'transition-opacity duration-300',
          content: 'transition-opacity duration-300',
        };
      case 'slideUp':
        return {
          overlay: 'transition-opacity duration-300',
          content: 'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        };
      case 'slideDown':
        return {
          overlay: 'transition-opacity duration-300',
          content: 'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        };
      case 'zoom':
        return {
          overlay: 'transition-opacity duration-300',
          content: 'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        };
      default:
        return {
          overlay: 'transition-opacity duration-300',
          content: 'transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        };
    }
  };

  const animations = getAnimationClasses();

  // Content transform based on animation
  const getContentTransform = () => {
    if (!isOpen) {
      switch (animation) {
        case 'slideUp':
          return 'opacity-0 translate-y-8';
        case 'slideDown':
          return 'opacity-0 -translate-y-8';
        case 'zoom':
          return 'opacity-0 scale-95';
        case 'fade':
          return 'opacity-0';
        default:
          return 'opacity-0 translate-y-8';
      }
    }
    return 'opacity-100 translate-y-0 scale-100';
  };

  // Button variants
  const buttonVariants = {
    primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/30',
    secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:shadow-lg hover:shadow-red-500/30',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30',
    outline: 'border border-indigo-500 text-indigo-400 hover:bg-indigo-500/10',
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className={`
        fixed inset-0 z-[9999] flex ${MODAL_POSITIONS[position]} justify-center
        ${animations.overlay}
        ${isOpen ? 'visible' : 'invisible'}
      `}
    >
      {/* Overlay */}
      <div
        className={`
          absolute inset-0 bg-black/80 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0'}
          ${overlayClassName}
        `}
        onClick={closeOnClickOutside ? onClose : undefined}
      />

      {/* Modal Content */}
      <div
        className={`
          relative ${MODAL_SIZES[size]} w-full mx-4 my-4
          ${animations.content} ${getContentTransform()}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`
          relative bg-gradient-to-br from-[#1a1a24] to-[#13131a] 
          rounded-2xl border border-white/10 shadow-2xl
          overflow-hidden
          ${contentClassName}
        `}>
          {/* Header */}
          <div className={`
            relative px-6 py-5 border-b border-white/10
            ${headerClassName}
          `}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {title}
              </h2>
              
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            {children}
          </div>

          {/* Footer */}
          {showFooter && (
            <div className={`
              px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3
              ${footerClassName}
            `}>
              {footerContent || (
                <>
                  <button
                    onClick={onCancel || onClose}
                    className={`
                      px-6 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-300
                      ${buttonVariants[cancelVariant]}
                    `}
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={`
                      px-6 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-300
                      ${buttonVariants[confirmVariant]}
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      confirmText
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Confirmation Modal (Pre-built)
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  isLoading = false,
}) {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'success':
        return (
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default: // warning
        return (
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'danger': return 'danger';
      case 'success': return 'success';
      case 'info': return 'primary';
      default: return 'warning';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showFooter
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={onConfirm}
      onCancel={onClose}
      confirmVariant={getButtonVariant()}
      cancelVariant="secondary"
      isLoading={isLoading}
    >
      <div className="text-center">
        {getIcon()}
        <p className="text-gray-300">{message}</p>
      </div>
    </Modal>
  );
}

// Form Modal (Pre-built)
export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Form',
  children,
  confirmText = 'Submit',
  cancelText = 'Cancel',
  size = 'md',
  isLoading = false,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      showFooter
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={handleSubmit}
      onCancel={onClose}
      confirmVariant="primary"
      cancelVariant="secondary"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {children}
      </form>
    </Modal>
  );
}

// Image/Media Modal (Pre-built)
export function ImageModal({
  isOpen,
  onClose,
  src,
  alt = 'Image',
  caption,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      showCloseButton
      showFooter={false}
      closeOnClickOutside
      className="bg-transparent"
      contentClassName="bg-transparent border-none shadow-2xl"
    >
      <div className="relative">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto rounded-2xl"
        />
        {caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
            <p className="text-white text-sm">{caption}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// Drawer Modal (Side Panel)
export function DrawerModal({
  isOpen,
  onClose,
  title,
  children,
  position = 'right', // 'left', 'right'
  size = 'md',
  showFooter = true,
  footerContent,
}) {
  const drawerSizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  };

  const positionClasses = {
    left: {
      container: 'justify-start',
      content: isOpen ? 'translate-x-0' : '-translate-x-full',
    },
    right: {
      container: 'justify-end',
      content: isOpen ? 'translate-x-0' : 'translate-x-full',
    },
  };

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex ${positionClasses[position].container}
        transition-opacity duration-300
        ${isOpen ? 'visible' : 'invisible'}
      `}
    >
      {/* Overlay */}
      <div
        className={`
          absolute inset-0 bg-black/80 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div
        className={`
          relative ${drawerSizes[size]} w-full h-full
          bg-gradient-to-br from-[#1a1a24] to-[#13131a]
          border-l border-white/10 shadow-2xl
          transform transition-transform duration-500
          ease-[cubic-bezier(0.16,1,0.3,1)]
          ${positionClasses[position].content}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold font-display bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 h-[calc(100%-80px)] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {showFooter && (
          <div className="absolute bottom-0 left-0 right-0 px-6 py-4 border-t border-white/10 bg-gradient-to-br from-[#1a1a24] to-[#13131a]">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}