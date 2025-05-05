-- Migration: Create flashcards_set_name table
-- Purpose: Creates a table to associate user-defined deck names with individual flashcards for specific users.
-- Affected Tables: public.flashcards_set_name
-- Depends on: public.flashcards table, auth.users table, uuid-ossp extension
-- Special Considerations: Uniqueness of the deck name *concept* per user must be handled at the application level.

-- Table: flashcards_set_name
-- Description: Stores the association between a user, a specific flashcard, and a named deck (set).
-- Note: The uniqueness of the deck name *per user* is enforced by application logic when adding flashcards,
-- ensuring all flashcards intended for the same deck under the same user receive the identical 'flashcards_set_name' string.
-- This table structure primarily links individual flashcards to a named set for a user.
create table public.flashcards_set_name (
    -- primary key
    id uuid primary key default uuid_generate_v4(),

    -- foreign key to supabase auth users table
    -- ensures each entry is linked to an existing user.
    -- cascades deletes: if a user is deleted, their deck name associations are removed.
    user_id uuid not null references auth.users(id) on delete cascade,

    -- foreign key to the flashcards table
    -- ensures each entry is linked to an existing flashcard.
    -- cascades deletes: if a flashcard is deleted, its association with a deck name is removed.
    flashcard_id bigint not null references public.flashcards(id) on delete cascade,

    -- deck name field
    -- the actual name of the deck/set this flashcard belongs to for this user.
    -- max length constraint enforced by check.
    flashcards_set_name text not null check (char_length(flashcards_set_name) <= 50),

    -- timestamps
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,

    -- constraints
    -- ensures a specific flashcard cannot be added to the list for the same user more than once.
    -- note: this does not enforce uniqueness of 'flashcards_set_name' per user directly in the db schema,
    -- as multiple rows will share the same name for different flashcards within the same deck.
    -- uniqueness of the *deck name concept* per user must be handled at the application level.
    constraint unique_user_flashcard_entry unique (user_id, flashcard_id)
);

-- optional: index for faster lookups based on user and deck name
create index idx_flashcards_set_name_user_deck on public.flashcards_set_name (user_id, flashcards_set_name);

-- enable row level security (rls)
-- important: always enable rls for tables containing user-specific data.
alter table public.flashcards_set_name enable row level security;

-- rls policies
-- allow users to perform operations only on their own deck name entries.

-- policy: allow users to select their own deck name entries.
create policy "allow users to select their own deck name entries"
on public.flashcards_set_name
for select
using (auth.uid() = user_id);

-- policy: allow users to insert deck name entries for themselves.
create policy "allow users to insert their own deck name entries"
on public.flashcards_set_name
for insert
with check (auth.uid() = user_id);

-- policy: allow users to update their own deck name entries.
-- (e.g., potentially re-assigning a flashcard to a different deck name)
create policy "allow users to update their own deck name entries"
on public.flashcards_set_name
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: allow users to delete their own deck name entries.
create policy "allow users to delete their own deck name entries"
on public.flashcards_set_name
for delete
using (auth.uid() = user_id);

-- trigger to automatically update 'updated_at' timestamp
-- ensure the function exists or create it if needed (often exists in supabase projects)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_flashcards_set_name_updated
before update on public.flashcards_set_name
for each row
execute function public.handle_updated_at();

-- add comments to the table and columns for better understanding within supabase ui
comment on table public.flashcards_set_name is 'associates flashcards with user-defined deck names.';
comment on column public.flashcards_set_name.id is 'unique identifier for the deck name association entry.';
comment on column public.flashcards_set_name.user_id is 'identifier for the user who owns this deck association (references auth.users).';
comment on column public.flashcards_set_name.flashcard_id is 'identifier for the specific flashcard belonging to this deck (references public.flashcards).';
comment on column public.flashcards_set_name.flashcards_set_name is 'the name of the deck/set (max 50 characters).';
comment on column public.flashcards_set_name.created_at is 'timestamp when the entry was created.';
comment on column public.flashcards_set_name.updated_at is 'timestamp when the entry was last updated.'; 