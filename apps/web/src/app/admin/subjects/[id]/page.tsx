import ResourceEditor from '@/components/admin/ResourceEditor'

export default async function EditSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ResourceEditor resource="subjects" id={id} />
}