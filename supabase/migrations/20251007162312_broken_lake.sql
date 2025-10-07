/*
  # Add reference field to debts_credits table

  1. Changes
    - Add reference column to debts_credits table for linking to financial records
    - This helps track the connection between debts/credits and actual transactions

  2. Security
    - No changes to RLS policies needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'debts_credits' AND column_name = 'reference'
  ) THEN
    ALTER TABLE debts_credits ADD COLUMN reference text;
  END IF;
END $$;