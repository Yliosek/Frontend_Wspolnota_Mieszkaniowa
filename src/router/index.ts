import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import UserView from '../views/UserView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/admin', name: 'admin', component: AdminView, meta: { role: 'administrator' } },
    { path: '/user', name: 'user', component: UserView, meta: { role: 'resident' } },
  ],
})

router.beforeEach(async (to: RouteLocationNormalized) => {
  const auth = useAuthStore()
  if (to.meta.public) return true

  if (!auth.isAuthenticated) {
    const me = await auth.fetchMe()
    if (!me) return { name: 'login' }
  }

  const required = to.meta.role
  if (required && auth.currentUser?.role !== required) {
    return { name: auth.currentUser?.role === 'administrator' ? 'admin' : 'user' }
  }
  return true
})

export default router
