import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/auth';

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });

  try {
    const body = await request.json();
    const payload = {
      tournament_match_no: body.tournament_match_no ? Number(body.tournament_match_no) : null,
      stage: String(body.stage || 'Grupo'),
      group_name: body.group_name ? String(body.group_name) : null,
      home_team: String(body.home_team || '').trim(),
      away_team: String(body.away_team || '').trim(),
      kickoff_at: new Date(body.kickoff_at).toISOString(),
      venue: body.venue ? String(body.venue) : null,
      city: body.city ? String(body.city) : null,
      home_source: body.home_source ? String(body.home_source) : String(body.home_team || '').trim(),
      away_source: body.away_source ? String(body.away_source) : String(body.away_team || '').trim(),
      notes: body.notes ? String(body.notes) : null,
      status: 'not_started'
    };

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
