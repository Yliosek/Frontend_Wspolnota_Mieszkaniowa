<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="brand">
        <h2>Panel Admina</h2>
        <p class="brand-sub" v-if="authStore.currentUser">{{ authStore.currentUser.email }}</p>
      </div>

      <nav class="menu">
        <button :class="['menu-item', { active: activeTab === 'dashboard' }]" @click="activeTab = 'dashboard'">Pulpit</button>
        <button :class="['menu-item', { active: activeTab === 'codes' }]" @click="activeTab = 'codes'">Kody dostępu</button>
        <button :class="['menu-item', { active: activeTab === 'residents' }]" @click="activeTab = 'residents'">Mieszkańcy</button>
        <button :class="['menu-item', { active: activeTab === 'reports' }]" @click="activeTab = 'reports'">
          Zgłoszenia
          <span v-if="newIssuesCount > 0" class="notif-badge">{{ newIssuesCount }}</span>
        </button>
      </nav>

      <div class="bottom-action">
        <button @click="logout" class="btn-logout">Wyloguj</button>
      </div>
    </aside>

    <main class="content-area">
      <div v-if="activeTab === 'dashboard'" class="tab-content fade-in">
        <h1 class="page-title">Pulpit Zarządzania</h1>
        <p class="description">Opublikuj komunikaty dla wszystkich mieszkańców.</p>

        <div class="card">
          <h3>Opublikuj nowe ogłoszenie</h3>
          <div class="form-group">
            <label>Tytuł ogłoszenia</label>
            <input type="text" v-model="newAnn.title" placeholder="Np. Przerwa w dostawie wody" class="input-field" />
          </div>
          <div class="form-group">
            <label>Treść ogłoszenia</label>
            <textarea v-model="newAnn.content" placeholder="Wpisz szczegóły dla mieszkańców..." class="input-field textarea"></textarea>
          </div>
          <div class="form-group checkbox-row">
            <label><input type="checkbox" v-model="newAnn.notify_residents" /> Wyślij e-mail do mieszkańców</label>
          </div>
          <button @click="handlePostAnnouncement" class="btn-primary" :disabled="busy">
            {{ busy ? 'Publikowanie...' : 'Opublikuj ogłoszenie' }}
          </button>
        </div>

        <div class="card">
          <h3>Ostatnie ogłoszenia</h3>
          <div v-if="announcements.length === 0" class="empty-state">Brak ogłoszeń.</div>
          <div v-for="a in announcements" :key="a.id" class="ann-item">
            <div class="ann-head">
              <strong>{{ a.title }}</strong>
              <button class="btn-link" @click="removeAnnouncement(a.id)">Usuń</button>
            </div>
            <p>{{ a.content }}</p>
            <small>{{ formatDate(a.created_at) }} · {{ a.status }}</small>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'codes'" class="tab-content fade-in">
        <h1 class="page-title">Kody rejestracji</h1>
        <p class="description">Generuj jednorazowe kody dla nowych mieszkańców wspólnoty.</p>

        <div class="card">
          <div class="form-row">
            <input v-model="newCodeFlat" placeholder="Numer mieszkania (np. 12A)" class="input-field" />
            <button @click="generateCode" class="btn-primary" :disabled="busy || !newCodeFlat.trim()">Generuj kod</button>
          </div>

          <div v-if="codes.length > 0" class="codes-section">
            <p class="codes-title">Aktywne kody:</p>
            <table class="codes-table">
              <thead>
                <tr><th>Kod</th><th>Mieszkanie</th><th>Wygasa</th><th></th></tr>
              </thead>
              <tbody>
                <tr v-for="c in codes" :key="c.id">
                  <td><code class="code-badge">{{ c.code }}</code></td>
                  <td>{{ c.flat_number }}</td>
                  <td>{{ c.expires_at ? formatDate(c.expires_at) : '–' }}</td>
                  <td><button class="btn-link" @click="removeCode(c.id)">Usuń</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">Brak aktywnych kodów.</div>
        </div>
      </div>

      <div v-else-if="activeTab === 'residents'" class="tab-content fade-in">
        <h1 class="page-title">Mieszkańcy</h1>
        <p class="description">Wystaw fakturę za zużycie wody i prądu dla wybranego mieszkańca.</p>

        <div class="card">
          <h3>Lista mieszkańców</h3>
          <div v-if="residents.length === 0" class="empty-state">Brak mieszkańców.</div>
          <table v-else class="codes-table">
            <thead>
              <tr>
                <th>Mieszkanie</th>
                <th>Imię i nazwisko</th>
                <th>E-mail</th>
                <th>Saldo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in residents" :key="r.id">
                <td>{{ r.flat_number }}</td>
                <td>{{ r.first_name }} {{ r.last_name }}</td>
                <td>{{ r.email }}</td>
                <td>{{ formatMoney(r.balance) }} PLN</td>
                <td>
                  <button class="btn-primary btn-sm" @click="openInvoiceForm(r)">
                    Generuj fakturę
                  </button>
                  <button class="btn-secondary btn-sm" @click="openHistory(r)">
                    Historia
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="invoiceTarget" class="card">
          <h3>
            Nowa faktura dla
            <span class="hl">{{ invoiceTarget.first_name }} {{ invoiceTarget.last_name }}</span>
            (mieszkanie {{ invoiceTarget.flat_number }})
          </h3>

          <div class="invoice-grid">
            <div class="invoice-col">
              <h4>Woda</h4>
              <div class="form-group">
                <label>Zużycie (m³)</label>
                <input type="number" min="0" step="0.001" v-model.number="invoiceForm.waterQty" class="input-field" />
              </div>
              <div class="form-group">
                <label>Cena za m³ (PLN)</label>
                <input type="number" min="0" step="0.01" v-model.number="invoiceForm.waterPrice" class="input-field" />
              </div>
              <p class="line-total">Razem: <strong>{{ formatMoney(waterAmount) }} PLN</strong></p>
            </div>

            <div class="invoice-col">
              <h4>Prąd</h4>
              <div class="form-group">
                <label>Zużycie (kWh)</label>
                <input type="number" min="0" step="0.001" v-model.number="invoiceForm.energyQty" class="input-field" />
              </div>
              <div class="form-group">
                <label>Cena za kWh (PLN)</label>
                <input type="number" min="0" step="0.0001" v-model.number="invoiceForm.energyPrice" class="input-field" />
              </div>
              <p class="line-total">Razem: <strong>{{ formatMoney(energyAmount) }} PLN</strong></p>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>Termin płatności</label>
              <input type="date" v-model="invoiceForm.dueDate" class="input-field" />
            </div>
          </div>

          <p class="invoice-summary">
            Suma do zapłaty: <strong>{{ formatMoney(totalInvoice) }} PLN</strong>
          </p>

          <div class="form-row">
            <button class="btn-primary" :disabled="busy || totalInvoice <= 0" @click="submitInvoice">
              {{ busy ? 'Wystawianie...' : 'Wystaw fakturę' }}
            </button>
            <button class="btn-secondary" @click="invoiceTarget = null">Anuluj</button>
          </div>
        </div>

        <div v-if="historyTarget" class="card">
          <div class="card-head">
            <h3>
              Historia opłat —
              <span class="hl">{{ historyTarget.first_name }} {{ historyTarget.last_name }}</span>
              (mieszkanie {{ historyTarget.flat_number }})
            </h3>
            <button class="btn-link" @click="closeHistory">Zamknij</button>
          </div>

          <h4>Faktury</h4>
          <div v-if="historyInvoices.length === 0" class="empty-state">Brak faktur.</div>
          <table v-else class="codes-table">
            <thead>
              <tr>
                <th>ID</th><th>Wystawiono</th><th>Typ</th><th>Zużycie</th>
                <th>Kwota</th><th>Termin</th><th>Odsetki</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in historyInvoices" :key="inv.id">
                <td>#{{ inv.id }}</td>
                <td>{{ inv.issue_date }}</td>
                <td>{{ inv.type === 'water' ? 'Woda' : 'Prąd' }}</td>
                <td>
                  <template v-if="inv.quantity">
                    {{ inv.quantity }} {{ inv.type === 'water' ? 'm³' : 'kWh' }}
                    × {{ inv.unit_price }}
                  </template>
                  <template v-else>–</template>
                </td>
                <td>{{ formatMoney(inv.amount) }} PLN</td>
                <td>{{ inv.due_date }}</td>
                <td>{{ formatMoney(inv.late_fee) }} PLN</td>
                <td><span :class="['status-pill', inv.status]">{{ inv.status }}</span></td>
              </tr>
            </tbody>
          </table>

          <h4 style="margin-top: 24px;">Płatności</h4>
          <div v-if="historyPayments.length === 0" class="empty-state">Brak płatności.</div>
          <table v-else class="codes-table">
            <thead>
              <tr><th>ID</th><th>Data</th><th>Kwota</th><th>Metoda</th><th>Opis</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in historyPayments" :key="p.id">
                <td>#{{ p.id }}</td>
                <td>{{ formatDate(p.created_at) }}</td>
                <td>{{ formatMoney(p.amount) }} PLN</td>
                <td>{{ p.method }}</td>
                <td>{{ p.description || '–' }}</td>
                <td><span :class="['status-pill', p.status]">{{ p.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="lastIssuedInvoices.length > 0" class="card">
          <h3>Ostatnio wystawione faktury</h3>
          <table class="codes-table">
            <thead>
              <tr><th>ID</th><th>Typ</th><th>Zużycie</th><th>Kwota</th><th>Termin</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr v-for="inv in lastIssuedInvoices" :key="inv.id">
                <td>#{{ inv.id }}</td>
                <td>{{ inv.type === 'water' ? 'Woda' : 'Prąd' }}</td>
                <td>
                  <template v-if="inv.quantity">
                    {{ inv.quantity }} {{ inv.type === 'water' ? 'm³' : 'kWh' }}
                    × {{ inv.unit_price }} PLN
                  </template>
                  <template v-else>–</template>
                </td>
                <td>{{ formatMoney(inv.amount) }} PLN</td>
                <td>{{ inv.due_date }}</td>
                <td>{{ inv.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else-if="activeTab === 'reports'" class="tab-content fade-in">
        <h1 class="page-title">Zgłoszone usterki</h1>
        <p class="description">Lista problemów zgłoszonych przez mieszkańców.</p>

        <div v-if="issues.length > 0">
          <div v-for="issue in issues" :key="issue.id" class="card fault-card">
            <div class="fault-header">
              <span class="fault-cat">{{ issue.category }}</span>
              <span class="fault-date">{{ formatDate(issue.created_at) }}</span>
            </div>
            <h3 class="fault-title">{{ issue.title }}</h3>
            <p class="fault-user"><strong>Zgłaszający:</strong> {{ issue.resident_email }} (mieszkanie {{ issue.resident_flat }})</p>
            <p class="fault-desc">{{ issue.description }}</p>
            <div v-if="issue.attachment_url" class="fault-attachment">
              <a :href="issue.attachment_url" target="_blank">Załącznik</a>
            </div>
            <div class="fault-actions">
              <label>Status:</label>
              <select :value="issue.status" @change="changeStatus(issue, ($event.target as HTMLSelectElement).value)">
                <option value="new">Nowe</option>
                <option value="in_progress">W trakcie</option>
                <option value="completed">Zakończone</option>
                <option value="rejected">Odrzucone</option>
              </select>
            </div>
          </div>
        </div>
        <div v-else class="card">
          <p class="empty-state">Brak aktywnych zgłoszeń o usterkach.</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  AnnouncementsApi,
  CodesApi,
  InvoicesApi,
  IssuesApi,
  PaymentsApi,
  UsersApi,
} from '@/api/endpoints'
import type {
  Announcement,
  Invoice,
  InvoiceItemInput,
  Issue,
  IssueStatus,
  Payment,
  ResidentSummary,
  VerificationCode,
} from '@/api/types'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref<'dashboard' | 'codes' | 'residents' | 'reports'>('dashboard')
const busy = ref(false)

const announcements = ref<Announcement[]>([])
const codes = ref<VerificationCode[]>([])
const issues = ref<Issue[]>([])
const residents = ref<ResidentSummary[]>([])
const lastIssuedInvoices = ref<Invoice[]>([])

const newAnn = reactive({ title: '', content: '', notify_residents: false })
const newCodeFlat = ref('')

// Default tariffs (admin can override per-invoice).
const DEFAULT_WATER_PRICE = 12.5
const DEFAULT_ENERGY_PRICE = 0.95

const invoiceTarget = ref<ResidentSummary | null>(null)
const historyTarget = ref<ResidentSummary | null>(null)
const historyInvoices = ref<Invoice[]>([])
const historyPayments = ref<Payment[]>([])
const invoiceForm = reactive({
  waterQty: 0,
  waterPrice: DEFAULT_WATER_PRICE,
  energyQty: 0,
  energyPrice: DEFAULT_ENERGY_PRICE,
  dueDate: defaultDueDate(),
})

const newIssuesCount = computed(() => issues.value.filter((i) => i.status === 'new').length)

const waterAmount = computed(() => round2(invoiceForm.waterQty * invoiceForm.waterPrice))
const energyAmount = computed(() => round2(invoiceForm.energyQty * invoiceForm.energyPrice))
const totalInvoice = computed(() => round2(waterAmount.value + energyAmount.value))

function round2(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round(n * 100) / 100
}

function formatMoney(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '0.00'
  const n = typeof v === 'string' ? parseFloat(v) : v
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

function defaultDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
}

function openInvoiceForm(r: ResidentSummary) {
  invoiceTarget.value = r
  historyTarget.value = null
  invoiceForm.waterQty = 0
  invoiceForm.waterPrice = DEFAULT_WATER_PRICE
  invoiceForm.energyQty = 0
  invoiceForm.energyPrice = DEFAULT_ENERGY_PRICE
  invoiceForm.dueDate = defaultDueDate()
  lastIssuedInvoices.value = []
}

async function openHistory(r: ResidentSummary) {
  historyTarget.value = r
  invoiceTarget.value = null
  historyInvoices.value = []
  historyPayments.value = []
  try {
    const [invs, pays] = await Promise.all([
      InvoicesApi.list(r.id),
      PaymentsApi.list(r.id),
    ])
    historyInvoices.value = invs
    historyPayments.value = pays
  } catch (e: any) {
    alert(e?.response?.data?.detail || 'Nie udało się pobrać historii')
  }
}

function closeHistory() {
  historyTarget.value = null
  historyInvoices.value = []
  historyPayments.value = []
}

async function submitInvoice() {
  if (!invoiceTarget.value) return
  const items: InvoiceItemInput[] = []
  if (invoiceForm.waterQty > 0) {
    items.push({
      type: 'water',
      quantity: invoiceForm.waterQty,
      unit_price: invoiceForm.waterPrice,
      description: `Woda – ${invoiceForm.waterQty} m³`,
    })
  }
  if (invoiceForm.energyQty > 0) {
    items.push({
      type: 'electricity',
      quantity: invoiceForm.energyQty,
      unit_price: invoiceForm.energyPrice,
      description: `Prąd – ${invoiceForm.energyQty} kWh`,
    })
  }
  if (items.length === 0) {
    alert('Wpisz zużycie wody lub prądu.')
    return
  }
  busy.value = true
  try {
    const created = await InvoicesApi.adminGenerate(invoiceTarget.value.id, {
      items,
      due_date: invoiceForm.dueDate || null,
    })
    lastIssuedInvoices.value = created
    // Refresh resident balance shown in the table.
    residents.value = await UsersApi.listResidents()
    alert(`Wystawiono ${created.length} faktur(y) na łącznie ${formatMoney(
      created.reduce((s, i) => s + Number(i.amount), 0),
    )} PLN.`)
    invoiceTarget.value = null
  } catch (e: any) {
    alert(e?.response?.data?.detail || 'Błąd wystawiania faktury')
  } finally {
    busy.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('pl-PL')
}

async function loadAll() {
  try {
    const [a, c, i, r] = await Promise.all([
      AnnouncementsApi.list(),
      CodesApi.list(true),
      IssuesApi.list(),
      UsersApi.listResidents(),
    ])
    announcements.value = a
    codes.value = c
    issues.value = i
    residents.value = r
  } catch (e) {
    console.error('Load failed', e)
  }
}

async function handlePostAnnouncement() {
  if (!newAnn.title.trim() || !newAnn.content.trim()) {
    alert('Wypełnij tytuł i treść ogłoszenia.')
    return
  }
  busy.value = true
  try {
    const created = await AnnouncementsApi.create(newAnn.title, newAnn.content, {
      publish: true,
      notify_residents: newAnn.notify_residents,
    })
    announcements.value = [created, ...announcements.value]
    newAnn.title = ''
    newAnn.content = ''
    newAnn.notify_residents = false
  } catch (e: any) {
    alert(e?.response?.data?.detail || 'Błąd publikacji ogłoszenia')
  } finally {
    busy.value = false
  }
}

async function removeAnnouncement(id: number) {
  if (!confirm('Usunąć ogłoszenie?')) return
  await AnnouncementsApi.remove(id)
  announcements.value = announcements.value.filter((a) => a.id !== id)
}

async function generateCode() {
  busy.value = true
  try {
    const c = await CodesApi.create(newCodeFlat.value.trim(), 30)
    codes.value = [c, ...codes.value]
    newCodeFlat.value = ''
  } catch (e: any) {
    alert(e?.response?.data?.detail || 'Błąd generowania kodu')
  } finally {
    busy.value = false
  }
}

async function removeCode(id: number) {
  if (!confirm('Usunąć kod?')) return
  await CodesApi.remove(id)
  codes.value = codes.value.filter((c) => c.id !== id)
}

async function changeStatus(issue: Issue, raw: string) {
  const status = raw as IssueStatus
  const updated = await IssuesApi.changeStatus(issue.id, status)
  const idx = issues.value.findIndex((i) => i.id === issue.id)
  if (idx >= 0) issues.value[idx] = updated
}

function logout() {
  authStore.logout()
  router.push('/')
}

onMounted(loadAll)
</script>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; background-color: #f4f7f6; }
.sidebar { width: 260px; background-color: #2c3e50; color: white; display: flex; flex-direction: column; box-shadow: 2px 0 10px rgba(0,0,0,0.1); z-index: 10; }
.brand { padding: 25px 20px; background-color: #233140; text-align: center; }
.brand h2 { margin: 0; font-size: 1.4rem; color: #42b983; }
.brand-sub { color: #a0aec0; font-size: 0.8rem; margin: 4px 0 0; }
.menu { flex: 1; padding: 20px 0; display: flex; flex-direction: column; }
.menu-item { background: transparent; color: #a0aec0; border: none; padding: 15px 25px; text-align: left; font-size: 1.05rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease; border-left: 4px solid transparent; position: relative; }
.menu-item:hover { background-color: #34495e; color: white; }
.menu-item.active { background-color: #34495e; color: white; border-left-color: #42b983; }
.notif-badge { background-color: #e53e3e; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; position: absolute; right: 20px; top: 50%; transform: translateY(-50%); }
.bottom-action { padding: 20px; }
.btn-logout { width: 100%; background: transparent; color: #e2e8f0; border: 1px solid #718096; padding: 10px; border-radius: 6px; cursor: pointer; transition: 0.2s; font-size: 1rem; }
.btn-logout:hover { background: #e53e3e; color: white; border-color: #e53e3e; }
.content-area { flex: 1; padding: 40px; overflow-y: auto; }
.page-title { margin-top: 0; color: #1a202c; font-size: 2rem; margin-bottom: 10px; }
.description { color: #718096; font-size: 1.05rem; margin-bottom: 30px; }
.card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); max-width: 800px; margin-bottom: 20px; }
.card h3 { margin-top: 0; color: #2d3748; margin-bottom: 20px; }
.form-group { margin-bottom: 15px; text-align: left; }
.form-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #4a5568; }
.checkbox-row label { display: flex; align-items: center; gap: 8px; font-weight: normal; }
.input-field { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 1rem; box-sizing: border-box; }
.textarea { min-height: 120px; resize: vertical; }
.btn-primary { background: #42b983; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem; transition: background-color 0.2s; margin-top: 10px; }
.btn-primary:hover:not(:disabled) { background: #369f6e; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-link { background: transparent; border: none; color: #e53e3e; cursor: pointer; font-size: 0.9rem; }
.form-row { display: flex; gap: 12px; align-items: stretch; margin-bottom: 20px; }
.form-row .input-field { flex: 1; }
.codes-section { margin-top: 30px; padding-top: 20px; border-top: 1px dashed #e2e8f0; }
.codes-title { font-weight: 600; color: #4a5568; margin-bottom: 15px; }
.codes-table { width: 100%; border-collapse: collapse; }
.codes-table th, .codes-table td { padding: 8px 12px; border-bottom: 1px solid #edf2f7; text-align: left; }
.code-badge { background: #ebf8f2; color: #2f855a; border: 1px solid #c6f6d5; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-weight: bold; letter-spacing: 1px; }
.fault-card { border-left: 5px solid #e53e3e; }
.fault-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f0f4f8; }
.fault-cat { background: #fed7d7; color: #9b2c2c; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 0.85rem; text-transform: uppercase; }
.fault-date { color: #a0aec0; font-size: 0.9rem; }
.fault-title { margin: 8px 0; }
.fault-user, .fault-desc { margin: 8px 0; color: #2d3748; }
.fault-attachment { margin: 8px 0; }
.fault-actions { margin-top: 15px; display: flex; align-items: center; gap: 10px; }
.fault-actions select { padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0; }
.empty-state { color: #a0aec0; font-style: italic; padding: 20px 0; }
.ann-item { padding: 12px 0; border-bottom: 1px solid #edf2f7; }
.ann-head { display: flex; justify-content: space-between; align-items: center; }
.fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.btn-sm { padding: 6px 12px; font-size: 0.85rem; margin-top: 0; }
.btn-secondary { background: #e2e8f0; color: #2d3748; border: none; padding: 12px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 10px; margin-left: 8px; }
.btn-secondary:hover { background: #cbd5e0; }
.invoice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 16px; }
.invoice-col { padding: 16px; background: #f7fafc; border-radius: 8px; border: 1px solid #edf2f7; }
.invoice-col h4 { margin: 0 0 12px; color: #2d3748; }
.line-total { margin: 8px 0 0; color: #4a5568; }
.invoice-summary { margin: 12px 0; padding: 12px 16px; background: #ebf8f2; border: 1px solid #c6f6d5; border-radius: 6px; color: #22543d; font-size: 1.05rem; }
.hl { color: #2f855a; }
.card-head { display: flex; justify-content: space-between; align-items: center; }
.card-head h3 { margin: 0; }
.status-pill { padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; }
.status-pill.pending, .status-pill.initialized { background: #bee3f8; color: #2c5282; }
.status-pill.paid, .status-pill.completed { background: #c6f6d5; color: #22543d; }
.status-pill.cancelled, .status-pill.rejected { background: #e2e8f0; color: #4a5568; }
</style>
