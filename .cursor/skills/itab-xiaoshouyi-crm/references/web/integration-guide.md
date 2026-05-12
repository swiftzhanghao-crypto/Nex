# 销售易 CRM 前端接入指南

## 前提

项目已接入 SSO 登录（参见 `itab-kso-sso` 技能），用户已登录状态下才能发起 CRM 授权。

## 核心问题：code 参数冲突

SSO 登录和 CRM 授权都通过 OAuth 回调带 `?code=xxx`，必须区分：

| 路径 | 含义 | 处理方 |
|------|------|--------|
| `/?code=xxx` | SSO 登录 code | `checkOauth()` → 后端 `/login` 换票 |
| `/crm/callback?code=xxx` | CRM 授权 code | `CrmCallbackView` → 后端 `/api/crm/auth` |

**路径是区分标志**。`checkOauth()` 中检测到 pathname 以 `/crm/callback` 开头时必须忽略 `code`，让 SSO 逻辑跳过。

## 授权流程

```
用户已登录 → 点击「CRM 授权」按钮（<a href>）
  → 跳转销售易 OAuth 页面（redirect_uri = VITE_CRM_REDIRECT_URI）
  → 用户在销售易授权
  → 重定向到中间页：/crm/callback?code=xxx
  → router guard：checkOauth() 识别路径，跳过 SSO 换票
  → CrmCallbackView.onMounted：调 POST /api/crm/auth { code, redirect_uri }
  → 显示 loading/成功/失败，router.replace('/?crm=ok') 回首页
  → 首页读取 ?crm=ok|fail 展示提示并清 query
```

## 接入步骤

### 1. 环境变量

`.env.development`：

```
VITE_CRM_REDIRECT_URI=http://localhost:8081/crm/callback
```

生产/测试环境对应各自域名。**必须把每个环境的 redirect_uri 加入销售易开发者后台的 OAuth 白名单**，否则回跳会被拒。

`src/types/env.d.ts` 加类型声明：

```typescript
interface ImportMetaEnv {
  readonly VITE_CRM_REDIRECT_URI: string
  // ...
}
```

### 2. 修改 `src/utils/auth.ts`

在 `checkOauth()` 中，按路径判断是否为 CRM 回调，跳过 SSO code 消耗：

```typescript
const params = new URLSearchParams(window.location.search)
const isCrmCallback = window.location.pathname.startsWith('/crm/callback')
const code = isCrmCallback ? null : params.get('code')
```

这确保 CRM 回调的 `code` 不会被 SSO 逻辑错误消费。

### 3. 创建 `src/api/crm.ts`

```typescript
import { http } from '@/utils/request'

/** 用 CRM OAuth code 完成授权绑定。后端要求 form 体，redirect_uri 必须与授权时一致（OAuth 规范）。 */
export async function authCrm(code: string) {
  const body = new URLSearchParams({
    code,
    redirect_uri: import.meta.env.VITE_CRM_REDIRECT_URI,
  })
  return http.post('/api/crm/auth', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

const CRM_CLIENT_ID = '<your-crm-client-id>'
const CRM_AUTH_BASE = 'https://login-sandbox.xiaoshouyi.com/auc/oauth2/auth'

/** 构建 CRM OAuth 授权跳转 URL；redirect_uri 由 VITE_CRM_REDIRECT_URI 控制。 */
export function buildCrmAuthUrl(): string {
  const redirectUri = encodeURIComponent(import.meta.env.VITE_CRM_REDIRECT_URI)
  return `${CRM_AUTH_BASE}?client_id=${CRM_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&scope=all&oauthType=standard`
}
```

**要点**：
- `authCrm` 用 `application/x-www-form-urlencoded`，后端 `req.RedirectUri` 字段必需。
- `redirect_uri` 跟授权跳转时用的必须完全一致，否则 OAuth 换票会失败。
- `CRM_CLIENT_ID` 替换为实际的销售易 appId。

### 4. 新增中间页 `src/views/CrmCallbackView.vue`

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authCrm } from '@/api/crm'

