import { createClient } from '@supabase/supabase-js';
import type { Database } from "./types.ts"; 

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  { db: { schema: 'api' } }
);
const { data } = await supabase.from('teams').select('*');
// fazer as outras apis...