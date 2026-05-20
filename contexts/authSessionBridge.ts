/** AppProvider 注册会话钩子，供 AuthProvider 在 login/logout 后同步业务数据 */
export type AuthSessionBridge = {
    onAfterLogin: () => Promise<void>;
    onAfterLogout: () => void;
    onBeforeLoginReset?: () => void;
};

const bridge: { current: AuthSessionBridge | null } = { current: null };

export function registerAuthSessionBridge(next: AuthSessionBridge | null) {
    bridge.current = next;
}

export function getAuthSessionBridge(): AuthSessionBridge | null {
    return bridge.current;
}
