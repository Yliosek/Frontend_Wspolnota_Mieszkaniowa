<template>
  <div class="login-container">
    <div class="login-card">
      <div class="brand-header">
        <h2>Wspólnota Mieszkaniowa</h2>
      </div>
      
      <form v-if="!isRegistering" @submit.prevent="handleLogin" class="fade-in">
        <p class="subtitle">Zaloguj się do swojego panelu</p>
        
        <div class="form-group">
          <label>E-mail (Login)</label>
          <input type="text" v-model="loginForm.username" placeholder="Np. admin lub user" required class="input-field" />
        </div>
        
        <div class="form-group">
          <label>Hasło</label>
          <input type="password" v-model="loginForm.password" placeholder="Twoje hasło" required class="input-field" />
        </div>
        
        <button type="submit" class="btn-main">Zaloguj się</button>
        
        <p class="switch-link">
          Nowy mieszkaniec? 
          <span @click="isRegistering = true">Zarejestruj się kodem</span>
        </p>
      </form>

      <form v-else @submit.prevent="handleRegister" class="fade-in">
        <p class="subtitle">Rejestracja nowego konta</p>
        
        <div class="form-group">
          <label>Adres e-mail</label>
          <input type="email" v-model="regForm.email" placeholder="Wpisz e-mail" required class="input-field" />
        </div>
        
        <div class="form-group">
          <label>Hasło</label>
          <input type="password" v-model="regForm.password" placeholder="Wymyśl hasło" required class="input-field" />
        </div>
        
        <div class="form-group">
          <label>Powtórz hasło</label>
          <input type="password" v-model="regForm.confirmPassword" placeholder="Powtórz hasło" required class="input-field" />
        </div>
        
        <div class="form-group">
          <label>Kod weryfikacyjny</label>
          <input type="text" v-model="regForm.code" placeholder="6-znakowy kod od administracji" required class="input-field code-input" />
        </div>
        
        <button type="submit" class="btn-main btn-reg">Załóż konto</button>
        
        <p class="switch-link">
          Masz już konto? 
          <span @click="isRegistering = false">Wróć do logowania</span>
        </p>
      </form>

      <div v-if="statusMsg" :class="['status-box', isError ? 'err' : 'ok']">
        {{ statusMsg }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isRegistering = ref(false)
const statusMsg = ref('')
const isError = ref(false)

const loginForm = reactive({ username: '', password: '' })
const regForm = reactive({ email: '', password: '', confirmPassword: '', code: '' })

const handleLogin = () => {
  statusMsg.value = ''
  const foundUser = authStore.login(loginForm.username, loginForm.password)

  if (foundUser) {
    if (foundUser.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/user')
    }
  } else {
    showFeedback('Błędny e-mail lub hasło!', true)
  }
}

const handleRegister = () => {
  statusMsg.value = ''
  
  if (regForm.password !== regForm.confirmPassword) {
    showFeedback('Podane hasła nie są identyczne!', true)
    return
  }

  const isCodeValid = authStore.useCode(regForm.code)

  if (isCodeValid) {
    authStore.registerUser(regForm.email, regForm.password)
    showFeedback('Konto utworzone pomyślnie! Możesz się teraz zalogować.', false)
    isRegistering.value = false
    
    // Czyszczenie formularza po sukcesie
    regForm.email = ''
    regForm.password = ''
    regForm.confirmPassword = ''
    regForm.code = ''
  } else {
    showFeedback('Nieprawidłowy lub wygasły kod weryfikacyjny.', true)
  }
}

const showFeedback = (msg: string, err: boolean) => {
  statusMsg.value = msg
  isError.value = err
}
</script>

<style scoped>
.login-container { 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  min-height: 100vh; 
  background: #f4f7f6; 
  padding: 20px;
}

.login-card { 
  background: white; 
  padding: 40px; 
  border-radius: 12px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.08); 
  width: 100%; 
  max-width: 420px; 
}

.brand-header {
  text-align: center;
  margin-bottom: 25px;
}

.brand-header h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.8rem;
}

.subtitle { 
  color: #718096; 
  margin-bottom: 25px; 
  font-size: 1rem; 
  text-align: center;
}

.form-group { 
  text-align: left; 
  margin-bottom: 18px; 
}

label { 
  display: block; 
  font-weight: 600; 
  margin-bottom: 8px; 
  font-size: 0.9rem; 
  color: #4a5568;
}

.input-field { 
  width: 100%; 
  padding: 12px; 
  border: 1px solid #e2e8f0; 
  border-radius: 6px; 
  box-sizing: border-box; 
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #42b983;
}

.code-input {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-family: monospace;
  font-weight: bold;
}

.btn-main { 
  width: 100%; 
  padding: 14px; 
  background: #42b983; 
  color: white; 
  border: none; 
  border-radius: 6px; 
  font-weight: bold; 
  font-size: 1.05rem;
  cursor: pointer; 
  margin-top: 10px; 
  transition: 0.2s;
}

.btn-main:hover {
  background: #369f6e;
}

.btn-reg { 
  background: #2c3e50; 
}

.btn-reg:hover {
  background: #1a252f;
}

.switch-link { 
  margin-top: 25px; 
  font-size: 0.9rem; 
  text-align: center;
  color: #718096;
}

.switch-link span { 
  color: #42b983; 
  cursor: pointer; 
  font-weight: bold;
  text-decoration: none; 
}

.switch-link span:hover {
  text-decoration: underline;
}

.status-box { 
  margin-top: 20px; 
  padding: 12px; 
  border-radius: 6px; 
  font-size: 0.9rem; 
  text-align: center;
  font-weight: 600;
}

.err { background: #fed7d7; color: #9b2c2c; }
.ok { background: #c6f6d5; color: #2f855a; }

.fade-in { animation: fadeIn 0.4s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 480px) {
  .login-card { padding: 25px; }
  .brand-header h2 { font-size: 1.5rem; }
}
</style>