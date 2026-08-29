import ResourceEditor from '@/components/admin/ResourceEditor'

export default async function EditSkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ResourceEditor resource="skills" id={id} />
}