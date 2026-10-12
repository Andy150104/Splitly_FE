export type Theme = 'dark' | 'light'
export const THEME_STORAGE_KEY = 'splitly.theme'
export const THEME_EVENT = 'splitly:theme'
export const THEME_TRANSITION_EVENT = 'splitly:theme-transition'
export const THEME_COLORS = { dark: '#0b0b12', light: '#f4f8fc' } as const

// Read the preference before first paint. Dark remains the existing default.
// Only static constants are interpolated into this script, never user input.
export const themeBootstrap = `(()=>{let theme='dark';try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='light')theme='light'}catch{}document.documentElement.dataset.theme=theme;const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=theme==='light'?'${THEME_COLORS.light}':'${THEME_COLORS.dark}'})()`
