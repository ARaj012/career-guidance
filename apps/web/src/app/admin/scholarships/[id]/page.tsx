import ResourceEditor from '@/components/admin/ResourceEditor'

export default async function EditScholarshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ResourceEditor resource="scholarships" id={id} />
}
