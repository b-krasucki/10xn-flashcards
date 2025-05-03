# Plan implementacji widoku Generowania Fiszek

## 1. Przegląd
Widok Generowania Fiszek umożliwia zalogowanym użytkownikom wklejenie tekstu źródłowego (o długości 1000-10000 znaków) i wygenerowanie propozycji fiszek edukacyjnych (pytanie/odpowiedź) przy użyciu modelu AI za pośrednictwem dedykowanego API. Widok zapewnia informacje zwrotne dotyczące walidacji długości tekstu, stanu ładowania podczas generowania oraz wyświetla wynikowe propozycje lub komunikaty o błędach.

## 2. Routing widoku
Widok powinien być dostępny pod ścieżką `/generate`. Dostęp powinien być ograniczony tylko do zalogowanych użytkowników (wymaga konfiguracji middleware w Astro).

## 3. Struktura komponentów
Widok będzie stroną Astro (`src/pages/generate.astro`), która renderuje główny komponent React (`GenerateForm`) z dyrektywą `client:load`.

```
src/pages/generate.astro
└── src/components/GenerateForm.tsx (React, client:load)
    ├── SourceTextInput (React, wrapper dla Shadcn Textarea + logika)
    ├── CharCounter (React)
    ├── GenerateButton (React, wrapper dla Shadcn Button)
    ├── ErrorMessage (React, warunkowe wyświetlanie)
    ├── OverlayLoader (React, warunkowe wyświetlanie, zawiera wskaźnik ładowania)
    └── ProposalList (React, warunkowe wyświetlanie)
```

## 4. Szczegóły komponentów

### `GenerateForm` (React)
- **Opis komponentu:** Główny kontener interfejsu generowania. Zarządza stanem formularza (wprowadzany tekst, stan ładowania, błędy, wynikowe propozycje), obsługuje walidację i wywołuje API. Renderuje komponenty podrzędne.
- **Główne elementy:** Renderuje `SourceTextInput`, `CharCounter`, `GenerateButton`, `ErrorMessage`, `OverlayLoader`, `ProposalList`.
- **Obsługiwane interakcje:** Przesłanie formularza (kliknięcie `GenerateButton`).
- **Obsługiwana walidacja:** Pośrednio, poprzez zarządzanie stanem `isValidLength` na podstawie danych z `SourceTextInput` i `CharCounter`.
- **Typy:** `GenerateViewState` (stan wewnętrzny), `CreateGenerationCommandDto`, `CreateGenerationResponseDto`, `ErrorResponseDto`.
- **Propsy:** Brak (komponent na poziomie widoku).

### `SourceTextInput` (React)
- **Opis komponentu:** Pole tekstowe (opakowanie `shadcn/ui Textarea`) do wprowadzania tekstu źródłowego. Oblicza liczbę znaków i informuje rodzica o zmianach oraz stanie walidacji długości.
- **Główne elementy:** `textarea` (z `shadcn/ui`).
- **Obsługiwane interakcje:** Wprowadzanie tekstu (`onChange`).
- **Obsługiwana walidacja:** Sprawdza, czy długość tekstu mieści się w zakresie 1000-10000 znaków. Wizualnie sygnalizuje błąd (np. przez `aria-invalid`).
- **Typy:** `string` (dla `value`), `(text: string) => void` (dla `onChange`), `boolean` (dla `isInvalid`).
- **Propsy:** `value: string`, `onChange: (text: string) => void`, `isInvalid: boolean`, `minLength: number`, `maxLength: number`.

### `CharCounter` (React)
- **Opis komponentu:** Wyświetla aktualną liczbę znaków oraz wymagany zakres (1000-10000). Używa `aria-live` do ogłaszania zmian czytnikom ekranu.
- **Główne elementy:** Elementy tekstowe (`span`, `p`).
- **Obsługiwane interakcje:** Brak (tylko wyświetlanie).
- **Obsługiwana walidacja:** Może wizualnie wskazywać przekroczenie limitów (np. zmiana koloru).
- **Typy:** `number` (dla `count`), `number` (dla `min`), `number` (dla `max`).
- **Propsy:** `count: number`, `min: number`, `max: number`.

