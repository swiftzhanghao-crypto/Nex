import React, { useMemo } from 'react';
import { Check, CheckSquare } from 'lucide-react';

// ─── 通用权限树类型 ──────────────────────────────────────────────────
//
// 主平台 `PermGroup` 与应用的 `SpacePermGroup` 形状一致，这里用一组
// 结构性接口承接两者，避免重复实现两套只读权限渲染。
export interface ReadonlyPermItem {
    id: string;
    label: string;
}

export interface ReadonlyPermCategory {
    id: string;
    label: string;
    permissions: ReadonlyPermItem[];
}

export interface ReadonlyPermSubgroup {
    id: string;
    label: string;
    permissions?: ReadonlyPermItem[];
    categories?: ReadonlyPermCategory[];
}

export interface ReadonlyPermGroup {
    id: string;
    label: string;
    subgroups: ReadonlyPermSubgroup[];
}

interface Props {
    tree: ReadonlyPermGroup[];
    grantedIds: string[];
    /** 全部为空时显示的提示文案，默认「暂未配置任何功能权限」 */
    emptyText?: string;
}

function collectSubgroupIds(sg: ReadonlyPermSubgroup): string[] {
    const direct = (sg.permissions || []).map(p => p.id);
    const nested = (sg.categories || []).flatMap(c => c.permissions.map(p => p.id));
    return [...direct, ...nested];
}

function collectGroupIds(g: ReadonlyPermGroup): string[] {
    return g.subgroups.flatMap(collectSubgroupIds);
}

const PermissionReadonlyTree: React.FC<Props> = ({ tree, grantedIds, emptyText = '暂未配置任何功能权限' }) => {
    // 用 Set 加速命中判断，避免每个权限项做 O(n) 的 includes
    const grantedSet = useMemo(() => new Set(grantedIds), [grantedIds]);
    const isGranted = (id: string) => grantedSet.has(id);
    const countGranted = (ids: string[]) => ids.reduce((acc, id) => acc + (grantedSet.has(id) ? 1 : 0), 0);

    if (grantedIds.length === 0) {
        return (
            <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-white/10 rounded-lg">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                {emptyText}
            </div>
        );
    }

    return (
        <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#1C1C1E]">
            {tree.map((group, gIdx) => {
                const groupIds = collectGroupIds(group);
                const groupCount = countGranted(groupIds);
                if (groupCount === 0) return null;
                const groupAll = groupCount === groupIds.length;
                return (
                    <div key={group.id} className={gIdx > 0 ? 'border-t border-gray-100 dark:border-white/10' : ''}>
                        <div className="flex items-center gap-2.5 px-4 py-2 bg-blue-50/50 dark:bg-blue-900/10">
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${groupAll ? 'bg-blue-600 border-blue-600' : 'bg-blue-400/60 border-blue-400'}`}>
                                <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                            <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{group.label}</span>
                            <span className="text-[11px] text-blue-500 ml-auto font-mono">{groupCount}/{groupIds.length}</span>
                        </div>
                        {group.subgroups.map(sg => {
                            const sgIds = collectSubgroupIds(sg);
                            const sgCount = countGranted(sgIds);
                            if (sgCount === 0) return null;
                            const sgAll = sgCount === sgIds.length;
                            return (
                                <div key={sg.id}>
                                    <div className="flex items-center gap-2.5 py-1.5 pr-4" style={{ paddingLeft: 36 }}>
                                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0" />
                                        <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${sgAll ? 'bg-blue-600 border-blue-600' : 'bg-blue-400/60 border-blue-400'}`}>
                                            <Check className="w-2 h-2 text-white" />
                                        </div>
                                        <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">{sg.label}</span>
                                        <span className="text-[11px] text-gray-400 font-mono">{sgCount}/{sgIds.length}</span>
                                    </div>
                                    {sg.categories?.map(cat => {
                                        const catCount = countGranted(cat.permissions.map(p => p.id));
                                        if (catCount === 0) return null;
                                        const catAll = catCount === cat.permissions.length;
                                        return (
                                            <div key={cat.id}>
                                                <div className="flex items-center gap-2 py-1 pr-4" style={{ paddingLeft: 56 }}>
                                                    <div className="w-px h-3 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-0.5 shrink-0" />
                                                    <div className={`w-2.5 h-2.5 rounded border flex items-center justify-center shrink-0 ${catAll ? 'bg-blue-600 border-blue-600' : 'bg-blue-400/60 border-blue-400'}`}>
                                                        <Check className="w-1.5 h-1.5 text-white" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{cat.label}</span>
                                                </div>
                                                {cat.permissions.filter(p => isGranted(p.id)).map(perm => (
                                                    <div key={perm.id} className="flex items-center gap-2.5 py-0.5 pr-4" style={{ paddingLeft: 76 }}>
                                                        <div className="w-px h-3 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-0.5 shrink-0" />
                                                        <div className="w-3 h-3 rounded border bg-blue-600 border-blue-600 flex items-center justify-center shrink-0">
                                                            <Check className="w-2 h-2 text-white" />
                                                        </div>
                                                        <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">{perm.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                    {!sg.categories && sg.permissions?.filter(p => isGranted(p.id)).map(perm => (
                                        <div key={perm.id} className="flex items-center gap-2.5 py-1 pr-4" style={{ paddingLeft: 64 }}>
                                            <div className="w-px h-3.5 bg-gray-200 dark:bg-white/10 -ml-[1px] mr-1 shrink-0" />
                                            <div className="w-3 h-3 rounded border bg-blue-600 border-blue-600 flex items-center justify-center shrink-0">
                                                <Check className="w-2 h-2 text-white" />
                                            </div>
                                            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">{perm.label}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(PermissionReadonlyTree);
