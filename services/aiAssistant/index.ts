/**
 * AI 业务助手 — 统一导出
 */
export type {
  SkillId,
  SkillRouteResult,
  ChatMessage,
  SkillDefinition,
  DataScope,
  SkillModule,
  PageContext,
  PageType,
} from './types';

export { SKILL_LABELS } from './types';

export { routeSkill, executeSkill, isAIConfigured } from './skillRouter';

export {
  getSkillModule,
  getFilteredData,
  buildSkillContext,
  parsePageContext,
} from './dataProvider';

export type { AppDataSnapshot } from './dataProvider';
