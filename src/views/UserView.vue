<template>
  <div class="user-layout">
    <aside class="sidebar">
      <div class="brand">
        <h2>Panel Mieszkańca</h2>
        <p class="brand-sub" v-if="authStore.currentUser">{{ authStore.currentUser.email }}</p>
      </div>

      <nav class="menu">
        <button :class="['menu-item', { active: activeTab === 'dashboard' }]" @click="activeTab = 'dashboard'">Pulpit</button>
        <button :class="['menu-item', { active: activeTab === 'data' }]" @click="activeTab = 'data'">Moje dane</button>
        <button :class="['menu-item', { active: activeTab === 'payments' }]" @click="activeTab = 'payments'">Opłaty</button>
        <button :class="['menu-item', { active: activeTab === 'report' }]" @click="activeTab = 'report'">Zgłoś usterkę</button>
        <button :class="['menu-item', { active: activeTab === 'history' }]" @click="activeTab = 'history'">Moje zgłoszenia</button>
        <button :class="['menu-item', { active: activeTab === 'security' }]" @click="activeTab = 'security'">Bezpieczeństwo</button>
      </nav>

      <div class="bottom-action">
        <button @click="logout" class="btn-logout">Wyloguj</button>
      </div>
    </aside>

    <main class="content-area">
      <div v-if="activeTab === 'dashboard'" class="tab-content fade-in">
        <h1 class="page-title">Dzień dobry, {{ authStore.currentUser?.first_name }}!</h1>
        <p class="description">Witaj w panelu swojej wspólnoty mieszkaniowej.</p>

        <div class="stats-grid">
          <div class="stat-card">
            <h3 v-if="Number(balance) > 0">Do spłacenia</h3>
            <h3 v-else>Saldo (opłacone)</h3>
            <p class="stat-number" :class="{ ok: Number(balance) <= 0, overdue: Number(balance) > 0 }">{{ formatMoney(balance) }} zł</p>
          </div>
          <div class="stat-card">
            <h3>Aktywne zgłoszenia</h3>
            <p class="stat-number">{{ activeIssuesCount }}</p>
          </div>
        </div>

        <div class="card info-card">
          <h3>Aktualności wspólnoty</h3>
          <div v-if="announcements.length === 0" class="empty-state">Brak ogłoszeń.</div>
          <div v-for="a in announcements" :key="a.id" class="ann-item">
            <strong>{{ a.title }}</strong>
            <p>{{ a.content }}</p>
            <small>{{ formatDate(a.created_at) }}</small>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'data'" class="tab-content fade-in">
        <h1 class="page-title">Twoje dane profilowe</h1>
        <div class="card">
          <div class="data-row"><span class="label">E-mail:</span><span class="value">{{ authStore.currentUser?.email }}</span></div>
          <div class="data-row"><span class="label">Imię:</span><span class="value">{{ authStore.currentUser?.first_name }}</span></div>
          <div class="data-row"><span class="label">Nazwisko:</span><span class="value">{{ authStore.currentUser?.last_name }}</span></div>
          <div class="data-row"><span class="label">Mieszkanie:</span><span class="value">{{ authStore.currentUser?.flat_number }}</span></div>
          <div class="data-row"><span class="label">Rola:</span><span class="value">Mieszkaniec</span></div>
        </div>
      </div>

      <div v-else-if="activeTab === 'payments'" class="tab-content fade-in">
        <h1 class="page-title">Rozliczenia</h1>

        <div class="card">
          <h3>Twoje saldo</h3>
          <p class="balance-big" :class="{ positive: Number(balance) <= 0, negative: Number(balance) > 0 }">{{ formatMoney(balance) }} zł</p>
          <p v-if="Number(balance) <= 0" class="ok-msg">✓ Wszystkie należności są uregulowane.</p>
          <p v-else class="warning-msg">⚠ Masz zaległości w wysokości {{ formatMoney(Math.abs(balance)) }} zł</p>

                  <div v-if="Number(balance) > 0" class="pay-block">
                    <h3>Zapłać zaległy czynsz (BLIK)</h3>
                    <div v-if="!activePayment">
                      <button class="btn-primary" @click="startFullPayment" :disabled="busy">Zapłać {{ formatMoney(balance) }} zł</button>
                    </div>
            <div v-else class="blik-form">
              <p>ID transakcji: <code>{{ activePayment.external_transaction_id }}</code></p>
              <label>Wpisz 6-cyfrowy kod BLIK:</label>
              <input
                v-model="blikCode"
                maxlength="6"
                placeholder="######"
                class="input-field code-input"
              />
              <div class="actions">
                <button class="btn-primary" @click="confirmBlik" :disabled="busy || blikCode.length !== 6">Potwierdź płatność</button>
                <button class="btn-link" @click="cancelPayment">Anuluj</button>
              </div>
              <p class="hint">Mock: dowolny 6-cyfrowy kod = sukces. Kod zaczynający się od "0" = odrzucenie.</p>
              <div v-if="paymentMsg" :class="['status-box', paymentError ? 'err' : 'ok']" style="margin-top:12px">{{ paymentMsg }}</div>
            </div>
          </div>
        </div>

          <div class="card">
          <h3>Faktury (woda i prąd)</h3>
          <div v-if="invoices.length === 0" class="empty-state">Brak faktur.</div>
          <table v-else class="payments-table">
            <thead>
              <tr>
                <th>Wystawiono</th>
                <th>Typ</th>
                <th>Zużycie</th>
                <th>Kwota</th>
                <th>Termin</th>
                <th>Odsetki</th>
                <th>Razem</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in invoices" :key="inv.id">
                <td>{{ inv.issue_date }}</td>
                <td>{{ inv.type === 'water' ? 'Woda' : 'Prąd' }}</td>
                <td>
                  <template v-if="inv.quantity">
                    {{ inv.quantity }} {{ inv.type === 'water' ? 'm³' : 'kWh' }}
                  </template>
                  <template v-else>–</template>
                </td>
                <td>{{ formatMoney(inv.amount) }} zł</td>
                <td>
                  {{ inv.due_date }}
                  <span v-if="inv.status === 'pending' && daysOverdue(inv) > 0" class="overdue">
                    (+{{ daysOverdue(inv) }} dni)
                  </span>
                </td>
                <td>{{ formatMoney(currentLateFee(inv)) }} zł</td>
                <td><strong>{{ formatMoney(invoiceTotal(inv)) }} zł</strong></td>
                <td><span :class="['status-pill', inv.status]">{{ translateInvoiceStatus(inv.status) }}</span></td>
                <td class="actions">
                  <button
                    v-if="inv.status === 'pending'"
                    class="btn-pay"
                    :disabled="busy"
                    @click="payInvoice(inv)"
                  >Zapłać</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <h3>Historia płatności</h3>
          <div v-if="payments.length === 0" class="empty-state">Brak transakcji.</div>
          <table v-else class="payments-table">
            <thead>
              <tr><th>Data</th><th>Kwota</th><th>Opis</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in payments" :key="p.id">
                <td>{{ formatDate(p.created_at) }}</td>
                <td>{{ formatMoney(p.amount) }} zł</td>
                <td>{{ translatePaymentDescription(p.description) }}</td>
                <td><span :class="['status-pill', p.status]">{{ translatePaymentStatus(p.status) }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="activeTab === 'report'" class="tab-content fade-in">
        <h1 class="page-title">Zgłoś usterkę</h1>
        <div class="card report-form">
          <div class="form-group">
            <label>Tytuł</label>
            <input type="text" v-model="newIssue.title" class="input-field" />
          </div>
          <div class="form-group">
            <label>Rodzaj usterki</label>
            <select v-model="newIssue.category" class="input-field">
              <option value="elevator">Winda</option>
              <option value="lighting">Oświetlenie</option>
              <option value="cleaning">Czystość</option>
              <option value="intercom">Domofon</option>
              <option value="heating">Ogrzewanie</option>
              <option value="plumbing">Hydraulika</option>
              <option value="other">Inne</option>
            </select>
          </div>
          <div class="form-group">
            <label>Opis problemu</label>
            <textarea v-model="newIssue.description" placeholder="Opisz krótko co się stało..." class="input-field"></textarea>
          </div>
          <div class="form-group">
            <label>Załącznik (JPG/PNG, max 5MB)</label>
            <input type="file" accept="image/jpeg,image/png" @change="onFileChange" />
          </div>
          <button class="btn-primary" @click="submitIssue" :disabled="busy">
            {{ busy ? 'Wysyłanie...' : 'Wyślij zgłoszenie' }}
          </button>
          <div v-if="issueMsg" :class="['status-box', issueError ? 'err' : 'ok']" style="margin-top:12px">{{ issueMsg }}</div>
        </div>
      </div>

      <div v-else-if="activeTab === 'history'" class="tab-content fade-in">
        <h1 class="page-title">Moje zgłoszenia</h1>
        <div v-if="issues.length === 0" class="card"><p class="empty-state">Brak zgłoszeń.</p></div>
        <div v-for="i in issues" :key="i.id" class="card fault-card">
          <div class="fault-header">
            <span class="fault-cat">{{ translateIssueCategory(i.category) }}</span>
            <span :class="['status-pill', i.status]">{{ translateIssueStatus(i.status) }}</span>
          </div>
          <h3>{{ i.title }}</h3>
          <p>{{ i.description }}</p>
          <a v-if="i.attachment_url" :href="i.attachment_url" target="_blank">Załącznik</a>
          <small class="block">Zgłoszono: {{ formatDate(i.created_at) }}</small>
        </div>
      </div>

      <div v-else-if="activeTab === 'security'" class="tab-content fade-in">
        <h1 class="page-title">Bezpieczeństwo</h1>
        <p class="description">Zarządzaj ustawieniami bezpieczeństwa swojego konta.</p>

        <div class="card">
          <h3>Zmiana hasła</h3>
          <div class="form-group">
            <label>Obecne hasło</label>
            <div class="password-wrapper">
              <input
                :type="showCurrentPassword ? 'text' : 'password'"
                v-model="changePasswordForm.current_password"
                class="input-field"
              />
              <button type="button" class="btn-show-password" @click="showCurrentPassword = !showCurrentPassword">
                  <svg v-if="showCurrentPassword" viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                    <path d="M9.88 5.09A10.7 10.7 0 0 1 12 5c5.5 0 9.5 4.5 10.5 7-0.34.86-1.1 2.07-2.18 3.22" />
                    <path d="M6.61 6.61C3.95 8.24 2.34 10.86 1.5 12c1 2.5 5 7 10.5 7 1.52 0 2.95-.24 4.25-.68" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Nowe hasło (min 8 znaków, duża litera + cyfra)</label>
            <div class="password-wrapper">
              <input
                :type="showNewPassword ? 'text' : 'password'"
                v-model="changePasswordForm.new_password"
                class="input-field"
              />
              <button type="button" class="btn-show-password" @click="showNewPassword = !showNewPassword">
                  <svg v-if="showNewPassword" viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                    <path d="M9.88 5.09A10.7 10.7 0 0 1 12 5c5.5 0 9.5 4.5 10.5 7-0.34.86-1.1 2.07-2.18 3.22" />
                    <path d="M6.61 6.61C3.95 8.24 2.34 10.86 1.5 12c1 2.5 5 7 10.5 7 1.52 0 2.95-.24 4.25-.68" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Powtórz nowe hasło</label>
            <div class="password-wrapper">
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="changePasswordForm.confirm_password"
                class="input-field"
              />
              <button type="button" class="btn-show-password" @click="showConfirmPassword = !showConfirmPassword">
                  <svg v-if="showConfirmPassword" viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                    <path d="M9.88 5.09A10.7 10.7 0 0 1 12 5c5.5 0 9.5 4.5 10.5 7-0.34.86-1.1 2.07-2.18 3.22" />
                    <path d="M6.61 6.61C3.95 8.24 2.34 10.86 1.5 12c1 2.5 5 7 10.5 7 1.52 0 2.95-.24 4.25-.68" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
              </button>
            </div>
          </div>
          <button class="btn-primary" @click="handleChangePassword" :disabled="busy">
            {{ busy ? 'Zmiana hasła...' : 'Zmień hasło' }}
          </button>
          <div v-if="passwordChangeMsg" :class="['status-box', passwordChangeError ? 'err' : 'ok']" style="margin-top: 12px;">
            {{ passwordChangeMsg }}
          </div>
        </div>
        <!-- payment confirmation modal removed to fix template syntax; will reintroduce later -->
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { AnnouncementsApi, InvoicesApi, IssuesApi, PaymentsApi } from '@/api/endpoints'
import { apiClient } from '@/api/client'
import { translatePaymentStatus, translateInvoiceStatus, translateIssueStatus, translateIssueCategory } from '@/utils/translations'
import type {
  Announcement,
  Invoice,
  Issue,
  IssueCategory,
  Payment,
  PaymentInitResponse,
} from '@/api/types'

const LATE_FEE_DAILY_RATE = 0.01 // mirror of backend constant

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref<'dashboard' | 'data' | 'payments' | 'report' | 'history' | 'security'>('dashboard')
const busy = ref(false)

const announcements = ref<Announcement[]>([])
const issues = ref<Issue[]>([])
const payments = ref<Payment[]>([])
const invoices = ref<Invoice[]>([])
const balance = ref<number>(0)

const activePayment = ref<PaymentInitResponse | null>(null)
const blikCode = ref('')

const newIssue = reactive<{ title: string; description: string; category: IssueCategory; file: File | null }>({
  title: '',
  description: '',
  category: 'other',
  file: null,
})

const issueMsg = ref('')
const issueError = ref(false)
const paymentMsg = ref('')
const paymentError = ref(false)

const changePasswordForm = reactive({ current_password: '', new_password: '', confirm_password: '' })
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordChangeMsg = ref('')
const passwordChangeError = ref(false)

const activeIssuesCount = computed(() =>
  issues.value.filter((i) => i.status === 'new' || i.status === 'in_progress').length,
)

const pendingInvoicesTotal = computed(() => {
  return invoices.value
    .filter((inv) => inv.status === 'pending')
    .reduce((sum, inv) => sum + invoiceTotal(inv), 0)
})

function formatDate(d: string) {
  return new Date(d).toLocaleString('pl-PL')
}

function formatMoney(v: number | string) {
  const n = typeof v === 'string' ? parseFloat(v) : v
  return n.toFixed(2)
}

async function loadAll() {
  try {
    const [a, b, p, i, inv] = await Promise.all([
      AnnouncementsApi.list(),
      PaymentsApi.balance(),
      PaymentsApi.list(),
      IssuesApi.list(),
      InvoicesApi.list(),
    ])
    announcements.value = a
    balance.value = typeof b.balance === 'string' ? parseFloat(b.balance) : b.balance
    payments.value = p
    issues.value = i
    invoices.value = inv
  } catch (e) {
    console.error(e)
  }
}

// Refresh data when switching to payments or dashboard tab
watch(activeTab, async (newTab) => {
  if (newTab === 'dashboard' || newTab === 'payments') {
    await loadAll()
  }
})

function daysOverdue(inv: Invoice): number {
  const due = new Date(inv.due_date + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000)
  return Math.max(diff, 0)
}

function currentLateFee(inv: Invoice): number {
  if (inv.status !== 'pending') {
    return Number(inv.late_fee) || 0
  }
  const base = Number(inv.amount)
  const days = daysOverdue(inv)
  return Math.round(base * LATE_FEE_DAILY_RATE * days * 100) / 100
}

function invoiceTotal(inv: Invoice): number {
  return Math.round((Number(inv.amount) + currentLateFee(inv)) * 100) / 100
}

const payConfirmationTarget = ref<Invoice | null>(null)
const payMsg = ref('')
const payError = ref(false)

async function payInvoice(inv: Invoice) {
  payMsg.value = ''
  payError.value = false
  if (!inv) return
  // Start a payment flow for this single invoice (BLIK)
  payConfirmationTarget.value = inv
  await startPayment(Number(invoiceTotal(inv)), `Invoice #${inv.id}`)
}

async function startFullPayment() {
  await startPayment()
}

async function confirmPay() {
  if (!payConfirmationTarget.value) return
  busy.value = true
  payMsg.value = ''
  payError.value = false
  try {
    const res = await InvoicesApi.pay(payConfirmationTarget.value.id, { method: 'blik' })
    payMsg.value = `Opłacono fakturę #${res.invoice_id}. Razem: ${formatMoney(res.total_paid)} zł`
    payError.value = false
    await loadAll()
    setTimeout(() => {
      payConfirmationTarget.value = null
      payMsg.value = ''
    }, 2000)
  } catch (e: any) {
    payMsg.value = e?.response?.data?.detail || 'Błąd płatności'
    payError.value = true
  } finally {
    busy.value = false
  }
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  newIssue.file = target.files && target.files[0] ? target.files[0] : null
}

async function submitIssue() {
  issueMsg.value = ''
  issueError.value = false
  if (!newIssue.title.trim() || !newIssue.description.trim()) {
    issueMsg.value = 'Uzupełnij tytuł i opis.'
    issueError.value = true
    return
  }
  busy.value = true
  try {
    const created = await IssuesApi.create(
      newIssue.title,
      newIssue.description,
      newIssue.category,
      newIssue.file ?? undefined,
    )
    issues.value = [created, ...issues.value]
    newIssue.title = ''
    newIssue.description = ''
    newIssue.category = 'other'
    newIssue.file = null
    issueMsg.value = 'Zgłoszenie wysłane.'
    issueError.value = false
    activeTab.value = 'history'
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    issueMsg.value = extractServerMessage(detail) || 'Błąd wysyłki'
    issueError.value = true
  } finally {
    busy.value = false
  }
}

async function startPayment(amount?: number, description = 'Czynsz') {
  paymentMsg.value = ''
  paymentError.value = false
  busy.value = true
  try {
    const amt = amount ?? Number(balance.value)
    activePayment.value = await PaymentsApi.init(amt, description)
    blikCode.value = ''
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    paymentMsg.value = extractServerMessage(detail) || 'Nie udało się rozpocząć płatności'
    paymentError.value = true
  } finally {
    busy.value = false
  }
}

async function confirmBlik() {
  if (!activePayment.value) return
  if (!/^\d{6}$/.test(blikCode.value)) {
    paymentMsg.value = 'Kod BLIK musi mieć dokładnie 6 cyfr.'
    paymentError.value = true
    return
  }
  busy.value = true
  try {
    const result = await PaymentsApi.confirmBlik(activePayment.value.payment_id, blikCode.value)
    if (result.status === 'completed') {
      paymentMsg.value = 'Płatność zakończona pomyślnie!'
      paymentError.value = false
      // If we're paying a specific invoice, attach the payment to that invoice
      if (payConfirmationTarget.value) {
        try {
          await InvoicesApi.pay(payConfirmationTarget.value.id, { method: 'blik', existing_payment_id: result.id })
        } catch (err: any) {
          // log but continue
          paymentMsg.value = err?.response?.data?.detail || paymentMsg.value
          paymentError.value = true
        }
      }
      activePayment.value = null
      await loadAll()
    } else {
      paymentMsg.value = `Płatność: ${result.status}. Spróbuj ponownie.`
      paymentError.value = true
    }
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    paymentMsg.value = extractServerMessage(detail) || 'Błąd płatności'
    paymentError.value = true
  } finally {
    busy.value = false
  }
}

async function cancelPayment() {
  if (!activePayment.value) return
  await PaymentsApi.cancel(activePayment.value.payment_id)
  activePayment.value = null
  await loadAll()
}

async function handleChangePassword() {
  passwordChangeMsg.value = ''
  if (!changePasswordForm.current_password || !changePasswordForm.new_password || !changePasswordForm.confirm_password) {
    passwordChangeMsg.value = 'Wszystkie pola są wymagane'
    passwordChangeError.value = true
    return
  }
  if (changePasswordForm.new_password !== changePasswordForm.confirm_password) {
    passwordChangeMsg.value = 'Podane hasła nie są identyczne'
    passwordChangeError.value = true
    return
  }
  busy.value = true
  try {
    const response = await apiClient.post('/auth/change-password', {
      current_password: changePasswordForm.current_password,
      new_password: changePasswordForm.new_password,
    })
    passwordChangeMsg.value = response.data.message || 'Hasło zmienione pomyślnie'
    passwordChangeError.value = false
    changePasswordForm.current_password = ''
    changePasswordForm.new_password = ''
    changePasswordForm.confirm_password = ''
    showCurrentPassword.value = false
    showNewPassword.value = false
    showConfirmPassword.value = false
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    passwordChangeMsg.value = extractServerMessage(detail) || 'Nie udało się zmienić hasła'
    passwordChangeError.value = true
  } finally {
    busy.value = false
  }
}

function extractServerMessage(detail: any): string | null {
  if (!detail) return null
  if (typeof detail === 'string') {
    // Remove common Pydantic prefixes like "Value error, ..."
    const parts = detail.split(',').map((s) => s.trim())
    const first = parts[0] ?? ''
    if (parts.length > 1 && /value error/i.test(first)) return parts.slice(1).join(', ').trim()
    return detail
  }
  if (Array.isArray(detail) && detail[0]) {
    if (detail[0].msg) return detail[0].msg
    if (detail[0].message) return detail[0].message
    return JSON.stringify(detail[0])
  }
  try {
    return String(detail)
  } catch {
    return null
  }
}

function translatePaymentDescription(desc: any): string {
  if (!desc) return '–'
  const s: string = String(desc || '')
  let out: string = s.replace(/Invoice\s*#/i, 'Faktura #')
  out = out.replace(/\(electricity\)/i, '(prąd)')
  out = out.replace(/\(water\)/i, '(woda)')
  return out
}

function logout() {
  authStore.logout()
  router.push('/')
}

onMounted(loadAll)
</script>

<style scoped>
.user-layout { position: relative; min-height: 100vh; background-color: #f4f7f6; }
.sidebar { position: fixed; left: 0; top: 0; width: 260px; height: 100vh; background-color: #2c3e50; color: white; display: flex; flex-direction: column; box-shadow: 2px 0 10px rgba(0,0,0,0.1); z-index: 10; }
.brand { padding: 25px 20px; background-color: #233140; text-align: center; }
.brand h2 { margin: 0; font-size: 1.4rem; color: #42b983; }
.brand-sub { color: #a0aec0; font-size: 0.8rem; margin: 4px 0 0; }
.menu { flex: 1; padding: 20px 0; display: flex; flex-direction: column; overflow-y: auto; }
.menu-item { background: transparent; color: #a0aec0; border: none; padding: 15px 25px; text-align: left; font-size: 1.05rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease; border-left: 4px solid transparent; }
.menu-item:hover { background-color: #34495e; color: white; }
.menu-item.active { background-color: #34495e; color: white; border-left-color: #42b983; }
.bottom-action { padding: 20px; }
.btn-logout { width: 100%; background: transparent; color: #e2e8f0; border: 1px solid #718096; padding: 10px; border-radius: 6px; cursor: pointer; }
.btn-logout:hover { background: #e53e3e; border-color: #e53e3e; color: white; }
.content-area { margin-left: 260px; padding: 40px; overflow-y: auto; }
.page-title { margin-top: 0; color: #1a202c; font-size: 2rem; margin-bottom: 10px; }
.description { color: #718096; margin-bottom: 30px; }
  .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); max-width: 100%; margin-bottom: 20px; }
.stats-grid { display: flex; gap: 20px; max-width: 800px; margin-bottom: 30px; flex-wrap: wrap; }
.stat-card { background: white; flex: 1; min-width: 200px; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); text-align: center; }
.stat-number { font-size: 2.2rem; font-weight: bold; color: #e53e3e; margin: 10px 0 0 0; }
.stat-number.ok { color: #2f855a; }
.stat-number.overdue { color: #e53e3e; }
.balance-big { font-size: 2.5rem; font-weight: bold; color: #2c3e50; margin: 10px 0 20px; }
.balance-big.positive { color: #2f855a; }
.balance-big.negative { color: #e53e3e; }
.ok-msg { color: #2f855a; font-weight: bold; }
.warning-msg { color: #e53e3e; font-weight: bold; }
.pay-block { margin-top: 20px; padding-top: 20px; border-top: 1px dashed #e2e8f0; }
.blik-form .actions { margin-top: 12px; display: flex; gap: 10px; align-items: center; }
.code-input { text-transform: none; letter-spacing: 8px; font-family: monospace; font-weight: bold; font-size: 1.4rem; text-align: center; }
.hint { color: #a0aec0; font-size: 0.85rem; margin-top: 10px; }
.btn-primary { background: #42b983; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background: #369f6e; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-link { background: transparent; border: none; color: #718096; cursor: pointer; }
.data-row { display: flex; padding: 10px 0; border-bottom: 1px solid #edf2f7; }
.label { font-weight: bold; width: 140px; color: #4a5568; }
.form-group { margin-bottom: 20px; display: flex; flex-direction: column; }
label { font-weight: 600; margin-bottom: 8px; }
.input-field { padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 1rem; }
textarea.input-field { min-height: 120px; resize: vertical; }
.empty-state { color: #a0aec0; font-style: italic; }
.ann-item { padding: 10px 0; border-bottom: 1px solid #edf2f7; }
.ann-item:last-child { border-bottom: none; }
.fault-card { border-left: 5px solid #42b983; }
.fault-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.fault-cat { background: #e6fffa; color: #2c7a7b; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 0.85rem; text-transform: uppercase; }
.status-pill { padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; }
.status-pill.new { background: #fed7d7; color: #9b2c2c; }
.status-pill.in_progress { background: #feebc8; color: #9c4221; }
.status-pill.completed, .status-pill.completed { background: #c6f6d5; color: #22543d; }
.status-pill.rejected, .status-pill.cancelled { background: #e2e8f0; color: #4a5568; }
.status-pill.initialized, .status-pill.pending { background: #bee3f8; color: #2c5282; }
  .payments-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .payments-table th, .payments-table td { overflow-wrap: anywhere; white-space: normal; }
  .payments-table th:nth-child(1), .payments-table td:nth-child(1) { width: 11%; }
  .payments-table th:nth-child(2), .payments-table td:nth-child(2) { width: 8%; }
  .payments-table th:nth-child(5), .payments-table td:nth-child(5) { width: 13%; }
  .payments-table th:nth-child(7), .payments-table td:nth-child(7) { width: 12%; }
.payments-table th, .payments-table td { padding: 8px 12px; border-bottom: 1px solid #edf2f7; text-align: left; font-size: 0.95rem; }
.block { display: block; margin-top: 10px; color: #a0aec0; }
.password-wrapper { position: relative; display: flex; }
.password-wrapper .input-field { width: 100%; padding-right: 40px; }
.btn-show-password { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0; color: #718096; transition: color 0.2s; }
.btn-show-password:hover { color: #42b983; }
.password-icon { width: 20px; height: 20px; display: block; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.status-box { margin-top: 12px; padding: 12px; border-radius: 6px; font-size: 0.9rem; text-align: center; font-weight: 600; white-space: pre-wrap; word-wrap: break-word; }
.status-box.err { background: #fed7d7; color: #9b2c2c; }
.status-box.ok { background: #c6f6d5; color: #2f855a; }
.fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.btn-sm { padding: 6px 12px; font-size: 0.85rem; }
.overdue { color: #c53030; font-weight: 600; font-size: 0.85rem; margin-left: 4px; }
.status-pill.pending { background: #bee3f8; color: #2c5282; }
.status-pill.paid { background: #c6f6d5; color: #22543d; }

.payments-table td:last-child { width: 1%; white-space: nowrap; }
.btn-primary.btn-sm { padding: 6px 8px; }
.payments-table td.actions { width: 160px; white-space: nowrap; }
.btn-pay { background: #2fa66b; color: #fff; border: none; padding: 8px 12px; border-radius: 18px; font-weight: 700; font-size: 0.9rem; cursor: pointer; box-shadow: 0 2px 0 rgba(0,0,0,0.04); }
.btn-pay:hover:not(:disabled) { background: #268d56; }
.btn-pay:disabled { opacity: 0.6; cursor: not-allowed; }

/* ===== RESPONSYWNOŚĆ ===== */
@media (max-width: 1200px) {
  .content-area { padding: 30px; }
  .page-title { font-size: 1.6rem; }
  .card { max-width: 100%; }
  .stats-grid { max-width: 100%; }
}

@media (max-width: 1100px) {
  .user-layout { flex-direction: column; }
  .sidebar { position: sticky; top: 0; width: 100%; height: auto; max-height: 100vh; overflow-y: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 20; }
  .brand { padding: 20px 15px; }
  .brand h2 { font-size: 1.1rem; }
  .menu { flex-direction: column; flex-wrap: nowrap; padding: 10px 0; overflow-y: visible; max-height: none; }
  .menu-item { padding: 10px 15px; font-size: 0.9rem; flex: none; min-width: 0; }
  .menu-item.active { border-left: none; border-bottom: 3px solid #42b983; }
  .content-area { margin-left: 0; padding: 20px; overflow-y: visible; }
  .page-title { font-size: 1.3rem; margin-bottom: 8px; }
  .description { font-size: 0.9rem; margin-bottom: 15px; }
  .card { padding: 20px; margin-bottom: 15px; }
  .stats-grid { gap: 10px; margin-bottom: 20px; }
  .stat-card { padding: 15px; }
  .stat-number { font-size: 1.8rem; }
  .balance-big { font-size: 1.8rem; }
  .payments-table th, .payments-table td { padding: 6px 8px; font-size: 0.8rem; }
  /* Hide less important columns on narrower screens to avoid horizontal scrollbar */
  .payments-table th:nth-child(3), .payments-table td:nth-child(3),
  .payments-table th:nth-child(4), .payments-table td:nth-child(4),
  .payments-table th:nth-child(6), .payments-table td:nth-child(6) {
    display: none;
  }
  .btn-primary, .btn-logout { padding: 10px 15px; font-size: 0.9rem; }
  .code-input { letter-spacing: 4px; font-size: 1.1rem; }
  textarea.input-field { min-height: 100px; }
  .form-group { margin-bottom: 15px; }
  label { font-size: 0.95rem; }
  .input-field { font-size: 0.95rem; padding: 8px; }
}

@media (max-width: 700px) {
  .content-area { padding: 15px; }
  .page-title { font-size: 1.1rem; margin-bottom: 5px; }
  .description { font-size: 0.8rem; margin-bottom: 10px; }
  .card { padding: 15px; margin-bottom: 10px; }
  .menu-item { padding: 8px 10px; font-size: 0.8rem; }
  .stat-number { font-size: 1.5rem; }
  .balance-big { font-size: 1.5rem; }
  .payments-table { font-size: 0.7rem; }
  .payments-table th, .payments-table td { padding: 4px 6px; }
  .btn-primary, .btn-logout { padding: 8px 12px; font-size: 0.8rem; }
  label { font-size: 0.9rem; margin-bottom: 5px; }
  .input-field { font-size: 0.9rem; padding: 6px; }
  .blik-form .actions { gap: 5px; flex-wrap: wrap; }
  .data-row { flex-direction: column; }
  .label { width: 100%; margin-bottom: 4px; }
  /* For very small screens hide more columns */
  .payments-table th:nth-child(2), .payments-table td:nth-child(2),
  .payments-table th:nth-child(5), .payments-table td:nth-child(5) {
    display: none;
  }
}
</style>
