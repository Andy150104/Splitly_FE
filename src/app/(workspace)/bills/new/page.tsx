import { CreateBillView } from '../../_components/WorkspaceViews'
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string; group?: string }>
}) {
  const params = await searchParams
  return <CreateBillView draftId={params.draft} initialGroupId={params.group} />
}
