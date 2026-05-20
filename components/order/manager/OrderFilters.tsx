import React from 'react';
import ReactDOM from 'react-dom';
import { Plus, Trash2, Calendar, ChevronDown, CheckCircle, Eye } from 'lucide-react';
import { Order, User } from '../../../types';
import {
  FilterCondition,
  FilterMode,
  availableFilterFields,
  multiCheckboxFields,
  personPickerFields,
  dateFilterFields,
  amountFilterFields,
  initValueForField,
} from './orderManagerUtils';

export interface ActiveDropdown {
  filterId: string;
  type: 'field' | 'mode' | 'value';
  top: number;
  left: number;
  width: number;
}

export interface OrderFilterDrawerTabProps {
  advancedFilters: FilterCondition[];
  appliedFilters: FilterCondition[];
  activeDropdown: ActiveDropdown | null;
  showSaveView: boolean;
  saveViewName: string;
  orders: Order[];
  users: User[];
  onAddFilter: () => void;
  onRemoveFilter: (id: string) => void;
  onUpdateFilter: (id: string, updates: Partial<FilterCondition>) => void;
  onToggleDropdown: (e: React.MouseEvent, filterId: string, type: 'field' | 'mode' | 'value') => void;
  onToggleMultiValue: (filterId: string, val: string) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  onCloseDrawer: () => void;
  onShowSaveView: () => void;
  onHideSaveView: () => void;
  onSaveViewNameChange: (name: string) => void;
  onSaveCurrentAsView: (name: string) => void;
  getCheckboxOptions: (fieldId: string) => { value: string; label: string }[];
}

