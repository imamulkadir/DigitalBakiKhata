import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export function useAnnouncements(ownerId: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    // Only show announcements the admin hasn't stopped and that haven't
    // passed their deadline (expires_at null means no deadline was set).
    const [{ data: rows }, { data: reads }] = await Promise.all([
      supabase
        .from('announcements')
        .select('id, title, content, created_at')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false }),
      supabase.from('announcement_reads').select('announcement_id').eq('owner_id', ownerId),
    ]);
    const readIds = new Set((reads ?? []).map((r) => r.announcement_id));
    setAnnouncements((rows ?? []).map((a) => ({ ...a, is_read: readIds.has(a.id) })));
    setLoading(false);
  }, [ownerId]);

  const markRead = useCallback(async (announcementId: string) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === announcementId ? { ...a, is_read: true } : a)));
    await supabase.from('announcement_reads').insert({ announcement_id: announcementId, owner_id: ownerId });
  }, [ownerId]);

  const markAllRead = useCallback(async () => {
    const unread = announcements.filter((a) => !a.is_read);
    if (unread.length === 0) return;
    setAnnouncements((prev) => prev.map((a) => ({ ...a, is_read: true })));
    await supabase.from('announcement_reads').insert(
      unread.map((a) => ({ announcement_id: a.id, owner_id: ownerId }))
    );
  }, [announcements, ownerId]);

  return { announcements, loading, fetchAnnouncements, markRead, markAllRead };
}
