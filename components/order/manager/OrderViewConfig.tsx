import React from 'react';
import { Eye, ChevronDown, Check, Pencil, Trash2, GripVertical, X } from 'lucide-react';
import { OrderView, allColumns, DEFAULT_VISIBLE } from './orderManagerUtils';

export interface OrderViewDropdownProps {
  views: OrderView[];
  activeViewId: string;
  activeView: OrderView;
  viewMenuOpenId: string | null;
  editingViewId: string | null;
  editingViewName: string;
  viewMenuRef: React.RefObject<HTMLDivElement | null>;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onSwitchView: (viewId: string) => void;
  onStartRename: (viewId: string, name: string) => void;
  onRenameView: (viewId: string, name: string) => void;
  onCancelRename: () => void;
  onEditingViewNameChange: (name: string) => void;
  onDeleteView: (viewId: string) => void;
}

export const OrderViewDropdown: React.FC<OrderViewDropdownProps> = React.memo(function OrderViewDropdown({
  views,
  activeViewId,
  activeView,
  viewMenuOpenId,
  editingViewId,
  editingViewName,
  viewMenuRef,
  onToggleMenu,
  onCloseMenu,
  onSwitchView,
  onStartRename,
  onRenameView,
  onCancelRename,
  onEditingViewNameChange,
  onDeleteView,
}) {
  return (
<div className="relative" ref={viewMenuRef}>
  <button
    onClick={() => onToggleMenu()}
    className="h-8 px-3 pr-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500/40 transition shadow-apple flex items-center gap-1.5"
  >
    <Eye className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#0A84FF]" />
    {activeView.name}
    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${viewMenuOpenId === '__dropdown__' ? 'rotate-180' : ''}`} />
  </button>
  {viewMenuOpenId === '__dropdown__' && (
    <>
      <div className="fixed inset-0 z-40" onClick={() => { onCloseMenu(); }} />
      <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 py-1 animate-fade-in">
        {views.map(view => (
          <div key={view.id} className="group flex items-center">
            {editingViewId === view.id ? (
              <input
                autoFocus
                value={editingViewName}
                onChange={e => onEditingViewNameChange(e.target.value)}
                onBlur={() => onRenameView(view.id, editingViewName)}
                onKeyDown={e => { if (e.key === 'Enter') onRenameView(view.id, editingViewName); if (e.key === 'Escape') onCancelRename(); }}
                onClick={e => e.stopPropagation()}
                className="flex-1 h-9 mx-1 px-3 text-sm border border-blue-400 rounded-lg bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white outline-none"
              />
            ) : (
              <button
                onClick={() => { onSwitchView(view.id); }}
                className={`flex-1 text-left px-3 py-2 text-sm font-medium flex items-center gap-2 transition ${
                  activeViewId === view.id
                    ? 'text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 truncate">{view.name}</span>
                {activeViewId === view.id && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            )}
            {!editingViewId && !view.isDefault && (
              <div className="flex items-center gap-0.5 pr-1.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); onStartRename(view.id, view.name); }}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition"
                  title="重命名"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteView(view.id); }}
                  className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  title="删除"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )}
</div>
  );
});

export interface OrderColumnDrawerTabProps {
  tempVisibleCols: string[];
  colSearch: string;
  colDragIdx: number | null;
  fixedColumns: Set<string>;
  showSaveView: boolean;
  saveViewName: string;
  onColSearchChange: (v: string) => void;
  onTempVisibleColsChange: (cols: string[]) => void;
  onColDragIdxChange: (idx: number | null) => void;
  onShowSaveView: () => void;
  onHideSaveView: () => void;
  onSaveViewNameChange: (name: string) => void;
  onSaveCurrentAsView: (name: string) => void;
  onRestoreDefault: () => void;
  onCloseDrawer: () => void;
  onConfirm: (cols: string[]) => void;
}

