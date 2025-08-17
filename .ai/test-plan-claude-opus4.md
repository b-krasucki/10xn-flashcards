# Plan Testów - Aplikacja do Nauki z Fiszkami

## 1. Wprowadzenie i cele testowania

#### Cel dokumentu
Niniejszy plan testów został opracowany dla aplikacji webowej do nauki z wykorzystaniem fiszek, zbudowanej w oparciu o framework Astro z komponentami React/TypeScript oraz bazę danych Supabase.

#### Główne cele testowania
- **Zapewnienie jakości** funkcjonalności generowania fiszek przy użyciu modeli językowych
- **Weryfikacja bezpieczeństwa** systemu autoryzacji i ochrony danych użytkowników
- **Potwierdzenie poprawności** algorytmu spaced repetition
- **Sprawdzenie wydajności** aplikacji przy dużej liczbie fiszek i użytkowników
- **Walidacja integracji** z zewnętrznymi serwisami (LLM, Supabase)
- **Testowanie użyteczności** interfejsu na różnych urządzeniach

## 2. Zakres testów

#### Obszary objęte testami

**Moduły krytyczne:**
- System autoryzacji (`AuthForm.tsx`, middleware, API endpoints)
- Generator fiszek (`GenerateForm.tsx`, `llmService.ts`, `/api/generations.ts`)
- Sesja nauki (`LearnSession.tsx`, `spaced-repetition.ts`, `/api/learn.ts`)
- Zarządzanie taliami i fiszkami (`DecksGrid.tsx`, `FlashcardsList.tsx`, `/api/decks.ts`)

**Moduły pomocnicze:**
- Dashboard i nawigacja
- Profil użytkownika
- Komponenty UI
- Strony statyczne

#### Obszary wyłączone z testów
- Kod bibliotek zewnętrznych
- Automatycznie generowane pliki typów
- Style CSS (poza testami wizualnymi)

## 3. Typy testów do przeprowadzenia

#### Testy jednostkowe
- **Komponenty React** - testowanie w izolacji przy użyciu React Testing Library
- **Serwisy** - testy logiki biznesowej w `flashcards.service.ts` i `llmService.ts`
- **Algorytmy** - testy funkcji `spaced-repetition.ts`
- **Utilsy** - testy pomocniczych funkcji

#### Testy integracyjne
- **API Endpoints** - testowanie wszystkich tras API z mockowaną bazą danych
- **Integracja z Supabase** - testy operacji CRUD na fiszkach i taliach
- **Integracja z LLM** - testy generowania treści z mockowanym serwisem

#### Testy E2E (End-to-End)
- **Przepływy użytkownika** - od rejestracji po naukę z fiszkami
- **Scenariusze krytyczne** - generowanie fiszek, sesja nauki, zarządzanie taliami

#### Testy wydajnościowe
- **Obciążenie** - testowanie przy 100+ fiszkach w talii
- **Czas odpowiedzi** - generowanie fiszek, ładowanie dashboardu
- **Optymalizacja zapytań** - analiza wydajności operacji bazodanowych

#### Testy bezpieczeństwa
- **Autoryzacja** - próby nieautoryzowanego dostępu do API
- **Walidacja danych** - testy SQL injection, XSS
- **Sesje użytkowników** - zarządzanie tokenami

#### Testy dostępności
- **WCAG 2.1** - zgodność z wytycznymi dostępności
- **Nawigacja klawiaturą** - dostępność wszystkich funkcji
- **Czytniki ekranu** - poprawność semantyki HTML

## 4. Scenariusze testowe dla kluczowych funkcjonalności

#### Autoryzacja i rejestracja
```
TC001: Rejestracja nowego użytkownika
1. Przejdź do /auth
2. Wypełnij formularz rejestracji
3. Weryfikuj utworzenie konta w Supabase
4. Sprawdź automatyczne logowanie

TC002: Logowanie istniejącego użytkownika
1. Wprowadź poprawne dane logowania
2. Weryfikuj przekierowanie do dashboardu
3. Sprawdź obecność tokenu sesji

TC003: Próba nieautoryzowanego dostępu
1. Wyloguj się z aplikacji
2. Spróbuj dostać się do /flashcards
3. Weryfikuj przekierowanie do /auth
```

#### Generowanie fiszek
```
TC004: Generowanie fiszek z tekstu
1. Przejdź do /generate
2. Wprowadź tekst źródłowy (500+ znaków)
3. Wybierz model językowy
4. Kliknij "Generuj"
5. Weryfikuj wyświetlenie propozycji fiszek

TC005: Edycja i zatwierdzanie propozycji
1. Po wygenerowaniu fiszek przejdź do przeglądu
2. Edytuj treść pytania/odpowiedzi
3. Usuń niepotrzebne fiszki
4. Zatwierdź i zapisz do talii
```

