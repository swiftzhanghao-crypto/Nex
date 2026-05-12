<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { loginURL } from '@/lib/wps-auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const error = ref('')

const errorMessages: Record<string, string> = {
  missing_code: '未收到授权码',
  invalid_state: '安全校验失败 (state 不匹配)，请重新登录',
  token_exchange_failed: '换取凭证失败',
  userinfo_failed: '获取用户信息失败',
  internal: '内部错误，请重试',
}

const loginHref = computed(() => loginURL(route.path))

onMounted(async () => {
  const err = route.query.error as string
  if (err) error.value = errorMessages[err] || err

  if (!userStore.isLoggedIn) {
    try { await userStore.fetchUser() } catch { /* 未登录 */ }
  }

  if (userStore.isLoggedIn && err) {
    router.replace({ path: route.path, query: {} })
  }
})

async function handleLogout() {
  await userStore.logout()
  router.replace('/')
}
</script>

<template>
  <div class="app-layout">
    <nav class="navbar">
      <router-link class="brand" to="/">
        <span class="brand-icon">W</span>
        <span class="brand-text">WPS 365</span>
      </router-link>

      <div class="nav-right">
        <template v-if="userStore.isLoggedIn">
          <router-link class="nav-link" to="/profile">个人中心</router-link>
          <button class="nav-btn logout" @click="handleLogout">退出</button>
        </template>
        <a v-else class="nav-btn login" :href="loginHref">登录</a>
      </div>
    </nav>

    <p v-if="error" class="global-error">{{ error }}</p>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style>
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f6fa;
  color: #1a1a2e;
}
</style>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #1a73e8, #6c3ce0);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.brand-text {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-link {
  font-size: 14px;
  color: #555;
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #1a73e8;
  background: #eef2ff;
}

.nav-btn {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  text-decoration: none;
}

.nav-btn.login {
  background: linear-gradient(135deg, #1a73e8, #6c3ce0);
  color: #fff;
}

.nav-btn.login:hover {
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.4);
}

.nav-btn.logout {
  background: transparent;
  color: #888;
  border: 1px solid #ddd;
}

.nav-btn.logout:hover {
  color: #dc2626;
  border-color: #dc2626;
}

.global-error {
  text-align: center;
  color: #dc2626;
  font-size: 13px;
  padding: 8px 16px;
  background: #fee2e2;
}

.main-content {
  flex: 1;
}
</style>
