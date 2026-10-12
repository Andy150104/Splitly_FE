import { BillsView } from '../_components/WorkspaceViews'
export default async function Page({ searchParams }: { searchParams: Promise<{ owed?: string }> }) {
  return <BillsView initialOwed={(await searchParams).owed === 'true'} />
}