const route = useRoute()
const router = useRouter()
const status = ref<'loading' | 'success' | 'fail'>('loading')
const errMsg = ref('')

onMounted(async () => {
  const code = (route.query.code as string) || ''
  if (!code) {
    router.replace('/')
    return
  }

  try {
    await authCrm(code)
    status.value = 'success'
    setTimeout(() => router.replace({ path: '/', query: { crm: 'ok' } }), 600)
  } catch (e) {
    status.value = 'fail'
    errMsg.value = e instanceof Error ? e.message : String(e)
    setTimeout(() => router.replace({ path: '/', query: { crm: 'fail' } }), 1500)
  }
})
</script>

<template>
  <div class="wrap">
    <div v-if="status === 'loading'" class="card">正在完成 CRM 授权…</div>
    <div v-else-if="status === 'success'" class="card success">CRM 授权成功,正在返回首页…</div>
    <div v-else class="card fail">CRM 授权失败：{{ errMsg }}</div>
  </div>
</template>
```

**为什么独立中间页**：
- 职责单一：组件只负责换票，守卫保持纯粹（SSO + 用户信息），业务页不感知 OAuth。
- SPA 内跳转（`router.replace`）避免整页 reload，保留 console/state，便于调试。
- 独立 UI 承载 loading/成功/失败反馈，用户知晓当前状态。
- 扩展其他第三方 OAuth（飞书、钉钉等）时只需新增独立路由和组件，模式复用。

### 5. 注册路由

`src/router/index.ts`：

```typescript
import CrmCallbackView from '@/views/CrmCallbackView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'ledger', component: LedgerHomeView },
    { path: '/crm/callback', name: 'crm-callback', component: CrmCallbackView },
  ],
})
```

`beforeEach` 只负责通用的 SSO 检查和用户信息加载，CRM 回调由 `CrmCallbackView` 自己在 `onMounted` 里处理。

### 6. 首页：入口按钮 + 结果提示

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildCrmAuthUrl } from '@/api/crm'

const route = useRoute()
const router = useRouter()
const crmAuthUrl = computed(() => buildCrmAuthUrl())
const crmMsg = ref('')

function consumeCrmQuery() {
  const flag = route.query.crm
  if (flag === 'ok') crmMsg.value = 'CRM 授权成功'
  else if (flag === 'fail') crmMsg.value = 'CRM 授权失败'
  if (flag) router.replace({ path: '/', query: {} })
}

onMounted(() => {
  consumeCrmQuery()
})
</script>

<template>
  <a :href="crmAuthUrl">CRM 授权</a>
  <div v-if="crmMsg" class="alert">{{ crmMsg }}</div>
</template>
```

用 `<a>` 而不是 `window.location` 跳转，让用户能看到目标地址、支持右键新窗口。

### 7. Vite 代理

确保 `/api` 路径代理到后端：

```typescript
proxy: {
  '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true },
}
```

## 关键约定

- **独立路由 `/crm/callback` 是 CRM 回调的唯一承载点**，回调处理逻辑都在 `CrmCallbackView` 内。
- `VITE_CRM_REDIRECT_URI` 在每个环境分别配置，且**必须**和销售易后台白名单一致。
- `authCrm` 请求中 `redirect_uri` 必须和授权时传给销售易的完全一致（含大小写、query），否则 OAuth 规范要求后端拒绝换票。
- CRM 的 `code` 是一次性的，后端 `/api/crm/auth` 负责用它换取 CRM access token 并持久化。
- 前端只负责跳转和传递 code，不直接调用销售易 API。
- **扩展到其他第三方 OAuth**（飞书、钉钉等）：复用相同模式，用不同 path 区分（如 `/feishu/callback`、`/dingtalk/callback`），每个对应独立中间页。

## 代码模板

完整文件模板见 [../../examples/web/frontend-files.md](../../examples/web/frontend-files.md)。