### `GenerateButton` (React)
- **Opis komponentu:** Przycisk (opakowanie `shadcn/ui Button`) uruchamiający proces generowania. Jest nieaktywny (`disabled`), jeśli tekst nie spełnia wymagań długości lub trwa ładowanie.
- **Główne elementy:** `button` (z `shadcn/ui`).
- **Obsługiwane interakcje:** Kliknięcie (`onClick`).
- **Obsługiwana walidacja:** Stan `disabled` zależny od propów.
- **Typy:** `boolean` (dla `disabled`), `() => void` (dla `onClick`).
- **Propsy:** `onClick: () => void`, `disabled: boolean`.

### `OverlayLoader` (React)
- **Opis komponentu:** Wyświetla nakładkę z indykatorem ładowania (np. spinner z `shadcn/ui` lub niestandardowy) na czas trwania operacji API.
- **Główne elementy:** `div` (kontener nakładki), komponent wskaźnika ładowania.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `boolean` (dla `isVisible`).
- **Propsy:** `isVisible: boolean`.

### `ProposalList` (React)
- **Opis komponentu:** Wyświetla listę wygenerowanych propozycji fiszek po pomyślnym zakończeniu generowania. Na tym etapie (US-003) tylko wyświetla, bez interakcji (edycja/akceptacja - US-004).
- **Główne elementy:** Lista (`ul`/`div`), elementy listy (`li`/`div`) dla każdej propozycji, wyświetlające `front` i `back`.
- **Obsługiwane interakcje:** Brak (na tym etapie).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `GenerationProposalDto[]` (dla `proposals`).
- **Propsy:** `proposals: GenerationProposalDto[]`.

### `ErrorMessage` (React)
- **Opis komponentu:** Wyświetla komunikaty błędów (walidacji lub API).
- **Główne elementy:** `div` lub `p` z komunikatem błędu.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `string | null` (dla `message`).
- **Propsy:** `message: string | null`.

## 5. Typy
W widoku wykorzystane zostaną następujące typy DTO z `src/types.ts`:
- **`CreateGenerationCommandDto`**: Typ danych wysyłanych w ciele żądania POST `/api/generations`.
  ```typescript
  {
    model: string; // Nazwa modelu AI, np. 'claude-3-haiku-20240307'
    source_text: string; // Tekst źródłowy od użytkownika
  }
  ```
- **`CreateGenerationResponseDto`**: Typ danych odbieranych w odpowiedzi na pomyślne żądanie POST `/api/generations`.
  ```typescript
  {
    generation_id: number; // ID zapisanego rekordu generacji
    generated_count: number; // Liczba wygenerowanych propozycji
    proposals: GenerationProposalDto[]; // Tablica propozycji
  }
  ```
- **`GenerationProposalDto`**: Typ obiektu reprezentującego pojedynczą propozycję fiszki.
  ```typescript
  {
    front: string; // Pytanie (przód fiszki)
    back: string; // Odpowiedź (tył fiszki)
    source: "ai-full"; // Źródło (tutaj zawsze AI)
  }
  ```
- **`ErrorResponseDto`**: Potencjalny typ dla odpowiedzi błędów API (choć API może zwracać różne struktury).
  ```typescript
  {
    error: string; // Komunikat błędu
  }
  ```

Wprowadzony zostanie również typ dla stanu wewnętrznego komponentu `GenerateForm`:
- **`GenerateViewState`**:
  ```typescript
  interface GenerateViewState {
    sourceText: string; // Tekst w textarea
    model: string; // Wybrany model AI
    isLoading: boolean; // Czy trwa ładowanie z API
    error: string | null; // Komunikat błędu (walidacji lub API)
    proposals: GenerationProposalDto[] | null; // Lista wygenerowanych propozycji
    generationId: number | null; // ID ostatniej udanej generacji
    // Pochodne (nie muszą być w stanie, można obliczać):
    // charCount: number;
    // isValidLength: boolean;
  }
  ```

