import ResourceEditor from '@/components/admin/ResourceEditor'

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ResourceEditor resource="blog" id={id} />
}
