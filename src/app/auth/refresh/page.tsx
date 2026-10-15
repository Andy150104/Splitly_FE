import SessionRefresh from '../../../components/workspace/SessionRefresh'

export default async function RefreshPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return <SessionRefresh destination={next || '/dashboard'} />
}
