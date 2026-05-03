import { useEffect, useRef } from 'react';

const REVEAL_TYPES = {
  fade: 'opacity-0',
  left: 'opacity-0 -translate-x-20',
  right: 'opacity-0 translate-x-20',
  up: 'opacity-0 translate-y-20',
  down: 'opacity-0 -translate-y-20',
  scale: 'opacity-0 scale-75',
  rotate: 'opacity-0 rotate-12',
};

export default function Reveal({ 
  children, 
  type = 'up', 
  delay = 0,
  threshold = 0.2,
  className = '',
  ...props 
}) {
  const elementRef = useRef(null);

  useEffect(() => {
    const el = elementRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              el.classList.remove(
                'opacity-0',
                '-translate-x-20',
                'translate-x-20',
                'translate-y-20',
                '-translate-y-20',
                'scale-75',
                'rotate-12'
              );

              el.classList.add(
                'opacity-100',
                'translate-x-0',
                'translate-y-0',
                'scale-100',
                'rotate-0'
              );
            }, delay);

            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px' } // 🔥 fix
    );

    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, [delay, threshold]);

  return (
    <div
      ref={elementRef}
      className={`${REVEAL_TYPES[type]} transition-all duration-1000 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}