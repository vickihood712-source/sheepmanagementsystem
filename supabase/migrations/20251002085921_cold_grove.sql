/*
  # Fix infinite recursion in users table RLS policies

  1. Security Changes
    - Drop all existing problematic policies that cause recursion
    - Create simple, non-recursive policies for users table
    - Ensure policies use direct auth.uid() checks without circular references

  2. New Policies
    - Simple user access policies without recursion
    - Admin policies that don't cause circular lookups
    - Service role access for system operations
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "admin_manage_all" ON users;
DROP POLICY IF EXISTS "admin_read_all" ON users;
DROP POLICY IF EXISTS "service_role_full_access" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "users_can_read_own_profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_can_update_own_profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role has full access (no recursion)
CREATE POLICY "service_role_has_full_access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin policy using raw_user_meta_data (avoids recursion)
CREATE POLICY "admins_can_manage_all_users"
  ON users
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin')
  WITH CHECK ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');