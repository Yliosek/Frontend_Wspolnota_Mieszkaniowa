<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="brand">
        <h2>Panel Admina</h2>
        <p class="brand-sub" v-if="authStore.currentUser">{{ authStore.currentUser.email }}</p>
      </div>

      <!-- Modal: Delete Announcement -->
      <div v-if="deleteAnnouncementTarget !== null" class="modal-overlay" @click="deleteAnnouncementTarget = null">
        <div class="modal-box" @click.stop>
          <h3>Usunąć ogłoszenie?</h3>
          <p style="color: #718096; margin: 12px 0; font-size: 0.95rem;">Ogłoszenie zostanie trwale usunięte.</p>
          <div class="form-row">
            <button class="btn-danger" @click="confirmDeleteAnnouncement" :disabled="busy">{{ busy ? 'Usuwanie...' : 'Tak, usuń' }}</button>
            <button class="btn-secondary" @click="deleteAnnouncementTarget = null">Anuluj</button>
          </div>
        </div>
      </div>

      <!-- Modal: Delete Code -->
      <div v-if="deleteCodeTarget !== null" class="modal-overlay" @click="deleteCodeTarget = null">
        <div class="modal-box" @click.stop>
          <h3>Usunąć kod rejestracji?</h3>
          <p style="color: #718096; margin: 12px 0; font-size: 0.95rem;">Kod zostanie usunięty i nie będzie dostępny dla nowych rejestracji.</p>
          <div class="form-row">
            <button class="btn-danger" @click="confirmDeleteCode" :disabled="busy">{{ busy ? 'Usuwanie...' : 'Tak, usuń' }}</button>
            <button class="btn-secondary" @click="deleteCodeTarget = null">Anuluj</button>
          </div>
        </div>
      </div>

      <nav class="menu">
        <button :class="['menu-item', { active: activeTab === 'dashboard' }]" @click="activeTab = 'dashboard'">Pulpit</button>
        <button :class="['menu-item', { active: activeTab === 'codes' }]" @click="activeTab = 'codes'">Kody dostępu</button>
        <button :class="['menu-item', { active: activeTab === 'residents' }]" @click="activeTab = 'residents'">Mieszkańcy</button>
        <button :class="['menu-item', { active: activeTab === 'reports' }]" @click="activeTab = 'reports'">
          Zgłoszenia
          <span v-if="newIssuesCount > 0" class="notif-badge">{{ newIssuesCount }}</span>
        </button>
        <button :class="['menu-item', { active: activeTab === 'security' }]" @click="activeTab = 'security'">Bezpieczeństwo</button>
      </nav>

      <div class="bottom-action">
        <button @click="logout" class="btn-logout">Wyloguj</button>
      </div>
    </aside>

    <main class="content-area">
      <div v-if="activeTab === 'dashboard'" class="tab-content fade-in">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h1 class="page-title" style="margin: 0;">Pulpit Zarządzania</h1>
          <button @click="loadAll" class="btn-refresh" :disabled="busy" title="Odśwież dane">🔄 Odśwież</button>
        </div>
        <p class="description">Opublikuj komunikaty dla wszystkich mieszkańców.</p>
        <div v-if="adminMsg" :class="['status-box', adminError ? 'err' : 'ok']" style="margin-bottom:16px;">
          {{ adminMsg }}
        </div>

        <!-- ALERT: Pending Password Reset Requests -->
        <div v-if="pendingPasswordResets.length > 0" class="card alert-card">
          <h3 class="alert-title" style="margin-top: 0;">Prośby o reset hasła ({{ pendingPasswordResets.length }})</h3>
          <p style="color: #718096; margin: 10px 0;">Mieszkańcy zgłosili prośby o reset hasła. Wybierz akcję dla każdej prośby:</p>
          <div v-for="req in pendingPasswordResets" :key="req.id" style="padding: 12px; border-left: 3px solid #f6ad55; background: #fffaf0; margin-bottom: 10px; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>{{ req.email }}</strong> (mieszkanie {{ req.flat_number }})
                <br/>
                <small style="color: #a0aec0;">{{ formatDate(req.created_at) }}</small>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn-primary btn-sm" @click="openResetDecision('approve', req)" :disabled="busy">Zatwierdź</button>
                <button class="btn-link" @click="openResetDecision('deny', req)" :disabled="busy">Odrzuć</button>
              </div>
            </div>
          </div>
          <div v-if="resetDecisionMsg" :class="['status-box', resetDecisionError ? 'err' : 'ok']" style="margin-top: 12px;">
            {{ resetDecisionMsg }}
          </div>
        </div>
        <div v-if="resetDecisionTarget" class="modal-overlay" @click="resetDecisionTarget = null">
          <div class="modal-box" @click.stop>
            <h3 :style="{ color: resetDecisionTarget.mode === 'approve' ? '#2d3748' : '#c53030' }">
              {{ resetDecisionTarget.mode === 'approve' ? 'Zatwierdzić reset hasła?' : 'Odrzucić reset hasła?' }}
            </h3>
            <p style="color: #718096; margin: 12px 0; font-size: 0.95rem;">
              <strong>{{ resetDecisionTarget.email }}</strong> (mieszkanie {{ resetDecisionTarget.flat_number }})
            </p>
            <p style="color: #718096; margin: 12px 0; font-size: 0.9rem;">
              {{ resetDecisionTarget.mode === 'approve'
                ? 'Po zatwierdzeniu mieszkaniec zaloguje się pustym hasłem i zostanie poproszony o ustawienie nowego.'
                : 'Prośba zostanie usunięta z listy oczekujących.' }}
            </p>
            <div class="form-row">
              <button class="btn-primary" @click="confirmResetDecision" :disabled="busy">
                {{ busy ? 'Przetwarzam...' : (resetDecisionTarget.mode === 'approve' ? 'Zatwierdź' : 'Odrzuć') }}
              </button>
              <button class="btn-secondary" @click="resetDecisionTarget = null">Anuluj</button>
            </div>
          </div>
        </div>

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
              <button class="btn-link" @click="openDeleteAnnouncement(a.id)">Usuń</button>
            </div>
            <p>{{ a.content }}</p>
            <small>{{ formatDate(a.created_at) }} · {{ translateAnnouncementStatus(a.status) }}</small>
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
                  <td><button class="btn-link" @click="openDeleteCode(c.id)">Usuń</button></td>
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
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3 style="margin:0">Lista mieszkańców</h3>
            <label style="font-weight:600; color:#4a5568; display:inline-flex; align-items:center; gap:8px;">
              <input type="checkbox" v-model="showOnlyActive" />
              Pokaż tylko aktywne
            </label>
          </div>
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
              <tr v-for="r in activeResidents" :key="r.id">
                <td>{{ r.flat_number }}</td>
                <td>{{ r.first_name }} {{ r.last_name }}</td>
                <td>{{ r.email }}</td>
                <td :class="{ 'balance-owed': Number(r.balance) > 0 }">{{ formatMoney(r.balance) }} PLN</td>
                  <td class="resident-actions-cell">
                    <div class="resident-actions">
                  <button
                    class="btn-primary btn-sm"
                    @click="openInvoiceForm(r)"
                    :disabled="!r.is_active"
                    :title="!r.is_active ? 'Konto nieaktywne — nie można wystawić faktury' : ''"
                  >
                    Generuj fakturę
                  </button>
                  <button class="btn-secondary btn-sm" @click="openHistory(r)">
                    Historia
                  </button>
                  <!-- For active residents we show invoice, history, reset and deactivate -->
                  <button
                    class="btn-secondary btn-sm"
                    @click="openResetPassword(r)"
                    :disabled="busy"
                  >
                    Reset hasła
                  </button>
                  <button
                    class="btn-danger btn-sm"
                    @click="openDeleteResident(r)"
                    :disabled="Number(r.balance) > 0"
                    :title="Number(r.balance) > 0 ? 'Nie można dezaktywować konta dopóki istnieją nieuregulowane należności' : ''"
                  >
                    Dezaktywuj
                  </button>
                    </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!showOnlyActive && inactiveResidents.length > 0" class="card" style="margin-top:16px;">
          <h3>Byli mieszkańcy / Konta nieaktywne</h3>
          <p class="description">Lista kont nieaktywnych (byli lokatorzy). Możesz przeglądać historię płatności.</p>
          <table class="codes-table">
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
              <tr v-for="r in inactiveResidents" :key="r.id" class="resident-inactive">
                <td>{{ r.flat_number }}</td>
                <td>{{ r.first_name }} {{ r.last_name }}</td>
                <td>{{ r.email }}</td>
                <td :class="{ 'balance-owed': Number(r.balance) > 0 }">{{ formatMoney(r.balance) }} PLN</td>
                <td>
                  <button class="btn-secondary btn-sm" @click="openHistory(r)">Historia</button>
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
                <td><span :class="['status-pill', inv.status]">{{ translateInvoiceStatus(inv.status) }}</span></td>
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
                  <td>{{ translatePaymentDescription(p.description) }}</td>
                <td><span :class="['status-pill', p.status]">{{ translatePaymentStatus(p.status) }}</span></td>
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
                <td>{{ translateInvoiceStatus(inv.status) }}</td>
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

      <!-- SECURITY TAB -->
      <div v-else-if="activeTab === 'security'" class="tab-content fade-in">
        <h1 class="page-title">Bezpieczeństwo</h1>
        <p class="description">Zarządzaj ustawieniami bezpieczeństwa konta administratora.</p>

        <div class="card">
          <h3>Zmiana hasła</h3>
          <div class="form-group">
            <label>Obecne hasło</label>
            <div class="password-wrapper">
              <input
                :type="showAdminCurrentPassword ? 'text' : 'password'"
                v-model="adminChangePasswordForm.current_password"
                class="input-field"
              />
              <button type="button" class="btn-show-password" @click="showAdminCurrentPassword = !showAdminCurrentPassword">
                  <svg v-if="showAdminCurrentPassword" viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
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
                :type="showAdminNewPassword ? 'text' : 'password'"
                v-model="adminChangePasswordForm.new_password"
                class="input-field"
              />
              <button type="button" class="btn-show-password" @click="showAdminNewPassword = !showAdminNewPassword">
                  <svg v-if="showAdminNewPassword" viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
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
                :type="showAdminConfirmPassword ? 'text' : 'password'"
                v-model="adminChangePasswordForm.confirm_password"
                class="input-field"
              />
              <button type="button" class="btn-show-password" @click="showAdminConfirmPassword = !showAdminConfirmPassword">
                  <svg v-if="showAdminConfirmPassword" viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
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
          <button class="btn-primary" @click="handleAdminChangePassword" :disabled="busy">
            {{ busy ? 'Zmiana hasła...' : 'Zmień hasło' }}
          </button>
          <div v-if="adminPasswordChangeMsg" :class="['status-box', adminPasswordChangeError ? 'err' : 'ok']" style="margin-top: 12px;">
            {{ adminPasswordChangeMsg }}
          </div>
        </div>
      </div>

      <!-- Modal: Reset Password -->
      <div v-if="resetPasswordTarget" class="modal-overlay" @click="resetPasswordTarget = null">
        <div class="modal-box" @click.stop>
          <h3>Reset hasła — {{ resetPasswordTarget.first_name }} {{ resetPasswordTarget.last_name }}</h3>
          <p style="color: #718096; margin: 12px 0; font-size: 0.9rem;">
            Reset wykona się od razu. Mieszkaniec zaloguje się bez hasła i zostanie poproszony o ustawienie nowego.
          </p>
          <div class="form-row">
            <button class="btn-primary" @click="handleResetPassword" :disabled="busy">
              {{ busy ? 'Resetowanie...' : 'Resetuj hasło' }}
            </button>
            <button class="btn-secondary" @click="resetPasswordTarget = null">Anuluj</button>
          </div>
          <div v-if="resetPasswordMsg" :class="['status-box', resetPasswordError ? 'err' : 'ok']" style="margin-top: 12px;">
            {{ resetPasswordMsg }}
          </div>
        </div>
      </div>

      <!-- Modal: Delete Resident -->
      <div v-if="deleteResidentTarget" class="modal-overlay" @click="deleteResidentTarget = null">
        <div class="modal-box" @click.stop>
          <h3 style="color: #c53030;">Dezaktywować konto?</h3>
          <p style="color: #718096; margin: 12px 0; font-size: 0.9rem;">
            Mieszkaniec <strong>{{ deleteResidentTarget.first_name }} {{ deleteResidentTarget.last_name }}</strong> (mieszkanie {{ deleteResidentTarget.flat_number }})
            będzie dezaktywowany. Historia opłat będzie zachowana.
          </p>
          <div class="form-row">
            <button
              class="btn-danger"
              @click="handleDeleteResident"
              :disabled="busy || (deleteResidentTarget && Number(deleteResidentTarget.balance) > 0)"
            >
              {{ busy ? 'Dezaktywacja...' : 'Tak, dezaktywuj konto' }}
            </button>
            <button class="btn-secondary" @click="deleteResidentTarget = null">Anuluj</button>
          </div>
          <div v-if="deleteResidentMsg" :class="['status-box', deleteResidentError ? 'err' : 'ok']" style="margin-top: 12px;">
            {{ deleteResidentMsg }}
          </div>
          <div v-if="deleteResidentTarget && Number(deleteResidentTarget.balance) > 0" class="status-box err" style="margin-top:12px;">
            Nie można dezaktywować konta dopóki istnieją nieuregulowane należności.
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/api/client'
import { translatePaymentStatus, translateInvoiceStatus, translateAnnouncementStatus } from '@/utils/translations'
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

