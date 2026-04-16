import React, { useMemo } from 'react';
import type { PurchaseNature, SubscriptionOrderRef } from '../../types';

const SPINE_LABEL: Record<Exclude<PurchaseNature, 'AddOn'>, { label: string; accent: string; soft: string }> = {
  New: { label: '新购', accent: 'text-blue-700 dark:text-blue-300', soft: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  Renewal: { label: '续费', accent: 'text-emerald-700 dark:text-emerald-300', soft: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  Upgrade: { label: '升级', accent: 'text-amber-800 dark:text-amber-300', soft: 'bg-amber-500/12 text-amber-800 dark:text-amber-300' },
};

const ADDON_META = {
  label: '增购',
  accent: 'text-violet-800 dark:text-violet-200',
  soft: 'bg-violet-500/10 text-violet-800 dark:text-violet-200',
  pill: '增',
} as const;

function fmtMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`;
}

export interface SubscriptionOrderChainProps {
  relatedOrders: SubscriptionOrderRef[];
  onOrderClick: (orderId: string) => void;
}

function orderRefSort(a: SubscriptionOrderRef, b: SubscriptionOrderRef): number {
  if (a.orderDate !== b.orderDate) return a.orderDate.localeCompare(b.orderDate);
  return a.orderId.localeCompare(b.orderId);
}

/**
 * 主干（新购/续费/升级）横向演进；增购挂在对应主干下。卡片为横向宽条，减少竖向占位。
 */
export function SubscriptionOrderChain({ relatedOrders, onOrderClick }: SubscriptionOrderChainProps) {
  const { spine, addOnsByAnchor, orphanAddOns } = useMemo(() => {
    const spineList = relatedOrders.filter(r => r.purchaseNature !== 'AddOn');
    const anchorIds = new Set(spineList.map(s => s.orderId));
    const byAnchor: Record<string, SubscriptionOrderRef[]> = {};
    const orphans: SubscriptionOrderRef[] = [];

    for (const r of relatedOrders) {
      if (r.purchaseNature !== 'AddOn') continue;
      const aid = r.relatesToOrderId;
      if (aid && anchorIds.has(aid)) {
        if (!byAnchor[aid]) byAnchor[aid] = [];
        byAnchor[aid].push(r);
      } else {
        orphans.push(r);
      }
    }
    for (const k of Object.keys(byAnchor)) {
      byAnchor[k].sort(orderRefSort);
    }
    orphans.sort(orderRefSort);
    return { spine: spineList, addOnsByAnchor: byAnchor, orphanAddOns: orphans };
  }, [relatedOrders]);

  if (relatedOrders.length === 0) return null;

  function renderSpineCard(ref: SubscriptionOrderRef, step: number) {
    const meta = SPINE_LABEL[ref.purchaseNature as Exclude<PurchaseNature, 'AddOn'>] ?? {
      label: ref.purchaseNature,
      accent: 'text-gray-800 dark:text-gray-200',
      soft: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
    };
    const lic =
      ref.licenseStartDate && ref.licenseEndDate
        ? `${ref.licenseStartDate} → ${ref.licenseEndDate}`
        : null;
    return (
      <button
        type="button"
        role="listitem"
        onClick={() => onOrderClick(ref.orderId)}
        title={
          lic
            ? `${ref.orderId} · 授权 ${lic} · ${fmtMoney(ref.amount)}`
            : `${ref.orderId} · ${fmtMoney(ref.amount)}`
        }
        className="group flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-gray-200/90 bg-white px-2.5 py-2 text-left shadow-sm transition hover:border-[#0071E3]/40 hover:shadow dark:border-white/10 dark:bg-[#2C2C2E] dark:hover:border-[#0A84FF]/40"
      >
        <span className={`shrink-0 text-[11px] font-bold leading-none ${meta.accent}`}>{meta.label}</span>
        <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold tabular-nums leading-none ${meta.soft}`}>{step}</span>
        {ref.productName ? (
          <span className="min-w-0 max-w-[6.5rem] shrink truncate text-[9px] font-medium text-gray-500 dark:text-gray-400" title={ref.productName}>
            {ref.productName}
          </span>
        ) : null}
        <span className="hidden h-3 w-px shrink-0 bg-gray-200 sm:block dark:bg-white/15" aria-hidden />
        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-gray-900 dark:text-white">{ref.quantity} 席</span>
        <span className="shrink-0 text-[10px] font-medium tabular-nums text-gray-500 dark:text-gray-400">{fmtMoney(ref.amount)}</span>
        {lic && (
          <>
            <span className="hidden shrink-0 text-gray-300 sm:inline dark:text-gray-600" aria-hidden>
              ·
            </span>
            <span className="min-w-0 text-[10px] font-medium tabular-nums leading-none text-gray-600 dark:text-gray-400">{lic}</span>
          </>
        )}
        <span className="min-w-0 flex-1 basis-full truncate pl-0 font-mono text-[9px] font-semibold leading-none text-[#0071E3] group-hover:underline sm:basis-[min(40%,12rem)] sm:pl-1 dark:text-[#0A84FF]" title={ref.orderId}>
          {ref.orderId}
        </span>
      </button>
    );
  }

  function renderAddOnRow(ref: SubscriptionOrderRef) {
    const lic =
      ref.licenseStartDate && ref.licenseEndDate
        ? `${ref.licenseStartDate} → ${ref.licenseEndDate}`
        : null;
    return (
      <button
        key={ref.orderId}
        type="button"
        onClick={() => onOrderClick(ref.orderId)}
        title={lic ? `${ref.orderId} · 授权 ${lic} · ${fmtMoney(ref.amount)}` : `${ref.orderId} · ${fmtMoney(ref.amount)}`}
        className="group flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-violet-200/80 bg-violet-50/70 px-2.5 py-1.5 text-left shadow-sm transition hover:border-violet-300 dark:border-violet-800/45 dark:bg-violet-950/30 dark:hover:border-violet-600/50"
      >
        <span className={`shrink-0 text-[11px] font-bold leading-none ${ADDON_META.accent}`}>{ADDON_META.label}</span>
        <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold ${ADDON_META.soft}`}>{ADDON_META.pill}</span>
        {ref.productName ? (
          <span className="min-w-0 max-w-[6.5rem] shrink truncate text-[9px] font-medium text-violet-900/80 dark:text-violet-200/80" title={ref.productName}>
            {ref.productName}
          </span>
        ) : null}
        <span className="hidden h-3 w-px shrink-0 bg-violet-200 sm:block dark:bg-violet-800/50" aria-hidden />
        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-gray-900 dark:text-white">{ref.quantity} 席</span>
        <span className="shrink-0 text-[10px] font-medium tabular-nums text-gray-600 dark:text-gray-400">{fmtMoney(ref.amount)}</span>
        {lic && (
          <>
            <span className="hidden shrink-0 text-violet-300 sm:inline dark:text-violet-700" aria-hidden>
              ·
            </span>
            <span className="min-w-0 text-[10px] font-medium tabular-nums leading-none text-gray-700 dark:text-gray-300">{lic}</span>
          </>
        )}
        <span className="min-w-0 flex-1 basis-full truncate font-mono text-[9px] font-semibold leading-none text-[#0071E3] group-hover:underline sm:basis-[min(40%,12rem)] dark:text-[#0A84FF]" title={ref.orderId}>
          {ref.orderId}
        </span>
      </button>
    );
  }

  return (
    <div className="mb-2 rounded-xl border border-gray-200/80 bg-white/95 px-2 py-2 shadow-sm dark:border-white/10 dark:bg-[#1C1C1E]">
      <div className="overflow-x-auto custom-scrollbar">
        <div className="flex min-w-min flex-wrap items-start gap-x-1 gap-y-2" role="list" aria-label="订阅主干与增购">
          {spine.map((sRef, si) => {
            const addOns = addOnsByAnchor[sRef.orderId] || [];
            const step = si + 1;
            return (
              <React.Fragment key={`${sRef.orderId}-${sRef.productId}-${si}`}>
                {si > 0 && (
                  <div
                    className="flex w-5 shrink-0 items-center justify-center self-center pt-1 text-xs font-bold text-gray-300 dark:text-gray-600"
                    aria-hidden
                  >
                    →
                  </div>
                )}
                <div className="flex w-[min(100%,22rem)] min-w-[min(100%,16rem)] max-w-[26rem] shrink-0 flex-col gap-1">
                  {renderSpineCard(sRef, step)}
                  {addOns.length > 0 && (
                    <div className="space-y-1 rounded-lg border border-dashed border-violet-200/60 bg-violet-50/30 p-1.5 dark:border-violet-800/35 dark:bg-violet-950/15">
                      {addOns.map(renderAddOnRow)}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {orphanAddOns.length > 0 && (
        <div className="mt-2 rounded-lg border border-amber-200/70 bg-amber-50/35 px-2 py-2 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="mb-1.5 text-[10px] font-semibold text-amber-900 dark:text-amber-200/90">未挂接主干的增购 · {orphanAddOns.length}</div>
          <div className="space-y-1">{orphanAddOns.map(renderAddOnRow)}</div>
        </div>
      )}
    </div>
  );
}
