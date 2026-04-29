import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Plus, Settings, Info, ChevronDown, ChevronUp, Pencil, Trash2, X } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import Pagination from '../common/Pagination';

interface DeliveryRule {
  id: string;
  productTypes: string[];
  deliveryMethod: string;
  accountDistMode: string;
  customerTypes: string[];
  industryLines: string[];
  regions: { province: string; cities: string[] }[];
}

const DELIVERY_METHODS = ['线上发货', '线下发货', '线上发货 + 线下发货'];
const ACCOUNT_DIST_MODES = ['账号密码', '激活码', '序列号', '账号分发'];

const ALL_CUSTOMER_TYPES = [
  '金融', '央企', '地方国企', '其他中央企业', '港澳台企业', '外资企业',
  '地方事业单位', '地方党政机关', '学校', '中央党政机关', '中央事业单位',
  '军队', '央企', '地方团体', '其他中央企业', '中央党政机关', '地方党政机关',
  '地方团体', '中央团体', '海外', '中央国体', '地方国体', '民企', '金融',
  '其他中央企业', '澳港台企业', '外资企业',
];
const UNIQUE_CUSTOMER_TYPES = [...new Set(ALL_CUSTOMER_TYPES)];

const ALL_INDUSTRY_LINES = [
  '大客民企', '企业区域金融', '企业区域民企', '区域新闻出版传媒',
  '邮委党政', '邮委医疗', '邮委新闻出版传媒', '大客央国企', '大客金融',
  '教育行业', '大客特种', '渠道和生态', '国内SaaS', '大客金融',
  '教育事业', '企业区域国企', '医疗行业', '政务特别', '大客民企',
  '政务区域党政', '企业区域', '区域新闻出版传媒',
];
const UNIQUE_INDUSTRY_LINES = [...new Set(ALL_INDUSTRY_LINES)];

const PROVINCES = [
  '北京市', '天津市', '河北省', '山西省', '内蒙古', '辽宁省', '吉林省',
  '黑龙江省', '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省',
  '山东省', '河南省', '湖北省', '湖南省', '广东省', '广西', '海南省',
  '重庆市', '四川省', '贵州省', '云南省', '西藏', '陕西省', '甘肃省',
  '青海省', '宁夏', '新疆',
];

const SAMPLE_PRODUCT_TYPES = [
  ['移动端、PDF（教育）、信创2019（教育版）、信创2023（教育版）、信创2023（教育版）、信创2016、信创2019、流版签'],
  ['信创2016、信创2019、信创2023（教育版）、流版签'],
  ['WPS+云套装、WPS365标准版（教育）、WPS365标准版（政府）、WPS365高级发货版、WPS365高级版（教育）'],
  ['WPS365应用版（教育）（服务）、WPS365协作版（教育）（服务）、WPS365协作版（服务）、WPS365旗舰版（服务）'],
];

