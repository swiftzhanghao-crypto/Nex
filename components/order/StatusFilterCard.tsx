import React from 'react';

interface StatusFilterCardProps {
  id: string;
  label: string;
  icon: React.ElementType;
  count: number;
  isActive: boolean;
  variant?: 'primary' | 'danger' | 'muted';
  onClick: () => void;
}

const StatusFilterCard: React.FC<StatusFilterCardProps> = ({ id, label, icon: Icon, count, isActive, variant = 'primary', onClick }) => {
  const activeClass = variant === 'danger'
    ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/20'
    : variant === 'muted'
      ? 'bg-gray-500 border-gray-500 text-white shadow-lg shadow-gray-400/20'
      : 'bg-[#0071E3] border-[#0071E3] text-white shadow-lg shadow-blue-500/20';

  const inactiveClass = variant === 'danger'
    ? 'bg-white dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 text-gray-500 hover:border-red-300 dark:hover:border-red-900'
    : variant === 'muted'
      ? 'bg-white dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 text-gray-500 hover:border-gray-400 dark:hover:border-gray-600'
      : 'bg-white dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 text-gray-500 hover:border-[#0071E3]/40 dark:hover:border-blue-900';

  const iconBgActive = 'bg-white/20';
  const iconBgInactive = variant === 'danger'
    ? 'bg-red-50 dark:bg-red-900/20 text-red-600'
    : variant === 'muted'
      ? 'bg-gray-100 dark:bg-white/10 text-gray-500'
      : 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3]';

  const badgeActive = variant === 'danger' || variant === 'muted'
    ? `bg-white ${variant === 'danger' ? 'text-red-600' : 'text-gray-600'}`
    : 'bg-white text-[#0071E3]';
  const badgeInactive = variant === 'danger'
    ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
    : variant === 'muted'
      ? 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
      : 'bg-blue-100 text-[#0071E3] dark:bg-blue-900/40 dark:text-blue-400';

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-xl border transition-all duration-300 text-left group min-w-[100px] flex-shrink-0 snap-start ${isActive ? activeClass : inactiveClass}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className={`p-1 rounded-lg ${isActive ? iconBgActive : iconBgInactive}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        {count > 0 && (
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive ? badgeActive : badgeInactive}`}>
            {count}
          </span>
        )}
      </div>
      <div className={`text-[11px] font-bold ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{label}</div>
      {isActive && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 bg-white rounded-full" />}
    </button>
  );
};

export default React.memo(StatusFilterCard);
