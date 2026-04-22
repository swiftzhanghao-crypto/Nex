import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';

const LoginModal: React.FC = () => {
    const { needsLogin, apiMode, login } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errMsg, setErrMsg] = useState<string | null>(null);

    if (!apiMode || !needsLogin) return null;

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
                className="w-[360px] rounded-lg bg-white shadow-2xl p-6 space-y-4"
            >
                <h2 className="text-lg font-semibold text-gray-800">登录业务平台</h2>
                <div className="space-y-2">
                    <label className="block text-sm text-gray-600">邮箱</label>
                    <input
                        type="email"
                        autoFocus
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        placeholder="user@example.com"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm text-gray-600">密码</label>
                    <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        placeholder="123456"
                    />
                </div>
                {errMsg && (
                    <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{errMsg}</div>
                )}
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                    {submitting ? '登录中…' : '登录'}
                </button>
                <p className="text-xs text-gray-400 text-center">
                    开发环境：任意已存在用户邮箱 + 默认密码
                </p>
            </form>
        </div>
    );
};

export default LoginModal;
