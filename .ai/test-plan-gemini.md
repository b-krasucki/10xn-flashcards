# Kompleksowy Plan Testów dla Aplikacji Fiszki AI

---

### 1. Wprowadzenie i cele testowania

**1.1. Wprowadzenie**

Niniejszy dokument przedstawia kompleksowy plan testów dla aplikacji do generowania i nauki fiszek, opartej o technologie Astro, React i Supabase. Aplikacja umożliwia użytkownikom tworzenie talii fiszek na podstawie dostarczonego tekstu z wykorzystaniem modeli językowych (LLM), a następnie naukę przy użyciu algorytmu powtórek interwałowych (spaced repetition).

**1.2. Cele testowania**

Głównym celem procesu testowania jest zapewnienie wysokiej jakości, niezawodności, bezpieczeństwa i użyteczności aplikacji przed jej wdrożeniem na środowisko produkcyjne.

Szczegółowe cele obejmują:

- **Weryfikację funkcjonalną:** Sprawdzenie, czy wszystkie kluczowe funkcje, takie jak rejestracja, generowanie fiszek, zarządzanie taliami i sesje nauki, działają zgodnie z założeniami.
- **Zapewnienie bezpieczeństwa:** Weryfikacja, czy dane użytkowników są odpowiednio izolowane i zabezpieczone, w szczególności poprzez testowanie mechanizmów autoryzacji na poziomie API.
- **Ocenę użyteczności:** Zapewnienie, że interfejs użytkownika jest intuicyjny, responsywny i działa poprawnie na różnych urządzeniach i przeglądarkach.
- **Sprawdzenie integracji:** Potwierdzenie, że integracja z usługami zewnętrznymi, takimi jak Supabase (baza danych, autentykacja) oraz API modeli LLM, jest stabilna i poprawnie obsługuje scenariusze sukcesu oraz błędów.
- **Identyfikację i raportowanie defektów:** Systematyczne wykrywanie, dokumentowanie i śledzenie błędów w celu ich naprawy przed wydaniem.

---

### 2. Zakres testów

**2.1. Funkcjonalności w zakresie testów**

- **Moduł uwierzytelniania i zarządzania użytkownikiem:**
  - Rejestracja nowego użytkownika.
  - Logowanie i wylogowywanie.
  - Zarządzanie profilem użytkownika.
  - Proces usuwania konta.
- **Zarządzanie taliami fiszek (Decks):**
  - Tworzenie nowej, pustej talii.
  - Edycja nazwy istniejącej talii.
  - Przeglądanie listy talii na pulpicie (Dashboard).
  - Usuwanie talii wraz z zawartymi w niej fiszkami.
- **Proces generowania fiszek:**
  - Wprowadzanie tekstu źródłowego.
  - Wybór modelu LLM do generacji.
  - Obsługa stanu ładowania podczas generowania.
  - Przeglądanie, edycja i akceptacja wygenerowanych propozycji fiszek.
  - Zapisywanie zaakceptowanych fiszek do nowej lub istniejącej talii.
- **Moduł nauki:**
  - Rozpoczynanie sesji nauki dla wybranej talii.
  - Wyświetlanie fiszek (awers i rewers).
  - Ocenianie stopnia opanowania fiszki przez użytkownika.
  - Działanie algorytmu powtórek interwałowych.
- **Interfejs użytkownika (UI):**
  - Responsywność layoutu (desktop, mobile).
  - Działanie podstawowych komponentów UI (przyciski, formularze, dialogi, powiadomienia).
  - Nawigacja w aplikacji.

**2.2. Funkcjonalności poza zakresem testów**

- Testowanie infrastruktury Supabase (np. działanie samej bazy danych PostgreSQL). Testowany będzie jedynie _sposób integracji_ aplikacji z Supabase.
- Testowanie modeli LLM pod kątem merytorycznej poprawności generowanych treści. Testowany będzie proces komunikacji z API LLM i obsługa odpowiedzi (poprawnych i błędnych), a nie sama "inteligencja" modelu.
- Testowanie wydajnościowe frameworków (Astro, React).

---

### 3. Typy testów do przeprowadzenia

W celu zapewnienia kompleksowego pokrycia testowego, przeprowadzone zostaną następujące rodzaje testów:

