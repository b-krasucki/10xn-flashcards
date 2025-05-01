# API Endpoint Implementation Plan: POST /flashcards

## 1. Przegląd punktu końcowego
Tworzy jedno lub wiele propozycji fiszek (manualnych lub generowanych przez AI). Umożliwia użytkownikowi dodanie własnych fiszek lub zaakceptowanie/edycję wygenerowanych automatycznie.

## 2. Szczegóły żądania
- Metoda HTTP: POST
- Ścieżka: `/api/flashcards`
- Nagłówki:
  - `Authorization: Bearer <session_token>`
  - `Content-Type: application/json`
- Body (JSON):
  ```json
  {
    "flashcardsProposals": [
      {
        "front": "string (req, max 200)",
        "back": "string (req, max 500)",
        "source": "manual | ai-full | ai-edited",
        "generation_id": number | null
      }
    ]
  }
  ```
- Walidacja (Zod):
  - `front`: non-empty, max 200 znaków
  - `back`: non-empty, max 500 znaków
  - `source`: enum(`manual`,`ai-full`,`ai-edited`)
  - jeśli `source` ≠ `manual` ⇒ `generation_id` musi być liczbą i istniał w tabeli `generations`
  - jeśli `source` = `manual` ⇒ `generation_id` musi być `null`
  - uwierzytelniona sesja Supabase; operacja tylko dla bieżącego `user_id`

## 3. Szczegóły odpowiedzi
- Status: **201 Created**
- Body (JSON):
  ```json
  {
    "flashcardsProposals": [
      {
        "id": number,
        "front": string,
        "back": string,
        "source": "manual|ai-full|ai-edited",
        "generation_id": number|null,
        "created_at": timestamp,
        "updated_at": timestamp
      }
    ]
  }
  ```
- Dodatkowe kody:
  - 400 Bad Request – błędy walidacji
  - 401 Unauthorized – brak sesji
  - 403 Forbidden – próba tworzenia dla innego `user_id`
  - 404 Not Found – nieistniejące `generation_id`
  - 500 Internal Server Error – nieoczekiwany błąd

## 4. Przepływ danych
1. **Middleware** (src/middleware/index.ts) doda `supabase` do `context.locals`
2. **Route Handler** (src/pages/api/flashcards/index.ts):
   - Parsuje i waliduje JSON via Zod
   - Pobiera `user_id` z `context.locals.session`
   - Deleguje do `flashcardsService.createFlashcards(user_id, dto)`
3. **Service** (src/lib/services/flashcards.service.ts):
   - Sprawdza istnienie `generation_id` dla AI (jeśli wymagane)
   - Przygotowuje tablicę insertów: mapuje DTO na obiekt { front, back, source, generation_id, user_id }
   - Batch insert przez Supabase RPC lub `supabase.from('flashcards').insert(...)` z zwrotem wszystkich kolumn
   - Mapuje wynik do `FlashcardDto[]`
4. **Odpowiedź**: zwraca JSON z propozycjami i status 201

## 5. Względy bezpieczeństwa
- Uwierzytelnianie: Supabase Auth (cookie lub header)
- Autoryzacja: `user_id` z sesji musi zgadzać się z `user_id` wpisu
- Unikanie SQL injection przez Supabase client
- Walidacja po stronie serwera (Zod)
- Ograniczenie wielkości wsadu: max np. 50 fiszek na żądanie

## 6. Obsługa błędów
| Scenariusz                     | Kod  | Akcja                                                       |
|--------------------------------|------|-------------------------------------------------------------|
| Błędna walidacja               | 400  | Zwróć szczegóły błędów Zod                                 |
| Brak sesji                     | 401  | Zwróć `{ error: 'Unauthorized' }`                          |
| Inny `user_id` w DTO           | 403  | Zwróć `{ error: 'Forbidden' }`                              |
| Nieistniejące `generation_id`  | 404  | Zwróć `{ error: 'Generation not found' }`                  |
| Błąd bazy danych / wyjątek     | 500  | Log error, zwróć `{ error: 'Internal Server Error' }`      |

## 7. Wydajność
- Batch insert zamiast wielu pojedynczych zapytań
- Opcjonalnie użycie RPC lub transakcji dla zachowania atomiczności
- Ograniczenie rozmiaru payloadu i liczby elementów na żądanie
- Indeks na `user_id` i `generation_id` w tabeli `flashcards`

## 8. Kroki implementacji
1. Utworzyć lub zaktualizować Zod schema w `src/lib/schemas/flashcards.schema.ts`
2. Dodać plik API route w `src/pages/api/flashcards/index.ts`
3. W middleware (`src/middleware/index.ts`) zapewnić dostęp do `supabase` i `session`
4. Stworzyć `flashcardsService` w `src/lib/services/flashcards.service.ts` z metodą `createFlashcards`
5. Napisać testy jednostkowe/względnie integracyjne dla:
   - walidacji Zod
   - logiki sprawdzania `generation_id`
   - batch insert i mapowania DTO
6. Dodać testy e2e korzystające z Supabase test database lub mocka
7. Zaktualizować dokumentację API (OpenAPI / postman)
8. Code review i deployment 