import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('settings GET error:', err);
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { cycle_day, cycle_length } = body as {
      cycle_day?: number;
      cycle_length?: number;
    };

    const updates: Record<string, number | string> = { updated_at: new Date().toISOString() };
    if (cycle_day !== undefined) updates.cycle_day = cycle_day;
    if (cycle_length !== undefined) updates.cycle_length = cycle_length;

    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('settings PUT error:', err);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}
