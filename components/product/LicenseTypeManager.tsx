import React, { useState, useCallback, useMemo } from 'react';
import { Plus, ArrowUp, ArrowDown, Copy, RotateCcw, Save, ChevronLeft, Download, X } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import { useAppContext } from '../../contexts/AppContext';

interface FieldCfg {
  displayMode: string;
  condField: string;
  condValue: string;
  valueMode: string;
  autoSource: string;
  allowManualEdit: boolean;
  required: boolean;
  defaultType: string;
  defaultValue: string;
  restrictType: string;
  restrictDetail: string;
  enumSelected: string[];
  fieldHint: string;
  validateField: string;
  validateKeyword: string;
}

interface AuthType {
  id: string;
  name: string;
  period: string;
  nccBiz: string;
  nccIncome: string;
  order: number;
  enabled: boolean;
  fieldCfg: Record<string, FieldCfg>;
}

interface FieldDef {
  key: string;
  name: string;
  dt: 'fixed' | 'configurable' | 'conditional';
  desc: string;
  cond?: string;
  enumDefs?: string[];
}

interface FieldGroup {
  title: string;
  fields: FieldDef[];
}


const FIELD_GROUPS: FieldGroup[] = [
  { title:"基础信息", fields:[
    {key:"quantity",name:"数量",dt:"fixed",desc:"允许限制不可编辑，默认指定"},
    {key:"unitPrice",name:"单价",dt:"fixed",desc:"所有授权方式均展示"},
    {key:"pricingQty",name:"计价数量",dt:"configurable",desc:"可配置，部分视为1"},
    {key:"pricingPrice",name:"计价单价",dt:"configurable",desc:"可配置"},
    {key:"subtotal",name:"金额小计",dt:"fixed",desc:"自动计算"},
  ]},
  { title:"日期与期限", fields:[
    {key:"startDateCalc",name:"授权开始日期计算",dt:"fixed",desc:"支持选项自定义",enumDefs:["发货后5个自然日开始计算","按上一授权截止日期开始计算","按申请日期开始","权益生效后计算"]},
    {key:"prevEndDate",name:"上一授权截止日期",dt:"conditional",desc:"和授权开始计算日期联动",cond:"授权开始日期计算='从上一期截止日期开始'"},
    {key:"applyStart",name:"申请服务开始时间",dt:"conditional",desc:"和授权开始计算日期联动",cond:"授权开始日期计算='按已申请日期填写'"},
    {key:"expectEnd",name:"预计服务结束时间",dt:"conditional",desc:"和授权开始计算日期联动"},
    {key:"orderByPeriod",name:"按期限下单/按截止时间下单",dt:"fixed",desc:"支持选项自定义",enumDefs:["按期限下单","按截止时间下单"]},
    {key:"authPeriod",name:"授权或服务期限（年/月/日）",dt:"configurable",desc:"支持单位自定义",enumDefs:["年","月","日"]},
    {key:"authStartDate",name:"授权开始日期",dt:"configurable",desc:"可配置是否展示"},
    {key:"authEndDate",name:"授权截止日期",dt:"conditional",desc:"和【按期限/截止时间下单】联动"},
  ]},
  { title:"升级保障", fields:[
    {key:"upgradePeriod",name:"升级保障期限",dt:"configurable",desc:"默认值=授权期限，允许编辑"},
    {key:"upgradeStart",name:"升级保障开始日期",dt:"configurable",desc:"可配置"},
    {key:"upgradeEnd",name:"升级保障截止日期",dt:"configurable",desc:"可配置"},
  ]},
  { title:"交付与服务", fields:[
    {key:"delivery",name:"交付方式",dt:"configurable",desc:"选项：一次性交付/分期交付"},
    {key:"expiredQty",name:"到期后授权数量",dt:"configurable",desc:"可配置是否展示"},
    {key:"serialDelay",name:"支持序列号失效延长时间",dt:"configurable",desc:"可配置/条件展示"},
  ]},
  { title:"授权范围与主体", fields:[
    {key:"licensee",name:"被授权方",dt:"configurable",desc:"支持置入默认值"},
    {key:"authScope",name:"授权范围",dt:"configurable",desc:"支持默认值，校验是否含xx"},
    {key:"siteUsers",name:"端年场地授权覆盖的用户数量",dt:"configurable",desc:"可配置"},
    {key:"subUnit",name:"按下级单位分开提供授权",dt:"conditional",desc:"仅新购时展示",cond:"仅新购"},
  ]},
];

