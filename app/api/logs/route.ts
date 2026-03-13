import { NextRequest, NextResponse } from 'next/server';
import { createUserClient, extractToken } from '@/lib/supabase';

function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return unauthorized();

    const supabase = createUserClient(token);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    // RLS filters to user's own rows automatically
    let query = supabase
      .from('daily_logs')
      .select('*')
      .order('created_at', { ascending: true });

    if (date) {
      query = query.eq('date', date);
    } else if (start && end) {
      query = query.gte('date', start).lte('date', end);
    } else {
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('date', today);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('logs GET error:', err);
    return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 });
  }
}
