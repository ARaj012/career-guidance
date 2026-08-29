import ResourceEditor from '@/components/admin/ResourceEditor'

export default async function EditCareerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ResourceEditor resource="careers" id={id} />
}
