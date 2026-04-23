import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Building2, MapPin, Briefcase } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

interface CustomerCardInChatProps {
  customerId: string;
  onClose?: () => void;
}

const getLevelBadge = (level: string) => {
  if (!level) return 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400';
  if (level.includes('一级') || level.includes('中央')) return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400';
  if (level.includes('二级') || level.includes('省级')) return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
  if (level.includes('三级') || level.includes('市级')) return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
  return 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400';
};

const CustomerCardInChat: React.FC<CustomerCardInChatProps> = ({ customerId, onClose }) => {
  const { filteredCustomers: customers } = useAppContext();
  const navigate = useNavigate();
  const customer = customers.find(c => c.id === customerId);

  if (!customer) {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-white/10 px-4 py-3 max-w-md">
        <div className="text-xs text-gray-400">未找到客户 <span className="font-mono text-gray-600 dark:text-gray-300">{customerId}</span></div>
      </div>
    );
  }

  const handleClick = () => {
    onClose?.();
    navigate(`/customers/${customer.id}`);
  };

  const initial = customer.companyName?.slice(0, 1) || '—';
  const displayLevel = customer.customerGrade || customer.level;
  const displayIndustry = customer.industryLine || customer.industry;
  const displayLocation = customer.province || customer.region;

  return (
    <div
      onClick={handleClick}
      className="group bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md cursor-pointer transition-all overflow-hidden max-w-md"
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0071E3] to-[#34AADC] flex items-center justify-center shrink-0 text-white text-sm font-bold">
            {customer.logo
              ? <img src={customer.logo} alt={customer.companyName} className="w-full h-full rounded-xl object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              : initial
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                {customer.companyName}
              </h3>
              {customer.status === 'Inactive' ? (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500">
                  停用
                </span>
              ) : (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                  活跃
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{customer.id}</p>
          </div>
        </div>

        {/* Meta Tags */}
        <div className="flex flex-wrap gap-1.5">
          {customer.customerType && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100 dark:bg-white/5 dark:text-gray-400 dark:border-white/10">
              {customer.customerType}
            </span>
          )}
          {displayLevel && (
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border-0 ${getLevelBadge(displayLevel)}`}>
              {displayLevel}
            </span>
          )}
          {customer.customerAttribute && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
              {customer.customerAttribute}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-1.5">
          {displayIndustry && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
              <Briefcase className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{displayIndustry}</span>
            </div>
          )}
          {displayLocation && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{displayLocation}{customer.city ? ` · ${customer.city}` : ''}</span>
            </div>
          )}
          {customer.ownerName && (
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
              <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">负责人：{customer.ownerName}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-white/5">
          <span className="text-[10px] text-gray-400">
            {customer.contacts?.length ? `${customer.contacts.length} 位联系人` : '暂无联系人'}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </div>
  );
};

export default CustomerCardInChat;
