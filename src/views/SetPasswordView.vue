<template>
  <div class="setpw-container">
    <div class="card">
      <h1>Ustaw nowe hasło</h1>
      <p>Twoje konto wymaga ustawienia nowego hasła po resecie. Wprowadź nowe hasło poniżej.</p>

      <div class="form-group">
        <label>Nowe hasło</label>
        <div class="password-wrapper">
          <input :type="showNew ? 'text' : 'password'" v-model="form.new_password" class="input-field" />
          <button type="button" class="btn-show-password" @click="showNew = !showNew">
            <svg v-if="showNew" viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
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
          <input :type="showNew ? 'text' : 'password'" v-model="form.confirm_password" class="input-field" />
          <button type="button" class="btn-show-password" @click="showNew = !showNew">
            <svg v-if="showNew" viewBox="0 0 24 24" class="password-icon" aria-hidden="true">
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

      <button class="btn-primary" @click="submit" :disabled="busy">{{ busy ? 'Przetwarzam...' : 'Ustaw nowe hasło' }}</button>

      <div v-if="msg" :class="['status-box', isError ? 'err' : 'ok']">{{ msg }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({ new_password: '', confirm_password: '' })
const showNew = ref(false)
const busy = ref(false)
const msg = ref('')
const isError = ref(false)

function showFeedback(m: string, err = false) {
  msg.value = m
  isError.value = err
}

async function submit() {
  showFeedback('', false)
  if (!form.new_password.trim() || !form.confirm_password.trim()) {
    showFeedback('Wypełnij oba pola', true)
    return
  }
  if (form.new_password !== form.confirm_password) {
    showFeedback('Podane hasła nie są identyczne', true)
    return
  }
  if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.new_password)) {
    showFeedback('Hasło musi zawierać co najmniej 8 znaków, dużą literę i cyfrę', true)
    return
  }
  busy.value = true
  try {
    const resp = await apiClient.post('/auth/complete-password-reset', { new_password: form.new_password })
    showFeedback(resp.data.message || 'Hasło ustawione pomyślnie', false)
    // Clear flag and redirect to dashboard
    auth.mustChangePassword = false
    const me = await auth.fetchMe()
    router.push(me?.role === 'administrator' ? '/admin' : '/user')
  } catch (e: any) {
    showFeedback(e?.response?.data?.detail || 'Błąd ustawiania hasła', true)
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.setpw-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f4f7f6; padding: 20px; }
.card { background: white; padding: 30px; border-radius: 10px; width: 100%; max-width: 520px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.form-group { margin-bottom: 16px; }
.password-wrapper { position: relative; display: flex; }
.password-wrapper .input-field { width: 100%; padding-right: 44px; }
.btn-show-password { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 0; color: #718096; display: inline-flex; align-items: center; justify-content: center; }
.btn-show-password:hover { color: #2f855a; }
.password-icon { width: 20px; height: 20px; display: block; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.input-field { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; }
.btn-primary { background: #42b983; color: white; padding: 12px 20px; border-radius: 6px; border: none; cursor: pointer; }
.status-box { margin-top: 12px; padding: 10px; border-radius: 6px; }
.err { background: #fed7d7; color: #9b2c2c; }
.ok { background: #c6f6d5; color: #2f855a; }

@media (max-width: 700px) {
  .setpw-container { padding: 14px; }
  .card { padding: 20px; }
}
</style>
