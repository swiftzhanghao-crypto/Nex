/**
 * 业务平台前端组件库 — 统一出口
 *
 * 使用示例：
 *   import { Button, Card, Badge, Input, Modal, Table } from '../ui';
 *
 * 设计令牌：
 *   import { cn, cls, colors, tagClassMap } from '../ui/theme';
 */

// ── 设计令牌 & 工具 ──────────────────────────────────────
export { cn, cls, colors, tagClassMap } from './theme';
export type { TagColor } from './theme';

// ── 按钮 ──────────────────────────────────────────────────
export { default as Button } from './Button';
export type { ButtonVariant, ButtonSize } from './Button';

// ── 卡片 ──────────────────────────────────────────────────
export { Card, CollapsibleCard } from './Card';

// ── 标签 / 徽章 ──────────────────────────────────────────
export { default as Badge } from './Badge';

// ── 表单控件 ──────────────────────────────────────────────
export { Input, Select, SearchField, Textarea } from './Input';

// ── 模态框 / 抽屉 / 确认框 ──────────────────────────────
export { Modal, Drawer, ConfirmDialog } from './Modal';

// ── 表格 ──────────────────────────────────────────────────
export { Table, TableHead, TableBody, TableRow, Th, Td, EmptyState, Pagination } from './Table';
