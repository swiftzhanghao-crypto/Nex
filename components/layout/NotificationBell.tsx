import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAppContext } from '../../contexts/AppContext';

const NotificationBell: React.FC = () => {
  const { apiMode } = useAppContext();
  const { notifications, unreadCount, loading, markRead, markAllRead, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!apiMode) return null;

  const handleClickItem = async (id: string, link: string | null, read: boolean) => {
    if (!read) await markRead(id);
    setOpen(false);
    if (link) {
      const path = link.startsWith('#') ? link.slice(1) : link;
      navigate(path);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void refresh();
        }}
        className="relative p-2 text-gray-400 hover:text-[#0071E3] dark:hover:text-blue-400 transition rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
        title="通知"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[420px] flex flex-col unified-card bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-2xl rounded-2xl z-50 animate-modal-enter overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10 shrink-0">
            <span className="text-sm font-bold text-gray-900 dark:text-white">通知</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1 text-xs text-[#0071E3] hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                全部已读
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">暂无通知</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-white/5">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void handleClickItem(n.id, n.link, n.read)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition ${!n.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      <p className={`text-sm font-medium ${!n.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1 font-mono">{n.createdAt}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
