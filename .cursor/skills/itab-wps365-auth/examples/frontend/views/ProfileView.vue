<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<template>
  <div v-if="!userStore.user" class="profile-empty">
    <p>正在加载...</p>
  </div>
  <div class="profile" v-else>
    <div class="profile-card">
      <div class="avatar">
        <img
          v-if="userStore.user.avatar"
          :src="userStore.user.avatar"
          alt="头像"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <span v-else class="avatar-fallback">{{ userStore.user.user_name?.charAt(0) }}</span>
      </div>

      <h2 class="user-name">{{ userStore.user.user_name }}</h2>
      <p class="page-tag">个人中心</p>

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
    </div>
  </div>
</template>

<style scoped>
.profile-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 56px);
  color: #aaa;
  font-size: 14px;
}

.profile {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 56px);
}

.profile-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 36px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 14px;
  border-radius: 50%;
  border: 3px solid #764ba2;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3e8ff;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  font-size: 32px;
  font-weight: 700;
  color: #764ba2;
}

.user-name {
  font-size: 22px;
  margin: 0 0 8px;
  color: #1a1a2e;
}

.page-tag {
  display: inline-block;
  padding: 3px 14px;
  border-radius: 20px;
  background: #f3e8ff;
  color: #764ba2;
  font-size: 12px;
  font-weight: 600;
  margin: 0 0 24px;
}

.info-grid {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 14px 18px;
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
</style>
