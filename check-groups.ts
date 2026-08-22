import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  const { data, error } = await supabase.from('group_members').select('*');
  console.log("All group_members:");
  console.log(data);

  // Check for duplicates
  const seen = new Set();
  const duplicates = [];
  data?.forEach(row => {
    const key = `${row.group_id}-${row.user_id}`;
    if (seen.has(key)) duplicates.push(row);
    seen.add(key);
  });
  console.log("Duplicates:", duplicates);
}
check();
