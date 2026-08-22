import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.from('group_members').select('*');
  
  if (error) return NextResponse.json({ error }, { status: 500 });
  
  return NextResponse.json({ data });
}
