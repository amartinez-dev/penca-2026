import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getClosingMinutes() {
  const supabase = supabaseAdmin();
  const { data } = await supabase.from('settings').select('value').eq('key', 'cierre_minutos_antes').single();
  return Number(data?.value || 15);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    if (!participantId) return NextResponse.json({ ok: false, error: 'Falta participante.' }, { status: 400 });

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('participant_id', participantId);

    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar los pronósticos.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const participant_id = String(body.participant_id || '');
    const match_id = String(body.match_id || '');
    const pred_home = Number(body.pred_home);
    const pred_away = Number(body.pred_away);

    if (!participant_id || !match_id) return NextResponse.json({ ok: false, error: 'Faltan datos.' }, { status: 400 });
    if (!Number.isInteger(pred_home) || !Number.isInteger(pred_away) || pred_home < 0 || pred_away < 0 || pred_home > 99 || pred_away > 99) {
      return NextResponse.json({ ok: false, error: 'Marcador inválido.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, kickoff_at, status')
      .eq('id', match_id)
      .single();

    if (matchError || !match) return NextResponse.json({ ok: false, error: 'Partido no encontrado.' }, { status: 404 });
    if (match.status !== 'not_started') return NextResponse.json({ ok: false, error: 'Este partido ya no acepta pronósticos.' }, { status: 403 });

    const closingMinutes = await getClosingMinutes();
    const closesAt = new Date(new Date(match.kickoff_at).getTime() - closingMinutes * 60_000);
    if (new Date() >= closesAt) {
      return NextResponse.json({ ok: false, error: 'El pronóstico de este partido ya está cerrado.' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('predictions')
      .upsert({ participant_id, match_id, pred_home, pred_away, updated_at: new Date().toISOString() }, { onConflict: 'participant_id,match_id' })
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudo guardar el pronóstico.' }, { status: 500 });
  }
}
