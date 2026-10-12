'use client'

import { useRouter } from 'next/navigation'
import { ErrorState } from '../ui/Feedback'

export default function WorkspaceLoadError({ message }: { message: string }) {
  const router = useRouter()
  return <ErrorState message={message} retry={() => router.refresh()} />
}