## 6. Zarządzanie stanem
Stan będzie zarządzany lokalnie w komponencie React `GenerateForm` przy użyciu hooków `useState`.
- `sourceText`, `setSourceText`: Przechowuje tekst z `Textarea`.
- `model`, `setModel`: Przechowuje nazwę modelu AI (początkowo stała wartość, np. 'claude-3-haiku-20240307').
- `isLoading`, `setIsLoading`: Flaga wskazująca na trwającą operację API.
- `error`, `setError`: Przechowuje komunikat błędu do wyświetlenia.
- `proposals`, `setProposals`: Przechowuje listę propozycji po udanym API call.
- `generationId`, `setGenerationId`: Przechowuje ID generacji po udanym API call.

Stan pochodny, taki jak `charCount` (`sourceText.length`) i `isValidLength` (`charCount >= 1000 && charCount <= 10000`), będzie obliczany w trakcie renderowania lub przy użyciu `useMemo`, aby uniknąć redundancji w stanie.

Rozważenie użycia customowego hooka `useGenerationForm` jest zalecane w celu enkapsulacji logiki stanu, walidacji i funkcji obsługi zdarzeń (`handleTextChange`, `handleGenerateClick`), co poprawi czytelność komponentu `GenerateForm`.

## 7. Integracja API
Komponent `GenerateForm` będzie komunikował się z endpointem backendu: `POST /api/generations`.
- **Wywołanie:** Po kliknięciu przycisku "Generuj" (jeśli walidacja długości tekstu jest pomyślna).
- **Metoda:** `POST`
- **URL:** `/api/generations` (zakładając, że frontend i API są na tej samej domenie)
- **Nagłówki:** `Content-Type: application/json`
- **Ciało żądania (`CreateGenerationCommandDto`):**
  ```json
  {
    "model": "claude-3-haiku-20240307", // lub inna wartość ze stanu
    "source_text": "..." // wartość ze stanu sourceText
  }
  ```
- **Obsługa odpowiedzi:**
  - **Sukces (status 201):** Przetwarza ciało odpowiedzi (`CreateGenerationResponseDto`), zapisuje `proposals` i `generationId` w stanie, czyści błędy, ustawia `isLoading` na `false`.
  - **Błąd (status 400, 500, inne):** Próbuje przetworzyć ciało odpowiedzi błędu (np. `ErrorResponseDto`), ustawia odpowiedni komunikat w stanie `error`, czyści `proposals`, ustawia `isLoading` na `false`.
  - **Błąd sieciowy:** Obsługuje błąd w bloku `catch`, ustawia ogólny komunikat błędu sieciowego w stanie `error`, ustawia `isLoading` na `false`.

## 8. Interakcje użytkownika
- **Wpisywanie/wklejanie tekstu w `SourceTextInput`:** Aktualizuje stan `sourceText`, przelicza `charCount` i `isValidLength`, aktualizuje wyświetlanie `CharCounter`, włącza/wyłącza `GenerateButton`.
- **Kliknięcie `GenerateButton` (gdy aktywny):** Ustawia `isLoading` na `true`, wyświetla `OverlayLoader`, czyści poprzednie błędy i propozycje, inicjuje wywołanie API `POST /api/generations`. Po otrzymaniu odpowiedzi (sukces lub błąd), aktualizuje stan (`proposals` lub `error`), ukrywa `OverlayLoader`.

## 9. Warunki i walidacja
- **Warunek:** Długość tekstu (`sourceText`) musi być w przedziale [1000, 10000] znaków.
- **Weryfikacja:**
  - **Komponent:** `SourceTextInput` i `GenerateForm`.
  - **Logika:** Obliczenie `sourceText.length` i porównanie z `min=1000` i `max=10000`.
- **Wpływ na interfejs:**
  - `GenerateButton` jest nieaktywny (`disabled`), jeśli warunek nie jest spełniony.
  - `CharCounter` wizualnie informuje o aktualnej liczbie i zakresie.
  - `SourceTextInput` może otrzymać stylizację błędu (np. czerwona ramka, `aria-invalid="true"`).
  - Opcjonalnie, `ErrorMessage` może wyświetlać komunikat walidacyjny, gdy użytkownik próbuje kliknąć nieaktywny przycisk lub gdy pole traci fokus z nieprawidłową wartością.

