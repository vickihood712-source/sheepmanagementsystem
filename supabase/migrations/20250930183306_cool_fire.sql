/*
  # Update admin user access policies

  1. Security Updates
    - Ensure admins can view all users
    - Update RLS policies for proper admin access
    - Add policy for admins to manage user data

  2. Changes
    - Update users table policies
    - Ensure admin role has full access to user management
*/

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create comprehensive admin access policy
CREATE POLICY "Admins have full access to users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    -- Allow if user is admin
    (auth.jwt() ->> 'role' = 'admin') OR
    -- Allow if accessing own record
    (auth.uid() = id)
  )
  WITH CHECK (
    -- Allow if user is admin
    (auth.jwt() ->> 'role' = 'admin') OR
    -- Allow if creating/updating own record
    (auth.uid() = id)
  );

-- Ensure users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);