import { NextRequest, NextResponse } from 'next/server';
import { createUserClient, extractToken } from '@/lib/supabase';

function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
}

/** GET /api/profile — returns the current user's profile */
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
    console.error('profile GET error:', err);
    return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 });
  }
}
