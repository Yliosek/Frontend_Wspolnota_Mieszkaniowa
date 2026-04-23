<template>
  <div class="user-layout">
    <aside class="sidebar">
      <div class="brand">
        <h2>Panel Mieszkańca</h2>
      </div>
      
      <nav class="menu">
        <button 
          :class="['menu-item', { active: activeTab === 'dashboard' }]" 
          @click="activeTab = 'dashboard'"
        >
          Pulpit
        </button>
        <button 
          :class="['menu-item', { active: activeTab === 'data' }]" 
          @click="activeTab = 'data'"
        >
          Moje dane
        </button>
        <button 
          :class="['menu-item', { active: activeTab === 'payments' }]" 
          @click="activeTab = 'payments'"
        >
          Opłaty
        </button>
        <button 
          :class="['menu-item', { active: activeTab === 'report' }]" 
          @click="activeTab = 'report'"
        >
          Zgłoś usterkę
        </button>
      </nav>

      <div class="bottom-action">
        <button @click="logout" class="btn-logout">Wyloguj</button>
      </div>
    </aside>

    <main class="content-area">
      
      <div v-if="activeTab === 'dashboard'" class="tab-content fade-in">
        <h1 class="page-title">Dzień dobry!</h1>
        <p class="description">Witaj w panelu swojej wspólnoty mieszkaniowej. Tutaj znajdziesz wszystkie ważne informacje.</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Twoje opłaty</h3>
            <p class="stat-status ok">Opłacone</p>
          </div>
          <div class="stat-card">
            <h3>Aktywne zgłoszenia</h3>
            <p class="stat-number">0</p>
          </div>
        </div>

        <div class="card info-card">
          <h3>Aktualności wspólnoty</h3>
          <ul>
            <li>Przegląd instalacji gazowej odbędzie się 15 maja.</li>
            <li>Nowy kod do domofonu został wysłany na e-mail.</li>
          </ul>
        </div>
      </div>

      <div v-else-if="activeTab === 'data'" class="tab-content fade-in">
        <h1 class="page-title">Twoje dane profilowe</h1>
        <div class="card">
          <div class="data-row">
            <span class="label">E-mail:</span>
            <span class="value">użytkownik@wspolnota.pl</span>
          </div>
          <div class="data-row">
            <span class="label">Rola:</span>
            <span class="value">Mieszkaniec</span>
          </div>
          <p class="description" style="margin-top: 20px;">
            Dane pochodzą z Twojej rejestracji. Jeśli chcesz zmienić dane, skontaktuj się z administratorem.
          </p>
        </div>
      </div>

      <div v-else-if="activeTab === 'payments'" class="tab-content fade-in">
        <h1 class="page-title">Rozliczenia</h1>
        <div class="card">
          <p class="empty-state">Brak faktur do opłacenia. Wszystkie należności są uregulowane.</p>
        </div>
      </div>

      <div v-else-if="activeTab === 'report'" class="tab-content fade-in">
        <h1 class="page-title">Zgłoś usterkę</h1>
        <div class="card report-form">
          <div class="form-group">
            <label>Rodzaj usterki</label>
            <select>
              <option>Winda</option>
              <option>Domofon</option>
              <option>Oświetlenie na klatce</option>
              <option>Inne</option>
            </select>
          </div>
          <div class="form-group">
            <label>Opis problemu</label>
            <textarea placeholder="Opisz krótko co się stało..."></textarea>
          </div>
          <button class="btn-send">Wyślij zgłoszenie</button>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref('dashboard')

const logout = () => {
  router.push('/')
}
</script>

<style scoped>
/* Te style są identyczne jak w AdminView dla zachowania spójności */
.user-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f4f7f6;
}

.sidebar {
  width: 260px;
  background-color: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
}

.brand {
  padding: 25px 20px;
  background-color: #233140;
  text-align: center;
}

.brand h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #42b983;
}

.menu {
  flex: 1;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}

.menu-item {
  background: transparent;
  color: #a0aec0;
  border: none;
  padding: 15px 25px;
  text-align: left;
  font-size: 1.05rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.menu-item:hover {
  background-color: #34495e;
  color: white;
}

.menu-item.active {
  background-color: #34495e;
  color: white;
  border-left-color: #42b983;
}

.bottom-action {
  padding: 20px;
}

.btn-logout {
  width: 100%;
  background: transparent;
  color: #e2e8f0;
  border: 1px solid #718096;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-logout:hover {
  background: #e53e3e;
  border-color: #e53e3e;
  color: white;
}

.content-area {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
}

.page-title {
  margin-top: 0;
  color: #1a202c;
  font-size: 2rem;
  margin-bottom: 10px;
}

.description {
  color: #718096;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  max-width: 800px;
  margin-bottom: 20px;
}

/* Statystyki */
.stats-grid {
  display: flex;
  gap: 20px;
  max-width: 800px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  flex: 1;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #42b983;
  margin: 10px 0 0 0;
}

.stat-status.ok {
  color: #2f855a;
  font-weight: bold;
  font-size: 1.5rem;
  margin-top: 10px;
}

/* Widok danych */
.data-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #edf2f7;
}

.label {
  font-weight: bold;
  width: 100px;
  color: #4a5568;
}

/* Formularz zgłoszeń */
.form-group {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 600;
  margin-bottom: 8px;
}

select, textarea {
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
}

textarea {
  min-height: 120px;
  resize: vertical;
}

.btn-send {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.empty-state {
  color: #a0aec0;
  font-style: italic;
}

.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .user-layout { flex-direction: column; }
  .sidebar { width: 100%; flex-direction: row; }
  .menu { flex-direction: row; overflow-x: auto; padding: 0; }
  .menu-item { padding: 15px; border-left: none; border-bottom: 3px solid transparent; }
  .menu-item.active { border-bottom-color: #42b983; }
  .content-area { padding: 20px; }
  .stats-grid { flex-direction: column; }
}
</style>