const TOTAL_FIELDS = FIELD_GROUPS.reduce((sum, g) => sum + g.fields.length, 0);

function initFieldCfg(f: FieldDef): FieldCfg {
  const dm = f.dt === 'fixed' ? 'fixed' : (f.dt === 'conditional' ? 'conditional' : 'show');
  return {
    displayMode: dm, condField: '', condValue: '',
    valueMode: 'manual', autoSource: '', allowManualEdit: false,
    required: ['quantity','authPeriod','subtotal'].includes(f.key),
    defaultType: '', defaultValue: '',
    restrictType: '', restrictDetail: '', enumSelected: [],
    fieldHint: '', validateField: '', validateKeyword: '',
  };
}

function createAuthTypes(sourceData: {id:string;name:string;period:string;nccBiz:string;nccIncome:string}[]): AuthType[] {
  return sourceData.map((at, i) => {
    const fieldCfg: Record<string, FieldCfg> = {};
    FIELD_GROUPS.forEach(g => g.fields.forEach(f => { fieldCfg[f.key] = initFieldCfg(f); }));
    return { ...at, order: i + 1, enabled: true, fieldCfg };
  });
}

type FilterKey = 'all' | 'periodic' | 'nonperiodic' | 'enabled' | 'disabled';

const Badge: React.FC<{text: string; color: 'blue'|'amber'|'green'|'gray'|'red'}> = ({text, color}) => {
  const styles: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    gray: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${styles[color]}`}>{text}</span>;
};

const Toggle: React.FC<{checked: boolean; onChange: (v: boolean) => void}> = ({checked, onChange}) => (
  <button
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
  >
    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'left-[18px]' : 'left-0.5'}`}/>
  </button>
);

