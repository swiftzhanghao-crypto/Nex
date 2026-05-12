<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

async function handleLogout() {
  await userStore.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="home-page">
    <div v-if="userStore.user" class="home-card">
      <div class="avatar">
        <img
          v-if="userStore.user.avatar"
          :src="userStore.user.avatar"
          alt="头像"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <span v-else class="avatar-fallback">{{ userStore.user.user_name?.charAt(0) }}</span>
      </div>

      <h1 class="user-name">{{ userStore.user.user_name }}</h1>
      <p class="badge">已登录</p>

      <div class="info-grid">
        <div class="info-row">
          <span class="label">用户 ID</span>
          <span class="value">{{ userStore.user.id }}</span>
        </div>
        <div v-if="userStore.user.company_id" class="info-row">
          <span class="label">企业 ID</span>
          <span class="value">{{ userStore.user.company_id }}</span>
        </div>
        <div v-if="userStore.user.local_id" class="info-row">
          <span class="label">本地 ID</span>
          <span class="value">{{ userStore.user.local_id }}</span>
        </div>
        <div v-if="userStore.user.expires_in" class="info-row">
          <span class="label">凭证剩余</span>
          <span class="value">{{ Math.floor(userStore.user.expires_in / 60) }} 分钟</span>
        </div>
      </div>

      <button class="btn-logout" @click="handleLogout">退出登录</button>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f6fa;
}

.home-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.avatar {
  width: 88px;
  height: 88px;
  margin: 0 auto 16px;
  border-radius: 50%;
  border: 3px solid #1a73e8;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-size: 36px;
  font-weight: 700;
  color: #1a73e8;
}

.user-name {
  font-size: 24px;
  margin: 0 0 8px;
  color: #1a1a2e;
}

.badge {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 20px;
  background: #dcfce7;
  color: #16a34a;
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 24px;
}

.info-grid {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 28px;
  text-align: left;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.info-row + .info-row {
  border-top: 1px solid #e9ecef;
}

.label {
  font-size: 13px;
  color: #888;
}

.value {
  font-size: 13px;
  color: #1a1a2e;
  font-weight: 600;
  font-family: ui-monospace, monospace;
}

.btn-logout {
  padding: 12px 36px;
  border: 2px solid #dc2626;
  border-radius: 10px;
  background: transparent;
  color: #dc2626;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #dc2626;
  color: #fff;
}
</style>
