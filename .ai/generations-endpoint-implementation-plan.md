# Plan wdrożenia punktu końcowego API: POST /generations

## 1. Przegląd punktu końcowego
Punkt końcowy **POST /generations** służy do zainicjowania procesu generowania propozycji fiszek przy pomocy zewnętrznego modelu LLM (np. Openrouter.ai). Proces obejmuje walidację długości tekstu wejściowego, wywołanie API LLM, zapis metadanych generacji do bazy oraz zwrócenie wygenerowanych propozycji.

## 2. Szczegóły żądania
- Metoda HTTP: **POST**
- Ścieżka: `/generations`
- Nagłówki:
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>` (użytkownik musi być uwierzytelniony)
- Parametry:
  - Wymagane:
    - `model` (string) – nazwa modelu LLM, np. `gpt-4`
    - `source_text` (string) – tekst źródłowy o długości od 1000 do 10000 znaków
  - Opcjonalne: brak
- Body (JSON) zgodny z typem **CreateGenerationCommandDto**:
  ```ts
  interface CreateGenerationCommandDto {
    model: string;
    source_text: string;
  }
  ```
- Walidacja:
  - `source_text.length` ⩾ 1000 i ⩽ 10000
  - `model` to niepusty string
  - W przypadku błędnych danych zwrócić **400 Bad Request**

## 3. Szczegóły odpowiedzi
- Kody statusu:
  - **201 Created** – generacja zakończona sukcesem
  - **400 Bad Request** – nieprawidłowe dane wejściowe lub brak wymaganych pól
  - **401 Unauthorized** – brak lub nieprawidłowy token
  - **500 Internal Server Error** – błąd serwera lub błąd wewnętrzny API LLM
- Body (JSON) zgodny z typem **CreateGenerationResponseDto**:
  ```ts
  interface GenerationProposalDto {
    front: string;
    back: string;
    source: 'ai-full';
  }

  interface CreateGenerationResponseDto {
    generation_id: number;
    generated_count: number;
    proposals: GenerationProposalDto[];
  }
  ```
- Przykład odpowiedzi **201**:
  ```json
  {
    "generation_id": 123,
    "generated_count": 5,
    "proposals": [
      { "front": "Pytanie 1", "back": "Odpowiedź 1", "source": "ai-full" },
      { "front": "Pytanie 2", "back": "Odpowiedź 2", "source": "ai-full" }
    ]
  }
  ```

## 4. Przepływ danych
1. **Autentykacja** – middleware w `src/middleware/index.ts` wyciąga i weryfikuje token, przekazując obiekt `supabase` oraz dane `user` do `context.locals`.
2. **Walidacja** – w kontrolerze `src/pages/api/generations.ts` użycie Zod do sprawdzenia długości `source_text` oraz formatu `model`.
3. **Obliczenie metryk**:
   - `source_text_length = source_text.length`
   - `source_text_hash = hash(source_text)` (np. SHA-256)
   - `start = Date.now()`
4. **Wywołanie LLM** – poprzez moduł `src/lib/services/llmService.ts`, przekazując `model` i `source_text`, otrzymując tablicę `GenerationProposalDto`.
5. **Pomiar czasu generacji**:
   - `generation_duration = Date.now() - start`
6. **Zapis rekordu generacji** – insert do tabeli `generations` z polami: `user_id`, `model`, `generated_count`, `source_text_hash`, `source_text_length`, `generation_duration`.
7. **Zwrócenie odpowiedzi** – odesłanie `generation_id`, `generated_count` oraz `proposals` do klienta.

## 5. Aspekty bezpieczeństwa
- Autentykacja: walidacja tokena JWT w middleware.
- Autoryzacja: powiązanie każdego żądania z `user_id` z `context.locals`.
- Ochrona przed nadużyciami: limit długości `source_text`, weryfikacja modelu wg listy dozwolonych (whitelist), ograniczenie rozmiaru payload.
- Ograniczenie liczby żądań (rate limiting) na użytkownika w razie potrzeby.

## 6. Obsługa błędów
| Scenariusz                     | Kod statusu | Działanie                                                        |
|--------------------------------|-------------|------------------------------------------------------------------|
| Nieprawidłowa długość pola     | 400         | Zwrócenie `{ error: string }` z opisem błędu walidacji           |
| Brak lub nieprawidłowy token   | 401         | Zwrócenie `{ error: 'Unauthorized' }`                            |
| Błąd usługi LLM                | 500         | Zapis do `generation_error_logs`, zwrócenie `{ error: string }`  |
| Błąd zapisu w bazie            | 500         | Zwrócenie `{ error: 'Database error' }`                          |

- Błędy z LLM i bazy danych: logowanie do tabeli `generation_error_logs` z polami: `user_id`, `model`, `source_text_hash`, `source_text_length`, `error_code`, `error_message`.

## 7. Wydajność
- Batch insert: przy wielu propozycjach użyć pojedynczego batch insert do tabeli `flashcards`.
- Asynchroniczne wywołanie LLM: wykonywanie innych operacji równolegle przed zapisem rekordu generacji.
- Cache’owanie metadanych lub połączeń do LLM w serwisie `llmService`.
- Paginate i rate-limit po stronie API, by unikać przeciążeń.

## 8. Kroki implementacji
1. **Zdefiniować schemat Zod** w `src/lib/schemas/generation.schema.ts` dla `CreateGenerationCommandDto`.
2. **Stworzyć serwis LLM** w `src/lib/services/llmService.ts` z metodą `generateFlashcards(model, sourceText)`.
3. **Utworzyć endpoint** w `src/pages/api/generations.ts`:
   - Import schematu, serwisu i typów DTO.
   - Wykonać walidację, wywołanie LLM, pomiar czasu i zapis do bazy.
4. **Logika bazy danych**: użyć `locals.supabase` do insercji do `generations` i ewentualnego zapisu fiszek.
5. **Implementacja logowania błędów**: w bloku `catch` insercja do `generation_error_logs`.
