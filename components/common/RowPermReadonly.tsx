import React from 'react';
import { Database, Columns, CheckCircle, Check } from 'lucide-react';
import type { RowLogicConfig } from '../../types';

/* ── 类型 ── */

export interface RowRuleLike {
  id: string;
  resource: string;
  dimension: string;
  operator: string;
  values: string[];
}
export interface DimLike {
  id: string;
  label: string;
  options?: { value: string; label: string }[];
}
export interface ResCfgLike {
  id: string;
  label: string;
  dimensions: DimLike[];
}
export interface ColRuleLike {
  id: string;
  resource: string;
  allowedColumns: string[];
}
export interface ColCfgLike {
  id: string;
  label: string;
  columns: { id: string; label: string }[];
}

/* ── 分组色板 ── */

export const GROUP_COLORS = [
  { bg: 'bg-indigo-50 dark:bg-indigo-900/15', border: 'border-indigo-300 dark:border-indigo-600', text: 'text-indigo-600 dark:text-indigo-400', label: 'A' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/15', border: 'border-emerald-300 dark:border-emerald-600', text: 'text-emerald-600 dark:text-emerald-400', label: 'B' },
  { bg: 'bg-rose-50 dark:bg-rose-900/15', border: 'border-rose-300 dark:border-rose-600', text: 'text-rose-600 dark:text-rose-400', label: 'C' },
];

/* ── 纯函数 ── */

export function getDimOp(
  logic: Record<string, RowLogicConfig> | undefined,
  resource: string,
  ruleId: string,
): 'AND' | 'OR' {
  return logic?.[resource]?.dimOperators?.[ruleId] || 'AND';
}

export function getGroupIdx(
  logic: Record<string, RowLogicConfig> | undefined,
  resource: string,
  ruleId: string,
): number {
  const groups = logic?.[resource]?.dimGroups || [];
  return groups.findIndex(g => g.dims.includes(ruleId));
}

export function buildFormula(
  rules: RowRuleLike[],
  logic: Record<string, RowLogicConfig> | undefined,
  resource: string,
  resCfg: ResCfgLike,
  getValLabel: (dim: string, val: string) => string,
): string {
  if (rules.length === 0) return '全部可见';
  if (rules.length === 1) {
    const r = rules[0];
    const dl = resCfg.dimensions.find(d => d.id === r.dimension)?.label || r.dimension;
    const vs = r.values.map(v => getValLabel(r.dimension, v)).join(', ');
    return `${dl} ${r.operator === 'contains' ? '包含' : '='} [${vs || '?'}]`;
  }
  const groups = logic?.[resource]?.dimGroups || [];
  const groupedIds = new Set(groups.flatMap(g => g.dims));
  const ungrouped = rules.filter(r => !groupedIds.has(r.id));
  const parts: string[] = [];
  for (const r of ungrouped) {
    const dl = resCfg.dimensions.find(d => d.id === r.dimension)?.label || r.dimension;
    const vs = r.values.map(v => getValLabel(r.dimension, v)).join(', ');
    parts.push(`${dl} ${r.operator === 'contains' ? '包含' : '='} [${vs || '?'}]`);
  }
  for (const grp of groups) {
    const ids = grp.dims.filter(d => rules.some(r => r.id === d));
    if (ids.length === 0) continue;
    const inner = ids.map(rid => {
      const r = rules.find(rr => rr.id === rid);
      if (!r) return '?';
      const dl = resCfg.dimensions.find(d => d.id === r.dimension)?.label || r.dimension;
      const vs = r.values.map(v => getValLabel(r.dimension, v)).join(', ');
      return `${dl} ${r.operator === 'contains' ? '包含' : '='} [${vs || '?'}]`;
    });
    parts.push(`(${inner.join(' OR ')})`);
  }
  return parts.join(' AND ');
}

/* ── UI 组件 ── */

export function FormulaBar({ formula }: { formula: string }) {
  return (
    <div className="px-4 py-2 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-purple-50/80 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10 border-b border-gray-100 dark:border-white/10">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider shrink-0">公式</span>
        <div className="text-[11px] font-mono font-semibold flex flex-wrap items-center gap-x-1 gap-y-0.5">
          {formula.split(/(\(|\)|AND|OR)/).filter(Boolean).map((token, ti) => {
            const t = token.trim();
            if (!t) return null;
            if (t === '(' || t === ')') return <span key={ti} className="text-sm font-extrabold text-indigo-500 dark:text-indigo-400 mx-0.5 leading-none">{t}</span>;
            if (t === 'AND') return <span key={ti} className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-extrabold tracking-wider">{t}</span>;
            if (t === 'OR') return <span key={ti} className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-extrabold tracking-wider">{t}</span>;
            return <span key={ti} className="text-indigo-700 dark:text-indigo-300">{t}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * 行权限只读展示：完整渲染某个 resource 下的规则列表，含公式栏、AND/OR 分隔与分组色条。
 */
export const RowPermResourceBlock: React.FC<{
  resCfg: ResCfgLike;
  rules: RowRuleLike[];
  logic: Record<string, RowLogicConfig> | undefined;
  getValLabel: (dim: string, val: string) => string;
}> = ({ resCfg, rules, logic, getValLabel }) => {
  const formula = buildFormula(rules, logic, resCfg.id, resCfg, getValLabel);
  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/60 dark:bg-amber-900/10">
        <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{resCfg.label}</span>
        <span className="text-xs text-amber-500 ml-auto">{rules.length} 条规则</span>
      </div>
      {rules.length >= 2 && formula && <FormulaBar formula={formula} />}
      <div className="bg-white dark:bg-[#1C1C1E]">
        {rules.map((rule, ruleIdx) => {
          const dimCfg = resCfg.dimensions.find(d => d.id === rule.dimension);
          const op = ruleIdx > 0 ? getDimOp(logic, resCfg.id, rule.id) : null;
          const gIdx = getGroupIdx(logic, resCfg.id, rule.id);
          const gColor = gIdx >= 0 ? GROUP_COLORS[gIdx % GROUP_COLORS.length] : null;
          return (
            <React.Fragment key={rule.id}>
              {op && (
                <div className="flex items-center gap-2 px-4 py-0.5">
                  <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10" />
                  <span className={`text-[10px] font-extrabold tracking-wider ${op === 'OR' ? 'text-amber-500 dark:text-amber-400' : 'text-blue-500 dark:text-blue-400'}`}>{op}</span>
                  <div className="flex-1 border-t border-dashed border-gray-200 dark:border-white/10" />
                </div>
              )}
              <div className={`flex items-center gap-3 px-4 py-2.5 ${gColor ? `border-l-[3px] ${gColor.border} ${gColor.bg}` : ''}`}>
                {gColor && <span className={`text-[9px] font-extrabold ${gColor.text}`}>{gColor.label}</span>}
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 min-w-[64px]">{dimCfg?.label || rule.dimension}</span>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">{rule.operator === 'contains' ? '包含' : '等于'}</span>
                <div className="flex flex-wrap gap-1.5">
                  {rule.values.length > 0 ? rule.values.map(v => (
                    <span key={v} className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-100 dark:border-amber-800/30">{getValLabel(rule.dimension, v)}</span>
                  )) : (
                    <span className="text-xs text-gray-400 italic">未指定值</span>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 列权限只读展示：某个 resource 下的可见/不可见列。
 */
export const ColPermResourceBlock: React.FC<{
  colCfg: ColCfgLike;
  rule: ColRuleLike;
}> = ({ colCfg, rule }) => (
  <div className="rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50/50 dark:bg-purple-900/10">
      <Columns className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
      <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{colCfg.label}</span>
      <span className="text-xs text-purple-500 ml-auto">{rule.allowedColumns.length}/{colCfg.columns.length} 列可见</span>
    </div>
    <div className="p-3 space-y-2">
      {colCfg.columns.map(col => {
        const allowed = rule.allowedColumns.includes(col.id);
        return (
          <div key={col.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${allowed ? 'bg-purple-50 dark:bg-purple-900/15 border-purple-200 dark:border-purple-800/40' : 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/10'}`}>
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${allowed ? 'bg-purple-500 border-purple-500' : 'border-gray-300 dark:border-gray-600'}`}>
              {allowed && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <span className={`text-sm font-medium ${allowed ? 'text-purple-700 dark:text-purple-300' : 'text-gray-400 dark:text-gray-500 line-through'}`}>{col.label}</span>
            {allowed && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 font-bold">可见</span>}
          </div>
        );
      })}
    </div>
  </div>
);
