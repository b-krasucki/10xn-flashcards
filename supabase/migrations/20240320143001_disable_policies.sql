-- Migration: Disable RLS Policies
-- Description: Drops all previously defined RLS policies for flashcards, generations, and generation_error_logs tables
-- Created at: 2024-03-20 14:30:01 UTC

-- Drop policies for flashcards table
drop policy if exists "Users can view their own flashcards" on flashcards;
drop policy if exists "Users can insert their own flashcards" on flashcards;
drop policy if exists "Users can update their own flashcards" on flashcards;
drop policy if exists "Users can delete their own flashcards" on flashcards;

-- Drop policies for generations table
drop policy if exists "Users can view their own generations" on generations;
drop policy if exists "Users can insert their own generations" on generations;
drop policy if exists "Users can update their own generations" on generations;

-- Drop policies for generation_error_logs table
drop policy if exists "Users can view their own error logs" on generation_error_logs;
drop policy if exists "Users can insert their own error logs" on generation_error_logs;

-- Disable RLS on tables
alter table flashcards disable row level security;
alter table generations disable row level security;
alter table generation_error_logs disable row level security; 