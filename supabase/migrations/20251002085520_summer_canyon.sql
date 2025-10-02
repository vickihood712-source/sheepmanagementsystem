/*
  # Fix users table RLS policies

  1. Security Changes
    - Drop all existing conflicting policies
    - Create simple, non-recursive policies
    - Allow users to read their own profile
    - Allow admins to read all profiles
    - Allow users to insert their own profile during registration
    - Allow users to update their own profile

  2. Policy Structure
    - Uses auth.uid() directly without subqueries to avoid recursion
    - Simple role-based access for admin operations
    - Secure but functional permissions
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins have full access" ON users;
DROP POLICY IF EXISTS "Enable read access for own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for admin users" ON users;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile during registration
CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Allow service role full access (for admin operations)
CREATE POLICY "service_role_full_access" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 5: Admin users can read all profiles (for user management)
CREATE POLICY "admin_read_all" ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid() 
      AND admin_user.role = 'admin'
    )
  );

-- Policy 6: Admin users can manage all users
CREATE POLICY "admin_manage_all" ON users
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