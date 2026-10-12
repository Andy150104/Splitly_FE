import { BillDetailView } from '../../_components/WorkspaceViews'
export default async function Page({ params }: { params: Promise<{ billId: string }> }) {
  return <BillDetailView billId={(await params).billId} />
}
