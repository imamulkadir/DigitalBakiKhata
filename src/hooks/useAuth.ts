import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { setSupabaseToken } from '../lib/supabase';

export interface Profile {
  id: string;
  phone_number: string;
  role: 'super_admin' | 'owner' | 'staff';
  status: 'pending_approval' | 'active' | 'rejected' | 'suspended';
  shop_name: string | null;
  subscription_status: 'active' | 'due_soon' | 'overdue' | null;
  next_due_date: string | null;
  expo_push_token: string | null;
}

interface AuthState {
  profile: Profile | null;
  token: string | null;
  loading: boolean;
}

const STORAGE_KEY = 'baki_session';

export async function loginUser(phone_number: string, pin: string): Promise<{ profile: Profile; access_token: string } | { error: string; status?: string }> {
  const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ phone_number, pin }),
  });
  return res.json();
}

export async function registerUser(phone_number: string, pin: string, shop_name?: string): Promise<{ success: boolean; role?: string; status?: string } | { error: string }> {
  const res = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/register-owner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ phone_number, pin, shop_name }),
  });
  return res.json();
}

export async function saveSession(token: string, profile: Profile): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify({ token, profile }));
  setSupabaseToken(token);
}

export async function loadSession(): Promise<{ token: string; profile: Profile } | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return null;
  try {
    const { token, profile } = JSON.parse(raw);
    setSupabaseToken(token);
    return { token, profile };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
  setSupabaseToken(null);
}
