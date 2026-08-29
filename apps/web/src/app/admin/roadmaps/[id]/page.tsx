import ResourceEditor from '@/components/admin/ResourceEditor'

export default async function EditRoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ResourceEditor resource="roadmaps" id={id} />
}