import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { GripVertical } from 'lucide-react';
import type { User, Channel } from '../../../types';
import Pagination from '../../common/Pagination';
import { Badge } from '../../ui';

export interface UserTableProps {
  searchTerm: string;
  currentUsers: User[];
  filteredUsersCount: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  channels: Channel[];
  dragUserId: string | null;
  dragOverUserId: string | null;
  onDragStart: (e: React.DragEvent, userId: string) => void;
  onDragOver: (e: React.DragEvent, userId: string) => void;
  onDrop: (e: React.DragEvent, userId: string) => void;
  onDragEnd: () => void;
  onAvatarClick: (e: React.MouseEvent, user: User) => void;
  getDepartmentName: (deptId?: string) => React.ReactNode;
}

const UserTable: React.FC<UserTableProps> = React.memo(function UserTable({ searchTerm, currentUsers, filteredUsersCount: filteredUsers, currentPage, itemsPerPage, onPageChange: handlePageChange, channels, dragUserId, dragOverUserId, onDragStart: handleUserDragStart, onDragOver: handleUserDragOver, onDrop: handleUserDrop, onDragEnd: handleUserDragEnd, onAvatarClick: handleAvatarClick, getDepartmentName }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const useVirtual = currentUsers.length > 50;
    const rowVirtualizer = useVirtualizer({
        count: currentUsers.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 64,
        overscan: 10,
        enabled: useVirtual,
    });

    const rows = useVirtual ? rowVirtualizer.getVirtualItems() : currentUsers.map((_, i) => ({ index: i, start: 0, end: 0, size: 0, key: i, lane: 0 }));
    const paddingTop = useVirtual && rows.length > 0 ? rows[0].start : 0;
    const paddingBottom = useVirtual && rows.length > 0 ? rowVirtualizer.getTotalSize() - rows[rows.length - 1].end : 0;

    return (
        <div className="unified-card dark:bg-[#1C1C1E] border-gray-100 dark:border-white/10 flex flex-col animate-fade-in flex-1 min-h-0">
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto">
                <table className="w-full text-left">
                    <thead className="unified-table-header dark: sticky top-0 backdrop-blur">
                        <tr>
                            {!searchTerm && <th className="w-8 p-4 pl-3"></th>}
                            <th className="p-4 pl-6">用户</th>
                            <th className="p-4">账号ID</th>
                            <th className="p-4">部门</th>
                            <th className="p-4">类型</th>
                            <th className="p-4">关联渠道</th>
                            <th className="p-4">状态</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                        {paddingTop > 0 && <tr aria-hidden="true"><td colSpan={searchTerm ? 6 : 7} style={{ height: paddingTop, padding: 0, border: 'none' }} /></tr>}
                        {rows.map((vRow) => {
                            const user = currentUsers[vRow.index];
                            return (
                                <tr
                                    key={user.id}
                                    draggable={!searchTerm}
                                    onDragStart={e => handleUserDragStart(e, user.id)}
                                    onDragOver={e => handleUserDragOver(e, user.id)}
                                    onDrop={e => handleUserDrop(e, user.id)}
                                    onDragEnd={handleUserDragEnd}
                                    className={`group hover:bg-gray-50 dark:hover:bg-white/5 transition ${
                                        dragUserId === user.id ? 'opacity-40' : ''
                                    } ${
                                        dragOverUserId === user.id && dragUserId !== user.id ? 'ring-2 ring-blue-400 dark:ring-blue-500 ring-inset bg-blue-50/50 dark:bg-blue-900/10' : ''
                                    }`}
                                >
                                    {!searchTerm && (
                                        <td className="w-8 p-4 pl-3">
                                            <div className="cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">
                                                <GripVertical className="w-4 h-4" />
                                            </div>
                                        </td>
                                    )}
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    src={user.avatar}
                                                    className="w-9 h-9 rounded-full bg-gray-100 cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 dark:hover:ring-offset-black transition-all"
                                                    alt=""
                                                    onClick={(e) => handleAvatarClick(e, user)}
                                                />
                                                {user.monthBadge && (
                                                    <span className="absolute -bottom-0.5 -right-1 px-1 py-px text-[8px] font-bold leading-none text-white bg-pink-500 rounded-full shadow ring-1 ring-white dark:ring-[#1C1C1E]">{user.monthBadge}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-gray-600 dark:text-gray-300">{user.accountId}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">{getDepartmentName(user.departmentId)}</td>
                                    <td className="p-4">
                                        <Badge color={user.userType === 'Internal' ? 'blue' : 'orange'}>
                                            {user.userType === 'Internal' ? '内部员工' : '外部协作'}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-xs text-gray-600 dark:text-gray-300">{user.channelId ? (channels.find(c => c.id === user.channelId)?.name || user.channelId) : <span className="text-gray-300 dark:text-gray-600">-</span>}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${user.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                            {user.status === 'Active' ? '已启用' : '已停用'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {paddingBottom > 0 && <tr aria-hidden="true"><td colSpan={searchTerm ? 6 : 7} style={{ height: paddingBottom, padding: 0, border: 'none' }} /></tr>}
                    </tbody>
                </table>
            </div>
            <Pagination
                page={currentPage}
                size={itemsPerPage}
                total={filteredUsers}
                onPageChange={handlePageChange}
            />
        </div>
    );
});

export default UserTable;
