import React from 'react';

type Variant = 'primary' | 'shipping' | 'warning' | 'success' | 'danger' | 'muted';

interface StatusFilterCardProps {
  id: string;
  label: string;
  icon: React.ElementType;
  count: number;
  isActive: boolean;
  variant?: Variant;
  onClick: () => void;
}

const styles: Record<Variant, { active: string; inactive: string; badge: string }> = {
  primary: {
    active: 'bg-[#0071E3] border-[#0071E3] text-white shadow-sm shadow-blue-500/20',
    inactive: 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-800 hover:text-[#0071E3] dark:hover:text-blue-400',
    badge: 'bg-blue-50 text-[#0071E3] dark:bg-blue-900/30 dark:text-blue-400',
  },
  shipping: {
    active: 'bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-500/20',
    inactive: 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-800 hover:text-violet-600 dark:hover:text-violet-400',
    badge: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
  warning: {
    active: 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/20',
    inactive: 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-amber-300 dark:hover:border-amber-800 hover:text-amber-600 dark:hover:text-amber-400',
    badge: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  success: {
    active: 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-500/20',
    inactive: 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-800 hover:text-emerald-600 dark:hover:text-emerald-400',
    badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  danger: {
    active: 'bg-red-600 border-red-600 text-white shadow-sm shadow-red-500/20',
    inactive: 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400',
    badge: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
  muted: {
    active: 'bg-gray-500 border-gray-500 text-white shadow-sm shadow-gray-400/20',
    inactive: 'bg-white dark:bg-[#1C1C1E] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600',
    badge: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
  },
};

const StatusFilterCard: React.FC<StatusFilterCardProps> = ({ label, icon: Icon, count, isActive, variant = 'primary', onClick }) => {
  const base = 'inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer select-none';
  const s = styles[variant];

  return (
    <button onClick={onClick} className={`${base} ${isActive ? s.active : s.inactive}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {count > 0 && (
        <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold leading-none px-1 ${
          isActive ? 'bg-white/25 text-inherit' : s.badge
        }`}>
          {count}
        </span>
      )}
    </button>
  );
};

export default React.memo(StatusFilterCard);
