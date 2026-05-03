import { forwardRef } from 'react';

// Button Variants
const BUTTON_VARIANTS = {
  // Solid variants
  primary: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/30 active:shadow-indigo-500/50',
  secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 active:bg-white/30',
  success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30',
  danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:shadow-lg hover:shadow-red-500/30',
  warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg hover:shadow-yellow-500/30',
  info: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-blue-500/30',
  
  // Outline variants
  outline: 'border-2 border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 active:bg-indigo-500/20',
  'outline-white': 'border-2 border-white/30 text-white hover:bg-white/10 active:bg-white/20',
  
  // Ghost variants
  ghost: 'text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/20',
  'ghost-primary': 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 active:bg-indigo-500/20',
  
  // Glass variants
  glass: 'bg-white/5 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 active:bg-white/15',
  'glass-primary': 'bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 active:bg-indigo-500/30',
};

// Button Sizes
const BUTTON_SIZES = {
  xs: 'px-3 py-1.5 text-xs',
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
  xl: 'px-10 py-4 text-lg',
};

// Icon Sizes
const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
};

// Button Component
const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  rounded = true,
  iconLeft,
  iconRight,
  onClick,
  className = '',
  ...props
}, ref) => {
  // Base classes
  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-medium transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-indigo-500/50
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;

  // Rounded classes
  const roundedClasses = rounded ? 'rounded-full' : 'rounded-lg';

  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';

  // Loading spinner
  const Spinner = () => (
   <svg
  className={`animate-spin ${ICON_SIZES[size]}`}
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
>
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseClasses}
        ${BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary}
        ${BUTTON_SIZES[size] || BUTTON_SIZES.md}
        ${roundedClasses}
        ${widthClasses}
        ${className}
      `}
      {...props}
    >
      {loading && <Spinner />}
      {!loading && iconLeft && (
        <span className={ICON_SIZES[size]}>{iconLeft}</span>
      )}
      {children}
      {!loading && iconRight && (
        <span className={ICON_SIZES[size]}>{iconRight}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;

// Icon Button Component
export const IconButton = forwardRef(({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  rounded = true,
  onClick,
  className = '',
  ...props
}, ref) => {
  const iconSizes = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  const iconInnerSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`
        inline-flex items-center justify-center
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-indigo-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.95]
        ${BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.ghost}
        ${iconSizes[size] || iconSizes.md}
        ${rounded ? 'rounded-full' : 'rounded-lg'}
        ${className}
      `}
      {...props}
    >
      <span className={iconInnerSizes[size]}>{icon}</span>
    </button>
  );
});

IconButton.displayName = 'IconButton';

// Social Button Component
export const SocialButton = ({
  provider,
  onClick,
  label,
  className = '',
}) => {
  const providers = {
    google: {
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
      bgColor: 'bg-white hover:bg-gray-100',
      textColor: 'text-gray-900',
    },
    github: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      ),
      bgColor: 'bg-[#24292e] hover:bg-[#2f363d]',
      textColor: 'text-white',
    },
    facebook: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      bgColor: 'bg-[#1877f2] hover:bg-[#0e5fcc]',
      textColor: 'text-white',
    },
    twitter: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.104c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.775-5.804 14.01 14.01 0 001.544-6.187c0-.21-.005-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      ),
      bgColor: 'bg-[#1da1f2] hover:bg-[#0c85d0]',
      textColor: 'text-white',
    },
  };

  const providerData = providers[provider] || providers.google;

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center gap-3 w-full
        px-4 py-2.5 rounded-lg font-medium
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-indigo-500/50
        ${providerData.bgColor} ${providerData.textColor}
        ${className}
      `}
    >
      {providerData.icon}
      <span>{label || `Continue with ${provider}`}</span>
    </button>
  );
};

// Button Group Component
export const ButtonGroup = ({
  children,
  orientation = 'horizontal',
  className = '',
}) => {
  const orientationClasses = {
    horizontal: 'flex flex-row',
    vertical: 'flex flex-col',
  };

  return (
    <div
      className={`
        ${orientationClasses[orientation]}
        divide-x divide-white/10
        [&>button:first-child]:rounded-r-none
        [&>button:last-child]:rounded-l-none
        [&>button:not(:first-child):not(:last-child)]:rounded-none
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Loading Button Component
export const LoadingButton = ({
  loading = true,
  text = 'Submit',
  loadingText = 'Processing...',
  ...props
}) => {
  return (
    <Button
      {...props}
      loading={loading}
      disabled={loading}
    >
      {loading ? loadingText : text}
    </Button>
  );
};

// Floating Action Button
export const FAB = ({
  icon,
  onClick,
  position = 'bottom-right',
  label,
  className = '',
}) => {
  const positions = {
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'top-right': 'top-8 right-8',
    'top-left': 'top-8 left-8',
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positions[position]} z-50
        w-14 h-14 rounded-full
        bg-gradient-to-r from-indigo-500 to-purple-600
        text-white shadow-xl shadow-indigo-500/30
        hover:scale-110 hover:shadow-2xl hover:shadow-indigo-500/50
        transition-all duration-300
        flex items-center justify-center
        group
        ${className}
      `}
      aria-label={label}
    >
      <span className="w-6 h-6">{icon}</span>
      {label && (
        <span className="absolute right-16 bg-black/90 text-white px-3 py-1.5 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {label}
        </span>
      )}
    </button>
  );
};