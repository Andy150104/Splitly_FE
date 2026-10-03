import Support from '../../../components/workspace/Support'
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ billId?: string }>
}) {
  return <Support billId={(await searchParams).billId} />
}
