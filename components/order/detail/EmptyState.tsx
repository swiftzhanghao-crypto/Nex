import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState: React.FC<{
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    className?: string;
}> = ({ icon, title = '暂无数据', description, className = '' }) => (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center mb-3">
            {icon || <Inbox className="w-7 h-7 text-gray-300 dark:text-gray-600" />}
        </div>
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">{title}</p>
        {description && <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">{description}</p>}
    </div>
);