#### Sesja nauki
```
TC006: Rozpoczęcie sesji nauki
1. Wybierz talię z minimum 5 fiszkami
2. Kliknij "Rozpocznij naukę"
3. Weryfikuj wyświetlenie pierwszej fiszki

TC007: Algorytm spaced repetition
1. Podczas sesji oceń fiszkę jako "Łatwa"
2. Weryfikuj aktualizację interwału powtórki
3. Sprawdź, czy fiszka nie pojawia się ponownie w sesji

TC008: Zakończenie sesji nauki
1. Przejdź przez wszystkie fiszki w sesji
2. Weryfikuj wyświetlenie podsumowania
3. Sprawdź zapisanie postępów w bazie
```

## 5. Środowisko testowe

#### Środowiska
- **Lokalne** - Node.js 18+, lokalna instancja Supabase
- **Staging** - Replika produkcji z testową bazą danych
- **CI/CD** - GitHub Actions z testami automatycznymi

#### Dane testowe
- **Użytkownicy testowi** - minimum 10 kont z różnymi rolami
- **Talie testowe** - zestawy fiszek dla różnych scenariuszy
- **Teksty źródłowe** - przykładowe materiały do generowania

## 6. Narzędzia do testowania

#### Testy jednostkowe i integracyjne
- **Vitest** - framework testowy dla TypeScript/React
- **React Testing Library** - testy komponentów
- **MSW (Mock Service Worker)** - mockowanie API

#### Testy E2E
- **Playwright** - automatyzacja testów w przeglądarkach
- **Cypress** - alternatywa dla testów E2E

#### Testy wydajnościowe
- **Lighthouse** - audyt wydajności
- **k6** - testy obciążeniowe API

#### Testy bezpieczeństwa
- **OWASP ZAP** - skanowanie podatności
- **npm audit** - analiza zależności

#### Zarządzanie testami
- **TestRail** lub **Zephyr** - zarządzanie przypadkami testowymi
- **Jira** - śledzenie defektów

## 7. Harmonogram testów

#### Faza 1: Przygotowanie (5 dni)
- Konfiguracja środowisk testowych
- Przygotowanie danych testowych
- Instalacja narzędzi

#### Faza 2: Testy jednostkowe (10 dni)
- Komponenty React (5 dni)
- Serwisy i utils (3 dni)
- API endpoints (2 dni)

#### Faza 3: Testy integracyjne (7 dni)
- Integracja z Supabase (3 dni)
- Integracja z LLM (2 dni)
- Przepływy między komponentami (2 dni)

#### Faza 4: Testy E2E (5 dni)
- Scenariusze krytyczne (3 dni)
- Testy regresyjne (2 dni)

#### Faza 5: Testy specjalistyczne (5 dni)
- Testy wydajnościowe (2 dni)
- Testy bezpieczeństwa (2 dni)
- Testy dostępności (1 dzień)

## 8. Kryteria akceptacji testów

#### Pokrycie kodu
- **Minimum 80%** pokrycia dla komponentów krytycznych
- **Minimum 60%** pokrycia dla całej aplikacji

#### Wydajność
- Czas ładowania strony głównej **< 3 sekundy**
- Czas generowania fiszek **< 10 sekund**
- Czas odpowiedzi API **< 500ms**

#### Stabilność
- **Zero** błędów krytycznych
- **< 5** błędów średniej wagi
- **95%** testów E2E przechodzi pomyślnie

#### Bezpieczeństwo
- Brak podatności wysokiego ryzyka
- Wszystkie endpointy zabezpieczone autoryzacją
- Prawidłowa walidacja danych wejściowych

## 9. Role i odpowiedzialności w procesie testowania

#### Test Manager
- Nadzór nad realizacją planu testów
- Raportowanie postępów
- Zarządzanie ryzykiem

#### Testerzy manualni (2 osoby)
- Wykonywanie testów eksploracyjnych
- Testy akceptacyjne użytkownika
- Weryfikacja naprawionych błędów

#### Testerzy automatyczni (2 osoby)
- Tworzenie i utrzymanie testów automatycznych
- Integracja testów z CI/CD
- Analiza wyników testów

#### Deweloperzy
- Tworzenie testów jednostkowych
- Naprawa zgłoszonych błędów
- Wsparcie w debugowaniu

## 10. Procedury raportowania błędów

#### Format zgłoszenia błędu
```
Tytuł: [Moduł] Krótki opis problemu
Priorytet: Krytyczny/Wysoki/Średni/Niski
Środowisko: Lokalne/Staging/Produkcja

Kroki reprodukcji:
1. [Krok 1]
2. [Krok 2]
...

Oczekiwany rezultat:
[Opis oczekiwanego zachowania]

Aktualny rezultat:
[Opis aktualnego zachowania]

Załączniki:
- Zrzuty ekranu
- Logi konsoli
- Nagrania wideo (opcjonalnie)
```

#### Proces obsługi błędów
1. **Zgłoszenie** w systemie Jira
2. **Weryfikacja** przez Test Managera
3. **Przypisanie** do dewelopera
4. **Naprawa** i oznaczenie jako "Do weryfikacji"
5. **Retesty** przez testera
6. **Zamknięcie** po pozytywnej weryfikacji

#### Cykl raportowania
- **Raporty dzienne** - postęp testów, nowe błędy
- **Raporty tygodniowe** - podsumowanie, metryki, ryzyka
- **Raport końcowy** - kompleksowe podsumowanie testów
