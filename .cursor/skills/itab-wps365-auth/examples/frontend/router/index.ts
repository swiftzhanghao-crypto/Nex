import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { createVueAuthGuard, loginURL, type AuthState } from '@/lib/wps-auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
  ],
})

router.beforeEach(
  createVueAuthGuard({
    publicPaths: ['/'],
    authMode: 'redirect',
    oauthURL: (redirect) => loginURL(redirect),
    ensureAuth: async (): Promise<AuthState> => {
      const store = useUserStore()
      if (store.isLoggedIn) return true
      const result = await store.fetchUser()
      if (result === 'authed') return true
      if (result === 'unauthed') return false
      return 'unknown' // 守卫据此 fallback，不去外跳 OAuth，避免后端探测失败时死循环
    },
  }),
)

export default router
