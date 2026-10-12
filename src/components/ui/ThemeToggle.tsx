'use client'

import { Moon, Sun } from 'lucide-react'
import { toggleTheme, useTheme } from '../../hooks/useTheme'

export default function ThemeToggle() {
  const theme = useTheme()
  const label = theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      aria-pressed={theme === 'light'}
      title={label}
      onClick={(event) => void toggleTheme(event.currentTarget)}
    >
      <Sun className="theme-icon-light" size={18} aria-hidden="true" />
      <Moon className="theme-icon-dark" size={18} aria-hidden="true" />
    </button>
  )
}
