import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const users = [
  { email: 'user1@test.com', password: '123456!' },
  { email: 'user2@test.com',   password: '123456!' },
  { email: 'user3@test.com', password: '123456' },
];

for (const u of users) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  });
  console.log(u.email, error ? 'ERROR: ' + error.message : 'OK: ' + data.user?.id);
}
