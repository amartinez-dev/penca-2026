import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/auth';

function cleanText(value: unknown) {
  const text = String(value || '').trim();
  return text ? text : null;
}

function buildPayload(body: any) {
  const kickoff = body.kickoff_at ? new Date(body.kickoff_at) : null;

  return {
    tournament_match_no: body.tournament_match_no ? Number(body.tournament_match_no) : null,
    stage: String(body.stage || 'Grupo'),
    group_name: cleanText(body.group_name),
    home_team: String(body.home_team || '').trim(),
    away_team: String(body.away_team || '').trim(),
    kickoff_at: kickoff ? kickoff.toISOString() : '',
    venue: cleanText(body.venue),
    city: cleanText(body.city),
    home_source: cleanText(body.home_source) || String(body.home_team || '').trim(),
    away_source: cleanText(body.away_source) || String(body.away_team || '').trim(),
    notes: cleanText(body.notes),
    home_lineup: cleanText(body.home_lineup),
    away_lineup: cleanText(body.away_lineup),
    status: body.status ? String(body.status) : 'not_started',
    updated_at: new Date().toISOString()
  };
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });

  try {
    const body = await request.json();
    const payload = buildPayload(body);

    if (!payload.home_team || !payload.away_team || Number.isNaN(Date.parse(payload.kickoff_at))) {
      return NextResponse.json({ ok: false, error: 'Datos de partido inválidos.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase.from('matches').insert(payload).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudo crear el partido.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });

  try {
    const body = await request.json();
    const matchId = String(body.match_id || '');

    if (!matchId) {
      return NextResponse.json({ ok: false, error: 'Falta partido.' }, { status: 400 });
    }

    const payload = buildPayload(body);

    if (!payload.home_team || !payload.away_team || Number.isNaN(Date.parse(payload.kickoff_at))) {
      return NextResponse.json({ ok: false, error: 'Datos de partido inválidos.' }, { status: 400 });
    }

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
    return NextResponse.json({ ok: false, error: 'No se pudo modificar el partido.' }, { status: 500 });
  }
}