## 10. Obsługa błędów
- **Błąd walidacji klienta:** (Długość tekstu poza zakresem) - Obsługiwany przez dezaktywację przycisku i wizualne wskazówki (jak opisano w sekcji 9).
- **Błąd API 400 (Bad Request):** (np. walidacja serwera) - Wyświetlić komunikat w `ErrorMessage`, np.: "Tekst musi zawierać od 1000 do 10000 znaków."
- **Błąd API 500 (Internal Server Error - Ogólny):** - Wyświetlić komunikat w `ErrorMessage`, np.: "Wystąpił błąd serwera podczas generowania fiszek. Spróbuj ponownie później."
- **Błąd API 500 (Internal Server Error - Błąd LLM):** - Wyświetlić komunikat w `ErrorMessage`, np.: "Wystąpił błąd podczas komunikacji z usługą AI. Spróbuj ponownie lub użyj innego tekstu." (Backend loguje szczegóły).
- **Błąd sieciowy / Fetch:** - Wyświetlić komunikat w `ErrorMessage`, np.: "Błąd połączenia z serwerem. Sprawdź swoje połączenie internetowe."
- **Stan ładowania:** Podczas trwania wywołania API, interfejs powinien być zablokowany przez `OverlayLoader`, aby zapobiec wielokrotnym kliknięciom.

## 11. Kroki implementacji
1.  **Utworzenie strony Astro:** Stworzyć plik `src/pages/generate.astro`. Zabezpieczyć stronę middlewarem Astro, aby wymagała zalogowania.
2.  **Utworzenie komponentu React:** Stworzyć plik `src/components/GenerateForm.tsx`. Zaimplementować podstawową strukturę komponentu i renderować go w `generate.astro` z dyrektywą `client:load`.
3.  **Implementacja zarządzania stanem:** W `GenerateForm.tsx` zdefiniować potrzebne stany (`sourceText`, `model`, `isLoading`, `error`, `proposals`, `generationId`) używając `useState`. Rozważyć stworzenie custom hooka `useGenerationForm`.
4.  **Implementacja komponentów podrzędnych:**
    -   Stworzyć `SourceTextInput.tsx` używając `shadcn/ui Textarea`. Dodać logikę `onChange`, walidację długości i przekazywanie stanu do rodzica.
    -   Stworzyć `CharCounter.tsx` do wyświetlania liczby znaków.
    -   Stworzyć `GenerateButton.tsx` używając `shadcn/ui Button`, powiązać `disabled` ze stanem walidacji i ładowania.
    -   Stworzyć `ErrorMessage.tsx` do warunkowego wyświetlania błędów.
    -   Stworzyć `OverlayLoader.tsx` do wyświetlania wskaźnika ładowania.
    -   Stworzyć `ProposalList.tsx` do wyświetlania wyników.
5.  **Integracja komponentów:** Połączyć komponenty podrzędne w `GenerateForm`, przekazując odpowiednie propsy i handlery.
6.  **Implementacja logiki API:** W `GenerateForm` (lub custom hooku) zaimplementować funkcję `handleGenerateClick`, która wykonuje żądanie `fetch` do `POST /api/generations`.
7.  **Obsługa odpowiedzi API:** Zaimplementować logikę obsługi sukcesu (aktualizacja stanu `proposals`, `generationId`) i błędów (aktualizacja stanu `error`).
8.  **Styling:** Użyć Tailwind i `shadcn/ui` do ostylowania komponentów zgodnie z projektem.
9.  **Testowanie:** Przetestować różne scenariusze: wprowadzanie tekstu, walidacja, kliknięcie przycisku, stan ładowania, pomyślne generowanie, różne typy błędów API. Sprawdzić responsywność i dostępność.
10. **Weryfikacja endpointu:** Upewnić się, że endpoint `/api/generations` poprawnie odczytuje ID zalogowanego użytkownika z `locals` (wymaga modyfikacji w `src/pages/api/generations.ts` i konfiguracji middleware). 