const activeTab = ref<'dashboard' | 'codes' | 'residents' | 'reports' | 'security'>('dashboard')
const busy = ref(false)
const adminMsg = ref('')
const adminError = ref(false)
const showOnlyActive = ref(false)

const announcements = ref<Announcement[]>([])
const codes = ref<VerificationCode[]>([])
const issues = ref<Issue[]>([])
const residents = ref<ResidentSummary[]>([])
const lastIssuedInvoices = ref<Invoice[]>([])
const pendingPasswordResets = ref<any[]>([])

const newAnn = reactive({ title: '', content: '' })
const newCodeFlat = ref('')

// Default tariffs (admin can override per-invoice).
const DEFAULT_WATER_PRICE = 12.5
const DEFAULT_ENERGY_PRICE = 0.95

const invoiceTarget = ref<ResidentSummary | null>(null)
const historyTarget = ref<ResidentSummary | null>(null)
const resetPasswordTarget = ref<ResidentSummary | null>(null)
const deleteResidentTarget = ref<ResidentSummary | null>(null)
const deleteAnnouncementTarget = ref<number | null>(null)
const deleteCodeTarget = ref<number | null>(null)
const resetDecisionTarget = ref<{ id: number; email: string; flat_number: string; mode: 'approve' | 'deny' } | null>(null)
const resetPasswordMsg = ref('')
const resetPasswordError = ref(false)
const resetDecisionMsg = ref('')
const resetDecisionError = ref(false)
const deleteResidentMsg = ref('')
const deleteResidentError = ref(false)
const historyInvoices = ref<Invoice[]>([])
const historyPayments = ref<Payment[]>([])
const invoiceForm = reactive({
  waterQty: 0,
  waterPrice: DEFAULT_WATER_PRICE,
  energyQty: 0,
  energyPrice: DEFAULT_ENERGY_PRICE,
  dueDate: defaultDueDate(),
})

