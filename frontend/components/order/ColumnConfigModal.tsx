import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';

export interface ColumnDef {
  id: string;
  label: string;
}

interface ColumnConfigModalProps {
  allColumns: ColumnDef[];
  initialVisible: string[];
  defaultVisible: string[];
  fixedColumns: Set<string>;
  onClose: () => void;
  onConfirm: (columns: string[]) => void;
}

const ColumnConfigModal: React.FC<ColumnConfigModalProps> = ({
  allColumns, initialVisible, defaultVisible, fixedColumns, onClose, onConfirm,
}) => {
  const [tempVisible, setTempVisible] = useState<string[]>(initialVisible);
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');
  const [leftChecked, setLeftChecked] = useState<Set<string>>(new Set());
  const [rightChecked, setRightChecked] = useState<Set<string>>(new Set());
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const availableCols = useMemo(
    () => allColumns.filter(c => !tempVisible.includes(c.id) && !fixedColumns.has(c.id)),
    [allColumns, tempVisible, fixedColumns],
  );
  const displayCols = useMemo(
    () => tempVisible.map(id => allColumns.find(c => c.id === id)!).filter(Boolean),
    [allColumns, tempVisible],
  );

  const filteredAvailable = useMemo(
    () => availableCols.filter(c => !leftSearch || c.label.includes(leftSearch)),
    [availableCols, leftSearch],
  );
  const filteredDisplay = useMemo(
    () => displayCols.filter(c => !rightSearch || c.label.includes(rightSearch)),
    [displayCols, rightSearch],
  );

  const addToDisplay = () => {
    if (leftChecked.size === 0) return;
    setTempVisible(prev => [...prev.filter(id => id !== 'action'), ...Array.from(leftChecked), 'action'].filter((v, i, a) => a.indexOf(v) === i));
    setLeftChecked(new Set());
  };
  const removeFromDisplay = () => {
    if (rightChecked.size === 0) return;
    setTempVisible(prev => prev.filter(id => !rightChecked.has(id)));
    setRightChecked(new Set());
  };
  const toggleLeftCheck = (id: string) =>
    setLeftChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleRightCheck = (id: string) => {
    if (fixedColumns.has(id)) return;
    setRightChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleLeftAll = () => {
    const ids = filteredAvailable.map(c => c.id);
    setLeftChecked(prev => prev.size === ids.length ? new Set() : new Set(ids));
  };
  const toggleRightAll = () => {
    const ids = filteredDisplay.filter(c => !fixedColumns.has(c.id)).map(c => c.id);
    setRightChecked(prev => prev.size === ids.length ? new Set() : new Set(ids));
  };
  const invertLeft = () => {
    const ids = filteredAvailable.map(c => c.id);
    setLeftChecked(prev => new Set(ids.filter(id => !prev.has(id))));
  };
  const removeOneFromDisplay = (id: string) => {
    if (fixedColumns.has(id)) return;
    setTempVisible(prev => prev.filter(x => x !== id));
    setRightChecked(prev => { const n = new Set(prev); n.delete(id); return n; });
  };
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const arr = [...tempVisible];
    const [item] = arr.splice(dragIdx, 1);
    arr.splice(idx, 0, item);
    setTempVisible(arr);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);
  const restoreDefault = () => {
    setTempVisible([...defaultVisible]);
    setLeftChecked(new Set());
    setRightChecked(new Set());
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-[720px] flex flex-col animate-modal-enter border border-gray-200/50 dark:border-white/10" onClick={e => e.stopPropagation()}>
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">请选择列字段</h3>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-stretch p-5 gap-4" style={{ minHeight: 380 }}>
            {/* Left: Available */}
            <div className="flex-1 flex flex-col border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={leftChecked.size > 0 && leftChecked.size === filteredAvailable.length} onChange={toggleLeftAll} className="w-3.5 h-3.5 rounded border-gray-300 text-[#0071E3]" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">可用字段</span>
                </div>
                <button onClick={invertLeft} className="text-[11px] text-[#0071E3] dark:text-[#0A84FF] font-medium hover:underline">反选</button>
              </div>
              <div className="px-3 py-2 border-b border-gray-50 dark:border-white/5 shrink-0">
                <input type="text" value={leftSearch} onChange={e => setLeftSearch(e.target.value)} placeholder="请输入搜索内容" className="w-full text-xs px-2.5 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-black outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:border-blue-300" />
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-1">
                {filteredAvailable.length > 0 ? filteredAvailable.map(col => (
                  <label key={col.id} className="flex items-center gap-2 px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer transition">
                    <input type="checkbox" checked={leftChecked.has(col.id)} onChange={() => toggleLeftCheck(col.id)} className="w-3.5 h-3.5 rounded border-gray-300 text-[#0071E3]" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{col.label}</span>
                  </label>
                )) : (
                  <div className="text-xs text-gray-400 text-center py-6">无可用字段</div>
                )}
              </div>
            </div>

            {/* Middle: Arrows */}
            <div className="flex flex-col items-center justify-center gap-2 shrink-0">
              <button onClick={addToDisplay} disabled={leftChecked.size === 0} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition whitespace-nowrap">
                添加 →
              </button>
              <button onClick={removeFromDisplay} disabled={rightChecked.size === 0} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2C2C2E] text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition whitespace-nowrap">
                ← 移除
              </button>
            </div>

            {/* Right: Display */}
            <div className="flex-1 flex flex-col border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={rightChecked.size > 0 && rightChecked.size === filteredDisplay.filter(c => !fixedColumns.has(c.id)).length} onChange={toggleRightAll} className="w-3.5 h-3.5 rounded border-gray-300 text-[#0071E3]" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">显示字段</span>
                </div>
                <button onClick={restoreDefault} className="text-[11px] text-[#0071E3] dark:text-[#0A84FF] font-medium hover:underline">恢复默认</button>
              </div>
              <div className="px-3 py-2 border-b border-gray-50 dark:border-white/5 shrink-0">
                <input type="text" value={rightSearch} onChange={e => setRightSearch(e.target.value)} placeholder="请输入搜索内容" className="w-full text-xs px-2.5 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-black outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:border-blue-300" />
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar px-1 py-1">
                {filteredDisplay.length > 0 ? filteredDisplay.map((col) => {
                  const isFixed = fixedColumns.has(col.id);
                  const tIdx = tempVisible.indexOf(col.id);
                  return (
                    <div
                      key={col.id}
                      draggable={!isFixed}
                      onDragStart={() => handleDragStart(tIdx)}
                      onDragOver={e => handleDragOver(e, tIdx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg transition group ${dragIdx === tIdx ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                    >
                      <span className={`cursor-grab text-gray-300 dark:text-gray-600 ${isFixed ? 'invisible' : ''}`}>☰</span>
                      <input type="checkbox" checked={rightChecked.has(col.id)} onChange={() => toggleRightCheck(col.id)} disabled={isFixed} className="w-3.5 h-3.5 rounded border-gray-300 text-[#0071E3] disabled:opacity-40" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{col.label}</span>
                      {isFixed ? (
                        <span className="text-[10px] text-orange-500 font-medium">(系统字段)</span>
                      ) : (
                        <button onClick={() => removeOneFromDisplay(col.id)} className="text-[11px] text-red-400 hover:text-red-600 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition font-medium">移除</button>
                      )}
                    </div>
                  );
                }) : (
                  <div className="text-xs text-gray-400 text-center py-6">无显示字段</div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition">取 消</button>
            <button onClick={() => onConfirm(tempVisible)} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-[#0071E3] hover:bg-[#0060C0] dark:bg-[#0A84FF] dark:hover:bg-[#007AEB] transition">确 定</button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default React.memo(ColumnConfigModal);
