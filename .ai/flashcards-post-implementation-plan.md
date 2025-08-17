# API Endpoint Implementation Plan: POST /flashcards

## 1. Przegląd punktu końcowego

Tworzy jedno lub wiele propozycji fiszek (manualnych lub generowanych przez AI). Umożliwia użytkownikowi dodanie własnych fiszek lub zaakceptowanie/edycję wygenerowanych automatycznie. **Dodatkowo, endpoint ten będzie obsługiwał przypisanie fiszek do talii (deck) na podstawie przekazanej nazwy talii. Jeśli talia o danej nazwie dla użytkownika nie istnieje, zostanie utworzona.**

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Ścieżka: `/api/flashcards`
- Nagłówki:
  - `Authorization: Bearer <session_token>`
  - `Content-Type: application/json`
- Body (JSON):
  ```json
  {
    "deck_name": "string (req, max 100)",
    "flashcards": [
      {
        "front": "string (req, max 200)",
        "back": "string (req, max 500)",
        "source": "manual | ai-full | ai-edited",
        "generation_id": "number | null (req if source != manual)"
      }
    ]
  }
  ```
- Walidacja (Zod):
  - `deck_name`: non-empty, max 100 znaków
  - `flashcards`: tablica, min 1 element
  - `flashcards[].front`: non-empty, max 200 znaków
  - `flashcards[].back`: non-empty, max 500 znaków
  - `flashcards[].source`: enum(`manual`,`ai-full`,`ai-edited`)
  - jeśli `flashcards[].source` ≠ `manual` ⇒ `flashcards[].generation_id` musi być liczbą i istnieć w tabeli `generations`
  - jeśli `flashcards[].source` = `manual` ⇒ `flashcards[].generation_id` musi być `null`
  - uwierzytelniona sesja Supabase; operacja tylko dla bieżącego `user_id`

## 3. Szczegóły odpowiedzi

- Status: **201 Created**
- Body (JSON):
  ```json
  {
    "deck": {
      "id": "number",
      "deck_name": "string",
      "user_id": "string"
    },
    "flashcards": [
      {
        "id": "number",
        "deck_id": "number",
        "front": "string",
        "back": "string",
        "source": "manual|ai-full|ai-edited",
        "generation_id": "number|null",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
  }
  ```
- Dodatkowe kody:
  - 400 Bad Request – błędy walidacji (w tym błędy `deckName` lub `flashcards`)
  - 401 Unauthorized – brak sesji
  - 403 Forbidden – próba tworzenia dla innego `user_id`
  - 404 Not Found – nieistniejące `generation_id`
  - 500 Internal Server Error – nieoczekiwany błąd

## 4. Przepływ danych

1. **Middleware** (src/middleware/index.ts) doda `supabase` do `context.locals`
2. **Route Handler** (src/pages/api/flashcards/index.ts):
   - Parsuje i waliduje JSON via Zod (w tym `deckName` i `flashcards`)
   - Pobiera `user_id` z `context.locals.session`
   - Deleguje do `flashcardsService.createFlashcards(user_id, deckName, flashcardsDto)`
3. **Service** (src/lib/services/flashcards.service.ts):
   - **Obsługa talii (Deck Handling)**:
     - Na podstawie `user_id` i `deckName`, wyszukuje istniejącą talię w tabeli `decks`.
     - Jeśli talia nie istnieje, tworzy nową talię dla `user_id` z `deckName`.
     - Pobiera `deck_id` istniejącej lub nowo utworzonej talii.
   - Sprawdza istnienie `generation_id` dla AI (jeśli wymagane) dla każdej fiszki.
   - Przygotowuje tablicę insertów dla fiszek: mapuje DTO na obiekt { front, back, source, generation_id, user_id, deck_id }
   - Batch insert przez Supabase RPC lub `supabase.from('flashcards').insert(...)` z zwrotem wszystkich kolumn.
   - Mapuje wynik (talię i fiszki) do struktury odpowiedzi DTO.
4. **Odpowiedź**: zwraca JSON z informacjami o talii i utworzonych fiszkach oraz status 201

## 5. Względy bezpieczeństwa

- Uwierzytelnianie: Supabase Auth (cookie lub header)
- Autoryzacja: `user_id` z sesji musi zgadzać się z `user_id` tworzonej talii oraz fiszek. Użytkownik może dodawać fiszki tylko do własnych talii.
- Unikanie SQL injection przez Supabase client
- Walidacja po stronie serwera (Zod) dla `deckName` i `flashcards`.
- Ograniczenie wielkości wsadu: max np. 50 fiszek na żądanie

## 6. Obsługa błędów

| Scenariusz                    | Kod | Akcja                                                                |
| ----------------------------- | --- | -------------------------------------------------------------------- |
| Błędna walidacja              | 400 | Zwróć szczegóły błędów Zod                                           |
| Brak sesji                    | 401 | Zwróć `{ error: 'Unauthorized' }`                                    |
| Inny `user_id` w DTO          | 403 | Zwróć `{ error: 'Forbidden' }`                                       |
| Nieistniejące `generation_id` | 404 | Zwróć `{ error: 'Generation not found for one or more flashcards' }` |
| Błąd bazy danych / wyjątek    | 500 | Log error, zwróć `{ error: 'Internal Server Error' }`                |

## 7. Wydajność

- Batch insert dla fiszek.
- Operacja wyszukiwania/tworzenia talii powinna być efektywna (indeks na `decks(user_id, name)`).
- Opcjonalnie użycie RPC lub transakcji dla zachowania atomiczności operacji na talii i fiszkach.
- Ograniczenie rozmiaru payloadu i liczby elementów na żądanie.
- Indeksy na `flashcards(user_id, deck_id)` i `flashcards(generation_id)`.

## 8. Kroki implementacji

1. Utworzyć migrację bazy danych dla nowej tabeli `decks` (`id`, `user_id`, `name`, `created_at`, `updated_at`) z unikalnym kluczem (`user_id`, `name`).
2. Zaktualizować tabelę `flashcards` dodając kolumnę `deck_id` (FK do `decks.id`) i odpowiednie indeksy.
3. Zaktualizować lub utworzyć Zod schema w `src/lib/schemas/flashcards.schema.ts` dla `deckName` oraz zmodyfikować schemat dla `flashcards`.
4. Dodać plik API route w `src/pages/api/flashcards/index.ts` - zmodyfikować logikę handlera.
5. W middleware (`src/middleware/index.ts`) zapewnić dostęp do `supabase` i `session` (bez zmian jeśli już istnieje).
6. Stworzyć/Zaktualizować `flashcardsService` w `src/lib/services/flashcards.service.ts` z metodą `createFlashcards(userId, deckName, flashcardsDto)` implementującą logikę obsługi talii i fiszek.
7. Zaktualizować dokumentację API (OpenAPI / postman).

## 9. Dodatkowe uwagi

- Upewnić się, że typ `user_id` (np. UUID z Supabase Auth) jest spójnie używany w tabelach `decks` i `flashcards`.
