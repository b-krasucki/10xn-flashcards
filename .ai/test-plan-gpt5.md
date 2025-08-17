# Plan testów dla 10xn Flashcards (Astro + React + Supabase)

## 1. Wprowadzenie i cele testowania
Celem testów jest zapewnienie jakości aplikacji webowej 10xn Flashcards, obejmującej:
- poprawność kluczowych funkcjonalności (autoryzacja, generowanie fiszek, zarządzanie taliami, nauka SRS, profil),
- stabilność i bezpieczeństwo warstwy API (Astro Pages API + Supabase),
- zgodność interfejsu z wymaganiami UX/A11y oraz spójność komunikatów/obsługi błędów,
- odporność na błędy zewnętrzne (LLM/OpenRouter) i spójność danych w bazie Supabase.

Efektem będzie zminimalizowanie regresji, szybkie wykrywanie krytycznych defektów oraz przewidywalne wydania.

## 2. Zakres testów
W zakres wchodzą:
- Frontend (React/TypeScript) i routing (Astro),
- API (Astro pages pod /api/*) współpracujące z Supabase (auth + DB),
- Integracje z OpenRouter (LLM) w warstwie serwerowej,
- Algorytm powtórek rozłożonych w czasie (SM-2),
- Walidacje danych (Zod) i procedury obsługi błędów/logowania.

Poza zakresem:
- Testy urządzeń mobilnych natywnych (aplikacja jest webowa),
- Pen-testy pełnego zaplecza Supabase (wykonane jako sanity/security w granicach aplikacji).

## 3. Typy testów
- Testy jednostkowe:
  - utils: spaced-repetition (SM-2), utils/toast, utils/cn,
  - services: LLMService (parsing “Front:/Back:”, ekstrakcja nazwy talii), FlashcardsService (mapowanie, walidacje, aktualizacje),
  - schematy Zod (flashcards.schema.ts, generation.schema.ts).
- Testy integracyjne API:
  - /api/generations, /api/generateDeckName, /api/flashcards, /api/decks, /api/learn, /api/dashboard, /api/profile, /api/user, /api/deleteAccount,
  - z mockiem Supabase i LLM (MSW/nock) oraz z testowym projektem Supabase.
- Testy E2E (Playwright):
  - pełne scenariusze użytkownika: rejestracja/logowanie, generowanie, edycja/akceptacja propozycji, zapis, nauka, zarządzanie taliami, profil, wylogowanie/usuwanie konta.
- Testy bezpieczeństwa:
  - autoryzacja API, poprawność/bezpieczeństwo ciasteczek, brak wycieków kluczy, CSRF/SameSite, separacja ról (admin service key tylko po stronie serwera).
- Testy wydajnościowe:
  - /api/decks (N+1 counts), /api/dashboard (złożone zapytania), /api/generations (średni czas + odporność na błędy LLM).
- Testy dostępności (a11y):
  - weryfikacja aria-atributów, focus management, kontrast, nawigacja klawiaturą.
- Testy użyteczności/regresji wizualnej (opcjonalnie):
  - kluczowe ekrany (Dashboard, Generate, Flashcards, Learn, Profile) przy użyciu Playwright snapshots.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Autoryzacja i sesje (AuthForm, middleware, UserMenu, ProfileCard, /auth)
- Rejestracja nowego użytkownika:
  - poprawne walidacje (format e-mail, min 6 znaków, confirmPassword),
  - ścieżka z niepotwierdzonym e-mailem (toast, brak auto-logowania),
  - ścieżka z auto-logowaniem (jeśli włączone w projekcie).
- Logowanie istniejącego użytkownika:
  - poprawne zapisanie sb-access-token i sb-refresh-token (Secure, SameSite=Strict),
  - odświeżenie strony po zalogowaniu – sesja powinna istnieć.
- Middleware:
  - niezalogowany użytkownik -> redirect na /auth przy próbie wejścia na trasy: “/”, “/generate”, “/flashcards”, “/learn”, “/profile”, “/deck/*”.
- Wylogowanie (UserMenu, Profile):
  - wywołanie supabaseClient.auth.signOut(),
  - wyczyszczenie ciasteczek i redirect do /auth.
- Zmiana hasła (ProfileCard):
  - walidacje min. 6 znaków, brak zgodności z confirmPassword,
  - pomyślna zmiana (toast).
- Usunięcie konta (ProfileCard + /api/deleteAccount):
  - kaskadowe usunięcie flashcards, deck_names, generations, error_logs,
  - użycie SUPABASE_SERVICE_ROLE_KEY tylko po stronie serwera (brak wycieku),
  - wylogowanie i redirect.

Testy negatywne:
- Błędne hasło/e-mail, błąd sieci, błędny format JSON; zachowanie toasts/alerts.

Bezpieczeństwo:
- weryfikacja, że endpointy /api/* wymagają poprawnej sesji (uwaga: middleware omija /api; API musi samodzielnie odczytać sesję z cookies i ustawić supabase.auth.setSession – test weryfikuje, że aktualna implementacja nie powoduje 401 w zdrowej sesji; jeśli powoduje, test rejestruje defekt).
- sprawdzenie braku atrybutu HttpOnly w ciasteczkach (ryzyko, do zarejestrowania jako znane ograniczenie).

### 4.2. Generowanie fiszek (GenerateForm, ProposalList, /api/generations, /api/generateDeckName)
- Walidacje treści źródłowej:
  - < 1000 znaków -> przycisk zablokowany i komunikaty,
  - > 10000 znaków -> błąd/walidacja UI.
- Wybór modelu i wywołanie /api/generations:
  - poprawna odpowiedź 201 z proposals, generation_id, deckName,
  - błędy LLM (API error, brak klucza) -> toast, zapis do generation_error_logs.
- Nazwa talii:
  - regeneracja na /api/generateDeckName (sukces, porażka, parsing nazwy z reasoning).
- Przegląd propozycji:
  - Edycja propozycji ustawia source: “ai-edited”,
  - Odrzucenie/zaakceptowanie (stanowe).
- Zapisywanie:
  - “Save Approved”: zapis tylko zaakceptowanych + opcja dokończenia zapisu nieoznaczonych (modal),
  - “Save All”: zapis wszystkich (uwaga: obecny kod zapisuje również “rejected” – test ma to wykryć i zgłosić jako defekt lub potwierdzić wymóg biznesowy; kryterium akceptacji poniżej).
- Po zapisie:
  - utworzona talia (gdy nie istniała), mapping deck_name_id, poprawne źródła “ai-full/ai-edited”,
  - zaktualizowanie tabeli generations (accepted_unedited_count, accepted_edited_count) – testy wykryją, czy wartości są poprawnie sumowane czy nadpisywane (ryzyko).

Testy negatywne:
- LLM zwraca format inny niż “Front:/Back:” -> poprawne odfiltrowanie/propozycje puste/obsługa błędu.

### 4.3. Zarządzanie taliami i fiszkami (DecksGrid, FlashcardsList, EditDeckNameDialog, CreateDeckDialog, /api/decks, /api/flashcards, /deck/[id])
- Lista talii:
  - pobranie /api/decks; liczba fiszek per talia,
  - tworzenie nowej talii (POST /api/decks) z walidacją nazw,
  - edycja nazwy (PUT /api/decks),
  - usuwanie talii (DELETE /api/decks) – kaskadowo usuwa fiszki z tej talii.
- Widok talii:
  - /deck/:id – pobranie fiszek, filtrowanie (po generation i po deck),
  - dodanie ręcznej fiszki (POST /api/flashcards) z generation_id = null i source = “manual”,
  - edycja fiszki (PUT /api/flashcards) – gdy source = “ai-full” po edycji -> “ai-edited”,
  - usunięcie fiszki (DELETE /api/flashcards).
- Filtrowanie po generation:
  - /flashcards?generation=:id – sprawdzenie, że zwraca fiszki właśnie z tej generacji.

Testy negatywne:
- błędy API (401, 500), walidacje długości (front/back), brak talii, pusta talia.

Wydajność (N+1):
- /api/decks wykonuje count per deck – pomiar czasu/ilości zapytań przy 50-200 taliach; rekomendacja optymalizacji (agregacje lub RPC).

### 4.4. Dashboard (Dashboard.tsx, /api/dashboard)
- Zwracane statystyki:
  - totalFlashcards, generatedFlashcards (source=ai-full), editedFlashcards (ai-edited), manualFlashcards (manual),
  - recentGenerations: generated_count (rzeczywista liczba fiszek z tej generacji), poprawne deck_name i deck_id.
- Nawigacja do /generate, /learn oraz kliknięcia w “Ostatnie generacje” (deck lub filtrowanie).
- Stany ładowania i błędów (Loader, Alert).

### 4.5. Nauka (Learn, DeckSelector, LearnSession, /api/learn)
- Wybór talii (DeckSelector) – pokazuje tylko talie z co najmniej 1 fiszką,
- GET /api/learn?deckId= – zwraca fiszki due (SM-2) lub fallback (nowe + najdawniej powtarzane),
- FlipCard interakcje (klawiatura/klik),
- POST /api/learn – aktualizacja pól: last_reviewed_at, difficulty_level, next_review_date, review_count, ease_factor (zgodnie z SM-2),
- Zakończenie sesji, restart, powrót do wyboru talii.

Testy algorytmu SM-2 (unit/integration):
- granice difficulty 1-5, wyliczenie EF, interwałów (1, 6, EF^n), minimalny EF 1.3, daty przyszłe.

### 4.6. Profil (ProfileCard, /api/profile, /api/user)
- /api/profile – poprawny e-mail, created_at, total_flashcards, total_generations,
- /api/user – podstawowe dane do awatara,
- UX: skeleton loading, toasty błędów.

### 4.7. Obsługa błędów i UX
- Komponenty: ErrorMessage, OverlayLoader, toasty,
- Spójność komunikatów (PL/EN), aria-live, role="alert",
- Nieprzewidziane błędy (sieć, JSON parse) -> klarowne komunikaty i brak crashy UI.

### 4.8. Bezpieczeństwo
- Wymaganie autoryzacji na wszystkich endpointach biznesowych:
  - pozytywne: zalogowany użytkownik z tokenami w cookies -> 200,
  - negatywne: brak/niepoprawne tokeny -> 401,
  - weryfikacja, że API potrafi odczytać sesję (ryzyko: middleware omija /api – test ma wykazać potrzebę setSession na podstawie cookies również dla API).
- Ciasteczka:
  - obecność Secure, SameSite=Strict (OK),
  - brak HttpOnly -> ryzyko ekspozycji tokenów – zarejestrować jako znane ryzyko.
- Brak wycieku SUPABASE_SERVICE_ROLE_KEY do klienta,
- Odpowiedzi API nie zwracają wrażliwych danych.

### 4.9. Dostępność (a11y)
- Formularze (etykiety, aria-invalid, aria-describedby),
- Kontrolki (przyciski, focus states),
- Kontrast, czytelność, wsparcie dla klawiatury (flip card, dialogi, menu mobilne).

## 5. Środowisko testowe
- Wersje:
  - Node LTS, Astro v5.x, React 19, TypeScript, Tailwind v4,
  - Supabase – osobny projekt TEST (środowisko deweloperskie), z seedem.
- Zmienne środowiskowe:
  - PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY,
  - SUPABASE_SERVICE_ROLE_KEY (server only),
  - OPENROUTER_API_KEY (server only).
- Dane testowe (seed):
  - Użytkownik A (z fiszkami/taliami/generacjami), użytkownik B (pusty),
  - Talia z 0, 5, 50 fiszek; fiszki manual/ai-full/ai-edited; różne generation_id,
  - Generacje z sukcesem i błędem (wpis w generation_error_logs),
  - Fiszki z różnymi wartościami SRS (review_count, ease_factor, next_review_date).
- Mocki:
  - LLM (OpenRouter) – MSW/nock w testach integracyjnych/CI (symulacja różnych formatów odpowiedzi),
  - Supabase – e2e z realnym testowym projektem; unit/integration z mockiem.

## 6. Narzędzia do testowania
- Jednostkowe/integracyjne: Vitest, @testing-library/react (komponenty), Supertest/fetch + MSW/nock (API),
- E2E: Playwright (desktop i mobile viewporty),
- A11y: axe-core/Playwright-a11y,
- Wydajność: k6 (API), Lighthouse (frontend),
- Security sanity: OWASP ZAP (skan pasywny), ręczne sprawdzenie ciasteczek/headers,
- CI: GitHub Actions (uruchamianie unit/integration/E2E headless, artefakty raportów).

## 7. Harmonogram testów
- Tydzień 1:
  - Przygotowanie środowiska testowego (Supabase TEST, seedy),
  - Testy jednostkowe utils, schematów Zod, LLM parsing,
  - Integracje /api/flashcards, /api/decks.
- Tydzień 2:
  - Integracje /api/generations, /api/generateDeckName (z mockiem LLM),
  - Integracje /api/learn (SM-2), /api/dashboard, /api/profile, /api/user.
- Tydzień 3:
  - E2E (Auth → Generate → Review → Save → Deck/Flashcards → Learn → Profile → Logout/Delete),
  - A11y, sanity security, Lighthouse,
  - Wydajność /api/decks i /api/dashboard (N+1).
- Tydzień 4:
  - Regresja po poprawkach, stabilizacja, przygotowanie raportu końcowego.

Równoległość: unit/integration w CI przy każdym PR; E2E nightly i przy release.

## 8. Kryteria akceptacji testów
- Testy jednostkowe: min. 80% pokrycia kluczowych modułów (spaced-repetition, LLM parsing, schemas, FlashcardsService),
- Integracyjne API: 100% pokrycia kluczowych ścieżek (sukces/błąd/autoryzacja) dla wszystkich endpointów,
- E2E: wszystkie krytyczne ścieżki “zielone” na Chrome/Firefox (desktop) + 1 viewport mobilny,
- A11y: brak krytycznych i poważnych naruszeń axe-core na głównych widokach,
- Wydajność: p95 < 300 ms dla /api/decks i /api/dashboard przy 50 taliach (zarejestrować N+1 jeśli przekroczone),
- Bezpieczeństwo: brak wycieków kluczy, endpointy wymagają autoryzacji, ciasteczka mają Secure i SameSite=Strict; znane ograniczenie: brak HttpOnly – zaakceptowane lub zgłoszone z priorytetem.

UWAGA – jednoznaczność wymogu dla “Save All” w ProposalList:
- Kryterium akceptacji należy doprecyzować:
  - jeśli “Save All” ma pominąć “rejected”, test potwierdza odrzucenie zapisów rejected i zgłasza defekt w obecnej implementacji,
  - jeśli “Save All” ma zapisać wszystkie (łącznie z “rejected”), UI powinien to jasno komunikować; test weryfikuje spójność komunikatu/akcji.

## 9. Role i odpowiedzialności
- QA Lead: planowanie testów, przegląd przypadków, akceptacja kryteriów, koordynacja raportowania,
- QA Engineer: implementacja testów unit/integration/E2E, konfiguracja CI, raportowanie defektów,
- Backend Dev: wsparcie w testach API, poprawki endpointów, analiza logów Supabase,
- Frontend Dev: naprawa problemów UI/UX, dostępności, stanów błędów/loaderów,
- DevOps: utrzymanie środowisk testowych, sekretów (klucze), pipeline’ów CI/CD,
- Product Owner: doprecyzowanie wymogów (m.in. “Save All”), akceptacja wyników testów.

## 10. Procedury raportowania błędów
- Zgłaszanie w systemie zadań (Issue Tracker) z polami:
  - Tytuł, opis, kroki reprodukcji, oczekiwane vs. rzeczywiste, zrzuty ekranu/wideo, logi (konsola, sieć, odpowiedź API), wersja commit,
  - Środowisko (URL, przeglądarka, użytkownik testowy), dane testowe,
  - Priorytet (Krytyczny/Poważny/Średni/Niski) i kategoria (Funkcjonalny/UI/A11y/API/Security/Performance).
- Dla błędów API: dołączać payload/headers/response, identyfikatory (np. generation_id, source_text_hash),
- Triaging co najmniej 2x tygodniowo, SLA napraw dla krytycznych < 24h w fazie stabilizacji,
- Retesty i oznaczanie “Done” po potwierdzeniu przez QA,
- Raport końcowy z metrykami (liczba testów, pass/fail, pokrycie, defekty wg kategorii/prio).

---

## Załącznik: lista przypadków testowych wysokiego priorytetu (skrót)
- API autoryzacja:
  - [P1] Zalogowany user, /api/decks -> 200; niezalogowany -> 401,
  - [P1] Middleware nie dotyka /api – API musi samodzielnie czytać cookies i ustawić sesję (test wykrywa ewentualne 401).
- Generate/LLM:
  - [P1] Min/max długość tekstu źródłowego; LLM error -> toast + wpis do generation_error_logs,
  - [P1] Parsing “Front:/Back:” (różne formaty, puste bloki),
  - [P1] Regeneracja nazwy talii (różne modele/reasoning).
- ProposalList:
  - [P1] Edycja -> source = ai-edited; Approve/Reject stany,
  - [P1] Save Approved (z modalem dla unmarked),
  - [P1] Save All – zachowanie wobec “rejected” (wymaga doprecyzowania).
- Deck/Flashcards:
  - [P1] Tworzenie/edycja/usuwanie talii, kaskada fiszek,
  - [P1] Dodanie ręcznej fiszki (source=manual, generation_id=null),
  - [P1] Edycja ai-full -> ai-edited; walidacje długości front/back.
- Learn (SM-2):
  - [P1] Dobór kart due i fallback (nowe + najstarsze),
  - [P1] Aktualizacja EF/interval/next_review_date,
  - [P1] Granice difficulty 1-5.
- Dashboard:
  - [P1] Statystyki źródeł, recentGenerations (rzeczywista liczba fiszek, deck_name),
  - [P2] Nawigacja po kartach/akcje.
- Security:
  - [P1] SUPABASE_SERVICE_ROLE_KEY niewidoczny w kliencie,
  - [P1] Ciasteczka: Secure, SameSite=Strict; rejestracja braku HttpOnly jako ryzyko,
  - [P1] Endpointy odrzucają żądania bez sesji (401).
- A11y:
  - [P2] aria-invalid, aria-describedby, role=alert, focus trap w dialogach.

Ten plan jest dostosowany do specyfiki kodu i architektury (Astro + React + Supabase + OpenRouter), priorytetyzuje obszary największego ryzyka (autoryzacja API, generowanie/LLM, zapis propozycji, SM-2), oraz zapewnia pokrycie kluczowych ścieżek użytkownika.