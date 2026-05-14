'use client'

import { useActionState } from 'react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { signInWithEmail, signUp } from '../actions/auth.actions'

type AuthState = { error?: string; success?: string } | undefined

export function LoginForm() {
  const [signInState, signInAction, signInPending] = useActionState<AuthState, FormData>(signInWithEmail, undefined)
  const [signUpState, signUpAction, signUpPending] = useActionState<AuthState, FormData>(signUp, undefined)

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">PractiCode</h1>
        <p className="text-sm text-muted-foreground">Engineering knowledge, structured.</p>
      </div>

      <form action={signInAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </div>
        {signInState?.error && (
          <p className="text-sm text-destructive">{signInState.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={signInPending}>
          {signInPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or create account</span>
        </div>
      </div>

      <form action={signUpAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input id="signup-email" name="email" type="email" placeholder="you@example.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input id="signup-password" name="password" type="password" placeholder="••••••••" required minLength={6} />
        </div>
        {signUpState?.error   && <p className="text-sm text-destructive">{signUpState.error}</p>}
        {signUpState?.success && <p className="text-sm text-success">{signUpState.success}</p>}
        <Button type="submit" variant="outline" className="w-full" disabled={signUpPending}>
          {signUpPending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </div>
  )
}
