import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';

/**
 * SSO 回调页（Cookie+sid 方案）
 *
 * 新流程下，OAuth 成功后后端直接 302 到前端目标路径（cookie 已写好），
 * 这个页面只在 OAuth 失败时展示错误。保留路由以兼容旧书签和错误回显。
 *
 * 同时支持旧的 token-in-URL 模式作为 fallback（平滑过渡期）。
 */
const SSOCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeSsoLogin, apiMode } = useAppContext();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!apiMode) {
      navigate('/', { replace: true });
      return;
    }

    const err = searchParams.get('error');
    const legacyToken = searchParams.get('token');
    const rawRedirect = searchParams.get('redirect') || '/';
    const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';

    if (err) {
      setMsg(err);
      return;
    }

    // Fallback：兼容旧的 token-in-URL 模式
    if (legacyToken) {
      (async () => {
        try {
          await completeSsoLogin(legacyToken);
          navigate(redirect, { replace: true });
        } catch (e: unknown) {
          setMsg(e instanceof Error ? e.message : '登录失败');
        }
      })();
      return;
    }

    // 新流程：没有 error 也没有 token，说明是直接访问或已通过 cookie 登录
    navigate(redirect, { replace: true });
  }, [apiMode, searchParams, completeSsoLogin, navigate]);

  if (msg) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 gap-4">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-red-500">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">WPS 登录失败</p>
          <p className="text-sm text-gray-500 max-w-md">{msg}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="text-blue-600 underline text-sm font-medium hover:text-blue-700"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-gray-500 text-sm">
      正在完成登录…
    </div>
  );
};

export default SSOCallback;
