import { useEffect, useMemo, useState } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ThemeSetting = 'system' | 'light' | 'dark'

const themeOrder: ThemeSetting[] = ['system', 'dark', 'light']

const icons: Record<ThemeSetting, typeof Sun> = {
  system: Monitor,
  dark: Moon,
  light: Sun,
}

const labels: Record<ThemeSetting, string> = {
  system: 'System theme',
  dark: 'Dark theme',
  light: 'Light theme',
}

export function ThemeToggleButton({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentThemeSetting = useMemo<ThemeSetting>(() => {
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      return theme
    }

    return 'system'
  }, [theme])

  const Icon = icons[currentThemeSetting]
  const nextThemeSetting = themeOrder[(themeOrder.indexOf(currentThemeSetting) + 1) % themeOrder.length]

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={cn('h-9 w-9', className)} aria-label="Toggle theme" disabled />
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('h-9 w-9', className)}
      aria-label={`${labels[currentThemeSetting]}. Activate ${labels[nextThemeSetting]}`}
      title={`${labels[currentThemeSetting]} (click to switch to ${labels[nextThemeSetting].toLowerCase()})`}
      onClick={() => setTheme(nextThemeSetting)}
    >
      <Icon className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  )
}