export const OrderColumnDrawerTab: React.FC<OrderColumnDrawerTabProps> = React.memo(function OrderColumnDrawerTab({
  tempVisibleCols,
  colSearch,
  colDragIdx,
  fixedColumns,
  showSaveView,
  saveViewName,
  onColSearchChange,
  onTempVisibleColsChange,
  onColDragIdxChange,
  onShowSaveView,
  onHideSaveView,
  onSaveViewNameChange,
  onSaveCurrentAsView,
  onRestoreDefault,
  onCloseDrawer,
  onConfirm,
}) {
  const colFilteredAll = allColumns.filter(c => c.id !== 'action' && (!colSearch || c.label.includes(colSearch)));
  const selectedSet = new Set(tempVisibleCols);
  const orderedSelected = tempVisibleCols.filter(id => id !== 'action').map(id => allColumns.find(c => c.id === id)!).filter(Boolean);
  const unselected = colFilteredAll.filter(c => !selectedSet.has(c.id));
  return (
    <>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-5 pt-4 pb-3">
          <input
            type="text"
            value={colSearch}
            onChange={e => onColSearchChange(e.target.value)}
            placeholder="搜索列字段…"
            className="w-full text-sm px-3.5 py-2 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-black/30 outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:border-blue-300 dark:focus:border-blue-600 transition"
          />
        </div>

        {/* Selected columns with drag reorder */}
        {orderedSelected.length > 0 && (
          <div className="px-5 pb-2">
            <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">已选字段 · {orderedSelected.length}</div>
            <div className="space-y-0.5">
              {orderedSelected.filter(c => !colSearch || c.label.includes(colSearch)).map((col) => {
                const isFixed = fixedColumns.has(col.id);
                const tIdx = tempVisibleCols.indexOf(col.id);
                return (
                  <div
                    key={col.id}
                    draggable={!isFixed}
                    onDragStart={() => onColDragIdxChange(tIdx)}
                    onDragOver={e => {
                      e.preventDefault();
                      if (colDragIdx === null || colDragIdx === tIdx) return;
                      const arr = [...tempVisibleCols];
                      const [item] = arr.splice(colDragIdx, 1);
                      arr.splice(tIdx, 0, item);
                      onTempVisibleColsChange(arr);
                      onColDragIdxChange(tIdx);
                    }}
                    onDragEnd={() => onColDragIdxChange(null)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition group ${colDragIdx === tIdx ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                  >
                    <GripVertical className={`w-3.5 h-3.5 shrink-0 ${isFixed ? 'text-transparent' : 'text-gray-300 dark:text-gray-600 cursor-grab'}`} />
                    <input
                      type="checkbox"
                      checked
                      disabled={isFixed}
                      onChange={() => {
                        if (!isFixed) onTempVisibleColsChange((tempVisibleCols.filter(id => id !== col.id)));
                      }}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-[#0071E3] shrink-0 disabled:opacity-40"
                    />
                    <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{col.label}</span>
                    {isFixed && <span className="text-[10px] text-orange-500 font-medium shrink-0">固定</span>}
                    {!isFixed && (
                      <button
                        onClick={() => onTempVisibleColsChange((tempVisibleCols.filter(id => id !== col.id)))}
                        className="text-gray-300 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Unselected columns */}
        {unselected.length > 0 && (
          <div className="px-5 pb-4">
            <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 mt-3">可选字段 · {unselected.length}</div>
            <div className="space-y-0.5">
              {unselected.map(col => (
                <label key={col.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition">
                  <span className="w-3.5" />
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => {
                      const actionIdx = tempVisibleCols.indexOf('action');
                      if (actionIdx >= 0) {
                        const next = [...tempVisibleCols];
                        next.splice(actionIdx, 0, col.id);
                        onTempVisibleColsChange(next);
                      } else {
                        onTempVisibleColsChange([...tempVisibleCols, col.id]);
                      }
                    }}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[#0071E3] shrink-0"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
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
            <button
              onClick={() => { onTempVisibleColsChange([...DEFAULT_VISIBLE]); }}
              className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-all"
            >
              恢复默认
            </button>
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
            <button
              onClick={() => { onConfirm(tempVisibleCols); onCloseDrawer(); }}
              className="unified-button-primary bg-[#0071E3] shadow-blue-500/25"
            >
              确 定
            </button>
          </div>
        </div>
      </div>
    </>
  );
});
