import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const SABCustomerDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const base = import.meta.env.BASE_URL || '/';
  const iframeSrc = `${base}customer-detail.html`;

  return (
    <div className="flex flex-col h-[calc(100vh-0px)] min-h-[480px] bg-[#F5F5F7] dark:bg-black">
      <header className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-black/[0.06] dark:border-white/10 bg-white/90 dark:bg-[#1C1C1E]/95 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate('/sab-insight/customer-list')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#86868B] hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          返回客户列表
        </button>
        <span className="h-4 w-px bg-black/10 dark:bg-white/15" aria-hidden />
        <span className="text-sm text-[#86868B]">
          客户编号{' '}
          <span className="font-mono font-medium text-[#1D1D1F] dark:text-white/90">{id ?? '—'}</span>
        </span>
      </header>
      <iframe
        title="客户详情"
        src={iframeSrc}
        className="flex-1 w-full border-0 bg-white dark:bg-black"
      />
    </div>
  );
};

export default SABCustomerDetail;
