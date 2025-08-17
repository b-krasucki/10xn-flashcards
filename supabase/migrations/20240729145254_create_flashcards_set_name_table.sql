-- migration: create_flashcards_set_name_table
-- purpose: creates the 'flashcards_set_name' table to store user-specific flashcard deck names.
-- affected_tables: public.flashcards_set_name
-- considerations:
--   - enables row level security (rls) for the table.
--   - enforces uniqueness on (user_id, name) to ensure deck names are unique per user.
--   - establishes a foreign key relationship to auth.users for user association.
--   - this table will be referenced by the 'flashcards' table via a 'deck_id' foreign key in a subsequent migration or table definition.

-- create the flashcards_set_name table
create table public.flashcards_set_name (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name varchar(150) not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    constraint flashcards_set_name_user_id_name_key unique (user_id, name)
);

-- add comments to the table and columns
comment on table public.flashcards_set_name is 'stores names for sets of flashcards, unique per user.';
comment on column public.flashcards_set_name.id is 'primary key for the flashcard set name (uuid).';
comment on column public.flashcards_set_name.user_id is 'foreign key referencing the user who owns this flashcard set (auth.users.id).';
comment on column public.flashcards_set_name.name is 'name of the flashcard set, max 100 characters. unique per user.';
comment on column public.flashcards_set_name.created_at is 'timestamp of when the flashcard set name was created.';
comment on column public.flashcards_set_name.updated_at is 'timestamp of when the flashcard set name was last updated.';

-- enable row level security (rls)
alter table public.flashcards_set_name enable row level security;

--
-- rls policies for authenticated users
--

-- policy: allow authenticated users to select their own flashcard sets
create policy "allow authenticated select on own flashcard_set_name"
on public.flashcards_set_name for select
to authenticated
using (auth.uid() = user_id);

-- policy: allow authenticated users to insert their own flashcard sets
create policy "allow authenticated insert on own flashcard_set_name"
on public.flashcards_set_name for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: allow authenticated users to update their own flashcard sets
create policy "allow authenticated update on own flashcard_set_name"
on public.flashcards_set_name for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: allow authenticated users to delete their own flashcard sets
create policy "allow authenticated delete on own flashcard_set_name"
on public.flashcards_set_name for delete
to authenticated
using (auth.uid() = user_id);

-- note: no policies for 'anon' role are created as flashcard sets are user-specific.
-- if public sets are needed in the future, separate policies for 'anon' would be required. 