const LicenseTypeManager: React.FC = () => {
  const { authTypes: sharedAuthTypes } = useAppContext();
  const [authTypes, setAuthTypes] = useState<AuthType[]>(() => createAuthTypes(sharedAuthTypes));
  const [filter, setFilter] = useState<FilterKey>('all');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceId, setCopySourceId] = useState('');
  const [addForm, setAddForm] = useState({name:'',period:'周期性',nccBiz:'',nccIncome:''});
  const [copyName, setCopyName] = useState('');
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const filtered = useMemo(() => {
    let list = [...authTypes];
    if (filter === 'periodic') list = list.filter(a => a.period === '周期性');
    if (filter === 'nonperiodic') list = list.filter(a => a.period === '非周期性');
    if (filter === 'enabled') list = list.filter(a => a.enabled);
    if (filter === 'disabled') list = list.filter(a => !a.enabled);
    return list.sort((a, b) => a.order - b.order);
  }, [authTypes, filter]);

  const enabledCount = authTypes.filter(a => a.enabled).length;

  const moveOrder = (id: string, dir: number) => {
    setAuthTypes(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(a => a.id === id);
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const tmp = sorted[idx].order;
      sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
      sorted[swapIdx] = { ...sorted[swapIdx], order: tmp };
      return sorted;
    });
  };

  const toggleEnabled = (id: string, val: boolean) => {
    setAuthTypes(prev => prev.map(a => a.id === id ? { ...a, enabled: val } : a));
  };

  const updateCfg = (atId: string, fKey: string, prop: keyof FieldCfg, val: FieldCfg[keyof FieldCfg]) => {
    setAuthTypes(prev => prev.map(at => {
      if (at.id !== atId) return at;
      const fc = { ...at.fieldCfg[fKey], [prop]: val };
      if (prop === 'displayMode' && val === 'hide') {
        Object.assign(fc, { condField:'', condValue:'', valueMode:'manual', autoSource:'', allowManualEdit:false, required:false, defaultType:'', defaultValue:'', restrictType:'', restrictDetail:'', enumSelected:[], fieldHint:'', validateField:'', validateKeyword:'' });
      }
      if (prop === 'displayMode' && val !== 'conditional') { fc.condField = ''; fc.condValue = ''; }
      if (prop === 'valueMode' && (val === 'manual' || val === 'default')) { fc.autoSource = ''; fc.allowManualEdit = false; }
      if (prop === 'defaultType') fc.defaultValue = '';
      if (prop === 'restrictType') { if (val !== 'numeric') fc.restrictDetail = ''; if (val !== 'enum') fc.enumSelected = []; }
      return { ...at, fieldCfg: { ...at.fieldCfg, [fKey]: fc } };
    }));
  };

  const toggleEnumOption = (atId: string, fKey: string, val: string, checked: boolean) => {
    setAuthTypes(prev => prev.map(at => {
      if (at.id !== atId) return at;
      const fc = { ...at.fieldCfg[fKey] };
      fc.enumSelected = checked ? [...(fc.enumSelected || []), val] : (fc.enumSelected || []).filter(v => v !== val);
      return { ...at, fieldCfg: { ...at.fieldCfg, [fKey]: fc } };
    }));
  };

  const updateAtProp = (atId: string, prop: string, val: string) => {
    setAuthTypes(prev => prev.map(a => a.id === atId ? { ...a, [prop]: val } : a));
  };

  const confirmAdd = () => {
    if (!addForm.name.trim()) return;
    if (authTypes.some(a => a.name === addForm.name.trim())) return;
    const fieldCfg: Record<string, FieldCfg> = {};
    FIELD_GROUPS.forEach(g => g.fields.forEach(f => { fieldCfg[f.key] = initFieldCfg(f); }));
    const maxOrder = authTypes.reduce((m, a) => Math.max(m, a.order), 0);
    setAuthTypes(prev => [...prev, { id: `custom_${Date.now()}`, name: addForm.name.trim(), period: addForm.period, nccBiz: addForm.nccBiz, nccIncome: addForm.nccIncome, order: maxOrder + 1, enabled: true, fieldCfg }]);
    setShowAddModal(false);
    setAddForm({name:'',period:'周期性',nccBiz:'',nccIncome:''});
    showToast(`已新增授权方式「${addForm.name.trim()}」`);
  };

  const openCopy = (id: string) => {
    const src = authTypes.find(a => a.id === id);
    if (!src) return;
    setCopySourceId(id);
    setCopyName(src.name + '（副本）');
    setShowCopyModal(true);
  };

  const confirmCopy = () => {
    const src = authTypes.find(a => a.id === copySourceId);
    if (!src || !copyName.trim() || authTypes.some(a => a.name === copyName.trim())) return;
    const maxOrder = authTypes.reduce((m, a) => Math.max(m, a.order), 0);
    setAuthTypes(prev => [...prev, { ...src, id: `copy_${Date.now()}`, name: copyName.trim(), order: maxOrder + 1, fieldCfg: JSON.parse(JSON.stringify(src.fieldCfg)) }]);
    setShowCopyModal(false);
    showToast(`已复制「${src.name}」为「${copyName.trim()}」`);
  };

  const resetDetail = (id: string) => {
    const at = authTypes.find(a => a.id === id);
    if (!at || !confirm('确定重置该授权方式的所有字段配置？')) return;
    const fieldCfg: Record<string, FieldCfg> = {};
    FIELD_GROUPS.forEach(g => g.fields.forEach(f => { fieldCfg[f.key] = initFieldCfg(f); }));
    setAuthTypes(prev => prev.map(a => a.id === id ? { ...a, fieldCfg } : a));
    showToast(`已重置「${at.name}」的配置`);
  };

  const exportConfig = () => {
    const out = authTypes.map(at => ({ name: at.name, period: at.period, order: at.order, enabled: at.enabled, nccBiz: at.nccBiz, nccIncome: at.nccIncome, fields: at.fieldCfg }));
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'license-type-config.json';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('配置已导出');
  };

  const countConfigured = (at: AuthType) => Object.values(at.fieldCfg).filter(f => f.displayMode !== 'hide').length;

  const detailAt = detailId ? authTypes.find(a => a.id === detailId) : null;

  const filterOptions: {key: FilterKey; label: string}[] = [
    {key:'all',label:'全部'},{key:'periodic',label:'周期性'},{key:'nonperiodic',label:'非周期性'},{key:'enabled',label:'已启用'},{key:'disabled',label:'已停用'},
  ];

  if (detailAt) {
    return (
      <div className="p-4 lg:p-6 max-w-[2400px] mx-auto animate-page-enter">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setDetailId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition"><ChevronLeft className="w-5 h-5"/></button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{detailAt.name} — 字段配置</h1>
              <div className="flex gap-2 mt-1">
                <Badge text={detailAt.period} color={detailAt.period==='周期性'?'blue':'amber'}/>
                <Badge text={detailAt.enabled ? '已启用' : '已停用'} color={detailAt.enabled ? 'green' : 'red'}/>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => resetDetail(detailAt.id)} className="px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5"/>重置</button>
            <button onClick={() => showToast(`「${detailAt.name}」配置已保存`)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1.5"><Save className="w-3.5 h-3.5"/>保存</button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl p-3">
            <div className="text-xs text-gray-400 mb-1">授权方式</div>
            <div className="text-sm font-medium text-gray-800 dark:text-white">{detailAt.name}</div>
          </div>
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl p-3">
            <div className="text-xs text-gray-400 mb-1">周期属性</div>
            <select value={detailAt.period} onChange={e => updateAtProp(detailAt.id, 'period', e.target.value)} className="text-sm font-medium bg-transparent border border-gray-200 dark:border-white/10 rounded px-2 py-1 w-full text-gray-800 dark:text-white">
              <option value="周期性">周期性</option><option value="非周期性">非周期性</option>
            </select>
          </div>
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl p-3">
            <div className="text-xs text-gray-400 mb-1">NCC业务类型</div>
            <input value={detailAt.nccBiz} onChange={e => updateAtProp(detailAt.id, 'nccBiz', e.target.value)} className="text-sm font-medium bg-transparent border border-gray-200 dark:border-white/10 rounded px-2 py-1 w-full text-gray-800 dark:text-white" placeholder="请输入"/>
          </div>
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl p-3">
            <div className="text-xs text-gray-400 mb-1">NCC收入类型</div>
            <input value={detailAt.nccIncome} onChange={e => updateAtProp(detailAt.id, 'nccIncome', e.target.value)} className="text-sm font-medium bg-transparent border border-gray-200 dark:border-white/10 rounded px-2 py-1 w-full text-gray-800 dark:text-white" placeholder="请输入"/>
          </div>
          <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl p-3">
            <div className="text-xs text-gray-400 mb-1">状态</div>
            <Badge text={detailAt.enabled ? '已启用' : '已停用'} color={detailAt.enabled ? 'green' : 'red'}/>
          </div>
        </div>

        {FIELD_GROUPS.map(group => (
          <div key={group.title} className="mb-6">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <span className="w-0.5 h-3.5 bg-blue-600 rounded-full"/>
              {group.title}
            </div>
            <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-black/20 text-xs text-gray-400 font-semibold uppercase">
                    <th className="px-3 py-2 text-left w-[9%]">字段名称</th>
                    <th className="px-3 py-2 text-left w-[14%]">展示控制</th>
                    <th className="px-3 py-2 text-left w-[16%]">赋值逻辑</th>
                    <th className="px-3 py-2 text-center w-[4%]">必填</th>
                    <th className="px-3 py-2 text-left w-[12%]">默认值</th>
                    <th className="px-3 py-2 text-left w-[13%]">填写限制</th>
                    <th className="px-3 py-2 text-left w-[12%]">字段说明</th>
                    <th className="px-3 py-2 text-left w-[20%]">下单校验</th>
                  </tr>
                </thead>
                <tbody>
                  {group.fields.map(f => {
                    const fc = detailAt.fieldCfg[f.key];
                    const isFixed = f.dt === 'fixed';
                    const isHidden = fc.displayMode === 'hide';
                    const disabled = isHidden;
                    return (
                      <tr key={f.key} className={`border-t border-gray-100 dark:border-white/5 ${isHidden ? 'opacity-40' : ''}`}>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-gray-800 dark:text-white text-xs">{f.name}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{f.key}</div>
                        </td>
                        <td className="px-3 py-2.5">
                          {isFixed ? <Badge text="固定展示" color="green"/> : (
                            <div className="space-y-1">
                              <select value={fc.displayMode} onChange={e => updateCfg(detailAt.id, f.key, 'displayMode', e.target.value)} className="text-xs border border-gray-200 dark:border-white/10 rounded px-1.5 py-1 bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 w-full">
                                <option value="hide">下单不展示</option><option value="show">下单展示</option><option value="conditional">条件展示</option>
                              </select>
                              {fc.displayMode === 'conditional' && (
                                <div className="flex items-center gap-1 text-[10px] text-gray-500 flex-wrap">
                                  <span>当</span>
                                  <input value={fc.condField} onChange={e => updateCfg(detailAt.id, f.key, 'condField', e.target.value)} className="w-16 px-1 py-0.5 border border-gray-200 dark:border-white/10 rounded text-[10px] bg-transparent" placeholder="字段"/>
                                  <span>=</span>
                                  <input value={fc.condValue} onChange={e => updateCfg(detailAt.id, f.key, 'condValue', e.target.value)} className="w-16 px-1 py-0.5 border border-gray-200 dark:border-white/10 rounded text-[10px] bg-transparent" placeholder="值"/>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="space-y-1">
                            <select disabled={disabled} value={fc.valueMode} onChange={e => updateCfg(detailAt.id, f.key, 'valueMode', e.target.value)} className="text-xs border border-gray-200 dark:border-white/10 rounded px-1.5 py-1 bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 disabled:opacity-50 w-full">
                              <option value="manual">下单录入</option><option value="auto">自动取值</option><option value="default">取默认值</option>
                            </select>
                            {fc.valueMode === 'auto' && !disabled && (
                              <>
                                <input value={fc.autoSource} onChange={e => updateCfg(detailAt.id, f.key, 'autoSource', e.target.value)} className="w-full text-[10px] px-1.5 py-0.5 border border-gray-200 dark:border-white/10 rounded bg-transparent" placeholder="取值字段名"/>
                                <label className="flex items-center gap-1 text-[10px] text-gray-500"><input type="checkbox" checked={fc.allowManualEdit} onChange={e => updateCfg(detailAt.id, f.key, 'allowManualEdit', e.target.checked)} className="accent-blue-600"/>支持人工编辑</label>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Toggle checked={fc.required} onChange={v => !disabled && updateCfg(detailAt.id, f.key, 'required', v)}/>
                        </td>
                        <td className="px-3 py-2.5">
                          {disabled ? <span className="text-xs text-gray-300">—</span> : (
                            <div className="space-y-1">
                              <select value={fc.defaultType} onChange={e => updateCfg(detailAt.id, f.key, 'defaultType', e.target.value)} className="text-[10px] border border-gray-200 dark:border-white/10 rounded px-1 py-0.5 bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 w-full">
                                <option value="">无默认值</option><option value="text">默认文字</option><option value="number">默认数字</option><option value="variable">含变量值</option>
                              </select>
                              {fc.defaultType && <input value={fc.defaultValue} onChange={e => updateCfg(detailAt.id, f.key, 'defaultValue', e.target.value)} className="w-full text-[10px] px-1 py-0.5 border border-gray-200 dark:border-white/10 rounded bg-transparent" placeholder={fc.defaultType === 'variable' ? '如：${quantity}' : '输入默认值'}/>}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {disabled ? <span className="text-xs text-gray-300">—</span> : (
                            <div className="space-y-1">
                              <select value={fc.restrictType} onChange={e => updateCfg(detailAt.id, f.key, 'restrictType', e.target.value)} className="text-[10px] border border-gray-200 dark:border-white/10 rounded px-1 py-0.5 bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 w-full">
                                <option value="">无限制</option><option value="numeric">数值型限制</option>
                                {f.enumDefs && f.enumDefs.length > 0 && <option value="enum">枚举值限制</option>}
                              </select>
                              {fc.restrictType === 'numeric' && <input value={fc.restrictDetail} onChange={e => updateCfg(detailAt.id, f.key, 'restrictDetail', e.target.value)} className="w-full text-[10px] px-1 py-0.5 border border-gray-200 dark:border-white/10 rounded bg-transparent" placeholder="如：≥0, 整数"/>}
                              {fc.restrictType === 'enum' && f.enumDefs && (
                                <div className="space-y-0.5 mt-1">
                                  {f.enumDefs.map(v => (
                                    <label key={v} className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                                      <input type="checkbox" checked={(fc.enumSelected || []).includes(v)} onChange={e => toggleEnumOption(detailAt.id, f.key, v, e.target.checked)} className="accent-blue-600"/>{v}
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {disabled ? <span className="text-xs text-gray-300">—</span> : (
                            <input value={fc.fieldHint} onChange={e => updateCfg(detailAt.id, f.key, 'fieldHint', e.target.value)} className="w-full text-[10px] px-1.5 py-1 border border-gray-200 dark:border-white/10 rounded bg-transparent text-gray-700 dark:text-gray-300" placeholder="提示文案" maxLength={30}/>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {disabled ? <span className="text-xs text-gray-300">—</span> : (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-0.5 text-[10px] text-gray-500">若字段【<input value={fc.validateField} onChange={e => updateCfg(detailAt.id, f.key, 'validateField', e.target.value)} className="w-14 px-0.5 py-0.5 border border-gray-200 dark:border-white/10 rounded text-[10px] bg-transparent"/>】</div>
                              <div className="flex items-center gap-0.5 text-[10px] text-gray-500">包含【<input value={fc.validateKeyword} onChange={e => updateCfg(detailAt.id, f.key, 'validateKeyword', e.target.value)} className="w-14 px-0.5 py-0.5 border border-gray-200 dark:border-white/10 rounded text-[10px] bg-transparent"/>】</div>
                              <div className="text-[9px] text-red-500">不允许提交订单</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto animate-page-enter">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">授权类型管理</h1>
          <button onClick={() => setShowAddModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5"/>新增授权</button>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"/>已启用 <b className="text-gray-800 dark:text-white">{enabledCount}</b></span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300"/>已停用 <b className="text-gray-800 dark:text-white">{authTypes.length - enabledCount}</b></span>
          <span>共 <b className="text-gray-800 dark:text-white">{authTypes.length}</b> 种</span>
          <button onClick={exportConfig} className="px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-1.5"><Download className="w-3.5 h-3.5"/>导出配置</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {filterOptions.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${filter === f.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-transparent border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-black/20 text-xs text-gray-400 font-semibold uppercase">
              <th className="px-4 py-2.5 text-center w-[8%]">顺序</th>
              <th className="px-4 py-2.5 text-left w-[22%]">授权方式</th>
              <th className="px-4 py-2.5 text-center w-[10%]">周期性</th>
              <th className="px-4 py-2.5 text-center w-[16%]">NCC业务类型</th>
              <th className="px-4 py-2.5 text-center w-[16%]">NCC收入类型</th>
              <th className="px-4 py-2.5 text-center w-[10%]">已配置字段</th>
              <th className="px-4 py-2.5 text-center w-[8%]">状态</th>
              <th className="px-4 py-2.5 text-center w-[10%]">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="py-16 text-center text-gray-400 text-sm">暂无匹配的授权方式</td></tr>
            )}
            {filtered.map(at => (
              <tr key={at.id} onClick={() => setDetailId(at.id)} className="border-t border-gray-100 dark:border-white/5 cursor-pointer hover:bg-blue-50/30 dark:hover:bg-white/5 transition">
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={e => { e.stopPropagation(); moveOrder(at.id, -1); }} className="w-5 h-5 border border-gray-200 dark:border-white/10 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-400 transition text-[10px]"><ArrowUp className="w-3 h-3"/></button>
                    <span className="w-6 text-center text-xs text-gray-600 dark:text-gray-400 font-medium">{at.order}</span>
                    <button onClick={e => { e.stopPropagation(); moveOrder(at.id, 1); }} className="w-5 h-5 border border-gray-200 dark:border-white/10 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-400 transition text-[10px]"><ArrowDown className="w-3 h-3"/></button>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="font-medium text-gray-800 dark:text-white">{at.name}</span></td>
                <td className="px-4 py-3 text-center"><Badge text={at.period} color={at.period === '周期性' ? 'blue' : 'amber'}/></td>
                <td className="px-4 py-3 text-center">{at.nccBiz ? <Badge text={at.nccBiz} color={at.nccBiz === '可持续授权' ? 'green' : 'gray'}/> : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-center">{at.nccIncome ? <Badge text={at.nccIncome} color="gray"/> : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-center"><span className="text-xs text-gray-400">{countConfigured(at)}/{TOTAL_FIELDS}</span></td>
                <td className="px-4 py-3 text-center"><Toggle checked={at.enabled} onChange={v => toggleEnabled(at.id, v)}/></td>
                <td className="px-4 py-3 text-center">
                  <button onClick={e => { e.stopPropagation(); setDetailId(at.id); }} className="text-xs text-blue-600 dark:text-blue-400 hover:underline mr-2">配置</button>
                  <button onClick={e => { e.stopPropagation(); openCopy(at.id); }} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">复制</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
            <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-gray-900 dark:text-white">新增授权方式</h3><button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button></div>
              <div className="space-y-3">
                <div><label className="text-xs font-bold text-gray-500 mb-1 block">授权名称 <span className="text-red-500">*</span></label><input value={addForm.name} onChange={e => setAddForm(p => ({...p, name: e.target.value}))} className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-transparent text-gray-800 dark:text-white" placeholder="请输入授权名称"/></div>
                <div><label className="text-xs font-bold text-gray-500 mb-1 block">周期性 <span className="text-red-500">*</span></label><select value={addForm.period} onChange={e => setAddForm(p => ({...p, period: e.target.value}))} className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-transparent text-gray-800 dark:text-white"><option value="周期性">周期性</option><option value="非周期性">非周期性</option></select></div>
                <div><label className="text-xs font-bold text-gray-500 mb-1 block">NCC业务类型 <span className="text-red-500">*</span></label><input value={addForm.nccBiz} onChange={e => setAddForm(p => ({...p, nccBiz: e.target.value}))} className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-transparent text-gray-800 dark:text-white" placeholder="如：可持续授权、永久性授权"/></div>
                <div><label className="text-xs font-bold text-gray-500 mb-1 block">NCC收入类型 <span className="text-red-500">*</span></label><input value={addForm.nccIncome} onChange={e => setAddForm(p => ({...p, nccIncome: e.target.value}))} className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-transparent text-gray-800 dark:text-white" placeholder="如：授权-数量授权、授权-场地授权"/></div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300">取消</button>
                <button onClick={confirmAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">确认新增</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {showCopyModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCopyModal(false)}>
            <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">复制授权方式</h3>
              <div><label className="text-xs font-bold text-gray-500 mb-1 block">新授权名称</label><input value={copyName} onChange={e => setCopyName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-transparent text-gray-800 dark:text-white"/></div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setShowCopyModal(false)} className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300">取消</button>
                <button onClick={confirmCopy} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">确认复制</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {toast && <div className="fixed bottom-7 right-7 bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm shadow-lg animate-fade-in z-50">{toast}</div>}
    </div>
  );
};

export default LicenseTypeManager;
