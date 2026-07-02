import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from './useAuth';

export function useProfile(profile: Profile) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (fields: {
    shop_name?: string;
    owner_name?: string;
    owner_photo_url?: string;
  }): Promise<Profile | null> => {
    setSaving(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', profile.id)
      .select()
      .single();
    setSaving(false);
    if (err || !data) {
      setError('তথ্য সংরক্ষণ করতে সমস্যা হয়েছে');
      return null;
    }
    return data as Profile;
  }, [profile.id]);

  return { saving, error, updateProfile };
}