const adminChangePasswordForm = reactive({ current_password: '', new_password: '', confirm_password: '' })
const showAdminCurrentPassword = ref(false)
const showAdminNewPassword = ref(false)
const showAdminConfirmPassword = ref(false)
const adminPasswordChangeMsg = ref('')
const adminPasswordChangeError = ref(false)

const newIssuesCount = computed(() => issues.value.filter((i) => i.status === 'new').length)

const waterAmount = computed(() => round2(invoiceForm.waterQty * invoiceForm.waterPrice))
const energyAmount = computed(() => round2(invoiceForm.energyQty * invoiceForm.energyPrice))
const totalInvoice = computed(() => round2(waterAmount.value + energyAmount.value))

const sortedResidents = computed(() => {
  // Active accounts first, then inactive; within each group sort by flat_number
  return [...residents.value].sort((a, b) => {
    if (a.is_active === b.is_active) {
      const af = (a.flat_number || '').toString()
      const bf = (b.flat_number || '').toString()
      return af.localeCompare(bf, undefined, { numeric: true, sensitivity: 'base' })
    }
    return a.is_active ? -1 : 1
  })
})

const activeResidents = computed(() => sortedResidents.value.filter((r) => r.is_active))
const inactiveResidents = computed(() => sortedResidents.value.filter((r) => !r.is_active))

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
    const detail = e?.response?.data?.detail
    adminMsg.value = extractServerMessage(detail) || 'Nie udało się pobrać historii'
    adminError.value = true
  }
}

