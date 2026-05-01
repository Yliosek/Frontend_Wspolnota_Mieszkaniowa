export type UserRole = 'resident' | 'administrator'

export interface CurrentUser {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string | null
  role: UserRole
  is_active: boolean
  flat_number?: string | null
  balance?: string | number | null
  admin_level?: number | null
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface VerificationCode {
  id: number
  code: string
  flat_number: string
  is_used: boolean
  used_at: string | null
  expires_at: string | null
  created_at: string
}

export interface Announcement {
  id: number
  title: string
  content: string
  status: 'draft' | 'published'
  published_at: string | null
  notify_residents: boolean
  attachment_url: string | null
  author_id: number | null
  author_name: string | null
  created_at: string
  updated_at: string
}

export type IssueStatus = 'new' | 'in_progress' | 'completed' | 'rejected'
export type IssueCategory =
  | 'elevator'
  | 'lighting'
  | 'cleaning'
  | 'intercom'
  | 'heating'
  | 'plumbing'
  | 'other'

export interface Issue {
  id: number
  title: string
  description: string
  category: IssueCategory
  status: IssueStatus
  attachment_url: string | null
  resident_id: number
  resident_email?: string | null
  resident_flat?: string | null
  created_at: string
  updated_at: string
}

export type PaymentStatus =
  | 'initialized'
  | 'pending'
  | 'completed'
  | 'rejected'
  | 'cancelled'

export interface Payment {
  id: number
  amount: string | number
  description: string | null
  method: 'blik' | 'transfer'
  status: PaymentStatus
  external_transaction_id: string | null
  created_at: string
  updated_at: string
}

export interface PaymentInitResponse {
  payment_id: number
  external_transaction_id: string
  status: PaymentStatus
  redirect_url: string | null
}

export interface ResidentSummary {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string | null
  role: 'resident'
  is_active: boolean
  flat_number: string
  balance: string | number
  created_at: string
}

export type InvoiceType = 'water' | 'electricity'
export type InvoiceStatus = 'pending' | 'paid' | 'cancelled'

export interface Invoice {
  id: number
  type: InvoiceType
  amount: string | number
  quantity: string | number | null
  unit_price: string | number | null
  late_fee: string | number
  issue_date: string
  due_date: string
  status: InvoiceStatus
  paid_at: string | null
  description: string | null
  resident_id: number
  payment_id: number | null
  created_at: string
  updated_at: string
}

export interface InvoiceItemInput {
  type: InvoiceType
  quantity?: number
  unit_price?: number
  amount?: number
  description?: string | null
}

export interface InvoiceGenerateRequest {
  items: InvoiceItemInput[]
  issue_date?: string | null
  due_date?: string | null
}

export interface InvoicePayResponse {
  invoice_id: number
  base_amount: string | number
  late_fee: string | number
  days_overdue: number
  total_paid: string | number
  payment_id: number
  status: InvoiceStatus
}
