import React from 'react';
import { Target, Network, MousePointer2, Zap, Globe, Radio, User as UserIcon, FileText } from 'lucide-react';
import type { BuyerType, OrderSource, User } from '../../../types';

interface Step1OrderTypeProps {
  buyerType: BuyerType | '';
  setBuyerType: (v: BuyerType) => void;
  orderSource: OrderSource;
  setOrderSource: (v: OrderSource) => void;
  setLinkedContractIds: (v: string[]) => void;
  users: User[];
  creatorId: string;
  currentUser: User;
  orderRemark: string;
  setOrderRemark: (v: string) => void;
}

const Step1OrderType: React.FC<Step1OrderTypeProps> = ({
  buyerType,
  setBuyerType,
  orderSource,
  setOrderSource,
  setLinkedContractIds,
  users,
  creatorId,
  currentUser,
  orderRemark,
  setOrderRemark,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-500" /> 订单类型
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'Customer', title: '直签订单', icon: Target, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
            { id: 'Channel', title: '渠道订单', icon: Network, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
            { id: 'SelfDeal', title: '自成交订单', icon: MousePointer2, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
            { id: 'RedeemCode', title: '兑换码订单', icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
          ].map(type => (
            <button
              key={type.id}
              onClick={() => {
                setBuyerType(type.id as BuyerType);
                if (type.id === 'SelfDeal') setLinkedContractIds([]);
              }}
              className={`px-4 py-3 rounded-xl border-2 flex items-center gap-3 transition-all duration-200 ${
                buyerType === type.id
                  ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/30 dark:bg-white/5 ring-2 ring-blue-500/10'
                  : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#2C2C2E] hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${type.color}`}>
                <type.icon className="w-4 h-4" />
              </div>
              <span
                className={`text-sm font-bold ${
                  buyerType === type.id
                    ? 'text-[#0071E3] dark:text-[#FF2D55]'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {type.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {buyerType && (
        <div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" /> 订单来源
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'OnlineStore', label: '官网', icon: Globe, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
              { id: 'ChannelPortal', label: '渠道来源', icon: Network, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
              { id: 'APISync', label: '三方平台', icon: Radio, color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
              { id: 'Sales', label: '后台下单', icon: UserIcon, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
            ]
              .filter(src => {
                if (buyerType === 'Customer') return src.id === 'Sales';
                if (buyerType === 'Channel') return src.id === 'ChannelPortal' || src.id === 'Sales';
                if (buyerType === 'RedeemCode') return src.id === 'APISync' || src.id === 'Sales';
                if (buyerType === 'SelfDeal')
                  return src.id === 'OnlineStore' || src.id === 'APISync' || src.id === 'Sales';
                return true;
              })
              .map(src => (
                <button
                  key={src.id}
                  onClick={() => {
                    setOrderSource(src.id as OrderSource);
                    if (src.id === 'OnlineStore') setLinkedContractIds([]);
                  }}
                  className={`px-4 py-3 rounded-xl border-2 flex items-center gap-3 transition-all duration-200 ${
                    orderSource === src.id
                      ? 'border-[#0071E3] dark:border-[#FF2D55] bg-blue-50/30 dark:bg-white/5 ring-2 ring-blue-500/10'
                      : 'border-gray-100 dark:border-white/5 bg-white dark:bg-[#2C2C2E] hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${src.color}`}
                  >
                    <src.icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      orderSource === src.id
                        ? 'text-[#0071E3] dark:text-[#FF2D55]'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {src.label}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-blue-500" /> 制单人
        </h4>
        <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl border border-gray-100 dark:border-white/5 p-5 flex items-center gap-4 max-w-sm">
          {(() => {
            const sel = users.find(u => u.id === creatorId) || currentUser;
            return (
              <>
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 dark:border-white/10 shrink-0">
                  <img
                    src={sel.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${sel.name}`}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={e => {
                      const t = e.currentTarget;
                      t.style.display = 'none';
                      const p = t.parentElement;
                      if (p && !p.querySelector('span')) {
                        const s = document.createElement('span');
                        s.className =
                          'w-full h-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-blue-400 to-indigo-600';
                        s.textContent = sel.name.replace(/\s*\(.*?\)/g, '').charAt(0);
                        p.appendChild(s);
                      }
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {sel.name.replace(/\s*\(.*?\)/g, '')}
                  </div>
                  {sel.phone && (
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{sel.phone}</div>
                  )}
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-800 shrink-0">
                  当前用户
                </span>
              </>
            );
          })()}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" /> 订单备注
        </h4>
        <textarea
          value={orderRemark}
          onChange={e => setOrderRemark(e.target.value)}
          placeholder="请输入订单备注（选填）..."
          rows={2}
          className="w-full p-3 bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/5 rounded-2xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#0071E3] transition resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>
    </div>
  );
};

export default Step1OrderType;
