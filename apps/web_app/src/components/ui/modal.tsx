import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

const SIZE_MAP: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full', string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
  '2xl': 'max-w-4xl',
  full: 'max-w-5xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Background scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Keyboard accessibility (Escape key)
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      closeOnOutsideClick &&
      contentRef.current &&
      !contentRef.current.contains(e.target as Node)
    ) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={contentRef}
        className={cn(
          'relative w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150',
          SIZE_MAP[size] || SIZE_MAP.md,
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={cn(
              'flex-shrink-0 px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-start justify-between gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm',
              headerClassName,
            )}
          >
            <div className="flex items-start gap-3 min-w-0">
              {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Body */}
        <div
          className={cn(
            'flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 custom-scrollbar',
            bodyClassName,
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={cn(
              'flex-shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50/90 dark:bg-slate-800/40 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2.5',
              footerClassName,
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
