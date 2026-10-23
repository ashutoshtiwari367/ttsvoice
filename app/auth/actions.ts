'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { validateEmailForSignup } from '@/lib/emailValidation';

// ── Sign In ──────────────────────────────────────────────────────────────────
export async function signIn(
  _prevState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const next = (formData.get('next') as string | null) || '/text-to-speech';

  if (!email || !password) {
    return { error: 'Please enter your email and password.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Incorrect email or password.' };
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please verify your email address first. Check your inbox for the activation link.' };
    }
    return { error: error.message };
  }

  redirect(next);
}

// ── Sign Up ──────────────────────────────────────────────────────────────────
export async function signUp(
  _prevState: { error: string | null; success: boolean },
  formData: FormData,
): Promise<{ error: string | null; success: boolean }> {
  const rawEmail = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!rawEmail || !password) {
    return { error: 'Please fill in all fields.', success: false };
  }

  // 1. Validate email against fake & disposable domains (fraud prevention)
  const validation = validateEmailForSignup(rawEmail);
  if (!validation.valid) {
    return { error: validation.error!, success: false };
  }

  const email = validation.normalizedEmail!;

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.', success: false };
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.', success: false };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // User lands on /auth/callback -> redirects to /text-to-speech
      emailRedirectTo: `${siteUrl}/auth/callback?next=/text-to-speech`,
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'An account with this email already exists.', success: false };
    }
    return { error: error.message, success: false };
  }

  return { error: null, success: true };
}

// ── Sign Out ─────────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
