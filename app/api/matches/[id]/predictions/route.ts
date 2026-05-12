import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type PredictionWithParticipant = {
  id: string;
  participant_id: string;
  pred_home: number;
  pred_away: number;
  updated_at: string;
  participants: { name: string } | { name: string }[] | null;
};

function participantName(value: PredictionWithParticipant['participants']) {
  if (!value) return 'Participante';
  if (Array.isArray(value)) return value[0]?.name || 'Participante';
  return value.name || 'Participante';
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('predictions')
      .select('id, participant_id, pred_home, pred_away, updated_at, participants(name)')
      .eq('match_id', id)
      .order('updated_at', { ascending: true });

    if (error) throw error;

    const rows = ((data || []) as PredictionWithParticipant[]).map(row => ({
      id: row.id,
      participant_id: row.participant_id,
      name: participantName(row.participants),
      pred_home: row.pred_home,
      pred_away: row.pred_away,
      updated_at: row.updated_at
    }));

    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar los pronósticos del partido.' }, { status: 500 });
  }
}
