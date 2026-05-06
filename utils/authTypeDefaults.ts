/**
 * 授权类型默认单位推断（与"系统配置-授权类型管理"保持一致）。
 * 当后端/Context 未显式提供 purchaseUnit / auxPurchaseUnit 时，按名称智能推断默认值。
 */

export function inferDefaultPurchaseUnit(name: string): string {
  if (!name) return '套';
  if (name.includes('场地') || name.includes('服务器')) return '台';
  return '套';
}

export function inferDefaultAuxPurchaseUnit(name: string, period?: string): string {
  // 仅周期性授权类型支持辅助购买单位
  if (period && period !== '周期性') return '';
  if (!name) return '';
  if (name.includes('用户')) return '用户数';
  if (name.includes('并发')) return '并发数';
  if (name.includes('场地')) return '点';
  if (name.includes('字数') || name.includes('额度')) return '额度';
  if (name.includes('次数') || name.includes('计次')) return '次';
  return '';
}

/**
 * 解析授权类型的有效购买单位：优先用显式配置，否则按名称推断。
 */
export function resolvePurchaseUnit(at: { name: string; purchaseUnit?: string }): string {
  return at.purchaseUnit || inferDefaultPurchaseUnit(at.name);
}

/**
 * 解析授权类型的有效辅助购买单位：优先用显式配置，否则按名称+周期性推断。
 * 非周期性始终返回空。
 */
export function resolveAuxPurchaseUnit(at: { name: string; period?: string; auxPurchaseUnit?: string }): string {
  if (at.period && at.period !== '周期性') return '';
  return at.auxPurchaseUnit || inferDefaultAuxPurchaseUnit(at.name, at.period);
}
