import BillDetail from '../../../../components/workspace/BillDetail'
export default async function Page({ params }: { params: Promise<{ billId: string }> }) {
  return <BillDetail billId={(await params).billId} />
}
