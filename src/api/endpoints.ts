import { apiClient } from './client'
import type {
  Announcement,
  CurrentUser,
  Invoice,
  InvoiceGenerateRequest,
  InvoicePayResponse,
  Issue,
  IssueCategory,
  IssueStatus,
  Payment,
  PaymentInitResponse,
  ResidentSummary,
  TokenPair,
  VerificationCode,
} from './types'

// --- Auth ---
export const AuthApi = {
  login: (email: string, password: string) =>
    apiClient.post<TokenPair>('/auth/login', { email, password }).then((r) => r.data),

  register: (payload: {
    email: string
    password: string
    confirm_password: string
    first_name: string
    last_name: string
    verification_code: string
    accept_terms: boolean
  }) => apiClient.post<{ message: string }>('/auth/register', payload).then((r) => r.data),

  me: () => apiClient.get<CurrentUser>('/auth/me').then((r) => r.data),

  changePassword: (current_password: string, new_password: string) =>
    apiClient
      .post<{ message: string }>('/auth/change-password', { current_password, new_password })
      .then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>('/auth/forgot-password', { email }).then((r) => r.data),
}

// --- Verification codes ---
export const CodesApi = {
  list: (only_active = true) =>
    apiClient
      .get<VerificationCode[]>('/verification-codes', { params: { only_active } })
      .then((r) => r.data),

  create: (flat_number: string, expires_in_days = 30) =>
    apiClient
      .post<VerificationCode>('/verification-codes', { flat_number, expires_in_days })
      .then((r) => r.data),

  remove: (id: number) =>
    apiClient.delete<void>(`/verification-codes/${id}`).then((r) => r.data),
}

// --- Announcements ---
export const AnnouncementsApi = {
  list: () => apiClient.get<Announcement[]>('/announcements').then((r) => r.data),

  create: (
    title: string,
    content: string,
    options: { publish?: boolean; notify_residents?: boolean; attachment?: File } = {},
  ) => {
    const fd = new FormData()
    fd.append('title', title)
    fd.append('content', content)
    fd.append('publish', String(options.publish ?? true))
    fd.append('notify_residents', String(options.notify_residents ?? false))
    if (options.attachment) fd.append('attachment', options.attachment)
    return apiClient.post<Announcement>('/announcements', fd).then((r) => r.data)
  },

  remove: (id: number) =>
    apiClient.delete<void>(`/announcements/${id}`).then((r) => r.data),
}

// --- Issues ---
export const IssuesApi = {
  list: (status_filter?: IssueStatus) =>
    apiClient
      .get<Issue[]>('/issues', { params: status_filter ? { status_filter } : {} })
      .then((r) => r.data),

  create: (
    title: string,
    description: string,
    category: IssueCategory,
    attachment?: File,
  ) => {
    const fd = new FormData()
    fd.append('title', title)
    fd.append('description', description)
    fd.append('category', category)
    if (attachment) fd.append('attachment', attachment)
    return apiClient.post<Issue>('/issues', fd).then((r) => r.data)
  },

  changeStatus: (id: number, status: IssueStatus) =>
    apiClient.patch<Issue>(`/issues/${id}/status`, { status }).then((r) => r.data),

  remove: (id: number) =>
    apiClient.delete<void>(`/issues/${id}`).then((r) => r.data),
}

// --- Payments ---
export const PaymentsApi = {
  balance: () =>
    apiClient.get<{ balance: string | number; currency: string }>('/payments/balance').then((r) => r.data),

  list: (resident_id?: number) =>
    apiClient
      .get<Payment[]>('/payments', { params: resident_id ? { resident_id } : {} })
      .then((r) => r.data),

  init: (amount: number, description?: string) =>
    apiClient
      .post<PaymentInitResponse>('/payments/init', {
        amount,
        description,
        method: 'blik',
      })
      .then((r) => r.data),

  confirmBlik: (payment_id: number, blik_code: string) =>
    apiClient
      .post<Payment>(`/payments/${payment_id}/confirm-blik`, { blik_code })
      .then((r) => r.data),

  cancel: (payment_id: number) =>
    apiClient.post<Payment>(`/payments/${payment_id}/cancel`).then((r) => r.data),
}

// --- Users (admin) ---
export const UsersApi = {
  listResidents: () =>
    apiClient.get<ResidentSummary[]>('/users/residents').then((r) => r.data),
}

// --- Invoices ---
export const InvoicesApi = {
  list: (resident_id?: number) =>
    apiClient
      .get<Invoice[]>('/invoices', { params: resident_id ? { resident_id } : {} })
      .then((r) => r.data),

  adminGenerate: (resident_id: number, payload: InvoiceGenerateRequest) =>
    apiClient
      .post<Invoice[]>(`/invoices/admin/generate/${resident_id}`, payload)
      .then((r) => r.data),

  pay: (invoice_id: number, method: 'blik' | 'transfer' = 'blik') =>
    apiClient
      .post<InvoicePayResponse>(`/invoices/${invoice_id}/pay`, { method })
      .then((r) => r.data),
}