- **Testy jednostkowe (Unit Tests):** Weryfikacja małych, izolowanych fragmentów kodu (np. funkcji `utils`, logiki algorytmu `spaced-repetition`, schematów walidacji `Zod`).
- **Testy komponentów (Component Tests):** Testowanie poszczególnych komponentów React (`.tsx`) w izolacji, w celu sprawdzenia ich wyglądu i zachowania w odpowiedzi na interakcje użytkownika.
- **Testy integracyjne (Integration Tests):** Weryfikacja współpracy pomiędzy różnymi częściami systemu, np.:
  - Integracja komponentów front-endowych z endpointami API.
  - Integracja endpointów API z bazą danych Supabase.
- **Testy End-to-End (E2E):** Symulacja kompletnych scenariuszy z perspektywy użytkownika, np. od rejestracji, przez wygenerowanie talii, po odbycie sesji nauki. Testy te będą kluczowe dla weryfikacji głównych ścieżek aplikacji.
- **Testy bezpieczeństwa:** Skupione na weryfikacji autoryzacji w API. Głównym celem jest sprawdzenie, czy użytkownik A nie ma dostępu do danych (talii, fiszek) użytkownika B.
- **Testy manualne i eksploracyjne:** Ręczne testowanie aplikacji w celu znalezienia błędów trudnych do zautomatyzowania, oceny UX/UI oraz weryfikacji niestandardowych scenariuszy.

---

### 4. Scenariusze testowe dla kluczowych funkcjonalności

Poniższa tabela przedstawia wysokopoziomowe scenariusze testowe dla najważniejszych modułów aplikacji.

| Moduł                   | ID Scenariusza | Opis scenariusza                                                                                                                                              | Priorytet |
| :---------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------- |
| **Uwierzytelnianie**    | AUTH-01        | Pomyślna rejestracja użytkownika przy użyciu poprawnych danych i weryfikacja zalogowania.                                                                     | Krytyczny |
|                         | AUTH-02        | Próba logowania z nieprawidłowym hasłem i weryfikacja wyświetlenia błędu.                                                                                     | Krytyczny |
|                         | AUTH-03        | Użytkownik może się pomyślnie wylogować i traci dostęp do chronionych stron.                                                                                  | Wysoki    |
| **Generowanie Fiszki**  | GEN-01         | Użytkownik wkleja tekst, wybiera model, klika "Generuj", widzi stan ładowania, a następnie listę propozycji.                                                  | Krytyczny |
|                         | GEN-02         | Użytkownik edytuje, odrzuca i akceptuje propozycje, a następnie zapisuje je do nowej talii.                                                                   | Krytyczny |
|                         | GEN-03         | System poprawnie obsługuje błąd odpowiedzi z API LLM i informuje o tym użytkownika.                                                                           | Wysoki    |
|                         | GEN-04         | Przycisk "Generuj" jest nieaktywny, gdy pole tekstowe jest puste.                                                                                             | Średni    |
| **Zarządzanie Taliami** | DECK-01        | Użytkownik tworzy nową talię z poziomu pulpitu i jest ona widoczna na liście.                                                                                 | Wysoki    |
|                         | DECK-02        | Użytkownik edytuje nazwę istniejącej talii, a zmiana jest widoczna na pulpicie i stronie talii.                                                               | Średni    |
|                         | DECK-03        | Użytkownik usuwa talię, co powoduje jej zniknięcie z listy i usunięcie powiązanych fiszek.                                                                    | Wysoki    |
| **Sesja Nauki**         | LEARN-01       | Użytkownik rozpoczyna sesję nauki i widzi pierwszą stronę fiszki (awers).                                                                                     | Krytyczny |
|                         | LEARN-02       | Po kliknięciu "Pokaż odpowiedź", użytkownik widzi drugą stronę (rewers) i przyciski oceny.                                                                    | Krytyczny |
|                         | LEARN-03       | Po ocenie wszystkich fiszek w sesji, użytkownik widzi podsumowanie.                                                                                           | Wysoki    |
| **Bezpieczeństwo**      | SEC-01         | Zalogowany użytkownik A próbuje uzyskać dostęp do talii użytkownika B przez bezpośrednie odwołanie do API (np. `/api/decks?id=...`) i otrzymuje błąd 403/404. | Krytyczny |

---

### 5. Środowisko testowe

