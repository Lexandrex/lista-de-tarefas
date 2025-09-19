import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 10 });
if (error) throw error;
console.table(
  data.users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at }))
);
