import { GroupDetail } from '../../../../components/workspace/Groups'
export default async function Page({ params }: { params: Promise<{ groupId: string }> }) {
  return <GroupDetail groupId={(await params).groupId} />
}
