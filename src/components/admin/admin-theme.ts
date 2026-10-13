export const ADMIN_THEME_STORAGE_KEY = 'arista-admin-theme'

export type AdminTheme = 'light' | 'dark'

export function getInitialAdminTheme(): AdminTheme {
  if (typeof window === 'undefined') return 'light'

  const saved = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyAdminTheme(theme: AdminTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.adminTheme = theme
}
