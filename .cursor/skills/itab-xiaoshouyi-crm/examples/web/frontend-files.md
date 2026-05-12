# CRM OAuth 前端文件模板

在已有 SSO 登录的项目中添加 CRM 授权，涉及以下文件。核心思路：独立回调路由 `/crm/callback` + 中间页组件处理换票，避免把业务逻辑塞进守卫或首页。

---

## 新增文件：`.env.development`（及其他环境对应 env）

```
VITE_CRM_REDIRECT_URI=http://localhost:8081/crm/callback
```

生产/测试环境对应各自域名。**每个环境的 `redirect_uri` 必须加入销售易开发者后台的 OAuth 白名单**，否则授权后回跳会被拒绝。

---

## 修改文件：`src/types/env.d.ts`

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CRM_REDIRECT_URI: string
  // ... 其他 env
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

## 新增文件：`src/api/crm.ts`

```typescript
import { http } from '@/utils/request'

/**
 * 用 CRM OAuth code 完成授权绑定。
 * 后端要求 form 体；redirect_uri 必须与授权时传给销售易的完全一致（OAuth 规范）。
 */
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

替换 `CRM_CLIENT_ID` 为实际值。如果多环境 client_id 不同，可改为 `VITE_CRM_CLIENT_ID`。

---

## 修改文件：`src/utils/auth.ts`

在 `checkOauth()` 中按 pathname 判断是否为 CRM 回调，跳过 SSO code 消耗：

```typescript
const params = new URLSearchParams(window.location.search)
const isCrmCallback = window.location.pathname.startsWith('/crm/callback')
const code = isCrmCallback ? null : params.get('code')
```

这样 CRM 回调的 `code` 不会被 SSO 的 `/login` 换票逻辑错误消费。

---

## 新增文件：`src/views/CrmCallbackView.vue`

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

<style scoped>
.wrap {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card {
  padding: 16px 24px;
  border-radius: 8px;
  background: #f6f7f9;
  font-size: 14px;
}
.card.success {
  background: #e8f7ef;
  color: #2a7a44;
}
.card.fail {
  background: #fdecea;
  color: #b42318;
}
</style>
```

换票成功/失败后通过 `?crm=ok|fail` 带回首页，首页据此展示提示。

---

## 修改文件：`src/router/index.ts`

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { checkOauth } from '@/utils/auth'
import { useUserStore } from '@/stores/user'
import LedgerHomeView from '@/views/LedgerHomeView.vue'
import CrmCallbackView from '@/views/CrmCallbackView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'ledger', component: LedgerHomeView },
    { path: '/crm/callback', name: 'crm-callback', component: CrmCallbackView },
  ],
})

router.beforeEach(async (_to, _from, next) => {
  if (!checkOauth()) return

  const userStore = useUserStore()
  userStore.refreshToken()
  try {
    await userStore.loadUserInfo()
  } catch {
    return
  }

  next()
})
```

守卫保持纯粹：只管 SSO + 用户信息。CRM 相关逻辑都在 `CrmCallbackView` 里。

---

## 修改文件：首页组件（授权按钮 + 结果提示）

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
  <a :href="crmAuthUrl" class="btn-crm">CRM 授权</a>
  <div v-if="crmMsg" class="alert" :class="{ success: crmMsg.startsWith('CRM 授权成功') }">{{ crmMsg }}</div>
</template>

<style scoped>
.btn-crm {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
}

.btn-crm:hover {
  background: #e2e8f0;
}

.alert {
  margin: 12px 0;
  padding: 10px 14px;
  border-radius: 6px;
  background: #fdecea;
  color: #b42318;
}
.alert.success {
  background: #e8f7ef;
  color: #2a7a44;
}
</style>
```

用 `<a>` 而不是 `window.location` 跳转，让用户能看到目标地址、支持右键新窗口。

---

## 修改文件：`vite.config.ts`

确保 `/api` 代理到后端：

```typescript
server: {
  proxy: {
    '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true },
    // ... 其他代理规则
  },
}
```
