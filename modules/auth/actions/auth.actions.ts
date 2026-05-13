'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type AuthState = { error?: string; success?: string } | undefined

export async function signInWithEmail(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Email and password are required' }

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