function closeHistory() {
  historyTarget.value = null
  historyInvoices.value = []
  historyPayments.value = []
}

async function submitInvoice() {
  if (!invoiceTarget.value) return
  if (!invoiceTarget.value.is_active) {
    adminMsg.value = 'Nie można wystawić faktury dla nieaktywnego konta.'
    adminError.value = true
    return
  }
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
    adminMsg.value = 'Wpisz zużycie wody lub prądu.'
    adminError.value = true
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
    adminMsg.value = `Wystawiono ${created.length} faktur(y) na łącznie ${formatMoney(
      created.reduce((s, i) => s + Number(i.amount), 0),
    )} PLN.`
    adminError.value = false
    invoiceTarget.value = null
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    adminMsg.value = extractServerMessage(detail) || 'Błąd wystawiania faktury'
    adminError.value = true
  } finally {
    busy.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('pl-PL')
}

async function loadAll() {
  try {
    // Load data in parallel first
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
    
    // THEN load password resets (now residents data is available)
    await loadPasswordResets()
  } catch (e) {
    console.error('Load failed', e)
  }
}

async function loadPasswordResets() {
  try {
    const response = await apiClient.get('/users/password-reset-requests')
    // Filter out reset requests for residents who are currently inactive
    const all = response.data || []
    // Build a quick lookup by email (now residents data is guaranteed to be loaded)
    const activeEmails = new Set(residents.value.filter((r) => r.is_active).map((r) => r.email))
    const filtered = all.filter((req: any) => activeEmails.has(req.email))
    pendingPasswordResets.value = filtered
  } catch (e) {
    console.error('Failed to load password resets', e)
    pendingPasswordResets.value = []
  }
}

