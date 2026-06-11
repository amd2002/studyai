// Supabase client — one instance for the whole app.
// The anon key is PUBLIC and safe to expose; security is enforced by RLS in the database.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, anonKey)
