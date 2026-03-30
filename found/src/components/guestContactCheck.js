import { supabase } from '../supabaseClient'

export function contactLooksLikeEmail(value) {
  const v = String(value || '').trim()
  if (!v) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

/**
 * Probes whether `email` is already registered by attempting sign-in with a known-wrong password.
 * Supabase error text distinguishes unknown email vs wrong password vs unconfirmed email.
 */
export async function contactEmailBelongsToExistingAccount(email) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: 'intentionally-wrong-password-check',
  })
  if (!error?.message) return false
  const msg = error.message
  if (msg.includes('Invalid login credentials')) return true
  if (msg.includes('Email not confirmed')) return true
  return false
}
