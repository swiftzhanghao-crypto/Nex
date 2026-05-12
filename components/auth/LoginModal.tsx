import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../contexts/AppContext';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function currentHashRedirectPath(): string {
    const hash = window.location.hash || '#/';
    const m = hash.match(/^#(\/.*)$/);
    let path = m ? m[1] : '/';
    if (path.startsWith('/sso-callback')) path = '/';
    return path;
}

const WPS_LOGO = (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className="shrink-0">
        <rect width="24" height="24" rx="4" fill="#D4382C"/>
        <path d="M4.5 8.5L6.5 15.5L8.5 11L10.5 15.5L12.5 8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 8.5V15.5M14 8.5H17C18.1046 8.5 19 9.39543 19 10.5V10.5C19 11.6046 18.1046 12.5 17 12.5H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const LoginModal: React.FC = () => {
    const { needsLogin, apiMode, login } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errMsg, setErrMsg] = useState<string | null>(null);
    const [ssoStatus, setSsoStatus] = useState<'unknown' | 'enabled' | 'disabled'>('unknown');

    useEffect(() => {
        if (!apiMode || !needsLogin) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/auth/wps/status`);
                const j = (await res.json()) as { enabled?: boolean };
                if (!cancelled) setSsoStatus(j.enabled ? 'enabled' : 'disabled');
            } catch {
                if (!cancelled) setSsoStatus('disabled');
            }
        })();
        return () => { cancelled = true; };
    }, [apiMode, needsLogin]);

    const handleSsoClick = useCallback((e: React.MouseEvent) => {
        if (ssoStatus !== 'enabled') {
            e.preventDefault();
            setErrMsg('WPS 365 SSO 尚未配置，请联系管理员设置 WPS_APP_ID / WPS_APP_SECRET / WPS_REDIRECT_URI 环境变量');
        }
    }, [ssoStatus]);

    if (!apiMode || !needsLogin) return null;

    const wpsLoginHref = ssoStatus === 'enabled'
        ? `${API_BASE}/auth/wps/login?redirect=${encodeURIComponent(currentHashRedirectPath())}`
        : '#';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setErrMsg('请输入邮箱与密码');
            return;
        }
        setSubmitting(true);
        setErrMsg(null);
        try {
            await login(email.trim(), password);
        } catch (err: any) {
            setErrMsg(err?.message || '登录失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <form
                onSubmit={handleSubmit}
                className="w-[380px] rounded-2xl bg-white shadow-2xl p-7 space-y-5"
            >
                <div className="text-center space-y-1">
                    <h2 className="text-xl font-bold text-gray-900">登录业务平台</h2>
                    <p className="text-xs text-gray-400">选择一种方式登录</p>
                </div>

                {/* SSO 登录入口 — skill 核心规则：必须用 <a href> 浏览器直接跳转 */}
                <a
                    href={wpsLoginHref}
                    onClick={handleSsoClick}
                    className={`flex w-full items-center justify-center gap-2.5 rounded-xl border py-2.5 text-sm font-medium transition
                        ${ssoStatus === 'enabled'
                            ? 'border-gray-200 text-gray-800 hover:bg-gray-50 hover:border-gray-300'
                            : 'border-gray-100 text-gray-400 hover:bg-gray-50 cursor-pointer'
                        }`}
                >
                    {WPS_LOGO}
                    WPS 365 账号登录
                    {ssoStatus === 'disabled' && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-normal">未配置</span>
                    )}
                </a>

                <div className="flex items-center gap-3 text-xs text-gray-300">
                    <span className="h-px flex-1 bg-gray-100" />
                    <span className="text-gray-400 font-medium">或使用账号密码</span>
                    <span className="h-px flex-1 bg-gray-100" />
                </div>

                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-gray-500">邮箱</label>
                        <input
                            type="email"
                            autoFocus
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                            placeholder="user@example.com"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-gray-500">密码</label>
                        <input
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
                            placeholder="123456"
                        />
                    </div>
                </div>

                {errMsg && (
                    <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errMsg}</div>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-blue-600 text-white py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                >
                    {submitting ? '登录中…' : '登录'}
                </button>

                <p className="text-[11px] text-gray-300 text-center">
                    开发环境：任意已存在用户邮箱 + 默认密码 123456
                </p>
            </form>
        </div>
    );
};

export default LoginModal;
