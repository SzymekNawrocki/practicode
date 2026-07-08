'use client'

import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useIsClient } from '@/hooks/useIsClient'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useIsClient()

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="size-8" aria-label="Toggle theme" disabled />
  }

  function toggle() {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const icon = theme === 'dark' ? '☾' : theme === 'light' ? '☀' : '◑'
  const label = theme === 'dark' ? 'Dark (click for system)' : theme === 'light' ? 'Light (click for dark)' : 'System (click for light)'

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-base"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {icon}
    </Button>
  )
}
