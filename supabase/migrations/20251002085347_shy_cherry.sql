/*
  # Fix Users Table RLS Policies

  1. Security Changes
    - Remove conflicting RLS policies that cause infinite recursion
    - Create simple, non-recursive policies for the users table
    - Ensure authenticated users can read their own profile
    - Allow admins to manage all users
    - Allow users to insert and update their own profiles

  2. Policy Structure
    - Simple SELECT policy using auth.uid() = id
    - INSERT policy for profile creation during registration
    - UPDATE policy for profile updates
    - Admin policy for full access without recursion
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins have full access to all users" ON users;
DROP POLICY IF EXISTS "Admins have full access to users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin policy that doesn't cause recursion
CREATE POLICY "Admins have full access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );