import React, { useEffect, useState } from 'react';
import { AlertCircle, X, ChevronRight } from 'lucide-react';
import type { ValidationError } from './wizardValidation';

interface FieldErrorProps {
  error?: string;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;
  return (
    <div className={`flex items-center gap-1.5 mt-1.5 animate-fade-in ${className}`}>
      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
      <span className="text-xs font-medium text-red-600 dark:text-red-400">{error}</span>
    </div>
  );
};

interface ValidationToastProps {
  errors: ValidationError[];
  onClose: () => void;
  onNavigateStep?: (step: number) => void;
}

export const ValidationToast: React.FC<ValidationToastProps> = ({ errors, onClose, onNavigateStep }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (errors.length === 0) return null;

  const groupedByStep = errors.reduce<Record<number, ValidationError[]>>((acc, err) => {
    if (!acc[err.step]) acc[err.step] = [];
    acc[err.step].push(err);
    return acc;
  }, {});

  const stepLabels: Record<number, string> = { 1: '订单类型', 2: '客户信息', 3: '产品配置', 4: '交付信息' };

  return (
    <div className={`fixed top-6 right-6 z-[700] max-w-sm w-full transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl border border-red-100 dark:border-red-900/30 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-red-700 dark:text-red-300">
              请修正以下 {errors.length} 项问题
            </span>
          </div>
          <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto custom-scrollbar">
          {Object.entries(groupedByStep).map(([step, stepErrors]) => (
            <div key={step} className="px-4 py-2.5 border-b border-gray-50 dark:border-white/5 last:border-0">
              <button
                onClick={() => onNavigateStep?.(Number(step))}
                className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-blue-500 transition flex items-center gap-1 mb-1"
              >
                步骤 {step}: {stepLabels[Number(step)]}
                <ChevronRight className="w-3 h-3" />
              </button>
              {stepErrors.map((err, idx) => (
                <div key={idx} className="flex items-start gap-2 py-1">
                  <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  <span className="text-xs text-gray-600 dark:text-gray-300">{err.message}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface StepValidationBannerProps {
  errors: ValidationError[];
  currentStep: number;
}

export const StepValidationBanner: React.FC<StepValidationBannerProps> = ({ errors, currentStep }) => {
  const stepErrors = errors.filter(e => e.step === currentStep);
  if (stepErrors.length === 0) return null;

  return (
    <div className="mx-6 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl animate-fade-in">
      <div className="flex items-center gap-2 mb-1.5">
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
        <span className="text-xs font-bold text-red-700 dark:text-red-300">
          当前步骤有 {stepErrors.length} 项需要修正
        </span>
      </div>
      <ul className="space-y-1 pl-6">
        {stepErrors.map((err, idx) => (
          <li key={idx} className="text-xs text-red-600 dark:text-red-400 list-disc">{err.message}</li>
        ))}
      </ul>
    </div>
  );
};

