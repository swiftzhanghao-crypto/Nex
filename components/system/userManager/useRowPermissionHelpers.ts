import { useCallback } from 'react';
import type {
  PermissionDimension,
  RoleDefinition,
  Department,
  Channel,
} from '../../../types';
import {
  resourceConfig,
  resourceFunctionalPermMap,
  getRequiredPermIdsForResource,
} from '../permissionConfig';

/**
 * 行权限展示侧的辅助函数（维度选项列表、可读值、公式展示等）。
 */
export function useRowPermissionHelpers(
  roleForm: Partial<RoleDefinition>,
  departments: Department[],
  channels: Channel[],
  users: { id: string; name: string; departmentId?: string }[],
) {
  const getDepartmentPath = useCallback(
    (deptId: string): string => {
      const dept = departments.find(d => d.id === deptId);
      if (!dept) return deptId;
      if (dept.parentId) return getDepartmentPath(dept.parentId) + ' / ' + dept.name;
      return dept.name;
    },
    [departments],
  );

  const getDimensionOptions = useCallback(
    (dim: PermissionDimension) => {
      if (dim === 'departmentId') {
        return departments.map(d => ({ value: d.id, label: d.name }));
      }
      if (dim === 'salesRep' || dim === 'businessManager' || dim === 'creator') {
        return users.map(u => ({ value: u.id, label: u.name }));
      }
      if (dim === 'province') {
        return [
          '北京',
          '上海',
          '广东',
          '浙江',
          '江苏',
          '四川',
          '湖北',
          '湖南',
          '山东',
          '河南',
          '福建',
          '安徽',
          '重庆',
          '天津',
          '河北',
          '辽宁',
          '吉林',
          '黑龙江',
          '陕西',
          '山西',
          '甘肃',
          '青海',
          '内蒙古',
          '广西',
          '贵州',
          '云南',
          '西藏',
          '海南',
          '新疆',
          '宁夏',
          '江西',
        ].map(p => ({ value: p, label: p }));
      }
      if (dim === 'industryLine') {
        return [
          '互联网',
          '金融',
          '教育',
          '制造',
          '政府',
          '医疗',
          '零售',
          '能源',
          '交通',
          '房地产',
        ].map(i => ({ value: i, label: i }));
      }
      if (dim === 'directChannelId') {
        return channels.map(c => ({ value: c.id, label: c.name }));
      }
      if (dim === 'orderType' || dim === 'orderSource') {
        return [
          { value: 'Sales', label: '后台下单' },
          { value: 'OnlineStore', label: '官网' },
          { value: 'ChannelPortal', label: '渠道来源' },
          { value: 'APISync', label: '三方平台' },
          { value: 'Renewal', label: '续费' },
        ];
      }
      if (dim === 'orderStatus') {
        return [
          { value: 'DRAFT', label: '草稿' },
          { value: 'PENDING_APPROVAL', label: '待审批' },
          { value: 'PENDING_CONFIRM', label: '待确认' },
          { value: 'PROCESSING_PROD', label: '备货中' },
          { value: 'PENDING_PAYMENT', label: '待支付' },
          { value: 'SHIPPED', label: '已发货' },
          { value: 'DELIVERED', label: '已完成' },
          { value: 'CANCELLED', label: '已取消' },
          { value: 'REFUND_PENDING', label: '退款中' },
          { value: 'REFUNDED', label: '已退款' },
        ];
      }
      if (dim === 'buyerType') {
        return [
          { value: 'Customer', label: '直签订单' },
          { value: 'Channel', label: '渠道订单' },
          { value: 'SelfDeal', label: '自成交订单' },
        ];
      }
      if (dim === 'channelId') {
        return channels.map(c => ({ value: c.id, label: c.name }));
      }
      if (dim === 'customerIndustry') {
        return ['互联网', '金融', '教育', '制造', '政府', '医疗', '零售'].map(i => ({
          value: i,
          label: i,
        }));
      }
      if (dim === 'productId') {
        return [
          { value: 'wps-office', label: 'WPS Office' },
          { value: 'wps-365', label: 'WPS 365' },
          { value: 'wps-ai', label: 'WPS AI' },
        ];
      }
      if (dim === 'customerLevel') {
        return ['KA', 'SMB', 'Enterprise'].map(l => ({ value: l, label: l }));
      }
      return [];
    },
    [departments, users, channels],
  );

  const getReadableValue = useCallback(
    (dim: PermissionDimension, val: string) => {
      const options = getDimensionOptions(dim);
      return options.find(o => o.value === val)?.label || val;
    },
    [getDimensionOptions],
  );

  const hasResourceFunctionalPerm = useCallback(
    (resourceId: string): boolean => {
      const perms = roleForm.permissions || [];
      if (perms.includes('all')) return true;
      const requiredIds = getRequiredPermIdsForResource(resourceId);
      if (requiredIds.length === 0) return true;
      return requiredIds.some(id => perms.includes(id));
    },
    [roleForm.permissions],
  );

  const getResourcePermHint = useCallback((resourceId: string): string => {
    return resourceFunctionalPermMap[resourceId]?.hint || '';
  }, []);

  const getEnabledDimsForResource = useCallback(
    (resource: string) => {
      return (
        resourceConfig
          .find(r => r.id === resource)
          ?.dimensions.filter(d =>
            roleForm.rowPermissions?.some(r => r.resource === resource && r.dimension === d.id),
          ) || []
      );
    },
    [roleForm.rowPermissions],
  );

  const getRuleGroup = useCallback(
    (resource: string, ruleId: string) => {
      const groups = roleForm.rowLogic?.[resource]?.dimGroups || [];
      return groups.find(g => g.dims.includes(ruleId));
    },
    [roleForm.rowLogic],
  );

  const getRuleGroupIndex = useCallback(
    (resource: string, ruleId: string): number => {
      const groups = roleForm.rowLogic?.[resource]?.dimGroups || [];
      return groups.findIndex(g => g.dims.includes(ruleId));
    },
    [roleForm.rowLogic],
  );

  const buildFormulaDisplay = useCallback(
    (resource: string): string => {
      const rules = (roleForm.rowPermissions || []).filter(r => r.resource === resource);
      if (rules.length === 0) return '全部可见';
      if (rules.length === 1) {
        const dimCfg = resourceConfig
          .find(rc => rc.id === resource)
          ?.dimensions.find(d => d.id === rules[0].dimension);
        const label = dimCfg?.label || rules[0].dimension;
        const vals = rules[0].values
          .map(v => getReadableValue(rules[0].dimension, v))
          .join(', ');
        return `${label} ${rules[0].operator === 'contains' ? '包含' : '='} [${vals || '?'}]`;
      }
      const groups = roleForm.rowLogic?.[resource]?.dimGroups || [];
      const groupedRuleIds = new Set(groups.flatMap(g => g.dims));
      const ungrouped = rules.filter(r => !groupedRuleIds.has(r.id));
      const parts: string[] = [];
      for (const rule of ungrouped) {
        const dimCfg = resourceConfig
          .find(rc => rc.id === resource)
          ?.dimensions.find(d => d.id === rule.dimension);
        const label = dimCfg?.label || rule.dimension;
        const vals = rule.values.map(v => getReadableValue(rule.dimension, v)).join(', ');
        const op = rule.operator === 'contains' ? '包含' : '=';
        parts.push(`${label} ${op} [${vals || '?'}]`);
      }
      for (const grp of groups) {
        const grpRuleIds = grp.dims.filter(d => rules.some(r => r.id === d));
        if (grpRuleIds.length === 0) continue;
        const innerParts = grpRuleIds.map((rid, i) => {
          const r = rules.find(rr => rr.id === rid);
          if (!r) return '?';
          const dCfg = resourceConfig
            .find(rc => rc.id === resource)
            ?.dimensions.find(d => d.id === r.dimension);
          const l = dCfg?.label || r.dimension;
          const vs = r.values.map(v => getReadableValue(r.dimension, v)).join(', ');
          const rOp = r.operator === 'contains' ? '包含' : '=';
          return `${l} ${rOp} [${vs || '?'}]`;
        });
        parts.push(`(${innerParts.join(' OR ')})`);
      }
      return parts.join(' AND ');
    },
    [roleForm.rowPermissions, roleForm.rowLogic, getReadableValue],
  );

  const buildDeptTree = useCallback(
    (parentId?: string): Array<{ dept: Department; children: any[] }> => {
      return departments
        .filter(d => (d.parentId || undefined) === parentId)
        .map(d => ({ dept: d, children: buildDeptTree(d.id) }));
    },
    [departments],
  );

  return {
    getDepartmentPath,
    getDimensionOptions,
    getReadableValue,
    hasResourceFunctionalPerm,
    getResourcePermHint,
    getEnabledDimsForResource,
    getRuleGroup,
    getRuleGroupIndex,
    buildFormulaDisplay,
    buildDeptTree,
  };
}
