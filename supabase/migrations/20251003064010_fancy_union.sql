/*
  # Add Debt and Credit Tracking

  1. New Tables
    - `debts_credits`
      - `id` (uuid, primary key)
      - `type` (text, 'debt' or 'credit')
      - `amount` (numeric)
      - `description` (text)
      - `counterparty` (text, who owes or is owed)
      - `due_date` (date, optional)
      - `status` (text, 'pending', 'partial', 'paid')
      - `paid_amount` (numeric, default 0)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `debts_credits` table
    - Add policies for authenticated users to manage their records
    - Add policy for admins to view all records
*/

CREATE TABLE IF NOT EXISTS debts_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('debt', 'credit')),
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  counterparty text NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  paid_amount numeric DEFAULT 0 CHECK (paid_amount >= 0),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE debts_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own debts and credits"
  ON debts_credits
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can view all debts and credits"
  ON debts_credits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_debts_credits_updated_at 
  BEFORE UPDATE ON debts_credits 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();