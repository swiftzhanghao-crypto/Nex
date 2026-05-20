import type { RoleDefinition } from '../../../types';
import { resourceConfig } from '../permissionConfig';

export function buildFormulaDisplay(
  resource: string,
  roleForm: Partial<RoleDefinition>,
  getDimOperator: (resource: string, ruleId: string) => 'AND' | 'OR',
): string {
  const rules = (roleForm.rowPermissions || []).filter(r => r.resource === resource);
  if (rules.length === 0) return '';
  if (rules.length === 1) {
    const dimCfg = resourceConfig.find(rc => rc.id === resource)?.dimensions.find(d => d.id === rules[0].dimension);
    return dimCfg?.label || rules[0].dimension;
  }
  const groups = roleForm.rowLogic?.[resource]?.dimGroups || [];
  const ruleToGroup = new Map<string, string>();
  groups.forEach(g => g.dims.forEach(rid => ruleToGroup.set(rid, g.id)));
  const groupSegments = new Map<string, string[]>();
  const topLevelParts: { type: 'rule' | 'group'; content: string; ruleId: string }[] = [];
  const processedGroups = new Set<string>();
  rules.forEach((rule) => {
    const dimCfg = resourceConfig.find(rc => rc.id === resource)?.dimensions.find(d => d.id === rule.dimension);
    const label = dimCfg?.label || rule.dimension;
    const groupId = ruleToGroup.get(rule.id) || null;
    if (groupId) {
      if (!groupSegments.has(groupId)) groupSegments.set(groupId, []);
      groupSegments.get(groupId)!.push(rule.id);
      if (!processedGroups.has(groupId)) {
        processedGroups.add(groupId);
        topLevelParts.push({ type: 'group', content: groupId, ruleId: rule.id });
      }
    } else {
      topLevelParts.push({ type: 'rule', content: label, ruleId: rule.id });
    }
  });
  return topLevelParts.map((part, idx) => {
    let prefix = '';
    if (idx > 0) {
      const firstRuleIdOfPart = part.type === 'group' ? groupSegments.get(part.content)![0] : part.ruleId;
      prefix = ` ${getDimOperator(resource, firstRuleIdOfPart)} `;
    }
    if (part.type === 'rule') return prefix + part.content;
    const grpRuleIds = groupSegments.get(part.content) || [];
    const innerParts = grpRuleIds.map((rid: string, i: number) => {
      const r = rules.find(rr => rr.id === rid);
      if (!r) return '?';
      const dCfg = resourceConfig.find(rc => rc.id === resource)?.dimensions.find(d => d.id === r.dimension);
      const lbl = dCfg?.label || r.dimension;
      if (i === 0) return lbl;
      return `${getDimOperator(resource, rid)} ${lbl}`;
    });
    return `${prefix}( ${innerParts.join(' ')} )`;
  }).join('');
}