const initialRules: DeliveryRule[] = [
  {
    id: 'dr-1',
    productTypes: SAMPLE_PRODUCT_TYPES[0],
    deliveryMethod: '线上发货',
    accountDistMode: '账号密码',
    customerTypes: ['金融', '央企', '地方国企', '其他中央企业', '港澳台企业', '外资企业', '地方事业单位', '地方党政机关', '学校', '中央党政机关', '军队', '央企', '中央事业单位', '中央团体', '地方团体', '民企'],
    industryLines: ['大客民企', '企业区域金融', '企业区域民企', '区域新闻出版传媒', '邮委党政', '邮委新闻出版传媒', '大客央国企', '大客金融', '教育行业', '大客特种', '渠道和生态', '国内SaaS', '大客金融', '教育事业', '企业区域国企', '医疗行业'],
    regions: [
      { province: '北京市', cities: [] },
      { province: '天津市', cities: [] },
      { province: '河北省', cities: ['石家庄市', '唐山市', '秦皇岛市'] },
      { province: '山西省', cities: [] },
    ],
  },
  {
    id: 'dr-2',
    productTypes: SAMPLE_PRODUCT_TYPES[1],
    deliveryMethod: '线上发货 + 线下发货',
    accountDistMode: '账号密码',
    customerTypes: ['地方事业单位', '地方党政机关', '中央团体', '地方团体', '中央党政机关', '地方党政机关'],
    industryLines: ['政务区域党政', '邮委党政', '邮委医疗'],
    regions: [
      { province: '河北省', cities: ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '邢台市', '保定市', '张家口市', '承德市', '沧州市', '廊坊市', '衡水市'] },
    ],
  },
  {
    id: 'dr-3',
    productTypes: SAMPLE_PRODUCT_TYPES[2],
    deliveryMethod: '线上发货 + 线下发货',
    accountDistMode: '账号密码',
    customerTypes: ['学校', '中央党政机关', '地方党政机关', '中央事业单位', '地方事业单位', '军队', '央企', '地方团体', '其他中央企业', '中央党政机关', '地方党政机关', '民企', '金融', '其他中央企业', '澳港台企业', '外资企业', '海外', '中央国体', '地方国体'],
    industryLines: ['大客民企', '政务区域党政', '企业区域', '企业区域金融', '企业区域民企', '区域新闻出版传媒', '邮委党政', '邮委医疗', '邮委新闻出版传媒', '大客央国企', '大客金融', '教育行业', '大客特种', '渠道和生态', '国内SaaS', '教育事业', '企业区域国企', '医疗行业'],
    regions: [
      { province: '北京市', cities: [] },
      { province: '天津市', cities: [] },
      { province: '河北省', cities: ['石家庄市', '唐山市'] },
      { province: '山东省', cities: [] },
    ],
  },
  {
    id: 'dr-4',
    productTypes: SAMPLE_PRODUCT_TYPES[3],
    deliveryMethod: '线上发货',
    accountDistMode: '账号密码',
    customerTypes: ['学校', '中央党政机关', '地方党政机关', '中央事业单位', '地方事业单位', '军队', '央企', '地方团体', '其他中央企业', '民企', '金融', '澳港台企业', '外资企业', '海外', '中央国体', '地方国体'],
    industryLines: ['政务特别', '大客民企', '政务区域党政', '企业区域', '区域新闻出版传媒', '邮委党政', '邮委医疗', '邮委新闻出版传媒', '大客央国企', '大客金融', '教育行业', '教育事业', '企业区域国企', '医疗行业'],
    regions: [
      { province: '北京市', cities: [] },
      { province: '天津市', cities: [] },
      { province: '河北省', cities: ['石家庄市', '唐山市', '廊山市', '秦皇岛市'] },
    ],
  },
];

const TruncatedCell: React.FC<{ text: string; title: string; onShowDetail: (title: string, content: string) => void }> = ({ text, title, onShowDetail }) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isClamped, setIsClamped] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) setIsClamped(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div>
      <span ref={textRef} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">{text}</span>
      {isClamped && (
        <button
          onClick={e => { e.stopPropagation(); onShowDetail(title, text); }}
          className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#0071E3] dark:text-[#0A84FF] bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-800 px-2 py-0.5 rounded-full transition"
        >
          更多
        </button>
      )}
    </div>
  );
};

