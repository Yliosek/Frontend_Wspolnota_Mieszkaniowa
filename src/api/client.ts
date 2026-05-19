import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
})

const ACCESS_KEY = 'wm_access_token'
const REFRESH_KEY = 'wm_refresh_token'

function normalizeBackendMessage(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/String should have at least (\d+) characters/gi, 'Pole musi mieć co najmniej $1 znaków')
      .replace(/String should have at most (\d+) characters/gi, 'Pole może mieć maksymalnie $1 znaków')
      .replace(/Field required/gi, 'Pole jest wymagane')
      .replace(/Input should be a valid string/gi, 'Wartość musi być tekstem')
      .replace(/Input should be a valid number/gi, 'Wartość musi być liczbą')
      .replace(/Input should be a valid integer/gi, 'Wartość musi być liczbą całkowitą')
      .replace(/Input should be a valid boolean/gi, 'Wartość musi być prawdą albo fałszem')
  }
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        return { ...record, msg: normalizeBackendMessage(record.msg) }
      }
      return item
    })
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const normalized: Record<string, unknown> = { ...record }
    if ('detail' in normalized) normalized.detail = normalizeBackendMessage(normalized.detail)
    if ('msg' in normalized) normalized.msg = normalizeBackendMessage(normalized.msg)
    return normalized
  }
  return value
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing: Promise<string> | null = null

async function performRefresh(): Promise<string> {
  const refresh = getRefreshToken()
  if (!refresh) throw new Error('No refresh token')
  const { data } = await axios.post(`${baseURL}/auth/refresh`, {
    refresh_token: refresh,
  })
  setTokens(data.access_token, data.refresh_token)
  return data.access_token
}

apiClient.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError) => {
    if (error.response?.data && typeof error.response.data === 'object') {
      error.response.data = normalizeBackendMessage(error.response.data) as typeof error.response.data
    }
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/login') &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true
      try {
        if (!refreshing) refreshing = performRefresh()
        const newToken = await refreshing
        refreshing = null
        if (original.headers) original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch (e) {
        refreshing = null
        clearTokens()
        if (typeof window !== 'undefined') window.location.href = '/'
        return Promise.reject(e)
      }
    }
    return Promise.reject(error)
  },
)