- **Środowisko deweloperskie (Lokalne):** Wykorzystywane przez deweloperów do tworzenia oprogramowania oraz uruchamiania testów jednostkowych i komponentów.
- **Środowisko testowe (Staging):** Osobna instancja aplikacji wdrożona w infrastrukturze chmurowej, zintegrowana z dedykowaną, odizolowaną bazą danych Supabase. Na tym środowisku będą uruchamiane testy integracyjne, E2E oraz prowadzone testy manualne.
- **Środowisko produkcyjne:** Wersja aplikacji dostępna dla użytkowników końcowych. Dostęp do tego środowiska będzie ograniczony, a testy będą miały charakter weryfikacji poprawności wdrożenia (tzw. "smoke tests").

---

### 6. Narzędzia do testowania

| Typ testów              | Proponowane narzędzia                                                        |
| :---------------------- | :--------------------------------------------------------------------------- |
| **Testy jednostkowe**   | Vitest                                                                       |
| **Testy komponentów**   | Storybook (dla wizualizacji), Playwright/Cypress Component Testing           |
| **Testy E2E**           | Playwright, Cypress                                                          |
| **Testowanie API**      | Playwright (wbudowane funkcje), Postman/Insomnia (do testów eksploracyjnych) |
| **CI/CD**               | GitHub Actions (do automatycznego uruchamiania testów)                       |
| **Zarządzanie błędami** | Jira, ClickUp, GitHub Issues                                                 |

---

### 7. Harmonogram testów

Testowanie będzie procesem ciągłym, zintegrowanym z cyklem rozwoju oprogramowania (CI/CD).

- **Testy jednostkowe i komponentów:** Pisane przez deweloperów równolegle z implementacją nowych funkcjonalności.
- **Testy integracyjne i E2E:** Uruchamiane automatycznie przy każdym pushu do głównej gałęzi developerskiej oraz przed każdym wdrożeniem na środowisko produkcyjne.
- **Testy manualne i eksploracyjne:** Przeprowadzane cyklicznie przed planowanymi wydaniami (np. raz na sprint).
- **Testy bezpieczeństwa:** Wykonywane po zaimplementowaniu kluczowych zmian w API lub systemie uwierzytelniania.

---

### 8. Kryteria akceptacji testów

**8.1. Kryteria wejścia (rozpoczęcia testów)**

- Kod źródłowy został zintegrowany i wdrożony na środowisku testowym.
- Wszystkie testy jednostkowe przechodzą pomyślnie.
- Dostępna jest dokumentacja dla testowanych funkcjonalności.

**8.2. Kryteria wyjścia (zakończenia testów)**

- Wszystkie zaplanowane scenariusze testowe zostały wykonane.
- Co najmniej 95% automatycznych testów E2E kończy się sukcesem.
- Nie istnieją żadne otwarte błędy o priorytecie krytycznym (blokujące).
- Wszystkie błędy o wysokim priorytecie zostały naprawione i zweryfikowane.
- Produkt został zaakceptowany przez Product Ownera.

---

### 9. Role i odpowiedzialności w procesie testowania

- **Inżynier QA:**
  - Autorstwo i utrzymanie planu testów.
  - Implementacja i utrzymanie automatycznych testów E2E i integracyjnych.
  - Wykonywanie testów manualnych i eksploracyjnych.
  - Raportowanie i weryfikacja błędów.
- **Deweloperzy:**
  - Pisanie testów jednostkowych i komponentów dla tworzonego kodu.
  - Naprawa zgłoszonych błędów.
  - Wsparcie w analizie przyczyn niepowodzeń testów automatycznych.
- **Product Owner:**
  - Definiowanie wymagań i kryteriów akceptacji.
  - Priorytetyzacja naprawy błędów.
  - Ostateczna akceptacja funkcjonalności.

---

### 10. Procedury raportowania błędów

Wszystkie zidentyfikowane błędy będą raportowane w systemie do śledzenia zadań (np. Jira). Każde zgłoszenie powinno zawierać:

- **Tytuł:** Zwięzły opis problemu.
- **Opis:**
  - **Kroki do odtworzenia:** Szczegółowa, ponumerowana lista kroków prowadzących do wystąpienia błędu.
  - **Oczekiwany rezultat:** Co powinno się wydarzyć.
  - **Rzeczywisty rezultat:** Co faktycznie się wydarzyło.
- **Środowisko:** Wersja aplikacji, przeglądarka, system operacyjny.
- **Priorytet/Waga:** Określenie wpływu błędu na działanie aplikacji (np. Krytyczny, Wysoki, Średni, Niski).
- **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli.

**Cykl życia błędu:** Nowy -> W analizie -> Do naprawy -> W trakcie naprawy -> Do weryfikacji -> Zamknięty / Ponownie otwarty.
