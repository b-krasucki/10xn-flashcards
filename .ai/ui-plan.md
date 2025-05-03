# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Interfejs użytkownika składa się z następujących warstw:

- Warstwa routingu i ochrony routingu (middleware Astro): autoryzacja, odświeżanie tokenu, przekierowanie do `/auth` w razie braku sesji.
- Główny layout aplikacji (`src/layouts/MainLayout.astro`): nagłówek z logiem, nawigacją (Dashboard, Generowanie, Moje fiszki, Sesja powtórek, Profil), przełącznikiem motywu, stopka.
- Widoki strony:
  - `/auth` (logowanie i rejestracja)
  - `/` Dashboard
  - `/generate` Formularz generowania
  - `/generate/review` Przegląd i zatwierdzanie propozycji
  - `/flashcards` Lista moich fiszek
  - `/learn` Sesja nauki
  - `/profile` Profil użytkownika
- Globalne komponenty UI: OverlayLoader, Toast, Modal, AlertDialog, FlipCard, ThemeToggle.

## 2. Lista widoków

### 2.1 Widok autoryzacji
- Ścieżka: `/auth`
- Główny cel: umożliwić rejestrację i logowanie użytkownika.
- Kluczowe informacje: formularz z polami e-mail i hasło, przycisk przełączania trybu (logowanie/rejestracja).
- Kluczowe komponenty: `AuthForm` (React Hook Form + Zod), `OverlayLoader`, `Toast`.
- UX: walidacja inline, czytelne komunikaty o błędach, fokus na pierwszym polu.
- Dostępność: aria-label, focus trapping.
- Bezpieczeństwo: ruch po HTTPS, obsługa błędów 400/401.

### 2.2 Dashboard
- Ścieżka: `/`
- Główny cel: szybki podgląd statystyk i akcja „Nowa generacja”.
- Kluczowe informacje: liczba fiszek, liczba wygenerowanych/zaakceptowanych, ostatnie 3 generacje.
- Kluczowe komponenty: `Card` (Shadcn/ui), `StatisticsGrid`, `Button` „Nowa generacja”, `ThemeToggle`.
- UX: responsywny układ grid, hover/focus states.
- Dostępność: aria-label dla przycisków, kontrast kolorów.
- Bezpieczeństwo: tylko dla zalogowanych.

### 2.3 Formularz generowania fiszek
- Ścieżka: `/generate`
- Główny cel: wprowadzenie tekstu źródłowego i wywołanie API generowania.
- Kluczowe informacje: pole tekstowe (1000–10000 znaków), licznik znaków, progress bar, przycisk „Generuj”.
- Kluczowe komponenty: `Textarea`, `CharCounter`, `ProgressBar`, `OverlayLoader`.
- UX: blokada przy nieosiągnięciu min, lub przekroczeniu max, feedback przy kliknięciu, overlay podczas ładowania.
- Dostępność: aria-live dla licznika, aria-invalid dla błędów.
- Bezpieczeństwo: walidacja długości po stronie klienta.

### 2.4 Przegląd i zatwierdzanie propozycji
- Ścieżka: `/generate/review`
- Główny cel: przegląd wygenerowanych fiszek, akceptacja, edycja lub odrzucenie.
- Kluczowe informacje: lista do 10 propozycji, infinite scroll z paginacją.
- Kluczowe komponenty: `FlashcardProposalList` (virtualized), `ProposalCard` z przyciskami Akceptuj/Edycja/Odrzuć, `Modal` do edycji, `AlertDialog` do odrzucenia.
- UX: płynny scroll, potwierdzenie akcji, animacja flip podczas edycji.
- Dostępność: focus management w modalach, aria-describedby w AlertDialog.
- Bezpieczeństwo: CSRF zabezpieczenie, autoryzacja.

