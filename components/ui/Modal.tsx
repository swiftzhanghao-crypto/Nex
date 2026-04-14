import React, { useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { cn, cls } from './theme';

// ── Portal 渲染 ───────────────────────────────────────────

function Portal({ children }: { children: React.ReactNode }) {
  const el = document.getElementById('modal-root') || document.body;
  return ReactDOM.createPortal(children, el);
}

// ── 模态框 ────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlay?: boolean;
}

export function Modal({ open, onClose, title, width = 'w-[520px]', children, footer, closeOnOverlay = true }: ModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <Portal>
      <div className={cls.overlay} onClick={closeOnOverlay ? onClose : undefined}>
        <div className={cn(cls.modalContent, width, 'max-h-[90vh] flex flex-col')} onClick={e => e.stopPropagation()}>
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-3 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}

// ── 右侧抽屉 ─────────────────────────────────────────────

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({ open, onClose, title, width = 'max-w-[480px] w-full', children, footer }: DrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <Portal>
      <div className={cls.drawerOverlay}>
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className={cn(cls.drawerContent, width, 'h-full flex flex-col relative z-10')}>
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-3 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}

// ── 确认对话框 ────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title = '确认操作',
  message, confirmLabel = '确认', cancelLabel = '取消',
  variant = 'danger', loading,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={title} width="w-[420px]"
      footer={
        <>
          <button onClick={onClose} className="unified-button-secondary px-4 py-2 text-sm">{cancelLabel}</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              variant === 'danger' ? 'unified-button-danger' : 'unified-button-primary',
              'px-4 py-2 text-sm',
            )}
          >
            {loading ? '处理中...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm text-gray-600 dark:text-gray-300">{message}</div>
    </Modal>
  );
}
