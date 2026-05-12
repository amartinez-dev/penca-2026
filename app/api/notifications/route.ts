import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');
    const unreadOnly = searchParams.get('unread_only') !== 'false';

    if (!participantId) {
      return NextResponse.json({ ok: false, error: 'Falta participante.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('participant_id', participantId)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (unreadOnly) query = query.eq('is_read', false);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar las notificaciones.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const participantId = String(body.participant_id || '');
    const notificationId = body.notification_id ? String(body.notification_id) : null;

    if (!participantId) {
      return NextResponse.json({ ok: false, error: 'Falta participante.' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    let query = supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('participant_id', participantId);

    if (notificationId) query = query.eq('id', notificationId);

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, data: { read: true } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, error: 'No se pudo marcar la notificación como leída.' }, { status: 500 });
  }
}
