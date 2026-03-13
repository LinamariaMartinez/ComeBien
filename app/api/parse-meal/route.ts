import { NextRequest, NextResponse } from 'next/server';
import { parseMealDescription } from '@/lib/openai';
import { createUserClient, extractToken } from '@/lib/supabase';
import { MealTime } from '@/lib/types';

function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request.headers.get('Authorization'));
    if (!token) return unauthorized();

    const supabase = createUserClient(token);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return unauthorized();

    const body = await request.json();
    const { description, meal_time, date } = body as {
      description: string;
      meal_time: MealTime;
      date?: string;
    };

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Descripción requerida' }, { status: 400 });
    }
    if (!meal_time) {
      return NextResponse.json({ error: 'Tipo de comida requerido' }, { status: 400 });
    }

    const parsed_portions = await parseMealDescription(description);
    const logDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_logs')
      .insert({
        user_id: user.id,
        date: logDate,
        meal_time,
        description: description.trim(),
        parsed_portions,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error('parse-meal error:', err);
    const message = err instanceof Error ? err.message : 'Error al procesar la comida';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
