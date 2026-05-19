<template>
  <div class="login-container">
    <div class="login-card">
      <div class="brand-header">
        <h2>Wspólnota Mieszkaniowa</h2>
      </div>

      <!-- LOGOWANIE -->
      <form v-if="!isRegistering && !isForgotPassword" @submit.prevent="handleLogin" class="fade-in">
        <p class="subtitle">Zaloguj się do swojego panelu</p>

        <div class="form-group">
          <label>E-mail</label>
          <input
            type="text"
            v-model="loginForm.email"
            placeholder="np. admin@wspolnota.pl"
            class="input-field"
          />
        </div>

        <div class="form-group">
          <label>Hasło</label>
          <div class="password-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="loginForm.password"
              placeholder="Twoje hasło"
              class="input-field"
            />
            <button type="button" class="btn-show-password" @click="showPassword = !showPassword">
              <svg v-if="showPassword" viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
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

        <button type="submit" class="btn-main" :disabled="busy">
          {{ busy ? 'Logowanie...' : 'Zaloguj się' }}
        </button>

        <p class="switch-link">
          <span @click="switchToForgotPassword">Nie pamiętam hasła</span>
          <span class="separator">•</span>
          <span @click="switchToRegister">Nowy mieszkaniec</span>
        </p>
      </form>

      <!-- REJESTRACJA -->
      <form v-else-if="isRegistering && !isForgotPassword" @submit.prevent="handleRegister" class="fade-in">
        <p class="subtitle">Rejestracja nowego konta</p>

        <div class="form-group">
          <label>Imię</label>
          <input type="text" v-model="regForm.first_name" class="input-field" />
        </div>

        <div class="form-group">
          <label>Nazwisko</label>
          <input type="text" v-model="regForm.last_name" class="input-field" />
        </div>

        <div class="form-group">
          <label>Adres e-mail</label>
          <input
            type="text"
            v-model="regForm.email"
            class="input-field"
          />
        </div>

        <div class="form-group">
          <label>Hasło (min 8 znaków, duża litera + cyfra)</label>
          <div class="password-wrapper">
            <input
              :type="showRegPassword ? 'text' : 'password'"
              v-model="regForm.password"
              class="input-field"
            />
            <button type="button" class="btn-show-password" @click="showRegPassword = !showRegPassword">
              <svg v-if="showRegPassword" viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
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
          <label>Powtórz hasło</label>
          <div class="password-wrapper">
            <input
              :type="showRegPassword ? 'text' : 'password'"
              v-model="regForm.confirm_password"
              class="input-field"
            />
            <button type="button" class="btn-show-password" @click="showRegPassword = !showRegPassword">
              <svg v-if="showRegPassword" viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
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
          <label>Kod weryfikacyjny</label>
          <input
            type="text"
            v-model="regForm.verification_code"
            placeholder="6-znakowy kod od administracji"
            class="input-field code-input"
          />
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" v-model="regForm.accept_terms" />
            Akceptuję regulamin systemu
          </label>
        </div>

        <button type="submit" class="btn-main btn-reg" :disabled="busy">
          {{ busy ? 'Tworzenie konta...' : 'Załóż konto' }}
        </button>

        <p class="switch-link">
          <span @click="isRegistering = false; isForgotPassword = false">Wróć do logowania</span>
        </p>
      </form>

      <!-- ODZYSKIWANIE HASŁA -->
      <form v-else-if="isForgotPassword" @submit.prevent="handleForgotPassword" class="fade-in">
        <p class="subtitle">Odzyskaj hasło</p>
        <p class="description-text">Podaj swój e-mail i numer pokoju do weryfikacji. Administracja wyśle Ci kod do resetu hasła.</p>

        <div class="form-group">
          <label>Adres e-mail</label>
          <input
            type="text"
            v-model="forgotForm.email"
            placeholder="np. adam@example.com"
            class="input-field"
          />
        </div>

        <div class="form-group">
          <label>Numer pokoju</label>
          <input
            type="text"
            v-model="forgotForm.flat_number"
            placeholder="np. 1A"
            class="input-field code-input"
          />
        </div>

        <button type="submit" class="btn-main" :disabled="busy">
          {{ busy ? 'Wysyłanie prośby...' : 'Wyślij prośbę o reset' }}
        </button>

        <p class="switch-link">
          <span @click="switchToLogin">Powrót do logowania</span>
        </p>
      </form>

      <div v-if="statusMsg" :class="['status-box', isError ? 'err' : 'ok']">
        {{ statusMsg }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/api/client'

const router = useRouter()
const authStore = useAuthStore()

const isRegistering = ref(false)
const isForgotPassword = ref(false)
const statusMsg = ref('')
const isError = ref(false)
const busy = ref(false)
const showPassword = ref(false)
const showRegPassword = ref(false)

const loginForm = reactive({ email: '', password: '' })
const regForm = reactive({
  email: '',
  password: '',
  confirm_password: '',
  first_name: '',
  last_name: '',
  verification_code: '',
  accept_terms: false,
})
const forgotForm = reactive({
  email: '',
  flat_number: '',
})

function showFeedback(msg: string, err: boolean) {
  statusMsg.value = msg
  isError.value = err
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

function switchToRegister() {
  isRegistering.value = true
  isForgotPassword.value = false
  statusMsg.value = ''
}

function switchToForgotPassword() {
  isForgotPassword.value = true
  isRegistering.value = false
  statusMsg.value = ''
}

function switchToLogin() {
  isRegistering.value = false
  isForgotPassword.value = false
  statusMsg.value = ''
}

async function handleLogin() {
  statusMsg.value = ''
  if (!loginForm.email.trim()) {
    showFeedback('E-mail jest wymagany', true)
    return
  }
  if (!isValidEmail(loginForm.email)) {
    showFeedback('E-mail nie jest poprawny (np. user@domena.pl)', true)
    return
  }
  // allow empty password submission (used when admin approved reset)
  busy.value = true
  try {
    const me = await authStore.login(loginForm.email, loginForm.password)
    if (authStore.mustChangePassword) {
      router.push('/set-password')
      return
    }
    router.push(me.role === 'administrator' ? '/admin' : '/user')
  } catch (e: any) {
    showFeedback(e?.response?.data?.detail || 'Błędny e-mail lub hasło!', true)
  } finally {
    busy.value = false
  }
}

async function handleRegister() {
  statusMsg.value = ''
  if (!regForm.first_name.trim()) {
    showFeedback('Imię jest wymagane', true)
    return
  }
  if (!regForm.last_name.trim()) {
    showFeedback('Nazwisko jest wymagane', true)
    return
  }
  if (!regForm.email.trim()) {
    showFeedback('E-mail jest wymagany', true)
    return
  }
  if (!isValidEmail(regForm.email)) {
    showFeedback('E-mail nie jest poprawny (np. user@domena.pl)', true)
    return
  }
  if (!regForm.password.trim()) {
    showFeedback('Hasło jest wymagane', true)
    return
  }
  if (!regForm.confirm_password.trim()) {
    showFeedback('Potwierdzenie hasła jest wymagane', true)
    return
  }
  if (!regForm.verification_code.trim()) {
    showFeedback('Kod weryfikacyjny jest wymagany', true)
    return
  }
  if (!regForm.accept_terms) {
    showFeedback('Musisz zaakceptować regulamin', true)
    return
  }
  if (regForm.password !== regForm.confirm_password) {
    showFeedback('Podane hasła nie są identyczne!', true)
    return
  }
  busy.value = true
  try {
    await authStore.register({
      email: regForm.email,
      password: regForm.password,
      confirm_password: regForm.confirm_password,
      first_name: regForm.first_name,
      last_name: regForm.last_name,
      verification_code: regForm.verification_code.trim().toUpperCase(),
      accept_terms: regForm.accept_terms,
    })
    showFeedback('Konto utworzone pomyślnie! Możesz się teraz zalogować.', false)
    isRegistering.value = false
    Object.assign(regForm, {
      email: '',
      password: '',
      confirm_password: '',
      first_name: '',
      last_name: '',
      verification_code: '',
      accept_terms: false,
    })
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    let msg = 'Nie udało się utworzyć konta.'
    if (typeof detail === 'string') msg = detail
    else if (Array.isArray(detail) && detail[0]?.msg) msg = detail[0].msg
    showFeedback(msg, true)
  } finally {
    busy.value = false
  }
}

async function handleForgotPassword() {
  statusMsg.value = ''
  if (!forgotForm.email.trim()) {
    showFeedback('E-mail jest wymagany', true)
    return
  }
  if (!isValidEmail(forgotForm.email)) {
    showFeedback('E-mail nie jest poprawny (np. user@domena.pl)', true)
    return
  }
  if (!forgotForm.flat_number.trim()) {
    showFeedback('Numer mieszkania jest wymagany', true)
    return
  }
  busy.value = true
  try {
    const response = await apiClient.post<{ message: string }>('/auth/request-password-reset', {
      email: forgotForm.email,
      flat_number: forgotForm.flat_number.trim().toUpperCase(),
    })
    showFeedback(response.data.message, false)
    Object.assign(forgotForm, { email: '', flat_number: '' })
    // Wróć do logowania po 3 sekundach
    setTimeout(() => {
      switchToLogin()
    }, 3000)
  } catch (e: any) {
    const detail = e?.response?.data?.detail
    let msg = 'Nie udało się wysłać prośby o reset hasła.'
    if (typeof detail === 'string') msg = detail
    else if (Array.isArray(detail) && detail[0]?.msg) msg = detail[0].msg
    showFeedback(msg, true)
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f4f7f6; padding: 20px; }
.login-card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); width: 100%; max-width: 460px; }
.brand-header { text-align: center; margin-bottom: 25px; }
.brand-header h2 { color: #2c3e50; margin: 0; font-size: 1.8rem; }
.subtitle { color: #718096; margin-bottom: 25px; font-size: 1rem; text-align: center; font-weight: 600; }
.description-text { color: #718096; margin-bottom: 20px; font-size: 0.85rem; text-align: center; line-height: 1.4; }
.form-group { text-align: left; margin-bottom: 18px; }
.checkbox-group label { display: flex; align-items: center; gap: 8px; font-weight: normal; }
.checkbox-group input { margin: 0; }
label { display: block; font-weight: 600; margin-bottom: 8px; font-size: 0.9rem; color: #4a5568; }
.input-field { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; box-sizing: border-box; font-size: 1rem; transition: border-color 0.2s; }
.input-field:focus { outline: none; border-color: #42b983; }
.password-wrapper { position: relative; display: flex; }
.password-wrapper .input-field { width: 100%; }
.btn-show-password { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0; color: #718096; transition: color 0.2s; }
.btn-show-password:hover { color: #42b983; }
.password-icon { width: 20px; height: 20px; display: block; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.code-input { text-transform: uppercase; letter-spacing: 2px; font-family: monospace; font-weight: bold; }
.btn-main { width: 100%; padding: 14px; background: #42b983; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 1.05rem; cursor: pointer; margin-top: 10px; transition: 0.2s; }
.btn-main:hover:not(:disabled) { background: #369f6e; }
.btn-main:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-reg { background: #2c3e50; }
.btn-reg:hover:not(:disabled) { background: #1a252f; }
.switch-link { margin-top: 25px; font-size: 0.9rem; text-align: center; color: #718096; }
.switch-link span { color: #42b983; cursor: pointer; font-weight: bold; transition: text-decoration 0.2s; }
.switch-link span:hover { text-decoration: underline; }
.separator { color: #cbd5e0; margin: 0 8px; }
.status-box { margin-top: 20px; padding: 12px; border-radius: 6px; font-size: 0.9rem; text-align: center; font-weight: 600; white-space: pre-wrap; word-wrap: break-word; }
.err { background: #fed7d7; color: #9b2c2c; }
.ok { background: #c6f6d5; color: #2f855a; }
.fade-in { animation: fadeIn 0.4s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