function openResetDecision(mode: 'approve' | 'deny', req: { id: number; email: string; flat_number: string }) {
  resetDecisionTarget.value = { ...req, mode }
  resetDecisionMsg.value = ''
  resetDecisionError.value = false
}

async function confirmResetDecision() {
  if (!resetDecisionTarget.value) return
  busy.value = true
  try {
    const { id, mode } = resetDecisionTarget.value
    await apiClient.post(`/users/password-reset-requests/${id}/${mode}`)
    resetDecisionMsg.value = mode === 'approve'
      ? 'Prośba zatwierdzona. Mieszkaniec może teraz zalogować się pustym hasłem i ustawić nowe.'
      : 'Prośba odrzucona.'
    resetDecisionError.value = false
    resetDecisionTarget.value = null
    await loadPasswordResets()
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    resetDecisionMsg.value = extractServerMessage(detail) || 'Błąd obsługi prośby'
    resetDecisionError.value = true
  } finally {
    busy.value = false
  }
}

async function handlePostAnnouncement() {
  if (!newAnn.title.trim() || !newAnn.content.trim()) {
    adminMsg.value = 'Wypełnij tytuł i treść ogłoszenia.'
    adminError.value = true
    return
  }
  busy.value = true
  try {
    const created = await AnnouncementsApi.create(newAnn.title, newAnn.content, {
      publish: true,
    })
    announcements.value = [created, ...announcements.value]
    newAnn.title = ''
    newAnn.content = ''
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    adminMsg.value = extractServerMessage(detail) || 'Błąd publikacji ogłoszenia'
    adminError.value = true
  } finally {
    busy.value = false
  }
}

async function removeAnnouncement(id: number) {
  openDeleteAnnouncement(id)
}

async function generateCode() {
  busy.value = true
  try {
    const c = await CodesApi.create(newCodeFlat.value.trim(), 30)
    codes.value = [c, ...codes.value]
    newCodeFlat.value = ''
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    adminMsg.value = extractServerMessage(detail) || 'Błąd generowania kodu'
    adminError.value = true
  } finally {
    busy.value = false
  }
}

async function removeCode(id: number) {
  openDeleteCode(id)
}

async function changeStatus(issue: Issue, raw: string) {
  const status = raw as IssueStatus
  const updated = await IssuesApi.changeStatus(issue.id, status)
  const idx = issues.value.findIndex((i) => i.id === issue.id)
  if (idx >= 0) issues.value[idx] = updated
}

function openResetPassword(resident: ResidentSummary) {
  resetPasswordTarget.value = resident
  resetPasswordMsg.value = ''
  resetPasswordError.value = false
}

async function handleResetPassword() {
  if (!resetPasswordTarget.value) return
  resetPasswordMsg.value = ''
  busy.value = true
  try {
    const response = await UsersApi.resetResidentPassword(resetPasswordTarget.value.id)
    resetPasswordMsg.value = response.message || 'Reset wykonany pomyślnie'
    resetPasswordError.value = false
    await loadPasswordResets()
    residents.value = await UsersApi.listResidents()
    setTimeout(() => {
      resetPasswordTarget.value = null
    }, 2000)
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    resetPasswordMsg.value = extractServerMessage(detail) || 'Nie udało się wykonać resetu'
    resetPasswordError.value = true
  } finally {
    busy.value = false
  }
}

function openDeleteResident(resident: ResidentSummary) {
  deleteResidentTarget.value = resident
  deleteResidentMsg.value = ''
  deleteResidentError.value = false
}

async function handleDeleteResident() {
  if (!deleteResidentTarget.value) return
  deleteResidentMsg.value = ''
  busy.value = true
  try {
    await UsersApi.deactivateResident(deleteResidentTarget.value.id)
    deleteResidentMsg.value = 'Konto deaktywowane pomyślnie'
    deleteResidentError.value = false
    setTimeout(async () => {
      deleteResidentTarget.value = null
      await loadAll()
    }, 2000)
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    deleteResidentMsg.value = extractServerMessage(detail) || 'Nie udało się usunąć konta'
    deleteResidentError.value = true
  } finally {
    busy.value = false
  }
}

async function activateResident(resident: ResidentSummary) {
  if (!resident) return
  busy.value = true
  try {
    await apiClient.post(`/users/residents/${resident.id}/activate`)
    adminMsg.value = 'Konto aktywowane pomyślnie'
    adminError.value = false
    residents.value = await UsersApi.listResidents()
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    adminMsg.value = extractServerMessage(detail) || 'Nie udało się aktywować konta'
    adminError.value = true
  } finally {
    busy.value = false
  }
}

