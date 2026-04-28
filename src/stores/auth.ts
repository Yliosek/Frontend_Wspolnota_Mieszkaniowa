import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { clearTokens, setTokens } from '@/api/client'
import { AuthApi } from '@/api/endpoints'
import type { CurrentUser } from '@/api/types'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<CurrentUser | null>(null)
  const isAuthenticated = computed(() => currentUser.value !== null)
  const isAdmin = computed(() => currentUser.value?.role === 'administrator')
  const isResident = computed(() => currentUser.value?.role === 'resident')

  async function login(email: string, password: string): Promise<CurrentUser> {
    const tokens = await AuthApi.login(email, password)
    setTokens(tokens.access_token, tokens.refresh_token)
    const me = await AuthApi.me()
    currentUser.value = me
    return me
  }

  async function register(payload: {
    email: string
    password: string
    confirm_password: string
    first_name: string
    last_name: string
    verification_code: string
    accept_terms: boolean
  }) {
    return AuthApi.register(payload)
  }

  async function fetchMe(): Promise<CurrentUser | null> {
    try {
      const me = await AuthApi.me()
      currentUser.value = me
      return me
    } catch {
      currentUser.value = null
      return null
    }
  }

  function logout(): void {
    clearTokens()
    currentUser.value = null
  }

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    isResident,
    login,
    register,
    fetchMe,
    logout,
  }
})
