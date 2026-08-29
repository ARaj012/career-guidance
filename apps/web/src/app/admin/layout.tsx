import { requireAdmin } from '@/lib/admin-auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="min-h-screen flex bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 min-w-0 p-6 lg:p-8">{children}</div>
    </div>
  )
}
