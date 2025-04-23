# Schemat bazy danych PostgreSQL dla MVP

## 1. Lista tabel

### Tabela: users
Tabela zarządzana przez Supabase Auth

- id: UUID PRIMARY KEY
- email: VARCHAR(255)
- encypted_password: VARCHAR NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- confirmed_at: TIMESTAMPTZ

### Tabela: flashcards
- id: BIGSERIAL PRIMARY KEY
- front: VARCHAR(200) NOT NULL
- back: VARCHAR(500) NOT NULL
- source: VARCHAR NOT NULL CHECK (source IN ('ai-full', 'ai-edited', 'manual'))
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- generation_id: BIGINT REFERENCES generations(id) ON DELETE SET NULL
- user_id: UUID NOT NULL REFERENCES users(id)

### Tabela: generations
- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id)
- model: VARCHAR NOT NULL
- generated_count: INTEGER NOT NULL
- accepted_unedited_count: INTEGER NULLABLE
- accepted_edited_count: INTEGER NULLABLE
- source_text_hash: VARCHAR NOT NULL
- source_text_lenght: INTEGER NOT NULL CHECK (source_text_lenght BETWEEN 1000 AND 10000)
- generation_duration: INTEGER NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()

### Tabela: generation_error_logs
- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id)
- model: VARCHAR NOT NULL
- source_text_hash: VARCHAR NOT NULL
- source_text_lenght: INTEGER NOT NULL CHECK (source_text_lenght BETWEEN 1000 AND 10000)
- error_code: VARCHAR(100) NOT NULL
- error_message: TEXT NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()


## 2. Relacje między tabelami

- Jeden uzytkownik (users) ma wiele fiszek (flashcards).
- Jeden uzytkownik (users) ma wiele rekordow w tabeli generations.
- Jeden uzytkownik (users) ma wiele rekordow w tabeli generation_error_logs.
- Kazda fiszka (flashcards) moze opcjonalnie odnosic sie do jednej generacji (generations) poprzez generation_id


## 3. Indeksy

- Indeks na kolumnie 'user_id' w tabeli flashcards
- Indeks na kolumnie 'generation_id' w tabeli flashcards
- Indeks na kolumnie 'user_id' w tabeli generations
- Indeks na kolumnie 'user_id' w tabeli generation_error_logs


## 4. Zasady PostgreSQL (RLS i triggery)

### Row-Level Security (RLS)
Dla tabel: flashcards, generations, generation_error_logs nalezy wdrozyc poltyki RLS, ktore pozwalaja uzytkownikowi na dostep tylko do rekordow, gdzie 'user_id' odpowiada identyfikatorowi uzytkownika z Supabase Auth (np. auth.uid() = user_id).


*Uwaga: Funkcja `auth.uid()` pochodzi z Supabase Auth i umożliwia identyfikację bieżącego użytkownika.*

### Triggery automatycznie aktualizujące `updated_at`
Triggery należy utworzyć dla tabel generations oraz flashcards.


## 5. Dodatkowe uwagi

- Użycie UUID jako kluczy głównych wspiera skalowalność i spójność danych.