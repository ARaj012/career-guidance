import ResourceEditor from '@/components/admin/ResourceEditor'

export default async function EditCollegePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ResourceEditor resource="colleges" id={id} />
}
