import CreateBill from '../../../../components/workspace/CreateBill'
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string; group?: string }>
}) {
  const params = await searchParams
  return <CreateBill draftId={params.draft} initialGroupId={params.group} />
}
