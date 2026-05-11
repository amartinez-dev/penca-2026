import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/auth';

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });

  try {
    const body = await request.json();
    const matchId = String(body.match_id || '');
    if (!matchId) return NextResponse.json({ ok: false, error: 'Falta partido.' }, { status: 400 });

    const payload = {
      venue: body.venue ? String(body.venue).trim() : null,
      city: body.city ? String(body.city).trim() : null,
      home_lineup: body.home_lineup ? String(body.home_lineup).trim() : null,
      away_lineup: body.away_lineup ? String(body.away_lineup).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
      updated_at: new Date().toISOString()
    };

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('matches')
      .update(payload)
      .eq('id', matchId)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudo guardar la información del partido.' }, { status: 500 });
  }
}
