-- Migration: Add Spaced Repetition Columns to Flashcards
-- Description: Adds columns needed for spaced repetition learning system
-- Tables affected: flashcards
-- Created at: 2025-08-14 21:00:00 UTC

-- Add spaced repetition columns to flashcards table
ALTER TABLE flashcards
ADD COLUMN last_reviewed_at timestamptz,
ADD COLUMN difficulty_level integer DEFAULT 0 CHECK (difficulty_level >= 0 AND difficulty_level <= 5),
ADD COLUMN next_review_date timestamptz,
ADD COLUMN review_count integer DEFAULT 0 CHECK (review_count >= 0),
ADD COLUMN ease_factor decimal(4,2) DEFAULT 2.5 CHECK (ease_factor >= 1.3);

-- Add comments to the new columns
COMMENT ON COLUMN flashcards.last_reviewed_at IS 'Timestamp of when the flashcard was last reviewed by the user';
COMMENT ON COLUMN flashcards.difficulty_level IS 'User-rated difficulty level (0=not rated, 1=very easy, 2=easy, 3=medium, 4=hard, 5=very hard)';
COMMENT ON COLUMN flashcards.next_review_date IS 'Calculated date when the flashcard should next be reviewed';
COMMENT ON COLUMN flashcards.review_count IS 'Number of times this flashcard has been reviewed';
COMMENT ON COLUMN flashcards.ease_factor IS 'SM-2 algorithm ease factor for spaced repetition (default 2.5)';

-- Create indexes for efficient querying
CREATE INDEX idx_flashcards_next_review_date ON flashcards(next_review_date);
CREATE INDEX idx_flashcards_last_reviewed_at ON flashcards(last_reviewed_at);
CREATE INDEX idx_flashcards_difficulty_level ON flashcards(difficulty_level);

-- Add deck_name_id column to link flashcards to deck names
-- This should already exist but adding it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'flashcards' 
        AND column_name = 'deck_name_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE flashcards ADD COLUMN deck_name_id bigint;
        
        -- Add foreign key constraint
        ALTER TABLE flashcards
        ADD CONSTRAINT fk_flashcards_deck_name
        FOREIGN KEY (deck_name_id)
        REFERENCES flashcards_deck_names(id)
        ON DELETE SET NULL;
        
        -- Add index
        CREATE INDEX idx_flashcards_deck_name_id ON flashcards(deck_name_id);
        
        -- Add comment
        COMMENT ON COLUMN flashcards.deck_name_id IS 'Foreign key referencing flashcards_deck_names.id';
    END IF;
END $$;
