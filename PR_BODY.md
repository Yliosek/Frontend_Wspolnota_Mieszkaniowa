Frontend — FE: per-invoice BLIK flow + UI fixes

Co dodano / naprawiono:
- Per‑invoice BLIK flow: `startPayment(amount, description)`, `payInvoice(inv)`, `confirmBlik()` — po potwierdzeniu BLIK frontend przekazuje `existing_payment_id` do endpointu opłacenia faktury.
- Sanitizacja komunikatów backendu: `extractServerMessage()` (usuwa np. "Value error,...").
- `translatePaymentDescription()` — tłumaczenie opisów płatności (np. "Invoice #18" → "Faktura #18").
- UI/UX: styl `.btn-pay`, modalne potwierdzenia zamiast `alert()`, responsywne ukrywanie kolumn tabel (znika poziomy scrollbar).
- Zmiana klienta API: `InvoicesApi.pay` przyjmuje teraz obiekt `{ method?, existing_payment_id? }`.

Jak testować:
1. Uruchomić frontend podpięty do dev/staging backend.
2. Zalogować się jako mieszkaniec, znaleźć fakturę, kliknąć `Zapłać`.
3. Zainicjować BLIK i potwierdzić — faktura powinna być oznaczona jako opłacona.
4. Test: attach istniejącej płatności — upewnić się że saldo nie jest zmieniane gdy `existing_payment_id` jest użyte.

DB / migracje: brak migracji (nie zmienia struktury DB).

Wdrożenie/uwagi:
- Wdrożyć frontend i backend w tym samym release, sprawdzić `BACKEND_URL` i CORS.
- Nie commitować plików konfiguracyjnych z danymi (.env etc.).
