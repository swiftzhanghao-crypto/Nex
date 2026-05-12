import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { isUnauthorized, type UserInfo } from '@/lib/wps-auth'
import { wpsAuth } from '@/services/wpsAuth'

export const useUserStore = defineStore('user', () => {
  const user = ref<UserInfo | null>(null)
  const loading = ref(false)
  /** 'unknown' 表示最近一次探测失败（网络/5xx/404 等非 401），区别于"明确未登录"。 */
  const probeError = ref<'unknown' | null>(null)

  const isLoggedIn = computed(() => !!user.value)

  /**
   * 探测当前登录态。返回值：
   * - 'authed'   已登录（user 已就位）
   * - 'unauthed' 明确未登录（401）
   * - 'unknown'  探测失败（网络/5xx/404 等）—— 守卫据此降级，不去外跳 OAuth
   */
  async function fetchUser(): Promise<'authed' | 'unauthed' | 'unknown'> {
    loading.value = true
    try {
      user.value = await wpsAuth.getUserInfo()
      probeError.value = null
      return 'authed'
    } catch (err) {
      user.value = null
      if (isUnauthorized(err)) {
        probeError.value = null
        return 'unauthed'
      }
      probeError.value = 'unknown'
      return 'unknown'
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await wpsAuth.logout()
    } finally {
      user.value = null
    }
  }

  function setUser(info: UserInfo) {
    user.value = info
  }

  return { user, loading, probeError, isLoggedIn, fetchUser, logout, setUser }
})
