import { GroupDetailView } from '../../_components/WorkspaceViews'
export default async function Page({ params }: { params: Promise<{ groupId: string }> }) {
  return <GroupDetailView groupId={(await params).groupId} />
}
