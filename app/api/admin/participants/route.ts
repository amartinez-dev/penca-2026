import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from('participants')
      .select('id, name, name_key, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar los participantes.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });

  try {
    const body = await request.json();
    const participantId = String(body.participant_id || '');

    if (!participantId) {
      return NextResponse.json({ ok: false, error: 'Falta participante.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    await supabase.from('notifications').delete().eq('participant_id', participantId);
    await supabase.from('scores').delete().eq('participant_id', participantId);
    await supabase.from('predictions').delete().eq('participant_id', participantId);

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', participantId);

    if (error) throw error;

    return NextResponse.json({ ok: true, data: { deleted: true } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudo quitar el participante.' }, { status: 500 });
  }
}
