import Bills from '../../../components/workspace/Bills'
export default async function Page({ searchParams }: { searchParams: Promise<{ owed?: string }> }) {
  return <Bills initialOwed={(await searchParams).owed === 'true'} />
}
