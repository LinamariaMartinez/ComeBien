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

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
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
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return unauthorized();

    const supabase = createUserClient(token);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const {
      current_cycle_day,
      cycle_length,
      daily_targets,
      name,
      weight_kg,
      height_cm,
      age,
      activity_level,
    } = body as Record<string, unknown>;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (current_cycle_day !== undefined) updates.current_cycle_day = current_cycle_day;
    if (cycle_length !== undefined) updates.cycle_length = cycle_length;
    if (daily_targets !== undefined) updates.daily_targets = daily_targets;
    if (name !== undefined) updates.name = name;
    if (weight_kg !== undefined) updates.weight_kg = weight_kg;
    if (height_cm !== undefined) updates.height_cm = height_cm;
    if (age !== undefined) updates.age = age;
    if (activity_level !== undefined) updates.activity_level = activity_level;

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('settings PUT error:', err);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}
