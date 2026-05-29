'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { authLimiter } from '@/lib/rate-limit'

type AuthState = { error?: string; success?: string } | undefined

export async function signInWithEmail(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Email and password are required' }

  const reqHeaders = await headers()
  const ip = reqHeaders.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const { success } = await authLimiter.limit(ip)
  if (!success) return { error: 'Too many login attempts. Please wait 15 minutes and try again.' }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  redirect('/knowledge')
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Email and password are required' }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) return { error: error.message }

  return { success: 'Check your email to confirm your account.' }
}

export async function signOut() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
