import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

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
