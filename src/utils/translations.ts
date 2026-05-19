// Translation utilities for statuses and labels

export function translatePaymentStatus(status: string): string {
  const translations: Record<string, string> = {
    'initialized': 'Zainicjowana',
    'pending': 'Oczekująca',
    'completed': 'Ukończona',
    'rejected': 'Odrzucona',
    'cancelled': 'Anulowana',
  }
  return translations[status] || status
}

export function translateInvoiceStatus(status: string): string {
  const translations: Record<string, string> = {
    'pending': 'Oczekuje',
    'paid': 'Opłacona',
    'cancelled': 'Anulowana',
  }
  return translations[status] || status
}

export function translateIssueStatus(status: string): string {
  const translations: Record<string, string> = {
    'new': 'Nowe',
    'in_progress': 'W trakcie',
    'completed': 'Ukończone',
    'rejected': 'Odrzucone',
  }
  return translations[status] || status
}

export function translateIssueCategory(category: string): string {
  const translations: Record<string, string> = {
    'elevator': 'Winda',
    'lighting': 'Oświetlenie',
    'cleaning': 'Czystość',
    'intercom': 'Domofon',
    'heating': 'Ogrzewanie',
    'plumbing': 'Hydraulika',
    'other': 'Inne',
  }
  return translations[category] || category
}

export function translateAnnouncementStatus(status: string): string {
  const translations: Record<string, string> = {
    'draft': 'Szkic',
    'published': 'Opublikowane',
  }
  return translations[status] || status
}
