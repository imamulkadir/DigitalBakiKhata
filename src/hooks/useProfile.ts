import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../i18n/LanguageContext';
import type { Profile } from './useAuth';

export function useProfile(profile: Profile) {
  const { t } = useTranslation();
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
      setError(t('account.saveError'));
      return null;
    }
    return data as Profile;
  }, [profile.id, t]);

  return { saving, error, updateProfile };
}