async function handleAdminChangePassword() {
  adminPasswordChangeMsg.value = ''
  if (!adminChangePasswordForm.current_password || !adminChangePasswordForm.new_password || !adminChangePasswordForm.confirm_password) {
    adminPasswordChangeMsg.value = 'Wszystkie pola są wymagane'
    adminPasswordChangeError.value = true
    return
  }
  if (adminChangePasswordForm.new_password !== adminChangePasswordForm.confirm_password) {
    adminPasswordChangeMsg.value = 'Podane hasła nie są identyczne'
    adminPasswordChangeError.value = true
    return
  }
  busy.value = true
  try {
    const response = await apiClient.post('/auth/change-password', {
      current_password: adminChangePasswordForm.current_password,
      new_password: adminChangePasswordForm.new_password,
    })
    adminPasswordChangeMsg.value = response.data.message || 'Hasło zmienione pomyślnie'
    adminPasswordChangeError.value = false
    adminChangePasswordForm.current_password = ''
    adminChangePasswordForm.new_password = ''
    adminChangePasswordForm.confirm_password = ''
    showAdminCurrentPassword.value = false
    showAdminNewPassword.value = false
    showAdminConfirmPassword.value = false
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    adminPasswordChangeMsg.value = extractServerMessage(detail) || 'Nie udało się zmienić hasła'
    adminPasswordChangeError.value = true
  } finally {
    busy.value = false
  }
}

function logout() {
  authStore.logout()
  router.push('/')
}

onMounted(loadAll)

