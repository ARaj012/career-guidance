import ResourceEditor from '@/components/admin/ResourceEditor'

export default async function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ResourceEditor resource="exams" id={id} />
}