### 2.5 Lista moich fiszek
- Ścieżka: `/flashcards`
- Główny cel: przegląd, dodawanie ręczne, edycja i usuwanie fiszek.
- Kluczowe informacje: zwirtualizowana lista fiszek, przycisk Dodaj nową, stan pustej listy.
- Kluczowe komponenty: `FlashcardsList` (virtualized), `FlashcardItem`, `Modal` do edycji/dodawania, `AlertDialog` do usuwania.
- UX: szybkie przewijanie, inline edit, potwierdzenie usunięcia.
- Dostępność: keyboard navigation, aria-modal.
- Bezpieczeństwo: walidacja długości front/back, RLS (tylko własne).

### 2.6 Sesja nauki
- Ścieżka: `/learn`
- Główny cel: przeprowadzenie sesji powtórkowej (spaced repetition).
- Kluczowe informacje: pojedyncza fiszka (przód), flip animation, ocena (Łatwo/Średnio/Trudno).
- Kluczowe komponenty: `FlipCard`, `ButtonGroup` z opcjami oceny, `ProgressIndicator`.
- UX: animacja flip, czytelne przyciski.
- Dostępność: aria-live dla zmiany treści karty.
- Bezpieczeństwo: ochrona ścieżki przed nieautoryzowanym dostepem.

### 2.7 Profil użytkownika
- Ścieżka: `/profile`
- Główny cel: wyświetlenie danych profilu, zmiana hasła, usunięcie konta, wylogowanie.
- Kluczowe informacje: adres e-mail, data rejestracji, przycisk Usuń konto, Logout.
- Kluczowe komponenty: `ProfileCard`, `AlertDialog` do usunięcia konta, `Button` Logout.
- UX: potwierdzenie usunięcia, feedback.
- Dostępność: aria-describedby w dialogach.
- Bezpieczeństwo: potwierdzenie silnym hasłem lub tokenem.

## 3. Mapa podróży użytkownika

1. Użytkownik odwiedza `/auth`, rejestruje/loguje się.
2. Po zalogowaniu jest przekierowany na `/` (Dashboard).
3. Kliknięcie „Nowa generacja” przenosi na `/generate`.
4. Użytkownik wkleja tekst, klika „Generuj”, widzi overlay.
5. Po otrzymaniu wyników następuje przekierowanie na `/generate/review`.
6. Przegląda propozycje, akceptuje/edytuje/odrzuca.
7. Po zatwierdzeniu jest przekierowany na `/flashcards`, gdzie widzi nowe fiszki.
8. Może dodać ręcznie nową fiszkę lub edytować/usuwać istniejącą.
9. Rozpoczyna sesję powtórkową pod `/learn` i przechodzi przez fiszki.
10. Z poziomu nagłówka lub `/profile` może się wylogować lub usunąć konto.

## 4. Układ i struktura nawigacji

- **Nagłówek (Header)**:
  - Logo (klik prowadzi do `/`)
  - Po zalogowaniu: linki: Dashboard, Generowanie, Moje fiszki, Sesja powtórek, Profil
  - ThemeToggle
  - Wersja mobilna: hamburger menu z tymi linkami
- **Stopka**:
  - Informacje o prawach autorskich, link do polityki prywatności
- **Middleware Astro**:
  - Sprawdzenie cookie JWT, odświeżenie tokenu,
  - Redirect do `/auth` jeśli brak lub nieaktualny token

## 5. Kluczowe komponenty

- **AuthForm**: jednoformowy komponent logowania/rejestracji z RHF i Zod.
- **OverlayLoader**: pełnoekranowy loader blokujący UI przy `isLoading`.
- **ToastProvider / Toast**: globalny system notyfikacji.
- **FlashcardProposalList**: lista z infinite scroll i virtualizacją.
- **Modal**: uniwersalny modal (Shadcn/ui) z focus trapping.
- **AlertDialog**: dialog potwierdzający (usunięcie fiszki/konta).
- **FlipCard**: komponent animacji flip dla sesji nauki.
- **ThemeToggle**: przełącznik jasny/ciemny.
- **StatisticsGrid**: siatka kart ze statystykami na Dashboardzie. 