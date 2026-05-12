import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * 销售易 CRM OAuth 回调中间页
 * URL: /#/crm-callback?status=ok&redirect=/customers  或  ?status=fail&error=...
 */
const CrmXsyCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get('status');
    const error = searchParams.get('error');
    const rawRedirect = searchParams.get('redirect') || '/customers';
    const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/customers';

    if (status === 'ok') {
      setMsg('CRM 授权成功，正在返回…');
      const t = setTimeout(() => navigate(redirect, { replace: true }), 800);
      return () => clearTimeout(t);
    }

    setMsg(error || 'CRM 授权失败');
  }, [searchParams, navigate]);

  const isOk = searchParams.get('status') === 'ok';

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 gap-4">
      <div className={`px-5 py-3 rounded-xl text-sm font-medium ${
        isOk
          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
      }`}>
        {msg}
      </div>
      {!isOk && (
        <button
          type="button"
          onClick={() => navigate('/customers', { replace: true })}
          className="text-[#0071E3] dark:text-[#0A84FF] underline text-sm font-medium"
        >
          返回客户列表
        </button>
      )}
    </div>
  );
};

export default CrmXsyCallback;