const DeliveryMethodConfig: React.FC = () => {
  const [rules, setRules] = useState<DeliveryRule[]>(initialRules);
  const [defaultMethod, setDefaultMethod] = useState('线下发货');
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [tempDefault, setTempDefault] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRule, setEditingRule] = useState<DeliveryRule | null>(null);
  const [toast, setToast] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailModal, setDetailModal] = useState<{ title: string; content: string } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const pagedRules = useMemo(() => rules.slice((page - 1) * pageSize, page * pageSize), [rules, page, pageSize]);

  const openDefaultModal = () => {
    setTempDefault(defaultMethod);
    setShowDefaultModal(true);
  };

  const saveDefault = () => {
    setDefaultMethod(tempDefault);
    setShowDefaultModal(false);
    showToast('默认发货方式已更新');
  };

  const openAdd = () => {
    setEditingRule({
      id: '',
      productTypes: [],
      deliveryMethod: '线下发货',
      accountDistMode: '账号密码',
      customerTypes: [],
      industryLines: [],
      regions: [],
    });
    setShowEditModal(true);
  };

  const openEdit = (rule: DeliveryRule) => {
    setEditingRule(JSON.parse(JSON.stringify(rule)));
    setShowEditModal(true);
  };

  const deleteRule = (id: string) => {
    if (!confirm('确定删除该发货规则？')) return;
    setRules(prev => prev.filter(r => r.id !== id));
    showToast('已删除');
  };

  const saveRule = () => {
    if (!editingRule) return;
    if (editingRule.id) {
      setRules(prev => prev.map(r => r.id === editingRule.id ? editingRule : r));
      showToast('已保存修改');
    } else {
      setRules(prev => [...prev, { ...editingRule, id: `dr-${Date.now()}` }]);
      showToast('已新增发货规则');
    }
    setShowEditModal(false);
    setEditingRule(null);
  };

  const updateEditField = <K extends keyof DeliveryRule>(key: K, val: DeliveryRule[K]) => {
    if (!editingRule) return;
    setEditingRule({ ...editingRule, [key]: val });
  };

  const toggleEditArray = (key: 'customerTypes' | 'industryLines', val: string) => {
    if (!editingRule) return;
    const arr = editingRule[key];
    const next = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
    setEditingRule({ ...editingRule, [key]: next });
  };

  const toggleEditRegion = (province: string) => {
    if (!editingRule) return;
    const exists = editingRule.regions.find(r => r.province === province);
    if (exists) {
      setEditingRule({ ...editingRule, regions: editingRule.regions.filter(r => r.province !== province) });
    } else {
      setEditingRule({ ...editingRule, regions: [...editingRule.regions, { province, cities: [] }] });
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-[2400px] mx-auto animate-page-enter">
      {/* Default Delivery Method */}
      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-gray-800 dark:text-white mb-1">默认发货方式</div>
            <div className="text-[13px] text-gray-600 dark:text-gray-400">{defaultMethod}</div>
          </div>
          <button onClick={openDefaultModal} className="px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition font-medium">
            设置
          </button>
        </div>
      </div>

      {/* Custom Rules Header */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-bold text-gray-800 dark:text-white">自定义发货方式</h2>
        <button onClick={openAdd} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium flex items-center gap-0.5">
          <Plus className="w-3.5 h-3.5" />新增
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 px-1">
        <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-400">配置自定义发货方式的产品，请清晰自定义发货方式，不受默认发货方式影响。</span>
      </div>

      {/* Rules Table */}
      <div className="unified-card dark:bg-[#1C1C1E] border-gray-100/50 dark:border-white/10 overflow-hidden">
        <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '10%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '9%' }} />
          </colgroup>
          <thead className="unified-table-header bg-gray-50 dark:bg-[#1C1C1E]">
            <tr>
              <th className="px-3 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">发货方式</th>
              <th className="px-3 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">账号分发模式</th>
              <th className="px-3 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">产品类型</th>
              <th className="px-3 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">客户类型</th>
              <th className="px-3 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">行业条线</th>
              <th className="px-3 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E]">发货地区</th>
              <th className="px-3 py-2.5 whitespace-nowrap border-b border-gray-200/50 dark:border-white/10 bg-gray-50 dark:bg-[#1C1C1E] text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {pagedRules.length === 0 && (
              <tr><td colSpan={7} className="py-16 text-center text-gray-400 text-sm">暂无自定义发货规则</td></tr>
            )}
            {pagedRules.map((rule, idx) => (
              <tr key={rule.id} className={`align-top transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-gray-50/50 dark:bg-white/[0.02]'} hover:bg-blue-50/40 dark:hover:bg-blue-900/10`}>
                <td className="px-3 py-2.5">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{rule.deliveryMethod}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{rule.accountDistMode}</span>
                </td>
                <td className="px-3 py-2.5">
                  <TruncatedCell text={rule.productTypes.join('、')} title="产品类型" onShowDetail={(t, c) => setDetailModal({ title: t, content: c })} />
                </td>
                <td className="px-3 py-2.5">
                  <TruncatedCell text={rule.customerTypes.join('、')} title="客户类型" onShowDetail={(t, c) => setDetailModal({ title: t, content: c })} />
                </td>
                <td className="px-3 py-2.5">
                  <TruncatedCell text={rule.industryLines.join('、')} title="行业条线" onShowDetail={(t, c) => setDetailModal({ title: t, content: c })} />
                </td>
                <td className="px-3 py-2.5">
                  <TruncatedCell
                    text={rule.regions.map(r => r.cities.length === 0 ? r.province : `【${r.province}】${r.cities.join('、')}`).join('；')}
                    title="发货地区"
                    onShowDetail={(t, c) => setDetailModal({ title: t, content: c })}
                  />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(rule)} className="text-sm text-[#0071E3] dark:text-[#0A84FF] hover:underline font-medium">编辑</button>
                    <button onClick={() => deleteRule(rule.id)} className="text-sm text-red-500 hover:underline font-medium">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rules.length > 0 && (
          <Pagination
            page={page}
            size={pageSize}
            total={rules.length}
            onPageChange={setPage}
            onSizeChange={s => { setPageSize(s); setPage(1); }}
          />
        )}
      </div>

      {/* Default Method Modal */}
      {showDefaultModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowDefaultModal(false)}>
            <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 w-[400px] shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">设置默认发货方式</h3>
                <button onClick={() => setShowDefaultModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2">
                {DELIVERY_METHODS.map(m => (
                  <label key={m} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${tempDefault === m ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                    <input type="radio" name="defaultMethod" value={m} checked={tempDefault === m} onChange={() => setTempDefault(m)} className="accent-blue-600" />
                    <span className={`text-sm ${tempDefault === m ? 'font-medium text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{m}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setShowDefaultModal(false)} className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300">取消</button>
                <button onClick={saveDefault} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">确定</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Edit / Add Modal */}
      {showEditModal && editingRule && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setShowEditModal(false); setEditingRule(null); }}>
            <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-6 w-[640px] max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{editingRule.id ? '编辑发货规则' : '新增发货规则'}</h3>
                <button onClick={() => { setShowEditModal(false); setEditingRule(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                {/* Product Types */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">产品类型</label>
                  <textarea
                    value={editingRule.productTypes.join('、')}
                    onChange={e => updateEditField('productTypes', e.target.value.split('、').filter(Boolean))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-transparent text-gray-800 dark:text-white resize-none"
                    rows={3}
                    placeholder="产品名称，用中文顿号「、」分隔"
                  />
                </div>

                {/* Delivery Method */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">发货方式</label>
                  <select value={editingRule.deliveryMethod} onChange={e => updateEditField('deliveryMethod', e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-transparent text-gray-800 dark:text-white">
                    {DELIVERY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Account Distribution Mode */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">账号分发模式</label>
                  <select value={editingRule.accountDistMode} onChange={e => updateEditField('accountDistMode', e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-transparent text-gray-800 dark:text-white">
                    {ACCOUNT_DIST_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Customer Types */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">客户类型 <span className="font-normal text-gray-400">（已选 {editingRule.customerTypes.length} 项）</span></label>
                  <div className="border border-gray-200 dark:border-white/10 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {UNIQUE_CUSTOMER_TYPES.map(ct => (
                        <label key={ct} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                          <input type="checkbox" checked={editingRule.customerTypes.includes(ct)} onChange={() => toggleEditArray('customerTypes', ct)} className="accent-blue-600 w-3.5 h-3.5" />
                          {ct}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Industry Lines */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">行业条线 <span className="font-normal text-gray-400">（已选 {editingRule.industryLines.length} 项）</span></label>
                  <div className="border border-gray-200 dark:border-white/10 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {UNIQUE_INDUSTRY_LINES.map(il => (
                        <label key={il} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                          <input type="checkbox" checked={editingRule.industryLines.includes(il)} onChange={() => toggleEditArray('industryLines', il)} className="accent-blue-600 w-3.5 h-3.5" />
                          {il}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Regions */}
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">发货地区 <span className="font-normal text-gray-400">（已选 {editingRule.regions.length} 个省/直辖市）</span></label>
                  <div className="border border-gray-200 dark:border-white/10 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {PROVINCES.map(pv => (
                        <label key={pv} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                          <input type="checkbox" checked={editingRule.regions.some(r => r.province === pv)} onChange={() => toggleEditRegion(pv)} className="accent-blue-600 w-3.5 h-3.5" />
                          {pv}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => { setShowEditModal(false); setEditingRule(null); }} className="px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-700 dark:text-gray-300">取消</button>
                <button onClick={saveRule} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">确定</button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setDetailModal(null)}>
            <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 w-[520px] max-h-[70vh] flex flex-col animate-modal-enter" onClick={e => e.stopPropagation()}>
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between shrink-0">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{detailModal.title}</span>
                <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{detailModal.content}</p>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {toast && <div className="fixed bottom-7 right-7 bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm shadow-lg animate-fade-in z-50">{toast}</div>}
    </div>
  );
};

export default DeliveryMethodConfig;
