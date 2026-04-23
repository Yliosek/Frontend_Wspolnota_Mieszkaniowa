<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="brand">
        <h2>Panel Admina</h2>
      </div>
      
      <nav class="menu">
        <button 
          :class="['menu-item', { active: activeTab === 'dashboard' }]" 
          @click="activeTab = 'dashboard'"
        >
          Pulpit
        </button>
        <button 
          :class="['menu-item', { active: activeTab === 'codes' }]" 
          @click="activeTab = 'codes'"
        >
          Kody dostępu
        </button>
        <button 
          :class="['menu-item', { active: activeTab === 'reports' }]" 
          @click="activeTab = 'reports'"
        >
          Zgłoszenia 
          <span v-if="authStore.faults.length > 0" class="notif-badge">
            {{ authStore.faults.length }}
          </span>
        </button>
      </nav>

      <div class="bottom-action">
        <button @click="logout" class="btn-logout">Wyloguj</button>
      </div>
    </aside>

    <main class="content-area">
      
      <div v-if="activeTab === 'dashboard'" class="tab-content fade-in">
        <h1 class="page-title">Pulpit Zarządzania</h1>
        <p class="description">Witaj, tutaj możesz opublikować komunikaty dla wszystkich mieszkańców.</p>
        
        <div class="card">
          <h3>Opublikuj nowe ogłoszenie</h3>
          <div class="form-group">
            <label>Tytuł ogłoszenia</label>
            <input 
              type="text" 
              v-model="newAnn.title" 
              placeholder="Np. Przerwa w dostawie wody" 
              class="input-field" 
            />
          </div>
          <div class="form-group">
            <label>Treść ogłoszenia</label>
            <textarea 
              v-model="newAnn.content" 
              placeholder="Wpisz szczegóły dla mieszkańców..." 
              class="input-field textarea"
            ></textarea>
          </div>
          <button @click="handlePostAnnouncement" class="btn-primary">
            Opublikuj ogłoszenie
          </button>
        </div>
      </div>

      <div v-else-if="activeTab === 'codes'" class="tab-content fade-in">
        <h1 class="page-title">Kody rejestracji</h1>
        <p class="description">Generuj jednorazowe kody dla nowych mieszkańców wspólnoty.</p>
        
        <div class="card">
          <button @click="authStore.generateVerificationCode()" class="btn-primary">
            Generuj nowy kod
          </button>
          
          <div v-if="authStore.activeCodes.length > 0" class="codes-section">
            <p class="codes-title">Oczekujące kody weryfikacyjne:</p>
            <div class="codes-grid">
              <span class="code-badge" v-for="c in authStore.activeCodes" :key="c">
                {{ c }}
              </span>
            </div>
          </div>
          <div v-else class="empty-state">
            Brak wygenerowanych kodów.
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'reports'" class="tab-content fade-in">
        <h1 class="page-title">Zgłoszone usterki</h1>
        <p class="description">Lista problemów zgłoszonych przez mieszkańców.</p>
        
        <div v-if="authStore.faults.length > 0">
          <div v-for="fault in authStore.faults" :key="fault.id" class="card fault-card">
            <div class="fault-header">
              <span class="fault-cat">{{ fault.category }}</span>
              <span class="fault-date">{{ fault.date }}</span>
            </div>
            <p class="fault-user"><strong>Zgłaszający:</strong> {{ fault.userEmail }}</p>
            <p class="fault-desc"><strong>Opis:</strong> {{ fault.description }}</p>
            <div class="fault-status">Status: {{ fault.status }}</div>
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Domyślna zakładka
const activeTab = ref('dashboard')

// Reaktywny obiekt na nowe ogłoszenie
const newAnn = reactive({ title: '', content: '' })

// Obsługa dodawania ogłoszenia
const handlePostAnnouncement = () => {
  if (newAnn.title.trim() && newAnn.content.trim()) {
    authStore.addAnnouncement(newAnn.title, newAnn.content)
    // Czyszczenie formularza po wysłaniu
    newAnn.title = ''
    newAnn.content = ''
    alert('Ogłoszenie zostało pomyślnie opublikowane!')
  } else {
    alert('Wypełnij tytuł i treść ogłoszenia.')
  }
}

// Obsługa wylogowania
const logout = () => {
  router.push('/')
}
</script>

<style scoped>
/* Główny układ panelu */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f4f7f6;
}

/* Pasek boczny (Sidebar) */
.sidebar {
  width: 260px;
  background-color: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  z-index: 10;
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
  position: relative;
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

.notif-badge {
  background-color: #e53e3e;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
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
  transition: 0.2s;
  font-size: 1rem;
}

.btn-logout:hover {
  background: #e53e3e;
  color: white;
  border-color: #e53e3e;
}

/* Obszar roboczy (Główna treść) */
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
  font-size: 1.05rem;
  margin-bottom: 30px;
}

/* Karty */
.card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  max-width: 800px;
  margin-bottom: 20px;
}

.card h3 {
  margin-top: 0;
  color: #2d3748;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
  text-align: left;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #4a5568;
}

.input-field {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 1rem;
  box-sizing: border-box;
}

.textarea {
  min-height: 120px;
  resize: vertical;
}

.btn-primary {
  background: #42b983;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: background-color 0.2s;
  margin-top: 10px;
}

.btn-primary:hover {
  background: #369f6e;
}

/* Sekcja kodów */
.codes-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px dashed #e2e8f0;
}

.codes-title {
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 15px;
}

.codes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.code-badge {
  background: #ebf8f2;
  color: #2f855a;
  border: 1px solid #c6f6d5;
  padding: 8px 16px;
  border-radius: 20px;
  font-family: monospace;
  font-size: 1.2rem;
  font-weight: bold;
  letter-spacing: 2px;
}

/* Zgłoszenia usterek */
.fault-card {
  border-left: 5px solid #e53e3e;
}

.fault-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f4f8;
}

.fault-cat {
  background: #fed7d7;
  color: #9b2c2c;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.85rem;
}

.fault-date {
  color: #a0aec0;
  font-size: 0.9rem;
}

.fault-user, .fault-desc {
  margin: 8px 0;
  color: #2d3748;
}

.fault-status {
  display: inline-block;
  margin-top: 15px;
  font-size: 0.9rem;
  color: #42b983;
  font-weight: bold;
  background: #ebf8f2;
  padding: 4px 10px;
  border-radius: 4px;
}

.empty-state {
  color: #a0aec0;
  font-style: italic;
  padding: 20px 0;
}

/* Animacja przejścia zakładek */
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsywność - dla telefonów i tabletów */
@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    flex-direction: row;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  .brand {
    padding: 15px;
    background: transparent;
  }
  
  .menu {
    flex-direction: row;
    padding: 0;
    overflow-x: auto;
    white-space: nowrap;
  }
  
  .menu-item {
    padding: 15px;
    border-left: none;
    border-bottom: 3px solid transparent;
  }
  
  .menu-item.active {
    border-left: none;
    border-bottom-color: #42b983;
  }
  
  .notif-badge {
    position: static;
    transform: none;
    margin-left: 8px;
  }
  
  .bottom-action {
    padding: 10px 15px;
  }
  
  .content-area {
    padding: 20px;
  }
}
</style>