export const OrderFilterDrawerTab: React.FC<OrderFilterDrawerTabProps> = React.memo(function OrderFilterDrawerTab({
  advancedFilters,
  appliedFilters,
  activeDropdown,
  showSaveView,
  saveViewName,
  orders,
  users,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  onToggleDropdown,
  onToggleMultiValue,
  onClearFilters,
  onApplyFilters,
  onCloseDrawer,
  onShowSaveView,
  onHideSaveView,
  onSaveViewNameChange,
  onSaveCurrentAsView,
  getCheckboxOptions,
}) {
  return (
    <>
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4 mb-8">
                        {advancedFilters.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl">
                                <p className="text-sm text-gray-400">暂无筛选条件，点击下方按钮添加</p>
                            </div>
                        )}
                        {advancedFilters.map((filter) => {
                            const isMultiCheckbox = multiCheckboxFields.includes(filter.fieldId);
                            const isPersonPicker = personPickerFields.includes(filter.fieldId);
                            const isDateFilter = dateFilterFields.includes(filter.fieldId);
                            const isAmountFilter = amountFilterFields.includes(filter.fieldId);
                            const selectedArr = Array.isArray(filter.value) ? filter.value as string[] : [];
                            const amountVal = (filter.value && typeof filter.value === 'object' && 'min' in filter.value) ? filter.value as { min: string; max: string } : { min: '', max: '' };
                            const checkboxOpts = getCheckboxOptions(filter.fieldId);
                            const fieldLabel = availableFilterFields.find(f => f.id === filter.fieldId)?.label || '选择字段';
                            const isFieldOpen = activeDropdown?.filterId === filter.id && activeDropdown.type === 'field';
                            const isModeOpen = activeDropdown?.filterId === filter.id && activeDropdown.type === 'mode';
                            const isValueOpen = activeDropdown?.filterId === filter.id && activeDropdown.type === 'value';
                            const bmIds = isPersonPicker ? [...new Set(orders.filter(o => o.businessManagerId).map(o => o.businessManagerId as string))] : [];
                            const bmUsers = isPersonPicker ? bmIds.map(id => users.find(u => u.id === id)).filter(Boolean) as typeof users : [];
                            const selectedUser = isPersonPicker ? bmUsers.find(u => u.id === filter.value) : undefined;
                            return (
                            <div key={filter.id} className="flex items-start gap-2">
                                <div className="w-[120px] shrink-0">
                                    <button
                                        onMouseDown={(e) => { e.stopPropagation(); onToggleDropdown(e, filter.id, 'field'); }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-xs bg-gray-50 dark:bg-black/30 border rounded-xl transition hover:border-[#0071E3]/50 ${isFieldOpen ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20' : 'border-gray-200 dark:border-white/10'}`}
                                    >
                                        <span className="text-gray-900 dark:text-white truncate">{fieldLabel}</span>
                                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 ml-1 transition-transform ${isFieldOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                                <div className="w-[64px] shrink-0">
                                    {(isMultiCheckbox || isPersonPicker || isAmountFilter) ? (
                                        <div className="px-2 py-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-400 text-center select-none">
                                            {isMultiCheckbox ? '多选' : isPersonPicker ? '单选' : '范围'}
                                        </div>
                                    ) : (
                                        <button
                                            onMouseDown={(e) => { e.stopPropagation(); onToggleDropdown(e, filter.id, 'mode'); }}
                                            className={`w-full flex items-center justify-between px-2 py-2.5 text-xs bg-gray-50 dark:bg-black/30 border rounded-xl transition hover:border-[#0071E3]/50 ${isModeOpen ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20' : 'border-gray-200 dark:border-white/10'}`}
                                        >
                                            <span className="text-gray-900 dark:text-white truncate">{filter.mode}</span>
                                            <ChevronDown className={`w-3 h-3 text-gray-400 shrink-0 ml-0.5 transition-transform ${isModeOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {isAmountFilter ? (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl">
                                            <span className="text-xs text-gray-400 shrink-0">¥</span>
                                            <input type="number" placeholder="最小" className="bg-transparent text-sm dark:text-white outline-none w-full min-w-0" value={amountVal.min} onChange={(e) => onUpdateFilter(filter.id, { value: { ...amountVal, min: e.target.value } })} />
                                            <span className="text-gray-300 shrink-0">—</span>
                                            <input type="number" placeholder="最大" className="bg-transparent text-sm dark:text-white outline-none w-full min-w-0" value={amountVal.max} onChange={(e) => onUpdateFilter(filter.id, { value: { ...amountVal, max: e.target.value } })} />
                                        </div>
                                    ) : isDateFilter && filter.mode === '时间段' ? (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <input type="date" className="bg-transparent text-xs dark:text-white outline-none flex-1 min-w-0" value={(typeof filter.value === 'object' && filter.value !== null && 'start' in filter.value ? filter.value.start : '') || ''} onChange={(e) => onUpdateFilter(filter.id, { value: { ...(typeof filter.value === 'object' && filter.value !== null && 'start' in filter.value ? filter.value : { start: '', end: '' }), start: e.target.value } })} />
                                            <span className="text-gray-300 shrink-0">—</span>
                                            <input type="date" className="bg-transparent text-xs dark:text-white outline-none flex-1 min-w-0" value={(typeof filter.value === 'object' && filter.value !== null && 'end' in filter.value ? filter.value.end : '') || ''} onChange={(e) => onUpdateFilter(filter.id, { value: { ...(typeof filter.value === 'object' && filter.value !== null && 'end' in filter.value ? filter.value : { start: '', end: '' }), end: e.target.value } })} />
                                        </div>
                                    ) : isDateFilter && filter.mode === '时间点' ? (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <input type="date" className="bg-transparent text-sm dark:text-white outline-none w-full" value={typeof filter.value === 'string' ? filter.value : ''} onChange={(e) => onUpdateFilter(filter.id, { value: e.target.value })} />
                                        </div>
                                    ) : (isMultiCheckbox || isPersonPicker) ? (
                                        <button
                                            onMouseDown={(e) => { e.stopPropagation(); onToggleDropdown(e, filter.id, 'value'); }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm bg-gray-50 dark:bg-black/30 border rounded-xl transition hover:border-[#0071E3]/50 ${isValueOpen ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20' : 'border-gray-200 dark:border-white/10'}`}
                                        >
                                            {isPersonPicker ? (
                                                selectedUser ? (
                                                    <span className="flex items-center gap-2 truncate">
                                                        <img src={selectedUser.avatar} className="w-5 h-5 rounded-full shrink-0" alt="" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=0071E3&color=fff&size=40`; }} />
                                                        <span className="text-gray-700 dark:text-gray-200 truncate">{selectedUser.name}</span>
                                                    </span>
                                                ) : <span className="text-gray-400">点击选择…</span>
                                            ) : (
                                                <span className={`text-left truncate ${selectedArr.length === 0 ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {selectedArr.length === 0 ? '点击选择…' : selectedArr.map(v => checkboxOpts.find(o => o.value === v)?.label || v).join('、')}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 shrink-0 ml-2">
                                                {isMultiCheckbox && selectedArr.length > 0 && (
                                                    <span className="unified-button-primary text-[10px] bg-[#0071E3] w-5 h-5">{selectedArr.length}</span>
                                                )}
                                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isValueOpen ? 'rotate-180' : ''}`} />
                                            </span>
                                        </button>
                                    ) : (
                                        <button
                                            onMouseDown={(e) => { e.stopPropagation(); onToggleDropdown(e, filter.id, 'value'); }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm bg-gray-50 dark:bg-black/30 border rounded-xl transition hover:border-[#0071E3]/50 ${isValueOpen ? 'border-[#0071E3] ring-2 ring-[#0071E3]/20' : 'border-gray-200 dark:border-white/10'}`}
                                        >
                                            <span className="text-gray-900 dark:text-white truncate">{filter.value as string || '全部'}</span>
                                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 ml-2 transition-transform ${isValueOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                    )}
                                </div>
                                <button onClick={() => onRemoveFilter(filter.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            );
                        })}
                    </div>

                    <button 
                        onClick={onAddFilter}
                        className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl"
                    >
                        <Plus className="w-4 h-4" />
                        添加筛选条件
                    </button>
                </div>

                <div className="p-5 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 shrink-0">
                    {showSaveView ? (
                      <div className="flex items-center gap-2 mb-3">
                        <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
                        <input
                          autoFocus
                          value={saveViewName}
                          onChange={e => onSaveViewNameChange(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && saveViewName.trim()) onSaveCurrentAsView(saveViewName.trim()); if (e.key === 'Escape') onHideSaveView(); }}
                          placeholder="输入视图名称…"
                          className="flex-1 h-8 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white outline-none focus:border-emerald-400 dark:focus:border-emerald-600 placeholder:text-gray-400 transition"
                        />
                        <button
                          onClick={() => { if (saveViewName.trim()) onSaveCurrentAsView(saveViewName.trim()); }}
                          disabled={!saveViewName.trim()}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >保存</button>
                        <button onClick={() => onHideSaveView()} className="px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition">取消</button>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={onClearFilters} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-all">重置</button>
                        {!showSaveView && (
                          <button
                            onClick={() => { onShowSaveView(); onSaveViewNameChange(''); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            存为视图
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                          <button onClick={onCloseDrawer} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">取消</button>
                          <button onClick={onApplyFilters} className="unified-button-primary bg-[#0071E3] shadow-blue-500/25">查询</button>
                      </div>
                    </div>
                </div>
              </>
  );
});

export interface OrderFilterDropdownPortalProps {
  activeDropdown: ActiveDropdown | null;
  advancedFilters: FilterCondition[];
  orders: Order[];
  users: User[];
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onUpdateFilter: (id: string, updates: Partial<FilterCondition>) => void;
  onToggleMultiValue: (filterId: string, val: string) => void;
  onCloseDropdown: () => void;
  getCheckboxOptions: (fieldId: string) => { value: string; label: string }[];
}

export const OrderFilterDropdownPortal: React.FC<OrderFilterDropdownPortalProps> = ({
  activeDropdown,
  advancedFilters,
  orders,
  users,
  dropdownRef,
  onUpdateFilter,
  onToggleMultiValue,
  onCloseDropdown,
  getCheckboxOptions,
}) => {
  if (!activeDropdown) return null;

  const f = advancedFilters.find(x => x.id === activeDropdown.filterId);
if (!f) return null;
const isMultiCheckbox = multiCheckboxFields.includes(f.fieldId);
const isPersonPicker = personPickerFields.includes(f.fieldId);
const baseStyle: React.CSSProperties = { position: 'fixed', zIndex: 9999, top: activeDropdown.top, left: activeDropdown.left, width: activeDropdown.width };
const baseClass = "bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden";

let content: React.ReactNode = null;

if (activeDropdown.type === 'field') {
    content = (
        <div ref={dropdownRef} style={baseStyle} className={baseClass} onMouseDown={e => e.stopPropagation()}>
            <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                {availableFilterFields.map(field => {
                    const isSelected = f.fieldId === field.id;
                    const isUsed = advancedFilters.some(af => af.id !== f.id && af.fieldId === field.id);
                    return (
                        <button key={field.id} disabled={isUsed} onMouseDown={(e) => { e.stopPropagation(); if (!isUsed) { onUpdateFilter(f.id, { fieldId: field.id, mode: field.defaultMode, value: initValueForField(field.id, field.defaultMode) }); onCloseDropdown(); } }} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition ${isUsed ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                            <span className="truncate">{field.label}</span>
                            {isSelected && <CheckCircle className="w-4 h-4 text-[#0071E3] shrink-0" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
} else if (activeDropdown.type === 'mode') {
    const modeOpts = dateFilterFields.includes(f.fieldId)
        ? [{ value: '时间段', label: '时间段' }, { value: '时间点', label: '时间点' }]
        : [{ value: '单选', label: '单选' }, { value: '多选', label: '多选' }];
    content = (
        <div ref={dropdownRef} style={baseStyle} className={baseClass} onMouseDown={e => e.stopPropagation()}>
            <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                {modeOpts.map(opt => {
                    const isSelected = f.mode === opt.value;
                    return (
                        <button key={opt.value} onMouseDown={(e) => { e.stopPropagation(); const newMode = opt.value as FilterMode; onUpdateFilter(f.id, { mode: newMode, value: newMode === '时间段' ? { start: '', end: '' } : newMode === '时间点' ? '' : initValueForField(f.fieldId, newMode) }); onCloseDropdown(); }} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                            <span>{opt.label}</span>
                            {isSelected && <CheckCircle className="w-4 h-4 text-[#0071E3] shrink-0" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
} else if (activeDropdown.type === 'value') {
    if (isMultiCheckbox) {
        const opts = getCheckboxOptions(f.fieldId);
        const selectedArr = Array.isArray(f.value) ? f.value as string[] : [];
        content = (
            <div ref={dropdownRef} style={baseStyle} className={baseClass} onMouseDown={e => e.stopPropagation()}>
                <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">选择筛选值</span>
                    {selectedArr.length > 0 && <button onMouseDown={(e) => { e.stopPropagation(); onUpdateFilter(f.id, { value: [] }); }} className="text-xs text-gray-400 hover:text-red-500 transition">清除</button>}
                </div>
                <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                    {opts.map(opt => {
                        const checked = selectedArr.includes(opt.value);
                        return (
                            <button key={opt.value} onMouseDown={(e) => { e.stopPropagation(); onToggleMultiValue(f.id, opt.value); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition ${checked ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3]' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${checked ? 'bg-[#0071E3] border-[#0071E3]' : 'border-gray-300 dark:border-gray-500'}`}>
                                    {checked && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                </span>
                                <span className="text-left">{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    } else if (isPersonPicker) {
        const bmIds = [...new Set(orders.filter(o => o.businessManagerId).map(o => o.businessManagerId as string))];
        const bmUsers = bmIds.map(id => users.find(u => u.id === id)).filter(Boolean) as typeof users;
        content = (
            <div ref={dropdownRef} style={baseStyle} className={baseClass} onMouseDown={e => e.stopPropagation()}>
                <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">选择商务</span>
                    {f.value && f.value !== '全部' && <button onMouseDown={(e) => { e.stopPropagation(); onUpdateFilter(f.id, { value: '全部' }); }} className="text-xs text-gray-400 hover:text-red-500 transition">清除</button>}
                </div>
                <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                    {bmUsers.map(user => {
                        const checked = f.value === user.id;
                        return (
                            <button key={user.id} onMouseDown={(e) => { e.stopPropagation(); onUpdateFilter(f.id, { value: checked ? '全部' : user.id }); onCloseDropdown(); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${checked ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                <img src={user.avatar} className="w-6 h-6 rounded-full shrink-0" alt="" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0071E3&color=fff&size=40`; }} />
                                <span className={`flex-1 text-left truncate ${checked ? 'text-[#0071E3] font-medium' : 'text-gray-700 dark:text-gray-200'}`}>{user.name}</span>
                                {checked && <div className="w-1.5 h-1.5 rounded-full bg-[#0071E3] shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    } else {
        content = (
            <div ref={dropdownRef} style={baseStyle} className={baseClass} onMouseDown={e => e.stopPropagation()}>
                <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                    {[{ value: '全部', label: '全部' }, { value: '不限', label: '不限' }].map(opt => {
                        const isSelected = f.value === opt.value;
                        return (
                            <button key={opt.value} onMouseDown={(e) => { e.stopPropagation(); onUpdateFilter(f.id, { value: opt.value }); onCloseDropdown(); }} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-[#0071E3] font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                <span>{opt.label}</span>
                                {isSelected && <CheckCircle className="w-4 h-4 text-[#0071E3] shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }
}


  return content ? ReactDOM.createPortal(content, document.body) : null;
};
