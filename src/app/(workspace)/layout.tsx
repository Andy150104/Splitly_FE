import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'
import { getCurrentUser } from '../../lib/api/session'
import Shell from '../../components/workspace/Shell'

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user)
    redirect(
      `/login?next=${encodeURIComponent((await headers()).get('x-mo-path') || '/dashboard')}`,
    )
  return <Shell user={user}>{children}</Shell>
}
