/**
 * Design Tokens — 业务平台统一设计令牌
 *
 * Apple 风格设计体系：大圆角 + 轻阴影 + 系统字体 + 蓝/红双轨主色
 * 所有组件应从此处引用色值与样式常量，避免在业务代码中硬编码。
 */

// ── 色彩系统 ──────────────────────────────────────────────

export const colors = {
  primary:      '#0071E3',
  primaryDark:  '#0A84FF',
  primaryHover: '#0060C0',
  accent:       '#FF2D55',
  accentHover:  '#FF2D55CC',

  canvas:       '#F5F5F7',
  canvasDark:   '#000000',
  surface:      '#FFFFFF',
  surfaceDark:  '#1C1C1E',
  surfaceDark2: '#2C2C2E',

  text:         '#1D1D1F',
  textDark:     '#F5F5F7',
  secondary:    '#86868B',
} as const;

// ── 样式类名常量（对应 Tailwind 实用类组合） ──────────────

export const cls = {
  card: 'unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10',

  tableHeader: 'unified-table-header',

  inputBase: [
    'w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10',
    'rounded-xl outline-none text-sm text-gray-900 dark:text-white',
    'focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition',
  ].join(' '),

  inputLg: 'p-3',
  inputMd: 'px-3 py-2',
  inputSm: 'h-9 px-3 rounded-lg',

  selectBase: [
    'w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10',
    'rounded-xl outline-none text-sm text-gray-900 dark:text-white',
    'focus:ring-2 focus:ring-[#0071E3] dark:focus:ring-[#FF2D55] transition',
  ].join(' '),

  searchField: [
    'flex items-center bg-gray-50 dark:bg-white/5',
    'border border-gray-200 dark:border-white/10 rounded-xl h-9',
    'focus-within:border-blue-400 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]',
    'transition-all',
  ].join(' '),

  overlay: 'fixed inset-0 bg-black/40 backdrop-blur-sm z-[500] flex items-center justify-center p-4 animate-fade-in',
  drawerOverlay: 'fixed inset-0 z-[500] flex justify-end',

  modalContent: 'bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl animate-modal-enter',
  drawerContent: 'bg-white dark:bg-[#1C1C1E] border-l border-gray-200 dark:border-white/10 shadow-2xl animate-drawer-enter',

  emptyState: 'py-16 text-center text-sm text-gray-400 dark:text-gray-500',
} as const;

// ── Tag 颜色映射 ─────────────────────────────────────────

export type TagColor = 'blue' | 'green' | 'orange' | 'gray' | 'indigo' | 'red' | 'purple' | 'yellow' | 'amber' | 'teal' | 'pink';

export const tagClassMap: Record<TagColor, string> = {
  blue:   'unified-tag-blue',
  green:  'unified-tag-green',
  orange: 'unified-tag-orange',
  gray:   'unified-tag-gray',
  indigo: 'unified-tag-indigo',
  red:    'unified-tag-red',
  purple: 'unified-tag-purple',
  yellow: 'unified-tag-yellow',
  amber:  'unified-tag-amber',
  teal:   'unified-tag-teal',
  pink:   'unified-tag-pink',
};

// ── 工具函数 ─────────────────────────────────────────────

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
