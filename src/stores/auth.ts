import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const activeCodes = ref<string[]>([])
  
  // Baza użytkowników
  const users = ref([
    { email: 'admin', password: 'admin', role: 'admin' },
    { email: 'user', password: 'user', role: 'user' }
  ])

  // --- KOMUNIKACJA ---
  // Początkowe ogłoszenie
  const announcements = ref([
    { 
      id: 1, 
      title: 'Witajcie mieszkańcy!', 
      content: 'To jest pierwsze ogłoszenie w naszym nowym systemie.', 
      date: new Date().toLocaleDateString() 
    }
  ])

  // Lista zgłoszonych usterek
  const faults = ref<any[]>([])

  // Funkcja dla Admina: Dodawanie ogłoszenia
  function addAnnouncement(title: string, content: string) {
    announcements.value.unshift({
      id: Date.now(),
      title,
      content,
      date: new Date().toLocaleDateString()
    })
  }

  // Funkcja dla Mieszkańca: Zgłaszanie usterki
  function reportFault(category: string, description: string, userEmail: string) {
    faults.value.unshift({
      id: Date.now(),
      category,
      description,
      userEmail,
      status: 'Nowe',
      date: new Date().toLocaleString()
    })
  }

  // --- LOGIKA AUTORYZACJI (bez zmian) ---
  function generateVerificationCode() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    activeCodes.value.push(code)
    return code
  }

  function useCode(code: string): boolean {
    const index = activeCodes.value.indexOf(code.trim().toUpperCase())
    if (index !== -1) {
      activeCodes.value.splice(index, 1)
      return true
    }
    return false
  }

  function registerUser(email: string, password: string) {
    users.value.push({ email, password, role: 'user' })
  }

  function login(email: string, password: string) {
    return users.value.find(u => u.email === email && u.password === password)
  }

  return { 
    activeCodes, users, announcements, faults,
    generateVerificationCode, useCode, registerUser, login,
    addAnnouncement, reportFault 
  }
})