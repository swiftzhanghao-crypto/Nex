import React from 'react';
import { Plus, Trash2, Cpu } from 'lucide-react';
import type { AtomicCapability } from '../../../types';
import { cardClass } from './styles';

export interface CompositionEditorProps {
  selectedComponents: AtomicCapability[];
  onOpenPicker: () => void;
  onRemove: (compId: string) => void;
}

const CompositionEditor: React.FC<CompositionEditorProps> = ({
  selectedComponents,
  onOpenPicker,
  onRemove,
}) => (
      <div className={cardClass}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">组件构成</h3>
            <span className="text-xs text-gray-400">({selectedComponents.length})</span>
          </div>
          <button onClick={() => { onOpenPicker(); }} className="unified-button-primary text-xs">
            <Plus className="w-3.5 h-3.5" /> 添加组件
          </button>
        </div>
        {selectedComponents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="unified-table-header">
                <tr>
                  <th className="px-5 py-3 w-10">#</th>
                  <th className="px-5 py-3">组件名称</th>
                  <th className="px-5 py-3">组件编号</th>
                  <th className="px-5 py-3">主版本号</th>
                  <th className="px-5 py-3">组件性质</th>
                  <th className="px-5 py-3">描述</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {selectedComponents.map((c, idx) => (
                  <tr key={c.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">{c.name}</td>
                    <td className="px-6 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">{c.id}</td>
                    <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400">{c.version || '—'}</td>
                    <td className="px-6 py-3 text-xs">
                      {c.nature ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.nature === '自有' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : c.nature === '第三方采购' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                          : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                        }`}>{c.nature}</span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[240px] truncate" title={c.description}>{c.description || '—'}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => onRemove(c.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <Cpu className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <div className="text-sm text-gray-400 dark:text-gray-500 mb-1">暂未添加组件</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">点击右上角按钮从组件池添加组件</div>
          </div>
        )}
      </div>
);

export default CompositionEditor;
