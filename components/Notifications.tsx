'use client';

import { useEffect, useState } from 'react';

type StoredParticipant = { id: string; name: string };
type NotificationRow = {
  id: string;
  participant_id: string;
  match_id: string;
  points: number;
  title: string;
  message: string;
  is_read: boolean;
  updated_at: string;
};

function getStoredParticipant(): StoredParticipant | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('pencaParticipant');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function Notifications() {
  const [participant, setParticipant] = useState<StoredParticipant | null>(null);
  const [items, setItems] = useState<NotificationRow[]>([]);

  async function load() {
    const stored = getStoredParticipant();
    setParticipant(stored);
    if (!stored) {
      setItems([]);
      return;
    }

    const res = await fetch(`/api/notifications?participant_id=${stored.id}`, { cache: 'no-store' });
    const json = await res.json();
    if (json.ok) setItems(json.data || []);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  async function markRead(notificationId?: string) {
    if (!participant) return;
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participant_id: participant.id, notification_id: notificationId })
    });
    setItems(prev => notificationId ? prev.filter(item => item.id !== notificationId) : []);
  }

  if (!items.length) return null;

  return (
    <div style={{
      position: 'fixed',
      right: '1rem',
      bottom: '1rem',
      zIndex: 60,
      display: 'grid',
      gap: '.75rem',
      width: 'min(420px, calc(100vw - 2rem))'
    }}>
      {items.slice(0, 3).map(item => (
        <div className="card" key={item.id} style={{ padding: '1rem', borderRadius: 22, boxShadow: '0 18px 40px rgba(7,22,77,.18)' }}>
          <div className="eyebrow">Tabla actualizada</div>
          <h3 style={{ marginTop: '.35rem' }}>{item.title}</h3>
          <p>{item.message}</p>
          <div className="actions" style={{ marginTop: '.8rem' }}>
            <a className="button" href="/tabla" onClick={() => markRead(item.id)}>Ver tabla</a>
            <button className="button secondary" onClick={() => markRead(item.id)}>Cerrar</button>
          </div>
        </div>
      ))}
    </div>
  );
}