function extractServerMessage(detail: any): string | null {
  if (!detail) return null
  if (typeof detail === 'string') {
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

function openDeleteAnnouncement(id: number) {
  deleteAnnouncementTarget.value = id
  adminMsg.value = ''
  adminError.value = false
}

async function confirmDeleteAnnouncement() {
  if (!deleteAnnouncementTarget.value) return
  busy.value = true
  try {
    await AnnouncementsApi.remove(deleteAnnouncementTarget.value)
    announcements.value = announcements.value.filter((a) => a.id !== deleteAnnouncementTarget.value)
    adminMsg.value = 'Ogłoszenie usunięte.'
    adminError.value = false
    deleteAnnouncementTarget.value = null
  } catch (e: any) {
    adminMsg.value = e?.response?.data?.detail || 'Błąd usuwania ogłoszenia'
    adminError.value = true
  } finally {
    busy.value = false
  }
}

function openDeleteCode(id: number) {
  deleteCodeTarget.value = id
  adminMsg.value = ''
  adminError.value = false
}

async function confirmDeleteCode() {
  if (!deleteCodeTarget.value) return
  busy.value = true
  try {
    await CodesApi.remove(deleteCodeTarget.value)
    codes.value = codes.value.filter((c) => c.id !== deleteCodeTarget.value)
    adminMsg.value = 'Kod usunięty.'
    adminError.value = false
    deleteCodeTarget.value = null
  } catch (e: any) {
    adminMsg.value = e?.response?.data?.detail || 'Błąd usuwania kodu'
    adminError.value = true
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.admin-layout { position: relative; min-height: 100vh; background-color: #f4f7f6; }
.sidebar { position: fixed; left: 0; top: 0; width: 260px; height: 100vh; background-color: #2c3e50; color: white; display: flex; flex-direction: column; box-shadow: 2px 0 10px rgba(0,0,0,0.1); z-index: 10; }
.content-area { margin-left: 260px; padding: 40px; overflow-y: auto; }
.brand { padding: 25px 20px; background-color: #233140; text-align: center; }
.brand h2 { margin: 0; font-size: 1.4rem; color: #42b983; }
.brand-sub { color: #a0aec0; font-size: 0.8rem; margin: 4px 0 0; }
.menu { flex: 1; padding: 20px 0; display: flex; flex-direction: column; overflow-y: auto; }
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
  .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); max-width: 100%; margin-bottom: 20px; }
.card.alert-card { border-left: 4px solid #f6ad55; background: #fffaf0; }
.card.alert-card .alert-title { color: #c05621; font-weight: 700; display: flex; align-items: center; }
.card.alert-card .alert-title::before { content: ''; display: inline-block; width: 12px; height: 12px; background: #f6ad55; border-radius: 3px; margin-right: 10px; box-shadow: 0 1px 0 rgba(0,0,0,0.05); }
.card h3 { margin-top: 0; color: #2d3748; margin-bottom: 20px; }
.form-group { margin-bottom: 15px; text-align: left; }
.form-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #4a5568; }
.checkbox-row label { display: flex; align-items: center; gap: 8px; font-weight: normal; }
.input-field { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 1rem; box-sizing: border-box; }
.password-wrapper { position: relative; display: flex; }
.password-wrapper .input-field { width: 100%; padding-right: 44px; }
.btn-show-password { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 0; color: #718096; display: inline-flex; align-items: center; justify-content: center; }
.btn-show-password:hover { color: #2f855a; }
.password-icon { width: 20px; height: 20px; display: block; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.textarea { min-height: 120px; resize: vertical; }
.btn-primary { background: #42b983; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem; transition: background-color 0.2s; margin-top: 10px; }
.btn-primary:hover:not(:disabled) { background: #369f6e; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary.btn-sm { padding: 8px 16px; font-size: 0.9rem; margin-top: 0; }
.btn-link { background: transparent; border: none; color: #e53e3e; cursor: pointer; font-size: 0.9rem; }
.form-row { display: flex; gap: 12px; align-items: stretch; margin-bottom: 20px; }
.form-row .input-field { flex: 1; }
.codes-section { margin-top: 30px; padding-top: 20px; border-top: 1px dashed #e2e8f0; }
.codes-title { font-weight: 600; color: #4a5568; margin-bottom: 15px; }
.codes-table { width: 100%; border-collapse: collapse; }
.codes-table th, .codes-table td { padding: 10px 12px; border-bottom: 1px solid #edf2f7; text-align: left; vertical-align: top; }
.codes-table tbody tr:hover { background: #f8fafc; }
.code-badge { background: #ebf8f2; color: #2f855a; border: 1px solid #c6f6d5; padding: 4px 10px; border-radius: 6px; font-family: monospace; font-weight: bold; letter-spacing: 1px; }
.resident-actions-cell { min-width: 240px; display: flex; justify-content: flex-end; }
.resident-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: flex-end; }
.resident-actions .btn-primary,
.resident-actions .btn-secondary,
.resident-actions .btn-danger { width: auto; margin-top: 0; padding: 8px 12px; border-radius: 8px; font-weight: 600; box-shadow: none; }
.resident-actions .btn-primary { background: #42b983; color: #fff; }
.resident-actions .btn-primary:hover:not(:disabled) { background: #369f6e; }
.resident-actions .btn-secondary { background: #f1f5f9; color: #2d3748; }
.resident-actions .btn-secondary:hover { background: #e2e8f0; }
.resident-actions .btn-danger { background: #e53e3e; color: #fff; border: none; }
.resident-actions .btn-danger:hover { background: #c53030; }
.resident-actions .btn-danger:focus { outline: none; box-shadow: 0 0 0 3px rgba(229,83,62,0.12); }
.btn-link { background: transparent; border: none; color: #4a5568; cursor: pointer; font-size: 0.95rem; font-weight: 600; }
.fault-card { border-left: 5px solid #e53e3e; }
.fault-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f0f4f8; }
.fault-cat { background: #fed7d7; color: #9b2c2c; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 0.85rem; text-transform: uppercase; }
.fault-date { color: #a0aec0; font-size: 0.9rem; }
.fault-title { margin: 8px 0; }
.fault-user, .fault-desc { margin: 8px 0; color: #2d3748; }
.fault-attachment { margin: 8px 0; }
/* Responsive: hide less important invoice/payment columns to avoid horizontal scrollbar */
.codes-table, .codes-table th, .codes-table td { table-layout: fixed; }
@media (max-width: 1100px) {
  .codes-table th:nth-child(3), .codes-table td:nth-child(3),
  .codes-table th:nth-child(4), .codes-table td:nth-child(4) {
    display: none;
  }
}
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
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: white; border-radius: 8px; padding: 24px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); animation: fadeIn 0.3s ease-in-out; }
.modal-box h3 { margin: 0 0 12px 0; font-size: 1.3rem; }
.modal-box p { margin: 0 0 12px 0; }
.btn-danger { background: #c53030; color: white; }
.btn-danger:hover { background: #9b2c2c; }
.status-box { padding: 12px; border-radius: 6px; font-size: 0.9rem; text-align: center; font-weight: 600; white-space: pre-wrap; word-wrap: break-word; }
.status-box.err { background: #fed7d7; color: #9b2c2c; }
.status-box.ok { background: #c6f6d5; color: #2f855a; }

.balance-owed { color: #c53030; font-weight: 700; }

.btn-refresh { background: #4299e1; color: white; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: background-color 0.2s; }
.btn-refresh:hover:not(:disabled) { background: #3182ce; }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 1100px) {
  .admin-layout { flex-direction: column; }
  .sidebar { position: sticky; top: 0; width: 100%; height: auto; max-height: 100vh; overflow-y: auto; z-index: 20; }
  .content-area { margin-left: 0; padding: 20px; }
  .menu { max-height: none; overflow-y: visible; }
  .bottom-action { padding-top: 0; }
  .card { padding: 20px; }
  .invoice-grid { grid-template-columns: 1fr; }
  .form-row { flex-direction: column; }
  .form-row .input-field { width: 100%; }
  .resident-actions { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 700px) {
  .content-area { padding: 14px; }
  .page-title { font-size: 1.3rem; }
  .menu-item { padding: 10px 16px; font-size: 0.95rem; }
  .btn-primary, .btn-secondary, .btn-danger, .btn-logout { width: 100%; }
  .btn-primary.btn-sm { width: auto; }
  .resident-actions { grid-template-columns: 1fr; }
  .resident-actions-cell { min-width: 0; }
  .codes-table th, .codes-table td { padding: 8px 10px; }
}

  .resident-inactive { opacity: 0.66; }
  .resident-inactive td { filter: grayscale(0.02); }
  .resident-inactive .btn-primary, .resident-inactive .btn-secondary, .resident-inactive .btn-danger { opacity: 0.85; }
  .resident-inactive .status-pill { opacity: 0.85; }

/* Enhanced mobile responsiveness */
@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }
  .sidebar {
    position: sticky;
    top: 0;
    width: 100%;
    height: auto;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .brand {
    flex: 0 0 100%;
    padding: 15px 20px;
  }
  .menu {
    flex: 0 0 100%;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0;
  }
  .menu-item {
    flex: 0 0 auto;
    padding: 12px 15px;
    font-size: 0.85rem;
    border-left: none;
    border-bottom: 3px solid transparent;
    white-space: nowrap;
  }
  .menu-item.active {
    border-left: none;
    border-bottom-color: #42b983;
  }
  .bottom-action {
    flex: 0 0 100%;
    padding: 12px 20px;
    border-top: 1px solid #34495e;
  }
  .content-area {
    margin-left: 0;
    margin-top: 0;
    padding: 15px;
  }
  .page-title {
    font-size: 1.3rem;
  }
  .card {
    padding: 15px;
    margin-bottom: 15px;
  }
  .form-row {
    flex-direction: column;
    gap: 8px;
  }
  .form-row .input-field {
    width: 100%;
  }
  .codes-table,
  .codes-table th,
  .codes-table td {
    font-size: 0.85rem;
  }
  .codes-table th,
  .codes-table td {
    padding: 8px 6px;
  }
  .resident-actions {
    flex-direction: column;
    gap: 4px;
    align-items: stretch;
  }
  .resident-actions-cell {
    min-width: auto;
  }
  .btn-primary,
  .btn-secondary,
  .btn-danger,
  .btn-logout {
    width: 100%;
    padding: 8px 12px;
    font-size: 0.85rem;
  }
  .btn-primary.btn-sm,
  .btn-secondary.btn-sm {
    width: auto;
  }
  .notif-badge {
    right: 12px;
  }
}

@media (max-width: 768px) and (orientation: landscape) {
  .sidebar {
    flex-direction: column;
    width: 200px;
    height: 100vh;
    position: fixed;
    flex-wrap: nowrap;
  }
  .menu {
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 15px 0;
  }
  .menu-item {
    flex: none;
    border-left: 4px solid transparent;
    border-bottom: none;
    padding: 12px 15px;
    white-space: normal;
    font-size: 0.9rem;
  }
  .menu-item.active {
    border-bottom: none;
    border-left-color: #42b983;
  }
  .bottom-action {
    flex: none;
    border-top: 1px solid #34495e;
    border-left: none;
  }
  .content-area {
    margin-left: 200px;
    margin-top: 0;
    padding: 15px;
  }
  .page-title {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .sidebar {
    max-height: 50vh;
  }
  .content-area {
    padding: 10px;
  }
  .page-title {
    font-size: 1.1rem;
    margin-bottom: 5px;
  }
  .description {
    font-size: 0.8rem;
    margin-bottom: 10px;
  }
  .card {
    padding: 12px;
    margin-bottom: 12px;
  }
  .card h3 {
    font-size: 1rem;
    margin-bottom: 10px;
  }
  .codes-table,
  .codes-table th,
  .codes-table td {
    font-size: 0.75rem;
  }
  .codes-table th,
  .codes-table td {
    padding: 4px 3px;
  }
  .code-badge {
    padding: 2px 6px;
    font-size: 0.7rem;
  }
  .form-group {
    margin-bottom: 10px;
  }
  label {
    font-size: 0.85rem;
    margin-bottom: 4px;
  }
  .input-field,
  textarea {
    font-size: 0.85rem;
    padding: 8px;
  }
  .btn-primary,
  .btn-secondary,
  .btn-danger,
  .btn-logout {
    padding: 6px 10px;
    font-size: 0.75rem;
  }
}
</style>
