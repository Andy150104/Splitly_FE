import { redirect } from 'next/navigation'
import { getCurrentUser } from '../../lib/api/session'
import Login from '../../components/workspace/Login'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; redirectTo?: string; email?: string }>
}) {
  const params = await searchParams
  const next = params.next || params.redirectTo || '/dashboard'
  const destination = /^\/(dashboard|bills|groups|payout-accounts|support|admin)(?:[/?]|$)/.test(
    next,
  )
    ? next
    : '/dashboard'
  if (await getCurrentUser()) redirect(destination)
  return (
    <Login
      destination={destination}
      email={params.email || ''}
      googleClientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}
      devEnabled={process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_LOGIN === 'true'}
    />
  )
}
