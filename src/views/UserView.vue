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
            <h3>Twoje saldo</h3>
            <p class="stat-number" :class="{ ok: Number(balance) <= 0 }">{{ formatMoney(balance) }} zł</p>
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
          <h3>Bieżące saldo</h3>
          <p class="balance-big">{{ formatMoney(balance) }} zł</p>
          <p v-if="Number(balance) <= 0" class="ok-msg">Wszystkie należności są uregulowane.</p>

          <div v-if="Number(balance) > 0" class="pay-block">
            <h3>Zapłać online (BLIK)</h3>
            <div v-if="!activePayment">
              <button class="btn-primary" @click="startPayment" :disabled="busy">Zapłać {{ formatMoney(balance) }} zł</button>
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
                <td><span :class="['status-pill', inv.status]">{{ inv.status }}</span></td>
                <td>
                  <button
                    v-if="inv.status === 'pending'"
                    class="btn-primary btn-sm"
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
                <td>{{ p.description || '–' }}</td>
                <td><span :class="['status-pill', p.status]">{{ p.status }}</span></td>
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
        </div>
      </div>

      <div v-else-if="activeTab === 'history'" class="tab-content fade-in">
        <h1 class="page-title">Moje zgłoszenia</h1>
        <div v-if="issues.length === 0" class="card"><p class="empty-state">Brak zgłoszeń.</p></div>
        <div v-for="i in issues" :key="i.id" class="card fault-card">
          <div class="fault-header">
            <span class="fault-cat">{{ i.category }}</span>
            <span :class="['status-pill', i.status]">{{ i.status }}</span>
          </div>
          <h3>{{ i.title }}</h3>
          <p>{{ i.description }}</p>
          <a v-if="i.attachment_url" :href="i.attachment_url" target="_blank">Załącznik</a>
          <small class="block">Zgłoszono: {{ formatDate(i.created_at) }}</small>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { AnnouncementsApi, InvoicesApi, IssuesApi, PaymentsApi } from '@/api/endpoints'
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

const activeTab = ref<'dashboard' | 'data' | 'payments' | 'report' | 'history'>('dashboard')
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

const activeIssuesCount = computed(() =>
  issues.value.filter((i) => i.status === 'new' || i.status === 'in_progress').length,
)

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

async function payInvoice(inv: Invoice) {
  if (!confirm(
    `Zapłacić fakturę #${inv.id}?\n` +
    `Kwota: ${formatMoney(inv.amount)} zł\n` +
    `Odsetki za zwłokę: ${formatMoney(currentLateFee(inv))} zł\n` +
    `Razem: ${formatMoney(invoiceTotal(inv))} zł`,
  )) return
  busy.value = true
  try {
    const res = await InvoicesApi.pay(inv.id, 'blik')
    alert(
      `Opłacono fakturę #${res.invoice_id}.\n` +
      `Kwota bazowa: ${formatMoney(res.base_amount)} zł\n` +
      `Odsetki (${res.days_overdue} dni): ${formatMoney(res.late_fee)} zł\n` +
      `Razem: ${formatMoney(res.total_paid)} zł`,
    )
    await loadAll()
  } catch (e: any) {
    alert(e?.response?.data?.detail || 'Błąd płatności')
  } finally {
    busy.value = false
  }
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  newIssue.file = target.files && target.files[0] ? target.files[0] : null
}

async function submitIssue() {
  if (!newIssue.title.trim() || !newIssue.description.trim()) {
    alert('Uzupełnij tytuł i opis.')
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
    alert('Zgłoszenie wysłane.')
    activeTab.value = 'history'
  } catch (e: any) {
    alert(e?.response?.data?.detail || 'Błąd wysyłki')
  } finally {
    busy.value = false
  }
}

async function startPayment() {
  busy.value = true
  try {
    activePayment.value = await PaymentsApi.init(Number(balance.value), 'Czynsz')
    blikCode.value = ''
  } catch (e: any) {
    alert(e?.response?.data?.detail || 'Nie udało się rozpocząć płatności')
  } finally {
    busy.value = false
  }
}

async function confirmBlik() {
  if (!activePayment.value) return
  if (!/^\d{6}$/.test(blikCode.value)) {
    alert('Kod BLIK musi mieć dokładnie 6 cyfr.')
    return
  }
  busy.value = true
  try {
    const result = await PaymentsApi.confirmBlik(activePayment.value.payment_id, blikCode.value)
    if (result.status === 'completed') {
      alert('Płatność zakończona pomyślnie!')
      activePayment.value = null
      await loadAll()
    } else {
      alert(`Płatność: ${result.status}. Spróbuj ponownie.`)
    }
  } catch (e: any) {
    alert(e?.response?.data?.detail || 'Błąd płatności')
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

function logout() {
  authStore.logout()
  router.push('/')
}

onMounted(loadAll)
</script>

<style scoped>
.user-layout { display: flex; min-height: 100vh; background-color: #f4f7f6; }
.sidebar { width: 260px; background-color: #2c3e50; color: white; display: flex; flex-direction: column; box-shadow: 2px 0 10px rgba(0,0,0,0.1); }
.brand { padding: 25px 20px; background-color: #233140; text-align: center; }
.brand h2 { margin: 0; font-size: 1.4rem; color: #42b983; }
.brand-sub { color: #a0aec0; font-size: 0.8rem; margin: 4px 0 0; }
.menu { flex: 1; padding: 20px 0; display: flex; flex-direction: column; }
.menu-item { background: transparent; color: #a0aec0; border: none; padding: 15px 25px; text-align: left; font-size: 1.05rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease; border-left: 4px solid transparent; }
.menu-item:hover { background-color: #34495e; color: white; }
.menu-item.active { background-color: #34495e; color: white; border-left-color: #42b983; }
.bottom-action { padding: 20px; }
.btn-logout { width: 100%; background: transparent; color: #e2e8f0; border: 1px solid #718096; padding: 10px; border-radius: 6px; cursor: pointer; }
.btn-logout:hover { background: #e53e3e; border-color: #e53e3e; color: white; }
.content-area { flex: 1; padding: 40px; overflow-y: auto; }
.page-title { margin-top: 0; color: #1a202c; font-size: 2rem; margin-bottom: 10px; }
.description { color: #718096; margin-bottom: 30px; }
.card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); max-width: 800px; margin-bottom: 20px; }
.stats-grid { display: flex; gap: 20px; max-width: 800px; margin-bottom: 30px; }
.stat-card { background: white; flex: 1; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); text-align: center; }
.stat-number { font-size: 2.2rem; font-weight: bold; color: #e53e3e; margin: 10px 0 0 0; }
.stat-number.ok { color: #2f855a; }
.balance-big { font-size: 2.5rem; font-weight: bold; color: #2c3e50; margin: 10px 0 20px; }
.ok-msg { color: #2f855a; font-weight: bold; }
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
.payments-table { width: 100%; border-collapse: collapse; }
.payments-table th, .payments-table td { padding: 8px 12px; border-bottom: 1px solid #edf2f7; text-align: left; font-size: 0.95rem; }
.block { display: block; margin-top: 10px; color: #a0aec0; }
.fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.btn-sm { padding: 6px 12px; font-size: 0.85rem; }
.overdue { color: #c53030; font-weight: 600; font-size: 0.85rem; margin-left: 4px; }
.status-pill.pending { background: #bee3f8; color: #2c5282; }
.status-pill.paid { background: #c6f6d5; color: #22543d; }
</style>
