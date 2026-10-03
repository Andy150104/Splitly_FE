import App from '../App'
import { connection } from 'next/server'
import { createSeed } from '../data/seed'
import { monthKey } from '../lib/finance'

// Serialize a single seed so the HTML and the first client render are identical.
// All user interactions and persistence stay in the browser.
export default async function HomePage() {
  // Keep month-based demo data current even when the production build is older.
  await connection()
  const now = new Date()
  return (
    <App
      initialState={createSeed(now)}
      initialMonth={monthKey(now)}
      initialYear={now.getFullYear()}
    />
  )
}
