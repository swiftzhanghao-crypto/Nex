import React from 'react';
import { Package, Plus, Trash2, Loader2, RefreshCw } from 'lucide-react';
import type { Product, InstallPackage } from '../../../types';
import { cardClass } from './styles';

export interface StepPackagesProps {
  form: Partial<Product>;
  updateForm: (patch: Partial<Product>) => void;
  pkgTab: 'public' | 'private';
  setPkgTab: (tab: 'public' | 'private') => void;
  filteredPkgs: InstallPackage[];
  refreshDeployPkgLoading: boolean;
  onRefreshDeployPackages: () => void;
  onOpenAddPkg: () => void;
}

const StepPackages: React.FC<StepPackagesProps> = ({
  form,
  updateForm,
  pkgTab,
  setPkgTab,
  filteredPkgs,
  refreshDeployPkgLoading,
  onRefreshDeployPackages,
  onOpenAddPkg,
}) => {
  const togglePkgEnabled = (pkgId: string) => {
    updateForm({
      installPackages: (form.installPackages || []).map(p =>
        p.id === pkgId ? { ...p, enabled: !(p.enabled ?? true) } : p
      ),
    });
  };

  return (
    <div className={cardClass}>
      {/* Tab 切换 */}
      <div className="border-b border-gray-200 dark:border-white/10 px-6 pt-4">
        <div className="flex gap-0">
          {(['public', 'private'] as const).map(tab => (
            <button key={tab} onClick={() => setPkgTab(tab)} className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${pkgTab === tab ? 'text-[#0071E3] dark:text-[#0A84FF] border-[#0071E3] dark:border-[#0A84FF]' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200'}`}>
              {tab === 'public' ? '端安装包' : '私有云安装包'}
            </button>
          ))}
        </div>
      </div>

      {/* 安装包子标题 + 操作按钮 */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100 dark:border-white/10">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">安装包</h4>
        <div className="flex items-center gap-2">
          {pkgTab === 'private' && (
            <button
              type="button"
              onClick={onRefreshDeployPackages}
              disabled={refreshDeployPkgLoading || filteredPkgs.length === 0}
              title={filteredPkgs.length === 0 ? '请先添加安装包' : '从运维聚合平台重新拉取最新数据'}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#0071E3] dark:border-[#0A84FF] text-[#0071E3] dark:text-[#0A84FF] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {refreshDeployPkgLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
              更新运维聚合平台数据
            </button>
          )}
          <button
            onClick={() => {
              onOpenAddPkg()
            }}
            className="unified-button-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> 新增安装包
          </button>
        </div>
      </div>

      {filteredPkgs.length > 0 ? (
        <div className="overflow-x-auto">
          {pkgTab === 'public' ? (
            <table className="w-full text-left min-w-[1100px]">
              <thead className="unified-table-header">
                <tr>
                  <th className="px-5 py-3">安装包编号</th>
                  <th className="px-5 py-3">交付物编号</th>
                  <th className="px-5 py-3 min-w-[200px]">交付物名称</th>
                  <th className="px-5 py-3">发布平台</th>
                  <th className="px-5 py-3">安装包来源</th>
                  <th className="px-5 py-3">CPU</th>
                  <th className="px-5 py-3">操作系统</th>
                  <th className="px-5 py-3 w-[120px]">安装包</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredPkgs.map(pkg => {
                  const enabled = pkg.enabled ?? true;
                  return (
                  <tr key={pkg.id} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${!enabled ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3.5 text-sm">
                      <a href={pkg.url || '#'} target={pkg.url ? '_blank' : undefined} rel="noreferrer" className="text-[#0071E3] dark:text-[#0A84FF] hover:underline font-mono">{pkg.id}</a>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.deliveryItemId || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-900 dark:text-white break-words">{pkg.deliveryItemName || pkg.name || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.platform || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.source || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.cpu || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.os || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${enabled ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-400 dark:text-gray-500'}`}>
                          {enabled ? '安装包' : '已停用'}
                        </span>
                        <button type="button" role="switch" aria-checked={enabled} onClick={() => togglePkgEnabled(pkg.id)} title={enabled ? '点击停用' : '点击启用'} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${enabled ? 'bg-[#0071E3] dark:bg-[#0A84FF]' : 'bg-gray-300 dark:bg-white/15'}`}>
                          <span aria-hidden="true" className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <button onClick={() => updateForm({ installPackages: (form.installPackages || []).filter(p => p.id !== pkg.id) })} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition" title="删除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          ) : (
            // 私有云表格（按图：安装包编号 / 包编号 / 包类型 / 包产品类型 / 版本类型 / 版本号 / 安装包）
            <table className="w-full text-left min-w-[1100px]">
              <thead className="unified-table-header">
                <tr>
                  <th className="px-5 py-3">安装包编号</th>
                  <th className="px-5 py-3">包编号</th>
                  <th className="px-5 py-3">包类型</th>
                  <th className="px-5 py-3 min-w-[200px]">包产品类型</th>
                  <th className="px-5 py-3">版本类型</th>
                  <th className="px-5 py-3">版本号</th>
                  <th className="px-5 py-3 w-[120px]">安装包</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredPkgs.map(pkg => {
                  const enabled = pkg.enabled ?? true;
                  return (
                  <tr key={pkg.id} className={`group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors ${!enabled ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3.5 text-sm">
                      <span className="text-[#0071E3] dark:text-[#0A84FF] font-mono" title={pkg.deployPackageName || ''}>{pkg.id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400 font-mono">{pkg.deployPackageId || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.packageKind || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400 break-words">{pkg.packageProductType || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.versionType || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-gray-400">{pkg.versionNumber || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${enabled ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-400 dark:text-gray-500'}`}>
                          {enabled ? '安装包' : '已停用'}
                        </span>
                        <button type="button" role="switch" aria-checked={enabled} onClick={() => togglePkgEnabled(pkg.id)} title={enabled ? '点击停用' : '点击启用'} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${enabled ? 'bg-[#0071E3] dark:bg-[#0A84FF]' : 'bg-gray-300 dark:bg-white/15'}`}>
                          <span aria-hidden="true" className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <button onClick={() => updateForm({ installPackages: (form.installPackages || []).filter(p => p.id !== pkg.id) })} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition" title="删除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="p-12 text-center">
          <Package className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <div className="text-sm text-gray-400 dark:text-gray-500">暂无{pkgTab === 'public' ? '端' : '私有云'}安装包</div>
        </div>
      )}

    </div>
  );
};

export default StepPackages;
